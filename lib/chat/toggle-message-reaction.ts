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
  const messageRef = doc(db, "AdminMessages", messageId);

  try {
    const snapshot = await getDoc(messageRef);
    const data = snapshot.data();
    const reactions: Record<string, string[]> = data?.reactions || {};

    const userHasReacted = reactions[emoji]?.includes(userId) ?? false;

    if (userHasReacted) {
      // Remove reaction
      await setDoc(
        messageRef,
        {
          reactions: {
            [emoji]: arrayRemove(userId),
          },
        },
        { merge: true }, // merge ensures existing fields are preserved
      );
    } else {
      // Add reaction
      await setDoc(
        messageRef,
        {
          reactions: {
            [emoji]: arrayUnion(userId),
          },
        },
        { merge: true },
      );
    }
  } catch (error) {
    console.error("Error toggling reaction:", error);
  }
};
