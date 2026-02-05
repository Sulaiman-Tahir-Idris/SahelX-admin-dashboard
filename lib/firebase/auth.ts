import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./config";

export interface AdminUser {
  userId: string;
  id: string;
  role: string;
  permissions: string[];
  createdAt: any;
  email?: string;
  displayName?: string;
  phone?: string;
  location?: string;
}

// Sign in admin user
export const signInAdmin = async (
  email: string,
  password: string,
): Promise<AdminUser> => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password,
    );
    const user = userCredential.user;

    // Get admin data from Firestore
    const adminDoc = await getDoc(doc(db, "Admin", user.uid));

    if (!adminDoc.exists()) {
      throw new Error("User is not an admin");
    }

    const adminData = adminDoc.data() as AdminUser;

    // Allow multiple admin roles (CEO/CTO same full access as admin)
    const allowedRoles = ["admin", "superadmin", "ceo", "cto", "cfo", "coo"];
    if (!allowedRoles.includes(adminData.role)) {
      throw new Error("Insufficient permissions");
    }

    return {
      ...adminData,
      userId: user.uid,
      email: user.email || "",
      displayName: user.displayName || adminData.displayName || "",
    };
  } catch (error: any) {
    throw new Error(error.message || "Failed to sign in");
  }
};

// Sign out admin user
export const signOutAdmin = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error: any) {
    throw new Error("Failed to sign out");
  }
};

// Get current admin user
export const getCurrentAdmin = async (): Promise<AdminUser | null> => {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      unsubscribe();

      if (!user) {
        resolve(null);
        return;
      }

      try {
        const adminDoc = await getDoc(doc(db, "Admin", user.uid));

        if (!adminDoc.exists()) {
          resolve(null);
          return;
        }

        const adminData = adminDoc.data() as AdminUser;

        resolve({
          ...adminData,
          userId: user.uid,
          email: user.email || "",
          displayName: user.displayName || adminData.displayName || "",
        });
      } catch (error) {
        resolve(null);
      }
    });
  });
};

// Listen to auth state changes
export const onAdminAuthStateChanged = (
  callback: (admin: AdminUser | null) => void,
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (!user) {
      callback(null);
      return;
    }

    try {
      const adminDoc = await getDoc(doc(db, "Admin", user.uid));

      if (!adminDoc.exists()) {
        callback(null);
        return;
      }

      const adminData = adminDoc.data() as AdminUser;

      callback({
        ...adminData,
        userId: user.uid,
        email: user.email || "",
        displayName: user.displayName || adminData.displayName || "",
      });
    } catch (error) {
      callback(null);
    }
  });
};
