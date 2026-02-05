// secretary-users.ts
import {
  collection,
  doc,
  getDocs,
  getDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "./config";

export interface SecretaryUser {
  id?: string;
  userId: string;
  role: "secretary";
  permissions: string[];
  createdAt: any;
  email?: string;
  displayName?: string;
}

/**
 * Get all secretaries
 */
export const getSecretaryUsers = async (): Promise<SecretaryUser[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, "Secretary"));
    const secretaries: SecretaryUser[] = [];

    querySnapshot.forEach((doc) => {
      secretaries.push({
        id: doc.id,
        ...doc.data(),
      } as SecretaryUser);
    });

    // Sort by createdAt descending (newest first)
    secretaries.sort((a, b) => {
      const aTime =
        a.createdAt?.seconds || a.createdAt?.toDate?.()?.getTime() || 0;
      const bTime =
        b.createdAt?.seconds || b.createdAt?.toDate?.()?.getTime() || 0;
      return bTime - aTime;
    });

    return secretaries;
  } catch (error: any) {
    throw new Error("Failed to get secretaries");
  }
};

/**
 * Get a single secretary by ID
 */
export const getSecretaryUser = async (
  id: string,
): Promise<SecretaryUser | null> => {
  try {
    const docRef = doc(db, "Secretary", id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as SecretaryUser;
    }

    return null;
  } catch (error: any) {
    throw new Error("Failed to get secretary");
  }
};

/**
 * Delete a secretary
 */
export const deleteSecretaryUser = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, "Secretary", id);
    await deleteDoc(docRef);

    // Note: Deleting the actual Firebase Auth user requires server-side admin SDK
  } catch (error: any) {
    throw new Error("Failed to delete secretary");
  }
};
