/**
 * lib/firebase/fcm.ts
 *
 * FCM token registration helper.
 * Foreground messages are handled via Firestore in use-notifications.ts.
 * This file only exists to support the "Enable Notifications" button
 * which explicitly requests permission and saves the FCM token.
 */
import { getMessaging, getToken } from 'firebase/messaging'
import { doc, updateDoc, arrayUnion } from 'firebase/firestore'
import { db } from './config'
import app from './config'

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY

export async function registerFcmToken(
  userId: string,
  userCollection: 'Admin' | 'Secretary'
): Promise<string | null> {
  if (typeof window === 'undefined') return null

  try {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return null

    const sw = await navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' })
    await navigator.serviceWorker.ready

    const messaging = getMessaging(app)
    if (!VAPID_KEY) return null

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: sw,
    })
    if (!token) return null

    await updateDoc(doc(db, userCollection, userId), {
      fcmTokens: arrayUnion(token),
    })

    return token
  } catch (err) {
    console.warn('[FCM] Token registration failed:', err)
    return null
  }
}
