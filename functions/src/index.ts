import * as functions from 'firebase-functions/v1';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';

initializeApp();
const db = getFirestore();
const messaging = getMessaging();

export const onNewChatMessage = functions.firestore
  .document('adminChats/{chatId}/messages/{messageId}')
  .onCreate(async (snap, context) => {
    const { chatId } = context.params;
    const msgData = snap.data();
    
    if (!msgData) return null;

    const senderId = msgData.senderId;
    const senderName = msgData.senderName || 'Someone';
    const text = msgData.text || 'Sent a new message';

    const tokens: string[] = [];
    const tokenToUserMap = new Map<string, { id: string, collection: string }>();

    const fetchTokens = async (col: string, excludeId: string) => {
      const users = await db.collection(col).get();
      users.forEach(u => {
        if (u.id === excludeId) return;
        const data = u.data();
        if (data.fcmTokens && Array.isArray(data.fcmTokens)) {
          data.fcmTokens.forEach((t: string) => {
            tokens.push(t);
            tokenToUserMap.set(t, { id: u.id, collection: col });
          });
        }
      });
    };

    if (chatId === 'global') {
      // Send to all Admins and Secretaries
      await fetchTokens('Admin', senderId);
      await fetchTokens('Secretary', senderId);
    } else {
      // It's a 1-on-1 chat
      // Chat ID is typically created as `${userIdA}_${userIdB}`
      const participants = chatId.split('_');
      const recipientId = participants.find((id: string) => id !== senderId);
      if (recipientId) {
        // We don't know if recipient is Admin or Secretary, check both
        const adminDoc = await db.collection('Admin').doc(recipientId).get();
        if (adminDoc.exists && adminDoc.data()?.fcmTokens) {
          adminDoc.data()!.fcmTokens.forEach((t: string) => {
            tokens.push(t);
            tokenToUserMap.set(t, { id: recipientId, collection: 'Admin' });
          });
        } else {
          const secDoc = await db.collection('Secretary').doc(recipientId).get();
          if (secDoc.exists && secDoc.data()?.fcmTokens) {
            secDoc.data()!.fcmTokens.forEach((t: string) => {
              tokens.push(t);
              tokenToUserMap.set(t, { id: recipientId, collection: 'Secretary' });
            });
          }
        }
      }
    }

    if (tokens.length === 0) {
      console.log('No tokens found for this chat');
      return null;
    }

    const payload = {
      notification: {
        title: `New message from ${senderName}`,
        body: text.length > 50 ? text.substring(0, 50) + '...' : text,
        icon: '/icons/icon-192x192.png',
        clickAction: '/admin/messages'
      }
    };

    const response = await messaging.sendEachForMulticast({
      tokens,
      notification: payload.notification,
    });

    // Cleanup invalid tokens
    const tokensToRemove = new Map<string, { collection: string, id: string, tokens: string[] }>();
    response.responses.forEach((res, idx) => {
      if (!res.success && res.error) {
        if (
          res.error.code === 'messaging/invalid-registration-token' ||
          res.error.code === 'messaging/registration-token-not-registered'
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
      for (const [_, info] of tokensToRemove) {
        const ref = db.collection(info.collection).doc(info.id);
        batch.update(ref, {
          fcmTokens: FieldValue.arrayRemove(...info.tokens)
        });
      }
      await batch.commit();
      console.log(`Removed ${tokensToRemove.size} invalid tokens.`);
    }

    return null;
  });
