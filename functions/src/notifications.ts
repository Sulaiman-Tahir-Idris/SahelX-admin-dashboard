import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';

const db = getFirestore();
const messaging = getMessaging();

export const sendAdminNotification = onCall(async (request) => {
  const { title, body, target } = request.data;
  if (!title || !body || !target) {
    throw new HttpsError('invalid-argument', 'Title, body, and target are required.');
  }

  let tokens: string[] = [];

  if (target === 'all' || target === 'customers') {
    const usersSnap = await db.collection('User').get();
    usersSnap.forEach((doc) => {
      const data = doc.data();
      if (data.fcmTokens && Array.isArray(data.fcmTokens)) {
        tokens.push(...data.fcmTokens);
      }
    });
  }

  if (target === 'all' || target === 'riders') {
    const ridersSnap = await db.collection('CourierUser').get();
    ridersSnap.forEach((doc) => {
      const data = doc.data();
      if (data.fcmTokens && Array.isArray(data.fcmTokens)) {
        tokens.push(...data.fcmTokens);
      }
    });
  }

  tokens = [...new Set(tokens)];

  if (tokens.length === 0) {
    return { success: true, count: 0, message: 'No devices found to send to.' };
  }

  try {
    const response = await messaging.sendEachForMulticast({
      tokens,
      notification: { title, body },
    });
    return { success: true, count: response.successCount };
  } catch (error) {
    console.error('Error sending admin notification:', error);
    throw new HttpsError('internal', 'Failed to send notifications');
  }
});

export const onDeliveryStatusChanged = onDocumentUpdated(
  'Deliveries/{deliveryId}',
  async (event) => {
    if (!event.data) return null;
    const beforeData = event.data.before.data();
    const afterData = event.data.after.data();

    if (!beforeData || !afterData) return null;
    if (beforeData.status === afterData.status) return null;

    const customerId = afterData.customerId;
    if (!customerId) return null;

    let title = 'Delivery Update';
    let body = `Your delivery status changed to ${afterData.status}.`;

    if (afterData.status === 'assigned') {
      title = 'Rider Assigned!';
      body = 'A rider is now on their way to pick up your package.';
    } else if (afterData.status === 'picked_up') {
      title = 'Package Picked Up';
      body = 'Your package has been picked up and is on its way!';
    } else if (afterData.status === 'delivered') {
      title = 'Package Delivered 🎉';
      body = 'Your package has been successfully delivered!';
    } else if (afterData.status === 'cancelled') {
      title = 'Delivery Cancelled';
      body = 'Your delivery request was cancelled.';
    }

    const customerSnap = await db.collection('User').doc(customerId).get();
    if (!customerSnap.exists) return null;

    const customerData = customerSnap.data();
    const tokens = customerData?.fcmTokens as string[] | undefined;

    if (!tokens || !Array.isArray(tokens) || tokens.length === 0) return null;

    try {
      await messaging.sendEachForMulticast({
        tokens,
        notification: { title, body },
        data: { deliveryId: event.params.deliveryId }
      });
      console.log(`Status notification sent for delivery ${event.params.deliveryId}`);
    } catch (error) {
      console.error('Error sending delivery status notification:', error);
    }
    return null;
  }
);
