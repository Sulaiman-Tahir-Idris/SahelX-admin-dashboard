import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

export async function markMessagesAsSeen(userId: string, role?: string) {
  const collectionName = role?.toLowerCase() === "secretary" ? "Secretary" : "Admin";
  const ref = doc(db, collectionName, userId);

  await setDoc(ref, { lastSeenMessageAt: serverTimestamp() }, { merge: true });
}
