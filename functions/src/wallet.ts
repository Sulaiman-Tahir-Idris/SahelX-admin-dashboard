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