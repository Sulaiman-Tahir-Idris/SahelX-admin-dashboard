content = """
import { onCall, HttpsError, onRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const db = getFirestore();
export const PAYSTACK_SECRET = defineSecret('PAYSTACK_SECRET_KEY');

export const initializePaystackTransaction = onCall(
  { secrets: [PAYSTACK_SECRET] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Must be logged in.');
    }
    const { email, amountKobo, metadata } = request.data as { email: string, amountKobo: number, metadata?: Record<string, unknown> };
    if (!email || !amountKobo) {
      throw new HttpsError('invalid-argument', 'Email and amount are required.');
    }

    const secret = PAYSTACK_SECRET.value();
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secret}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount: Math.round(amountKobo),
        metadata: metadata || {},
        channels: ['card', 'bank', 'ussd', 'bank_transfer'],
      }),
    });
    
    return await response.json();
  }
);

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

with open('src/paystack.ts', 'w', encoding='utf-8') as f:
    f.write(content.strip())
