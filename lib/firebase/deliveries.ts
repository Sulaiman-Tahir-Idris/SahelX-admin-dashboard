// lib/firebase/deliveries.ts
import {
  collection,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  arrayUnion,
  Timestamp,
} from "firebase/firestore";

import { db } from "./config";

export interface HistoryItem {
  timestamp: any;
  status: string;
  paymentStatus?: string;
}

export interface Delivery {
  id?: string;
  customerId: string;
  courierId?: string;
  courierName?: string;
  status: string;
  pickupLocation?: {
    address: string;
    lat: number;
    lng: number;
    phone?: string;
  };
  pickupPhoneNumber?: string;
  dropoffLocation?: {
    address: string;
    lat: number;
    lng: number;
  };
  goodsType?: string;
  goodsSize?: string;
  cost?: number;
  deliveryTime?: number;
  duration?: number;
  type?: string;
  createdAt: any;
  updatedAt?: any;
  rating?: number;
  tag?: string;
  trackingId?: string;
  paymentStatus?: string;
  history?: HistoryItem[];
}

export const getDeliveries = async (): Promise<Delivery[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, "deliveries")); // ✅ correct collection
    const deliveries: Delivery[] = [];

    querySnapshot.forEach((doc) => {
      deliveries.push({
        id: doc.id,
        ...doc.data(),
      } as Delivery);
    });

    deliveries.sort((a, b) => {
      const aTime =
        a.createdAt?.seconds || a.createdAt?.toDate?.()?.getTime() || 0;
      const bTime =
        b.createdAt?.seconds || b.createdAt?.toDate?.()?.getTime() || 0;
      return bTime - aTime;
    });

    return deliveries;
  } catch (error: any) {
    throw new Error("Failed to get deliveries");
  }
};

// Get deliveries for a single customer
export const getDeliveriesByCustomer = async (
  customerId: string,
): Promise<Delivery[]> => {
  try {
    // Avoid server-side orderBy to prevent Firestore composite index requirement.
    // We'll fetch by customerId and sort client-side.
    const q = query(
      collection(db, "deliveries"),
      where("customerId", "==", customerId),
    );

    const querySnapshot = await getDocs(q);
    const deliveries: Delivery[] = [];

    querySnapshot.forEach((doc) => {
      deliveries.push({ id: doc.id, ...doc.data() } as Delivery);
    });

    // Sort by createdAt descending on client
    deliveries.sort((a, b) => {
      const aTime =
        a.createdAt?.seconds || a.createdAt?.toDate?.()?.getTime() || 0;
      const bTime =
        b.createdAt?.seconds || b.createdAt?.toDate?.()?.getTime() || 0;
      return bTime - aTime;
    });

    return deliveries;
  } catch (error: any) {
    // return empty array instead of throwing to keep UI responsive
    return [];
  }
};

// Compute average rating for a courier (by courierId)
export const getAverageRatingForCourier = async (
  courierId: string,
): Promise<number | null> => {
  try {
    const q = query(
      collection(db, "deliveries"),
      where("courierId", "==", courierId),
    );
    const querySnapshot = await getDocs(q);
    const ratings: number[] = [];

    querySnapshot.forEach((doc) => {
      const data: any = doc.data();
      const r = data?.rating;
      // accept numbers or numeric strings; ignore null/undefined/non-numeric
      let rNum: number | null = null;
      if (typeof r === "number" && !isNaN(r)) rNum = r;
      else if (typeof r === "string" && r.trim() !== "" && !isNaN(Number(r)))
        rNum = Number(r);

      if (rNum !== null) ratings.push(rNum);
    });

    if (ratings.length === 0) return null;
    const sum = ratings.reduce((s, v) => s + v, 0);
    return sum / ratings.length;
  } catch (error: any) {
    return null;
  }
};

// Get total number of deliveries for a courier
export const getDeliveryCountForCourier = async (
  courierId: string,
): Promise<number> => {
  try {
    const q = query(
      collection(db, "deliveries"),
      where("courierId", "==", courierId),
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.size || querySnapshot.docs.length || 0;
  } catch (error: any) {
    return 0;
  }
};

// Fetch delivery history for a courier
export const fetchRiderDeliveryHistory = async (
  courierId: string,
): Promise<Delivery[]> => {
  try {
    const q = query(
      collection(db, "deliveries"),
      where("courierId", "==", courierId),
    );
    const snapshot = await getDocs(q);
    const deliveries: Delivery[] = [];
    snapshot.forEach((d) =>
      deliveries.push({ id: d.id, ...(d.data() as any) } as Delivery),
    );

    deliveries.sort((a, b) => {
      const aTime =
        a.createdAt?.seconds || a.createdAt?.toDate?.()?.getTime() || 0;
      const bTime =
        b.createdAt?.seconds || b.createdAt?.toDate?.()?.getTime() || 0;
      return bTime - aTime;
    });

    return deliveries;
  } catch (error: any) {
    return [];
  }
};

// Update delivery
export const updateDelivery = async (
  id: string,
  updates: Partial<Delivery>,
): Promise<void> => {
  try {
    const deliveryRef = doc(db, "deliveries", id);
    await updateDoc(deliveryRef, {
      ...updates,
      updatedAt: serverTimestamp(),
      history: arrayUnion({
        timestamp: Timestamp.now(),
        status: updates.status || "updated",
        paymentStatus: updates.paymentStatus,
      }),
    });
  } catch (error: any) {
    throw new Error("Failed to update delivery");
  }
};

// Delete delivery
export const deleteDelivery = async (id: string): Promise<void> => {
  try {
    const deliveryRef = doc(db, "deliveries", id);
    await deleteDoc(deliveryRef);
  } catch (error: any) {
    throw new Error("Failed to delete delivery");
  }
};
