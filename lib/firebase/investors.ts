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
  // Step 1: Create Firebase Auth user via REST (without affecting admin session)
  const authRes = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FIREBASE_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: investorData.email,
        password: investorData.password,
        displayName: investorData.displayName,
        returnSecureToken: true,
      }),
    }
  );
  const authData = await authRes.json();
  if (!authRes.ok || authData.error) {
    throw new Error(authData.error?.message || "Failed to create Auth user");
  }
  const uid: string = authData.localId;
  const idToken: string = authData.idToken;

  // Step 2: Write investor profile to Firestore using the new user's token (satisfies isOwner rule)
  const fsUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/Investors/${uid}?key=${FIREBASE_API_KEY}`;
  const fsRes = await fetch(fsUrl, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${idToken}` },
    body: JSON.stringify({
      fields: {
        userId: { stringValue: uid },
        email: { stringValue: investorData.email },
        phone: { stringValue: investorData.phone || "" },
        displayName: { stringValue: investorData.displayName },
        role: { stringValue: "investor" },
        numberOfBikes: { integerValue: investorData.numberOfBikes || 0 },
        totalInvested: { integerValue: investorData.totalInvested || 0 },
        notes: { stringValue: investorData.notes || "" },
        bikePurchase: { booleanValue: false },
        documentsReady: { booleanValue: false },
        riderReadiness: { booleanValue: false },
        bikeReadiness: { booleanValue: false },
        createdAt: { timestampValue: new Date().toISOString() },
      },
    }),
  });
  const fsData = await fsRes.json();
  if (!fsRes.ok) {
    throw new Error(fsData.error?.message || "Failed to save investor profile");
  }

  return uid;
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
