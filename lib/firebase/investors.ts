import {
  collection,
  doc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./config";
import type { InvestorUser } from "./investorAuth";

const FIREBASE_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAbvJX4T18HBcxr1BpD-WFhYDUyMthaFR0";
const FIREBASE_PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "sahelx-backend";

/**
 * Create a new investor
 */
export const createInvestor = async (investorData: any): Promise<string> => {
  try {
    const response = await fetch('/api/admin/create-investor', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: investorData.email,
        password: investorData.password,
        displayName: investorData.displayName,
        phone: investorData.phone,
        numberOfBikes: investorData.numberOfBikes,
        totalInvested: investorData.totalInvested,
        notes: investorData.notes,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to create investor");
    }

    return data.investorId;
  } catch (error: any) {
    throw new Error(error.message || "Failed to create investor");
  }
};


/**
 * Get all investors
 */
export const getInvestors = async (): Promise<InvestorUser[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, "Investors"));
    const investors: InvestorUser[] = [];

    querySnapshot.forEach((doc) => {
      investors.push({
        id: doc.id,
        ...doc.data(),
      } as InvestorUser);
    });

    // Sort by createdAt descending (newest first)
    investors.sort((a, b) => {
      const aTime =
        a.createdAt?.seconds || a.createdAt?.toDate?.()?.getTime() || 0;
      const bTime =
        b.createdAt?.seconds || b.createdAt?.toDate?.()?.getTime() || 0;
      return bTime - aTime;
    });

    return investors;
  } catch (error: any) {
    throw new Error("Failed to get investors");
  }
};

/**
 * Get a single investor by ID
 */
export const getInvestor = async (
  id: string,
): Promise<InvestorUser | null> => {
  try {
    const docRef = doc(db, "Investors", id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as InvestorUser;
    }

    return null;
  } catch (error: any) {
    throw new Error("Failed to get investor");
  }
};

/**
 * Update an investor
 */
export const updateInvestor = async (
  id: string,
  updates: Partial<InvestorUser>,
): Promise<void> => {
  try {
    const docRef = doc(db, "Investors", id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error: any) {
    throw new Error("Failed to update investor");
  }
};

/**
 * Delete an investor
 */
export const deleteInvestorUser = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, "Investors", id);
    await deleteDoc(docRef);
    // Note: Deleting the actual Firebase Auth user requires server-side admin SDK
  } catch (error: any) {
    throw new Error("Failed to delete investor");
  }
};
