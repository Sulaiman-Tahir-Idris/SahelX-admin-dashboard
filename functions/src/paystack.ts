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
        callback_url: 'https://paystackcallback-ha54nyllta-uc.a.run.app',
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
          const walletTxRef = db.collection('Wallets').doc(uid).collection('transactions').doc();
          t.set(walletTxRef, {
            id: walletTxRef.id,
            amount: amount,
            type: 'topup',
            title: 'Wallet Top-up',
            description: `Funded via Paystack`,
            balanceBefore: current,
            balanceAfter: newBal,
            createdAt: FieldValue.serverTimestamp(),
          });
          
          // Log Revenue
          const paymentRef = db.collection('payments').doc();
          t.set(paymentRef, {
            id: paymentRef.id,
            amount: amount,
            type: 'revenue',
            category: 'Wallet Top-up',
            description: `Paystack Wallet Top-up for User ${uid}`,
            date: FieldValue.serverTimestamp(),
            bankAccountId: 'paystack', // Or whatever ID your admin dashboard expects
            createdAt: FieldValue.serverTimestamp(),
          });
          
          // Increment Bank Balance
          const bankRef = db.collection('BankAccounts').doc('paystack');
          t.set(bankRef, {
            balance: FieldValue.increment(amount),
            updatedAt: FieldValue.serverTimestamp()
          }, { merge: true });
        });
      } else if (metadata.type === 'delivery') {
        const deliveryData = { ...(metadata.deliveryData as Record<string, unknown>) };
        deliveryData.paymentStatus = 'paid';
        deliveryData.status = 'pending';
        deliveryData.createdAt = FieldValue.serverTimestamp();
        deliveryData.trackingId = 'SHX-' + Math.floor(100000 + Math.random() * 900000);
      deliveryData.history = [{ status: 'pending', timestamp: new Date().toISOString() }];
      
      const batch = db.batch();
      const deliveryRef = db.collection('deliveries').doc();
      batch.set(deliveryRef, deliveryData);
      
      const paymentRef = db.collection('payments').doc();
      batch.set(paymentRef, {
        id: paymentRef.id,
        amount: event.data.amount / 100,
        type: 'revenue',
        category: 'Mobile Delivery',
        description: `Direct Paystack Payment for Delivery ${deliveryData.trackingId}`,
        date: FieldValue.serverTimestamp(),
        bankAccountId: 'paystack',
        createdAt: FieldValue.serverTimestamp(),
      });
      
      const bankRef = db.collection('BankAccounts').doc('paystack');
      batch.set(bankRef, {
        balance: FieldValue.increment(event.data.amount / 100),
        updatedAt: FieldValue.serverTimestamp()
      }, { merge: true });
      
      await batch.commit();
      }
    }

    res.status(200).send('OK');
  }
);

export const paystackCallback = onRequest(async (req, res) => {
  res.status(200).send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Payment Successful</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background-color: #f9fafb; color: #111827; text-align: center; padding: 20px; }
        .card { background: white; padding: 40px 20px; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); max-width: 400px; width: 100%; }
        .icon { font-size: 48px; margin-bottom: 16px; }
        h1 { font-size: 24px; margin-bottom: 8px; font-weight: 600; }
        p { font-size: 16px; color: #4b5563; line-height: 1.5; margin-bottom: 24px; }
        button { background-color: #dc2626; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer; width: 100%; }
        button:hover { background-color: #b91c1c; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="icon">✅</div>
        <h1>Payment Successful!</h1>
        <p>Your transaction has been processed securely. You can now close this window and return to the SahelX app.</p>
        <button onclick="window.close()">Close Window</button>
      </div>
      <script>
        setTimeout(() => { window.close(); }, 3000);
      </script>
    </body>
    </html>
  `);
});
