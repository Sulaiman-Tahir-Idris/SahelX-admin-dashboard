import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore } from 'firebase-admin/firestore';

export const lookupTrackingId = onCall(async (request) => {
  const trackingId = request.data?.trackingId;
  if (!trackingId || typeof trackingId !== 'string') {
    throw new HttpsError('invalid-argument', 'The function must be called with one argument "trackingId" containing the tracking ID to lookup.');
  }

  const db = getFirestore();

    // Search in deliveries collection by trackingId
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
  
  // Search by tag for bulk groups
  const tagSnapshot = await db.collection('deliveries')
    .where('tag', '==', trackingId)
    .get();

  if (!tagSnapshot.empty) {
    const docIds = tagSnapshot.docs.map(doc => doc.id);
    return {
      collection: 'deliveries',
      docIds,
      isTag: true
    };
  }

  // Not found
  throw new HttpsError('not-found', 'No delivery found with this tracking ID.');
});
