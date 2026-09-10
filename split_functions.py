chat = """
import * as functionsV1 from 'firebase-functions/v1';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';

const db = getFirestore();
const messaging = getMessaging();

// Kept as v1 — already deployed, cannot upgrade in-place without deleting first
export const onNewChatMessage = functionsV1.firestore
  .document('adminChats/{chatId}/messages/{messageId}')
  .onCreate(async (snap, context) => {
    const { chatId } = context.params;
    const msgData = snap.data();
    if (!msgData) return null;

    const senderId = msgData.senderId as string;
    const senderName = (msgData.senderName as string) || 'Someone';
    const text = (msgData.text as string) || 'Sent a new message';

    const tokens: string[] = [];
    const tokenToUserMap = new Map<string, { id: string; collection: string }>();

    const fetchTokens = async (col: string, excludeId: string) => {
      const users = await db.collection(col).get();
      users.forEach((u) => {
        if (u.id === excludeId) return;
        const data = u.data();
        if (data.fcmTokens && Array.isArray(data.fcmTokens)) {
          (data.fcmTokens as string[]).forEach((t) => {
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
          (adminDoc.data()!.fcmTokens as string[]).forEach((t) => {
            tokens.push(t);
            tokenToUserMap.set(t, { id: recipientId, collection: 'Admin' });
          });
        } else {
          const secDoc = await db.collection('Secretary').doc(recipientId).get();
          if (secDoc.exists && secDoc.data()?.fcmTokens) {
            (secDoc.data()!.fcmTokens as string[]).forEach((t) => {
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
        const code = res.error.code;
        if (
          code === 'messaging/invalid-registration-token' ||
          code === 'messaging/registration-token-not-registered'
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
"""

wallet = """
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const db = getFirestore();

export const requestDeliveryWallet = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be logged in.');
  }
  const uid = request.auth.uid;
  const { pickup, dropoff, dropoffs, goodsType, goodsSize, distanceKm, cost, type = 'single' } = request.data;

  if (!cost || cost <= 0) {
    throw new HttpsError('invalid-argument', 'Invalid cost.');
  }

  return await db.runTransaction(async (transaction) => {
    const walletRef = db.collection('Wallets').doc(uid);
    const userRef = db.collection('User').doc(uid);
    const walletDoc = await transaction.get(walletRef);
    const userDoc = await transaction.get(userRef);

    let currentBalance = 0;
    if (walletDoc.exists && walletDoc.data()?.balance !== undefined) {
      currentBalance = walletDoc.data()!.balance as number;
    } else if (userDoc.exists && userDoc.data()?.walletBalance !== undefined) {
      currentBalance = userDoc.data()!.walletBalance as number;
    }

    if (currentBalance < cost) {
      throw new HttpsError('failed-precondition', 'Insufficient wallet balance.');
    }

    const newBalance = currentBalance - cost;

    if (walletDoc.exists) {
      transaction.update(walletRef, { balance: newBalance, updatedAt: FieldValue.serverTimestamp() });
    } else {
      transaction.set(walletRef, { uid, balance: newBalance, updatedAt: FieldValue.serverTimestamp() });
    }
    transaction.update(userRef, { walletBalance: newBalance });

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
"""

paystack = """
import { onCall, HttpsError, onRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const db = getFirestore();
export const PAYSTACK_SECRET = defineSecret('PAYSTACK_SECRET_KEY');

export const verifyPaystackTransaction = onCall(
  { secrets: [PAYSTACK_SECRET] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Must be logged in.');
    }
    const { reference } = request.data as { reference: string };
    if (!reference) {
      throw new HttpsError('invalid-argument', 'Reference required.');
    }
    const secret = PAYSTACK_SECRET.value();
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${secret}` },
    });
    return await response.json();
  }
);

export const paystackWebhook = onRequest(
  { secrets: [PAYSTACK_SECRET] },
  async (req, res) => {
    const event = req.body as {
      event: string;
      data: { amount: number; metadata: Record<string, unknown> };
    };

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
          const current = wDoc.exists
            ? ((wDoc.data()?.balance as number) || 0)
            : ((uDoc.data()?.walletBalance as number) || 0);
          const newBal = current + amount;
          if (wDoc.exists) {
            t.update(walletRef, { balance: newBal, updatedAt: FieldValue.serverTimestamp() });
          } else {
            t.set(walletRef, { uid, balance: newBal, updatedAt: FieldValue.serverTimestamp() });
          }
          t.update(userRef, { walletBalance: newBal });
        });
      } else if (metadata.type === 'delivery') {
        const deliveryData = { ...(metadata.deliveryData as Record<string, unknown>) };
        deliveryData.paymentStatus = 'paid';
        deliveryData.status = 'pending';
        deliveryData.createdAt = FieldValue.serverTimestamp();
        deliveryData.trackingId = 'SHX-' + Math.floor(100000 + Math.random() * 900000);
        deliveryData.history = [{ status: 'pending', timestamp: new Date().toISOString() }];
        await db.collection('deliveries').add(deliveryData);
      }
    }

    res.status(200).send('OK');
  }
);
"""

index = """
import { initializeApp } from 'firebase-admin/app';
initializeApp();

export { onNewChatMessage } from './chat';
export { requestDeliveryWallet } from './wallet';
export { verifyPaystackTransaction, paystackWebhook } from './paystack';
"""

with open('functions/src/chat.ts', 'w', encoding='utf-8') as f:
    f.write(chat.strip())

with open('functions/src/wallet.ts', 'w', encoding='utf-8') as f:
    f.write(wallet.strip())

with open('functions/src/paystack.ts', 'w', encoding='utf-8') as f:
    f.write(paystack.strip())

with open('functions/src/index.ts', 'w', encoding='utf-8') as f:
    f.write(index.strip())

print("Done!")
