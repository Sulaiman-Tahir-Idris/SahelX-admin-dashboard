import { useEffect, useRef, useState } from 'react'
import { collection, onSnapshot, query, where, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'

/**
 * Listens in real-time to all chat rooms the user participates in.
 *
 * Returns:
 * - `unreadCount` — number of unread messages since lastSeenAt (or mount time)
 * - `newMessages` — messages that arrived AFTER mount (used for toasts)
 */
export function useUnreadMessages(userId: string, lastSeenAt?: Timestamp | null) {
  const [unreadCount, setUnreadCount] = useState(0)
  const [newMessages, setNewMessages] = useState<{ id: string; chatId: string; senderName: string; text: string }[]>([])

  // Stable reference to the time this hook mounted — for toast-only listener
  const mountTimeRef = useRef<Timestamp>(Timestamp.now())

  // ── Unread count (respects lastSeenAt) ──────────────────────────────────
  useEffect(() => {
    if (!userId) {
      setUnreadCount(0)
      return
    }

    const baseline = lastSeenAt ?? mountTimeRef.current

    const globalQ = query(
      collection(db, 'adminChats', 'global', 'messages'),
      where('createdAt', '>', baseline),
    )

    let globalCount = 0
    const dmCountMap: Record<string, number> = {}
    const updateTotal = () =>
      setUnreadCount(globalCount + Object.values(dmCountMap).reduce((a, b) => a + b, 0))

    const unsubGlobal = onSnapshot(globalQ, (snap) => {
      globalCount = snap.docs.filter(d => d.data().senderId !== userId).length
      updateTotal()
    })

    const dmUnsubs: (() => void)[] = []
    const unsubChats = onSnapshot(query(collection(db, 'adminChats')), (chatsSnap) => {
      dmUnsubs.forEach(u => u())
      dmUnsubs.length = 0
      Object.keys(dmCountMap).forEach(k => delete dmCountMap[k])

      const dmChatIds = chatsSnap.docs
        .map(d => d.id)
        .filter(id => id !== 'global' && id !== 'secretaries_group' && id.includes(userId))

      if (dmChatIds.length === 0) { updateTotal(); return }

      dmChatIds.forEach(chatId => {
        const msgsQ = query(
          collection(db, 'adminChats', chatId, 'messages'),
          where('createdAt', '>', baseline),
        )
        dmUnsubs.push(onSnapshot(msgsQ, (snap) => {
          dmCountMap[chatId] = snap.docs.filter(d => d.data().senderId !== userId).length
          updateTotal()
        }))
      })
    })

    return () => {
      unsubGlobal()
      unsubChats()
      dmUnsubs.forEach(u => u())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, lastSeenAt?.seconds])

  // ── Toast trigger (only fires for messages arriving AFTER mount) ─────────
  useEffect(() => {
    if (!userId) return

    const arrivedAfter = mountTimeRef.current

    // Global chat
    let initialGlobalLoad = true
    const unsubGlobalToast = onSnapshot(
      query(collection(db, 'adminChats', 'global', 'messages'), where('createdAt', '>', arrivedAfter)),
      (snap) => {
        if (initialGlobalLoad) { initialGlobalLoad = false; return }
        snap.docChanges().forEach(change => {
          if (change.type !== 'added') return
          const d = change.doc.data()
          if (d.senderId === userId) return
          setNewMessages(prev => [...prev, {
            id: change.doc.id,
            chatId: 'global',
            senderName: d.senderName || 'Someone',
            text: d.text || '',
          }])
        })
      }
    )

    // DM rooms
    const dmToastUnsubs: (() => void)[] = []
    let initialChatsLoad = true
    const unsubChats = onSnapshot(query(collection(db, 'adminChats')), (chatsSnap) => {
      if (initialChatsLoad) { initialChatsLoad = false }
      dmToastUnsubs.forEach(u => u())
      dmToastUnsubs.length = 0

      chatsSnap.docs
        .map(d => d.id)
        .filter(id => id !== 'global' && id !== 'secretaries_group' && id.includes(userId))
        .forEach(chatId => {
          let initialDmLoad = true
          dmToastUnsubs.push(onSnapshot(
            query(collection(db, 'adminChats', chatId, 'messages'), where('createdAt', '>', arrivedAfter)),
            (snap) => {
              if (initialDmLoad) { initialDmLoad = false; return }
              snap.docChanges().forEach(change => {
                if (change.type !== 'added') return
                const d = change.doc.data()
                if (d.senderId === userId) return
                setNewMessages(prev => [...prev, {
                  id: change.doc.id,
                  chatId,
                  senderName: d.senderName || 'Someone',
                  text: d.text || '',
                }])
              })
            }
          ))
        })
    })

    return () => {
      unsubGlobalToast()
      unsubChats()
      dmToastUnsubs.forEach(u => u())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  return { unreadCount, newMessages }
}
