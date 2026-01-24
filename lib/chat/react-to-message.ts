import {
  doc,
  getDoc,
  setDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";

export const toggleMessageReaction = async (
  messageId: string,
  emoji: string,
  userId: string,
) => {
  const messageRef = doc(db, "adminChats", "global", "messages", messageId);

  try {
    const snapshot = await getDoc(messageRef);
    const data = snapshot.data();
    const reactions: Record<string, string[]> = data?.reactions || {};

    const userHasReacted = reactions[emoji]?.includes(userId) ?? false;

    await setDoc(
      messageRef,
      {
        reactions: {
          [emoji]: userHasReacted ? arrayRemove(userId) : arrayUnion(userId),
        },
      },
      { merge: true },
    );
  } catch (error) {
    console.error("Error toggling reaction:", error);
  }
};
