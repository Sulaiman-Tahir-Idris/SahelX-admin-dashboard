import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

export async function sendAdminMessage(text: string, user: any) {
  await addDoc(collection(db, "adminChats", "global", "messages"), {
    text,
    senderId: user.userId,
    senderName: user.displayName || "Admin",
    senderRole: user.role,
    createdAt: serverTimestamp(),
  });
}
