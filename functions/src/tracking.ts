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
    .get();

  if (!deliveriesSnapshot.empty) {
    const docIds = deliveriesSnapshot.docs.map(doc => doc.id);
    return {
      collection: 'deliveries',
      docIds
    };
  }

  // Not found
  throw new HttpsError('not-found', 'No delivery found with this tracking ID.');
});
