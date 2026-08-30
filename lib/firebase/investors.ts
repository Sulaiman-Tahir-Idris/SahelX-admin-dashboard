import {
  collection,
  doc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { auth, db, secondaryAuth } from "./config";
import type { InvestorUser } from "./investorAuth";

/**
 * Create a new investor
 */
export const createInvestor = async (
  investorData: any
): Promise<string> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      secondaryAuth,
      investorData.email,
      investorData.password
    );

    const user = userCredential.user;

    const newInvestor = {
      userId: user.uid,
      email: investorData.email,
      phone: investorData.phone || "",
      displayName: investorData.displayName,
      role: "investor",
      numberOfBikes: investorData.numberOfBikes || 0,
      totalInvested: investorData.totalInvested || 0,
      notes: investorData.notes || "",
      createdAt: serverTimestamp(),
    };

    await setDoc(doc(db, "Investors", user.uid), newInvestor);

    // Sign out the secondary auth instance immediately to clear it
    await signOut(secondaryAuth);

    return user.uid;
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
