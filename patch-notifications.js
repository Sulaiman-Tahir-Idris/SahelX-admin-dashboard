const fs = require('fs');
let code = fs.readFileSync('functions/src/notifications.ts', 'utf8');
code = code.replace(/export const onDeliveryCreated =[\s\S]*$/, '');
code += 
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
      let tokens = [];
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
  }
);
;
fs.writeFileSync('functions/src/notifications.ts', code);
