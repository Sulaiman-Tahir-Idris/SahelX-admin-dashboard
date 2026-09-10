import {
  collection,
  doc,
  getDocs,
  getDoc, updateDoc,
  query,
  where,
} from "firebase/firestore";
import { db } from "./config";

export interface Customer {
  id?: string;
  userId: string;
  email: string;
  phone: string;
  fullName: string;
  displayName: string;
  role: "customer";
  isActive: boolean;
  isVerified?: boolean;
  profilePhoto?: string;
  totalOrders: number;
  createdAt: any;
  lastOrder?: any;
  walletBalance?: number;
  savedAddresses?: any[];
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
  };
}

// Get all customers from User collection with role 'customer'
export const getCustomers = async (): Promise<Customer[]> => {
  try {
    const q = query(collection(db, "User"), where("role", "==", "customer"));

    const querySnapshot = await getDocs(q);
    const customers: Customer[] = [];

    querySnapshot.forEach((doc) => {
      customers.push({
        id: doc.id,
        ...doc.data(),
      } as Customer);
    });

    // For each customer, fetch deliveries to compute totalOrders, lastOrder and isActive.
    // NOTE: This performs one additional query per customer (N+1). For larger datasets,
    // consider denormalizing counts into the User doc or using an aggregate query on the server.
    const customersWithStats = await Promise.all(
      customers.map(async (customer) => {
        try {
          const deliveriesQuery = query(
            collection(db, "deliveries"),
            where("customerId", "==", customer.id),
          );
          const deliveriesSnap = await getDocs(deliveriesQuery);

          const totalOrders = deliveriesSnap.size || 0;

          // compute lastOrder (most recent createdAt) if any
          let lastOrder: any = null;
          deliveriesSnap.forEach((d) => {
            const data: any = d.data();
            if (!data.createdAt) return;
            if (!lastOrder) {
              lastOrder = data.createdAt;
            } else {
              const lastTs =
                lastOrder?.seconds ?? new Date(lastOrder).getTime();
              const thisTs =
                data.createdAt?.seconds ?? new Date(data.createdAt).getTime();
              if (thisTs > lastTs) lastOrder = data.createdAt;
            }
          });

          // Calculate 30-day recency for active status
          const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
          const now = Date.now();
          let isActive = false;
          
          if (lastOrder) {
            const lastOrderTime = lastOrder?.seconds ? lastOrder.seconds * 1000 : new Date(lastOrder).getTime();
            isActive = (now - lastOrderTime) <= THIRTY_DAYS_MS;
          }

          return {
            ...customer,
            totalOrders,
            lastOrder,
            isActive,
          } as Customer;
        } catch (err) {
          return {
            ...customer,
            totalOrders: customer.totalOrders || 0,
            isActive: customer.isActive ?? false,
          } as Customer;
        }
      }),
    );

    // Sort by createdAt on client side
    customersWithStats.sort((a, b) => {
      const aTime =
        a.createdAt?.seconds || a.createdAt?.toDate?.()?.getTime() || 0;
      const bTime =
        b.createdAt?.seconds || b.createdAt?.toDate?.()?.getTime() || 0;
      return bTime - aTime; // Newest first
    });

    return customersWithStats;
  } catch (error: any) {
    throw new Error("Failed to get customers");
  }
};

// Get single customer
export const getCustomer = async (
  customerId: string,
): Promise<Customer | null> => {
  try {
    const docRef = doc(db, "User", customerId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();

      // Verify this is a customer
      if (data.role !== "customer") {
        return null;
      }

      return {
        id: docSnap.id,
        ...data,
      } as Customer;
    }

    return null;
  } catch (error: any) {
    throw new Error("Failed to get customer");
  }
};


export const updateCustomerVerification = async (customerId: string, isVerified: boolean): Promise<void> => {
  try {
    const docRef = doc(db, 'User', customerId);
    await updateDoc(docRef, { isVerified });
  } catch (error: any) {
    throw new Error('Failed to update verification status');
  }
};
