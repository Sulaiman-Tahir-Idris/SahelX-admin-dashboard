import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { auth, db, secondaryAuth } from "./config";

export interface CourierUser {
  id?: string;
  userId: string;
  email: string;
  phone: string;
  displayName: string;
  role: "courier";
  verified: boolean;
  profilePhoto?: string;
  isActive: boolean;
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    lat?: number;
    lng?: number;
  };
  vehicleInfo: {
    type: string;
    plateNumber: string;
    model: string;
    color: string;
    verified: boolean;
  };
  createdAt: any;
}

export interface CustomerUser {
  id?: string;
  userId: string;
  email: string;
  phone: string;
  fullName: string;
  role: "customer";
  isActive: boolean;
  profileImage?: string;
  totalOrders: number;
  createdAt: any;
  lastOrder?: any;
}

const FIREBASE_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAbvJX4T18HBcxr1BpD-WFhYDUyMthaFR0";
const FIREBASE_PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "sahelx-backend";

// Create a new courier without logging out the current admin
export const createCourierWithoutLogout = async (courierData: {
  email: string;
  password: string;
  displayName: string;
  phone: string;
  verified: boolean;
  isActive: boolean;
  profilePhoto?: string;
  address: { street: string; city: string; state: string; country: string };
  vehicleInfo: { type: string; plateNumber: string; model: string; color: string; verified: boolean };
}): Promise<string> => {
  // Step 1: Create Firebase Auth user via REST (gets back an idToken without affecting current session)
  const authRes = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FIREBASE_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: courierData.email,
        password: courierData.password,
        displayName: courierData.displayName,
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

  // Step 2: Write the courier profile to Firestore using the new user's token (satisfies isOwner rule)
  const fsUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/User/${uid}?key=${FIREBASE_API_KEY}`;
  const fsRes = await fetch(fsUrl, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${idToken}` },
    body: JSON.stringify({
      fields: {
        userId: { stringValue: uid },
        email: { stringValue: courierData.email },
        phone: { stringValue: courierData.phone || "" },
        displayName: { stringValue: courierData.displayName },
        role: { stringValue: "courier" },
        verified: { booleanValue: courierData.verified || false },
        isActive: { booleanValue: courierData.isActive !== false },
        isAvailable: { booleanValue: false },
        status: { stringValue: "offline" },
        profilePhoto: { stringValue: "" },
        address: { mapValue: { fields: {
          street: { stringValue: courierData.address?.street || "" },
          city: { stringValue: courierData.address?.city || "" },
          state: { stringValue: courierData.address?.state || "" },
          country: { stringValue: courierData.address?.country || "Nigeria" },
        }}},
        vehicleInfo: { mapValue: { fields: {
          type: { stringValue: courierData.vehicleInfo?.type || "" },
          plateNumber: { stringValue: courierData.vehicleInfo?.plateNumber || "" },
          model: { stringValue: courierData.vehicleInfo?.model || "" },
          color: { stringValue: courierData.vehicleInfo?.color || "" },
          verified: { booleanValue: courierData.verified || false },
        }}},
        createdAt: { timestampValue: new Date().toISOString() },
      },
    }),
  });
  const fsData = await fsRes.json();
  if (!fsRes.ok) {
    throw new Error(fsData.error?.message || "Failed to save courier profile");
  }

  return uid;
};


// Legacy function - keep for backward compatibility
export const createCourier = async (
  courierData: Omit<CourierUser, "id" | "userId" | "createdAt"> & {
    password: string;
  },
): Promise<string> => {
  return createCourierWithoutLogout(courierData);
};

// Get all couriers
export const getCouriers = async (): Promise<CourierUser[]> => {
  try {
    const q = query(collection(db, "User"), where("role", "==", "courier"));

    const querySnapshot = await getDocs(q);
    const couriers: CourierUser[] = [];

    querySnapshot.forEach((doc) => {
      couriers.push({
        id: doc.id,
        ...doc.data(),
      } as CourierUser);
    });

    // Sort by createdAt on client side
    couriers.sort((a, b) => {
      const aTime =
        a.createdAt?.seconds || a.createdAt?.toDate?.()?.getTime() || 0;
      const bTime =
        b.createdAt?.seconds || b.createdAt?.toDate?.()?.getTime() || 0;
      return bTime - aTime; // Newest first
    });

    return couriers;
  } catch (error: any) {
    throw new Error("Failed to get couriers");
  }
};

// Get all customers
export const getCustomers = async (): Promise<CustomerUser[]> => {
  try {
    const q = query(collection(db, "User"), where("role", "==", "customer"));

    const querySnapshot = await getDocs(q);
    const customers: CustomerUser[] = [];

    querySnapshot.forEach((doc) => {
      customers.push({
        id: doc.id,
        ...doc.data(),
      } as CustomerUser);
    });

    // Sort by createdAt on client side
    customers.sort((a, b) => {
      const aTime =
        a.createdAt?.seconds || a.createdAt?.toDate?.()?.getTime() || 0;
      const bTime =
        b.createdAt?.seconds || b.createdAt?.toDate?.()?.getTime() || 0;
      return bTime - aTime; // Newest first
    });

    return customers;
  } catch (error: any) {
    throw new Error("Failed to get customers");
  }
};

// Get single courier
export const getCourier = async (
  courierId: string,
): Promise<CourierUser | null> => {
  try {
    const docRef = doc(db, "User", courierId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as CourierUser;
    }

    return null;
  } catch (error: any) {
    throw new Error("Failed to get courier");
  }
};

// Get single customer
export const getCustomer = async (
  customerId: string,
): Promise<CustomerUser | null> => {
  try {
    const docRef = doc(db, "User", customerId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as CustomerUser;
    }

    return null;
  } catch (error: any) {
    throw new Error("Failed to get customer");
  }
};

// Update courier
export const updateCourier = async (
  courierId: string,
  updates: Partial<CourierUser>,
): Promise<void> => {
  try {
    const docRef = doc(db, "User", courierId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error: any) {
    throw new Error("Failed to update courier");
  }
};

// Delete courier
export const deleteCourier = async (courierId: string): Promise<void> => {
  try {
    const docRef = doc(db, "User", courierId);
    await deleteDoc(docRef);
  } catch (error: any) {
    throw new Error("Failed to delete courier");
  }
};
