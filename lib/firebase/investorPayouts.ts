import {
  collection,
  doc,
  getDocs,
  addDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db, auth } from "./config";
import { addCashTransaction, addBankTransaction } from "./finance";

export interface InvestorPayout {
  id: string;
  investorId: string;
  amount: number;
  source: string; // "Cash" or bank account ID
  financeTransactionId: string;
  date: Date;
  notes?: string;
  createdBy: string;
  createdAt: Date;
}

export const getInvestorPayouts = async (
  investorId: string
): Promise<InvestorPayout[]> => {
  try {
    const q = query(
      collection(db, "investorPayouts"),
      where("investorId", "==", investorId)
    );
    const snap = await getDocs(q);

    const payouts = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        date: data.date?.toDate?.() || new Date(data.date),
        createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
      } as InvestorPayout;
    });

    // Sort client-side to avoid needing a Firestore composite index
    return payouts.sort((a, b) => b.date.getTime() - a.date.getTime());
  } catch (error) {
    console.error("Failed to get investor payouts", error);
    throw new Error("Failed to get investor payouts");
  }
};

export const createInvestorPayout = async (
  investorId: string,
  amount: number,
  source: string, // "Cash" or Bank Account ID
  notes: string
): Promise<string> => {
  try {
    const adminUser = auth.currentUser;
    const createdBy = adminUser?.email || "unknown admin";
    const date = new Date();

    let financeTransactionId = "";

    // Record the deduction in the Finance module
    if (source === "Cash") {
      financeTransactionId = await addCashTransaction({
        date,
        amount,
        type: "cash_out",
        description: `Investor Payout - ${notes || "Weekly Payout"}`,
        createdBy,
      });
    } else {
      financeTransactionId = await addBankTransaction(
        source, // accountId
        {
          date,
          description: `Investor Payout - ${notes || "Weekly Payout"}`,
          debit: amount,
          credit: 0,
          createdBy,
        }
      );
    }

    // Save the payout record for the investor to see
    const payoutData = {
      investorId,
      amount,
      source,
      financeTransactionId,
      date: Timestamp.fromDate(date),
      notes,
      createdBy,
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, "investorPayouts"), payoutData);
    return docRef.id;
  } catch (error) {
    console.error("Failed to create investor payout", error);
    throw new Error("Failed to create investor payout");
  }
};
