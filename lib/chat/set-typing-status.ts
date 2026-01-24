import { doc, setDoc, serverTimestamp, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

export async function setTypingStatus(
  adminId: string,
  name: string,
  typing: boolean,
) {
  const ref = doc(db, "adminChats", "global", "typing", adminId);

  if (typing) {
    await setDoc(ref, {
      name,
      typing: true,
      updatedAt: serverTimestamp(),
    });
  } else {
    await deleteDoc(ref);
  }
}
