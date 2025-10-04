import { db } from "./config"
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";

export interface Payment {
  id: string;
  amount: number;
  createdAt: Date;
  customerId: string;
  deliveryId: string;
  gateway: string;
  gatewayResponse: string;
  paidAt: Date;
  reference: string;
  status: "paid" | "pending" | "failed";
}

const paymentsRef = collection(db, "payments");

export async function getAllPayments(): Promise<Payment[]> {
  const q = query(paymentsRef, orderBy("createdAt", "desc"));
  const snap = await getDocs(q);

  return snap.docs.map(doc => ({
    id: doc.id,
    ...(doc.data() as any),
    createdAt: doc.data().createdAt.toDate(),
    paidAt: doc.data().paidAt?.toDate(),
  })) as Payment[];
}

export async function getPaymentsByCustomer(customerId: string): Promise<Payment[]> {
  const q = query(paymentsRef, where("customerId", "==", customerId), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);

  return snap.docs.map(doc => ({
    id: doc.id,
    ...(doc.data() as any),
    createdAt: doc.data().createdAt.toDate(),
    paidAt: doc.data().paidAt?.toDate(),
  })) as Payment[];
}
