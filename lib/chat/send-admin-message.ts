import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

export async function sendAdminMessage(text: string, user: any, chatId: string = "global") {
  await addDoc(collection(db, "adminChats", chatId, "messages"), {
    text,
    senderId: user.userId,
    senderName: user.displayName || "Admin",
    senderRole: user.role,
    createdAt: serverTimestamp(),
  });
}
