import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./config";

export interface SecretaryUser {
  userId: string;
  id: string;
  role: "secretary";
  permissions: string[];
  createdAt: any;
  email?: string;
  displayName?: string;
}

/**
 * Sign in secretary
 */
export const signInSecretary = async (
  email: string,
  password: string
): Promise<SecretaryUser> => {
  const userCredential = await signInWithEmailAndPassword(
    auth,
    email,
    password
  );
  const user = userCredential.user;

  const secretaryDoc = await getDoc(doc(db, "Secretary", user.uid));

  if (!secretaryDoc.exists()) {
    await signOut(auth);
    throw new Error("User is not a secretary");
  }

  const data = secretaryDoc.data() as SecretaryUser;

  if (data.role !== "secretary") {
    await signOut(auth);
    throw new Error("Invalid secretary role");
  }

  return {
    ...data,
    userId: user.uid,
    email: user.email || "",
    displayName: user.displayName || data.displayName || "",
  };
};

/**
 * Get current secretary
 */
export const getCurrentSecretary = async (): Promise<SecretaryUser | null> => {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      unsubscribe();

      if (!user) {
        resolve(null);
        return;
      }

      try {
        const docSnap = await getDoc(doc(db, "Secretary", user.uid));
        if (!docSnap.exists()) {
          resolve(null);
          return;
        }

        const data = docSnap.data() as SecretaryUser;

        resolve({
          ...data,
          userId: user.uid,
          email: user.email || "",
          displayName: user.displayName || data.displayName || "",
        });
      } catch {
        resolve(null);
      }
    });
  });
};

/**
 * Sign out secretary
 */
export const signOutSecretary = async () => {
  await signOut(auth);
};
