import {
  doc,
  updateDoc,
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
    // Get current reactions
    const snapshot = await getDoc(messageRef);
    const data = snapshot.data();
    const reactions: Record<string, string[]> = data?.reactions || {};

    const userHasReacted = reactions[emoji]?.includes(userId) ?? false;

    if (userHasReacted) {
      // Remove reaction
      await updateDoc(messageRef, {
        [`reactions.${emoji}`]: arrayRemove(userId),
      });
    } else {
      // Add reaction
      await updateDoc(messageRef, {
        [`reactions.${emoji}`]: arrayUnion(userId),
      });
    }
  } catch (error) {
    console.error("Error toggling reaction:", error);
  }
};
