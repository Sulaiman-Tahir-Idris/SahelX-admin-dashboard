import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onDocumentUpdated, onDocumentCreated } from 'firebase-functions/v2/firestore';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';


export const sendAdminNotification = onCall(async (request) => {
  const db = getFirestore();
  const messaging = getMessaging();
  const { title, body, target } = request.data;
  if (!title || !body || !target) {
    throw new HttpsError('invalid-argument', 'Title, body, and target are required.');
  }

  let tokens: string[] = [];
  const batch = db.batch();

  if (target === 'all' || target === 'customers') {
    const usersSnap = await db.collection('User').get();
    usersSnap.forEach((doc) => {
      const data = doc.data();
      const notifRef = db.collection('User').doc(doc.id).collection('notifications').doc();
      batch.set(notifRef, { title, body, read: false, createdAt: FieldValue.serverTimestamp() });
      if (data.fcmTokens && Array.isArray(data.fcmTokens)) {
        tokens.push(...data.fcmTokens);
      }
    });
  }

  if (target === 'all' || target === 'riders') {
    const ridersSnap = await db.collection('User').where('role', '==', 'courier').get();
    ridersSnap.forEach((doc) => {
      const data = doc.data();
      const notifRef = db.collection('User').doc(doc.id).collection('notifications').doc();
      batch.set(notifRef, { title, body, read: false, createdAt: FieldValue.serverTimestamp() });
      if (data.fcmTokens && Array.isArray(data.fcmTokens)) {
        tokens.push(...data.fcmTokens);
      }
    });
  }

  await batch.commit();

  tokens = [...new Set(tokens)];

  if (tokens.length === 0) {
    return { success: true, count: 0, message: 'No devices found to send to.' };
  }

  try {
    const response = await messaging.sendEachForMulticast({
      tokens,
      notification: { title, body },
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'default'
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1
          }
        }
      }
    });
    return { success: true, count: response.successCount };
  } catch (error) {
    console.error('Error sending admin notification:', error);
    throw new HttpsError('internal', 'Failed to send notifications');
  }
});

export const onDeliveryStatusChanged = onDocumentUpdated(
  'deliveries/{deliveryId}',
  async (event) => {
    const db = getFirestore();
    const messaging = getMessaging();
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
      title = 'Package Delivered';
      body = 'Your package has been successfully delivered!';
    } else if (afterData.status === 'cancelled') {
      title = 'Delivery Cancelled';
      body = 'Your delivery request was cancelled.';
    }

    try {
      // 1. Write to Firestore so it appears in the app's notification bell inbox
      await db.collection('User').doc(customerId).collection('notifications').add({
        title,
        body,
        deliveryId: event.params.deliveryId,
        read: false,
        createdAt: FieldValue.serverTimestamp()
      });
    } catch (e) {
      console.error('Error writing to User/notifications:', e);
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
        data: { deliveryId: event.params.deliveryId },
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            channelId: 'default'
          }
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            }
          }
        }
      });
      console.log(`Status notification sent for delivery ${event.params.deliveryId}`);
    } catch (error) {
      console.error('Error sending delivery status notification:', error);
    }
    return null;
  }
);


export const onDeliveryCreated = onDocumentCreated(
  'deliveries/{deliveryId}',
  async (event) => {
    const db = getFirestore();
    const messaging = getMessaging();
    if (!event.data) return null;
    const data = event.data.data();

    // Broadcast to all riders
    const title = 'New Delivery Available!';
    const body = 'Pickup at ' + (data.pickupLocation?.address || 'Unknown location');

    try {
      const ridersSnap = await db.collection('User').where('role', '==', 'courier').get();
      let tokens: string[] = [];
      const batch = db.batch();

      ridersSnap.forEach((doc) => {
        const rData = doc.data();
        if (rData.fcmTokens && Array.isArray(rData.fcmTokens)) {
          tokens.push(...rData.fcmTokens);
        }
        const notifRef = db.collection('User').doc(doc.id).collection('notifications').doc();
        batch.set(notifRef, {
          title,
          body,
          deliveryId: event.params.deliveryId,
          read: false,
          createdAt: FieldValue.serverTimestamp()
        });
      });

      await batch.commit();

      if (tokens.length > 0) {
        await messaging.sendEachForMulticast({
          tokens,
          notification: { title, body },
          data: { deliveryId: event.params.deliveryId },
          android: { priority: 'high', notification: { sound: 'default', channelId: 'default' } },
          apns: { payload: { aps: { sound: 'default', badge: 1 } } }
        });
        console.log('[onDeliveryCreated] Sent broadcast push to ' + tokens.length + ' rider tokens.');
      }
    } catch (e) {
      console.error('Error broadcasting new delivery:', e);
    }
    return null;
  }
);
