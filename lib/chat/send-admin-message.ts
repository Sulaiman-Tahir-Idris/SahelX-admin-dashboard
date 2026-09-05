import { addDoc, collection, serverTimestamp, setDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

export async function sendAdminMessage(text: string, user: any, chatId: string = "global") {
  // Ensure the parent document exists so the unread counter can find the chat room
  await setDoc(doc(db, "adminChats", chatId), { lastActivity: serverTimestamp() }, { merge: true });

  await addDoc(collection(db, "adminChats", chatId, "messages"), {
    text,
    senderId: user.userId,
    senderName: user.displayName || "Admin",
    senderRole: user.role,
    createdAt: serverTimestamp(),
  });
}
