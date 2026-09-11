import * as functionsV1 from 'firebase-functions/v1';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';

const db = getFirestore();
const messaging = getMessaging();

// Kept as v1 — already deployed, cannot upgrade in-place without deleting first
export const onNewChatMessage = functionsV1.firestore
  .document('adminChats/{chatId}/messages/{messageId}')
  .onCreate(async (snap, context) => {
    const { chatId } = context.params;
    const msgData = snap.data();
    if (!msgData) return null;

    const senderId = msgData.senderId as string;
    const senderName = (msgData.senderName as string) || 'Someone';
    const text = (msgData.text as string) || 'Sent a new message';

    const tokens: string[] = [];
    const tokenToUserMap = new Map<string, { id: string; collection: string }>();

    const fetchTokens = async (col: string, excludeId: string) => {
      const users = await db.collection(col).get();
      users.forEach((u) => {
        if (u.id === excludeId) return;
        const data = u.data();
        if (data.fcmTokens && Array.isArray(data.fcmTokens)) {
          (data.fcmTokens as string[]).forEach((t) => {
            tokens.push(t);
            tokenToUserMap.set(t, { id: u.id, collection: col });
          });
        }
      });
    };

    if (chatId === 'global') {
      await fetchTokens('Admin', senderId);
      await fetchTokens('Secretary', senderId);
    } else {
      const participants = chatId.split('_');
      const recipientId = participants.find((id: string) => id !== senderId);
      if (recipientId) {
        const adminDoc = await db.collection('Admin').doc(recipientId).get();
        if (adminDoc.exists && adminDoc.data()?.fcmTokens) {
          (adminDoc.data()!.fcmTokens as string[]).forEach((t) => {
            tokens.push(t);
            tokenToUserMap.set(t, { id: recipientId, collection: 'Admin' });
          });
        } else {
          const secDoc = await db.collection('Secretary').doc(recipientId).get();
          if (secDoc.exists && secDoc.data()?.fcmTokens) {
            (secDoc.data()!.fcmTokens as string[]).forEach((t) => {
              tokens.push(t);
              tokenToUserMap.set(t, { id: recipientId, collection: 'Secretary' });
            });
          }
        }
      }
    }

    if (tokens.length === 0) return null;

    const response = await messaging.sendEachForMulticast({
      tokens,
      notification: {
        title: `New message from ${senderName}`,
        body: text.length > 50 ? text.substring(0, 50) + '...' : text,
      },
    });

    const tokensToRemove = new Map<string, { collection: string; id: string; tokens: string[] }>();
    response.responses.forEach((res, idx) => {
      if (!res.success && res.error) {
        const code = res.error.code;
        if (
          code === 'messaging/invalid-registration-token' ||
          code === 'messaging/registration-token-not-registered'
        ) {
          const token = tokens[idx];
          const userInfo = tokenToUserMap.get(token);
          if (userInfo) {
            const key = `${userInfo.collection}_${userInfo.id}`;
            if (!tokensToRemove.has(key)) {
              tokensToRemove.set(key, { collection: userInfo.collection, id: userInfo.id, tokens: [] });
            }
            tokensToRemove.get(key)!.tokens.push(token);
          }
        }
      }
    });

    if (tokensToRemove.size > 0) {
      const batch = db.batch();
      for (const [, info] of tokensToRemove) {
        const ref = db.collection(info.collection).doc(info.id);
        batch.update(ref, { fcmTokens: FieldValue.arrayRemove(...info.tokens) });
      }
      await batch.commit();
    }
    return null;
  });

