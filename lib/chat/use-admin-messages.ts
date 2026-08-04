import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

export function useAdminMessages(chatId: string = "global") {
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    if (!chatId) return;
    
    const q = query(
      collection(db, "adminChats", chatId, "messages"),
      orderBy("createdAt", "asc"),
    );

    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => unsub();
  }, [chatId]);

  return messages;
}
