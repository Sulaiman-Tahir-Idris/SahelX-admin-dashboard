'use client'
import { useEffect, useRef } from 'react'
import { useToast } from '@/hooks/use-toast'
import { useUnreadMessages } from '@/lib/chat/use-unread-messages'
import { Timestamp } from 'firebase/firestore'

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY

/**
 * All-in-one notifications hook for the sidebar.
 *
 * - Returns `unreadCount` for the badge
 * - Shows a toast popup when a new message arrives via Firestore (no FCM needed)
 * - Silently registers the FCM token so background OS notifications still work
 */
export function useNotifications({
  userId,
  userCollection,
  lastSeenAt,
  isChatOpen = false,
}: {
  userId: string
  userCollection: 'Admin' | 'Secretary'
  lastSeenAt?: Timestamp | null
  isChatOpen?: boolean
}) {
  const { toast } = useToast()
  const { unreadCount, newMessages } = useUnreadMessages(userId, lastSeenAt)

  // Track which message IDs we've already toasted so React StrictMode
  // double-invocations don't fire two toasts for the same message.
  const toastedIds = useRef<Set<string>>(new Set())

  // Show a toast for each new message that arrives (Firestore-driven)
  useEffect(() => {
    if (isChatOpen || !userId) return
    newMessages.forEach(msg => {
      if (toastedIds.current.has(msg.id)) return
      toastedIds.current.add(msg.id)
      toast({
        title: msg.senderName,
        description: msg.text.length > 80 ? msg.text.slice(0, 80) + '…' : msg.text,
      })
    })
  }, [newMessages, isChatOpen, userId, toast])

  // Silently register FCM token for background OS notifications
  // (Does NOT prompt the user — only registers if permission was already granted)
  useEffect(() => {
    if (!userId || typeof window === 'undefined') return
    if (!('Notification' in window)) return
    if (Notification.permission !== 'granted') return

    let cancelled = false

    const registerToken = async () => {
      try {
        const app = (await import('@/lib/firebase/config')).default
        const { getMessaging, getToken } = await import('firebase/messaging')
        const { doc, updateDoc, arrayUnion } = await import('firebase/firestore')
        const { db } = await import('@/lib/firebase/config')

        if (cancelled) return
        if (!VAPID_KEY) return

        const sw = await navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' })
        await navigator.serviceWorker.ready

        if (cancelled) return

        const messaging = getMessaging(app)
        const token = await getToken(messaging, {
          vapidKey: VAPID_KEY,
          serviceWorkerRegistration: sw,
        })

        if (!token || cancelled) return

        await updateDoc(doc(db, userCollection, userId), {
          fcmTokens: arrayUnion(token),
        })
      } catch {
        // Silently ignore — FCM is best-effort, toasts still work
      }
    }

    registerToken()
    return () => { cancelled = true }
  }, [userId, userCollection])

  return { unreadCount }
}
