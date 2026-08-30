import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./config";

export interface InvestorUser {
  id: string;
  userId: string;
  role: "investor";
  displayName: string;
  email: string;
  phone?: string;
  numberOfBikes: number;
  totalInvested: number;
  notes?: string;
  createdAt: any;
  updatedAt?: any;
}

/**
 * Sign in investor
 */
export const signInInvestor = async (
  email: string,
  password: string
): Promise<InvestorUser> => {
  const userCredential = await signInWithEmailAndPassword(
    auth,
    email,
    password
  );
  const user = userCredential.user;

  const investorDoc = await getDoc(doc(db, "Investors", user.uid));

  if (!investorDoc.exists()) {
    await signOut(auth);
    throw new Error("User is not an investor");
  }

  const data = investorDoc.data() as InvestorUser;

  if (data.role !== "investor") {
    await signOut(auth);
    throw new Error("Invalid investor role");
  }

  return {
    ...data,
    id: user.uid,
    userId: user.uid,
    email: user.email || data.email || "",
    displayName: user.displayName || data.displayName || "",
  };
};

/**
 * Get current investor
 */
export const getCurrentInvestor = async (): Promise<InvestorUser | null> => {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      unsubscribe();

      if (!user) {
        resolve(null);
        return;
      }

      try {
        const docSnap = await getDoc(doc(db, "Investors", user.uid));
        if (!docSnap.exists()) {
          resolve(null);
          return;
        }

        const data = docSnap.data() as InvestorUser;

        resolve({
          ...data,
          id: user.uid,
          userId: user.uid,
          email: user.email || data.email || "",
          displayName: user.displayName || data.displayName || "",
        });
      } catch {
        resolve(null);
      }
    });
  });
};

/**
 * Sign out investor
 */
export const signOutInvestor = async () => {
  await signOut(auth);
};
