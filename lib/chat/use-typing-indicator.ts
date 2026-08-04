import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

export function useTypingIndicator(currentUserId: string, chatId: string = "global") {
  const [typers, setTypers] = useState<string[]>([]);

  useEffect(() => {
    if (!chatId) return;
    
    const ref = collection(db, "adminChats", chatId, "typing");

    const unsub = onSnapshot(ref, (snap) => {
      const names = snap.docs
        .filter((d) => d.id !== currentUserId)
        .map((d) => d.data().name);

      setTypers(names);
    });

    return () => unsub();
  }, [currentUserId, chatId]);

  return typers;
}
