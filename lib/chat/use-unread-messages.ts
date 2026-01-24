import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";

export function useUnreadMessages(lastSeen?: Timestamp | null) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    // ✅ If admin has never opened chat, unread = 0
    if (!lastSeen) {
      setCount(0);
      return;
    }

    const q = query(
      collection(db, "adminChats", "global", "messages"),
      where("createdAt", ">", lastSeen),
    );

    const unsub = onSnapshot(q, (snap) => {
      setCount(snap.size);
    });

    return () => unsub();
  }, [lastSeen]);

  return count;
}
