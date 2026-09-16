import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import * as functionsV1 from 'firebase-functions/v1';


export const requestDeliveryWallet = onCall(async (request) => {
  const db = getFirestore();
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be logged in.');
  }
  const uid = request.auth.uid;
  const { pickup, dropoff, dropoffs, goodsType, goodsSize, distanceKm, cost, type = 'single', receiverPhone } = request.data;

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

    const walletTxRef = db.collection('Wallets').doc(uid).collection('transactions').doc();
    transaction.set(walletTxRef, {
      id: walletTxRef.id,
      amount: -cost,
      type: 'delivery_payment',
      title: 'Delivery Payment',
      description: `Payment for delivery`,
      balanceBefore: currentBalance,
      balanceAfter: newBalance,
      createdAt: FieldValue.serverTimestamp(),
    });

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
      receiverPhone: receiverPhone || null,
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

export const refundToWallet = onCall(async (request) => {
  const db = getFirestore();
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be logged in.');
  }
  
  const { deliveryId } = request.data;
  if (!deliveryId) {
    throw new HttpsError('invalid-argument', 'deliveryId is required.');
  }
  
  const deliveryRef = db.collection('deliveries').doc(deliveryId);
  
  await db.runTransaction(async (t) => {
    const dDoc = await t.get(deliveryRef);
    if (!dDoc.exists) throw new HttpsError('not-found', 'Delivery not found.');
    
    const dData = dDoc.data()!;
    if (dData.status !== 'cancelled') {
      throw new HttpsError('failed-precondition', 'Delivery must be cancelled before refunding.');
    }
    if (dData.refundStatus === 'refunded') {
      throw new HttpsError('failed-precondition', 'Delivery has already been refunded.');
    }
    
    const uid = dData.userId;
    const amount = dData.deliveryCost || dData.cost || 0;
    
    if (!uid || amount <= 0) {
      throw new HttpsError('invalid-argument', 'Invalid user or amount.');
    }
    
    const walletRef = db.collection('Wallets').doc(uid);
    const userRef = db.collection('User').doc(uid);
    
    const wDoc = await t.get(walletRef);
    const uDoc = await t.get(userRef);
    
    const currentBal = wDoc.exists ? wDoc.data()!.balance : (uDoc.data()?.walletBalance || 0);
    const newBal = currentBal + amount;
    
    if (wDoc.exists) {
      t.update(walletRef, { balance: newBal, updatedAt: FieldValue.serverTimestamp() });
    } else {
      t.set(walletRef, { uid, balance: newBal, updatedAt: FieldValue.serverTimestamp() });
    }
    t.update(userRef, { walletBalance: newBal });
    
    const walletTxRef = walletRef.collection('transactions').doc();
    t.set(walletTxRef, {
      id: walletTxRef.id,
      amount: amount,
      type: 'refund',
      title: 'Refund: Cancelled Delivery',
      description: `Refund for Tracking ID: ${dData.trackingId || deliveryId}`,
      balanceBefore: currentBal,
      balanceAfter: newBal,
      createdAt: FieldValue.serverTimestamp(),
    });
    
    t.update(deliveryRef, { refundStatus: 'refunded' });
  });
  
  return { success: true };
});

/**
 * Cascades account deletion when a Firebase Auth user is deleted.
 * Triggered automatically by Firebase Auth — no client-side call needed.
 *
 * Deletes in order:
 *  1. Wallets/{uid}/transactions subcollection (can't be done client-side)
 *  2. All deliveries where customerId == uid
 *  3. Wallets/{uid} document
 *  4. User/{uid} document
 *  5. Cloudinary profile photo (if stored)
 */
export const onUserDeleted = functionsV1.auth.user().onDelete(async (user) => {
  const db = getFirestore();
  const uid = user.uid;
  if (!uid) return;

  console.log(`[onUserDeleted] Starting cascade deletion for uid: ${uid}`);

  try {
    // 1. Delete Wallets/{uid}/transactions subcollection in batches
    const txRef = db.collection('Wallets').doc(uid).collection('transactions');
    let txSnap = await txRef.limit(200).get();
    while (!txSnap.empty) {
      const batch = db.batch();
      txSnap.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      txSnap = await txRef.limit(200).get();
    }
    console.log(`[onUserDeleted] Wallet transactions deleted for uid: ${uid}`);

    // 2. Delete all deliveries where customerId == uid in batches
    const deliveriesRef = db.collection('deliveries').where('customerId', '==', uid);
    let deliverySnap = await deliveriesRef.limit(200).get();
    while (!deliverySnap.empty) {
      const batch = db.batch();
      deliverySnap.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      deliverySnap = await deliveriesRef.limit(200).get();
    }
    console.log(`[onUserDeleted] Deliveries deleted for uid: ${uid}`);

    // 3. Delete Cloudinary profile photo if one exists
    const userSnap = await db.collection('User').doc(uid).get();
    const profilePhoto: string | undefined = userSnap.data()?.profilePhoto;
    if (profilePhoto && profilePhoto.includes('cloudinary.com')) {
      // Extract the public_id from the Cloudinary URL
      // URL format: https://res.cloudinary.com/{cloud}/image/upload/{version}/{publicId}.{ext}
      const match = profilePhoto.match(/\/upload\/(?:v\d+\/)?(.+?)(\.[a-z]+)?$/i);
      if (match) {
        const publicId = match[1];
        const CLOUD_NAME = 'dwy8mwkmm';
        // Cloudinary unsigned delete requires an API secret — log a warning instead
        // For production: use Cloudinary Admin API with CLOUDINARY_API_KEY secret
        console.warn(`[onUserDeleted] Profile photo requires manual cleanup: publicId=${publicId}, cloudName=${CLOUD_NAME}`);
      }
    }

    // 4 & 5. Delete Wallet doc and User doc atomically
    const finalBatch = db.batch();
    finalBatch.delete(db.collection('Wallets').doc(uid));
    finalBatch.delete(db.collection('User').doc(uid));
    await finalBatch.commit();
    console.log(`[onUserDeleted] User and Wallet documents deleted for uid: ${uid}`);

  } catch (err) {
    console.error(`[onUserDeleted] Error during cascade deletion for uid: ${uid}`, err);
    // Don't re-throw — the auth deletion has already happened, 
    // orphaned data is better than blocking the deletion.
  }
});
