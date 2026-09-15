import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore } from 'firebase-admin/firestore';

export const lookupTrackingId = onCall(async (request) => {
  const trackingId = request.data?.trackingId;
  if (!trackingId || typeof trackingId !== 'string') {
    throw new HttpsError('invalid-argument', 'The function must be called with one argument "trackingId" containing the tracking ID to lookup.');
  }

  const db = getFirestore();

  // Search in deliveries collection
  const deliveriesSnapshot = await db.collection('deliveries')
    .where('trackingId', '==', trackingId)
    .limit(1)
    .get();

  if (!deliveriesSnapshot.empty) {
    return {
      collection: 'deliveries',
      docId: deliveriesSnapshot.docs[0].id
    };
  }

  // If you later add a bulkDeliveries collection, we can search it here too:
  const bulkDeliveriesSnapshot = await db.collection('bulkDeliveries')
    .where('trackingId', '==', trackingId)
    .limit(1)
    .get();

  if (!bulkDeliveriesSnapshot.empty) {
    return {
      collection: 'bulkDeliveries',
      docId: bulkDeliveriesSnapshot.docs[0].id
    };
  }

  // Not found
  throw new HttpsError('not-found', 'No delivery found with this tracking ID.');
});
