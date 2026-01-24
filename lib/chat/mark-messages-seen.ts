import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

export async function markMessagesAsSeen(adminId: string) {
  const ref = doc(db, "Admin", adminId);

  await setDoc(ref, { lastSeenMessageAt: serverTimestamp() }, { merge: true });
}
