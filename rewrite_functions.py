content = """
import * as functions from 'firebase-functions/v1';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';

initializeApp();
const db = getFirestore();
const messaging = getMessaging();

// ─── Chat Notification ───────────────────────────────────────────────────────
export const onNewChatMessage = functions.firestore
  .document('adminChats/{chatId}/messages/{messageId}')
  .onCreate(async (snap, context) => {
    const { chatId } = context.params;
    const msgData = snap.data();
    if (!msgData) return null;

    const senderId = msgData.senderId;
    const senderName = msgData.senderName || 'Someone';
    const text = msgData.text || 'Sent a new message';

    const tokens: string[] = [];
    const tokenToUserMap = new Map<string, { id: string; collection: string }>();

    const fetchTokens = async (col: string, excludeId: string) => {
      const users = await db.collection(col).get();
      users.forEach((u) => {
        if (u.id === excludeId) return;
        const data = u.data();
        if (data.fcmTokens && Array.isArray(data.fcmTokens)) {
          data.fcmTokens.forEach((t: string) => {
            tokens.push(t);
            tokenToUserMap.set(t, { id: u.id, collection: col });
          });
        }
      });
    };

    if (chatId === 'global') {
      await fetchTokens('Admin', senderId);
      await fetchTokens('Secretary', senderId);
    } else {
      const participants = chatId.split('_');
      const recipientId = participants.find((id: string) => id !== senderId);
      if (recipientId) {
        const adminDoc = await db.collection('Admin').doc(recipientId).get();
        if (adminDoc.exists && adminDoc.data()?.fcmTokens) {
          adminDoc.data()!.fcmTokens.forEach((t: string) => {
            tokens.push(t);
            tokenToUserMap.set(t, { id: recipientId, collection: 'Admin' });
          });
        } else {
          const secDoc = await db.collection('Secretary').doc(recipientId).get();
          if (secDoc.exists && secDoc.data()?.fcmTokens) {
            secDoc.data()!.fcmTokens.forEach((t: string) => {
              tokens.push(t);
              tokenToUserMap.set(t, { id: recipientId, collection: 'Secretary' });
            });
          }
        }
      }
    }

    if (tokens.length === 0) return null;

    const response = await messaging.sendEachForMulticast({
      tokens,
      notification: {
        title: `New message from ${senderName}`,
        body: text.length > 50 ? text.substring(0, 50) + '...' : text,
      },
    });

    const tokensToRemove = new Map<string, { collection: string; id: string; tokens: string[] }>();
    response.responses.forEach((res, idx) => {
      if (!res.success && res.error) {
        if (
          res.error.code === 'messaging/invalid-registration-token' ||
          res.error.code === 'messaging/registration-token-not-registered'
        ) {
          const token = tokens[idx];
          const userInfo = tokenToUserMap.get(token);
          if (userInfo) {
            const key = `${userInfo.collection}_${userInfo.id}`;
            if (!tokensToRemove.has(key)) {
              tokensToRemove.set(key, { collection: userInfo.collection, id: userInfo.id, tokens: [] });
            }
            tokensToRemove.get(key)!.tokens.push(token);
          }
        }
      }
    });

    if (tokensToRemove.size > 0) {
      const batch = db.batch();
      for (const [, info] of tokensToRemove) {
        const ref = db.collection(info.collection).doc(info.id);
        batch.update(ref, { fcmTokens: FieldValue.arrayRemove(...info.tokens) });
      }
      await batch.commit();
    }
    return null;
  });

// ─── Atomic Wallet Delivery ───────────────────────────────────────────────────
export const requestDeliveryWallet = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in.');
  }
  const uid = context.auth.uid;
  const { pickup, dropoff, dropoffs, goodsType, goodsSize, distanceKm, cost, type = 'single' } = data;

  if (!cost || cost <= 0) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid cost.');
  }

  return await db.runTransaction(async (transaction) => {
    const walletRef = db.collection('Wallets').doc(uid);
    const userRef = db.collection('User').doc(uid);
    const walletDoc = await transaction.get(walletRef);
    const userDoc = await transaction.get(userRef);

    let currentBalance = 0;
    if (walletDoc.exists && walletDoc.data()?.balance !== undefined) {
      currentBalance = walletDoc.data()!.balance;
    } else if (userDoc.exists && userDoc.data()?.walletBalance !== undefined) {
      // Fallback to User doc for backward compatibility
      currentBalance = userDoc.data()!.walletBalance;
    }

    if (currentBalance < cost) {
      throw new functions.https.HttpsError('failed-precondition', 'Insufficient wallet balance.');
    }

    const newBalance = currentBalance - cost;

    // Update Wallets collection (primary)
    if (walletDoc.exists) {
      transaction.update(walletRef, { balance: newBalance, updatedAt: FieldValue.serverTimestamp() });
    } else {
      transaction.set(walletRef, { uid, balance: newBalance, updatedAt: FieldValue.serverTimestamp() });
    }

    // Keep User doc in sync (legacy)
    transaction.update(userRef, { walletBalance: newBalance });

    // Create delivery
    const deliveryRef = db.collection('deliveries').doc();
    const trackingId = 'SHX-' + Math.floor(100000 + Math.random() * 900000);

    const deliveryData: Record<string, unknown> = {
      customerId: uid,
      status: 'pending',
      paymentMethod: 'wallet',
      paymentStatus: 'paid',
      cost,
      distanceKm,
      goodsType,
      goodsSize,
      trackingId,
      isBulk: type === 'bulk',
      createdAt: FieldValue.serverTimestamp(),
      history: [{ status: 'pending', timestamp: new Date().toISOString() }],
    };

    if (type === 'single') {
      deliveryData.pickupLocation = pickup;
      deliveryData.dropoffLocation = dropoff;
    } else {
      deliveryData.pickupLocation = pickup;
      deliveryData.dropoffs = dropoffs;
    }

    transaction.set(deliveryRef, deliveryData);
    return { success: true, trackingId, deliveryId: deliveryRef.id };
  });
});

// ─── Server-side Paystack Verification ───────────────────────────────────────
export const verifyPaystackTransaction = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in.');
  }
  const { reference } = data;
  if (!reference) {
    throw new functions.https.HttpsError('invalid-argument', 'Reference required.');
  }

  const PAYSTACK_SECRET = functions.config().paystack?.secret_key || process.env.PAYSTACK_SECRET_KEY;
  if (!PAYSTACK_SECRET) {
    throw new functions.https.HttpsError('internal', 'Payment configuration error.');
  }

  const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
    headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
  });
  const result = await response.json() as { status: boolean; data: { status: string; amount: number; metadata: Record<string, unknown> } };
  return result;
});

// ─── Paystack Webhook ─────────────────────────────────────────────────────────
export const paystackWebhook = functions.https.onRequest(async (req, res) => {
  const event = req.body as { event: string; data: { amount: number; metadata: Record<string, unknown> } };

  if (event.event === 'charge.success') {
    const metadata = event.data.metadata || {};
    const uid = metadata.userId as string;
    if (!uid) { res.status(200).send('No userId'); return; }

    if (metadata.type === 'wallet_topup') {
      const amount = event.data.amount / 100;
      const walletRef = db.collection('Wallets').doc(uid);
      const userRef = db.collection('User').doc(uid);
      await db.runTransaction(async (t) => {
        const wDoc = await t.get(walletRef);
        const uDoc = await t.get(userRef);
        const current = wDoc.exists ? (wDoc.data()?.balance || 0) : (uDoc.data()?.walletBalance || 0);
        if (wDoc.exists) {
          t.update(walletRef, { balance: current + amount, updatedAt: FieldValue.serverTimestamp() });
        } else {
          t.set(walletRef, { uid, balance: current + amount, updatedAt: FieldValue.serverTimestamp() });
        }
        t.update(userRef, { walletBalance: current + amount });
      });
    } else if (metadata.type === 'delivery') {
      const deliveryData = metadata.deliveryData as Record<string, unknown>;
      if (deliveryData) {
        deliveryData.paymentStatus = 'paid';
        deliveryData.status = 'pending';
        deliveryData.createdAt = FieldValue.serverTimestamp();
        deliveryData.trackingId = 'SHX-' + Math.floor(100000 + Math.random() * 900000);
        deliveryData.history = [{ status: 'pending', timestamp: new Date().toISOString() }];
        await db.collection('deliveries').add(deliveryData);
      }
    }
  }

  res.status(200).send('OK');
});
"""

with open('functions/src/index.ts', 'w', encoding='utf-8') as f:
    f.write(content.strip())
