import {
  doc,
  setDoc,
  arrayUnion,
  arrayRemove,
  getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";

export const toggleMessageReaction = async (
  messageId: string,
  emoji: string,
  userId: string,
) => {
  const messageRef = doc(db, "adminChats", "global", "messages", messageId);

  const snapshot = await getDoc(messageRef);
  if (!snapshot.exists()) return;

  const data = snapshot.data();
  const reactions: Record<string, string[]> = data.reactions || {};

  const hasReacted = reactions[emoji]?.includes(userId);

  await setDoc(
    messageRef,
    {
      reactions: {
        [emoji]: hasReacted ? arrayRemove(userId) : arrayUnion(userId),
      },
    },
    { merge: true },
  );
};
