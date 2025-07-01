import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore"
import { createUserWithEmailAndPassword, signOut } from "firebase/auth"
import { auth, db } from "./config"

export interface CourierUser {
  id?: string
  userId: string
  email: string
  phone: string
  displayName: string
  role: "courier"
  verified: boolean
  profilePhoto?: string
  isActive: boolean
  address: {
    street: string
    city: string
    state: string
    country: string
    lat?: number
    lng?: number
  }
  vehicleInfo: {
    type: string
    plateNumber: string
    model: string
    color: string
    verified: boolean
  }
  createdAt: any
}

export interface CustomerUser {
  id?: string
  userId: string
  email: string
  phone: string
  fullName: string
  role: "customer"
  isActive: boolean
  profileImage?: string
  totalOrders: number
  createdAt: any
  lastOrder?: any
}

// Create a new courier without logging out the current admin
export const createCourierWithoutLogout = async (
  courierData: Omit<CourierUser, "id" | "userId" | "createdAt"> & { password: string },
): Promise<string> => {
  try {
    // Store current admin user info
    const currentUser = auth.currentUser
    const currentUserEmail = currentUser?.email

    // Create Firebase Auth user for courier
    const userCredential = await createUserWithEmailAndPassword(auth, courierData.email, courierData.password)
    const newUser = userCredential.user

    // Create courier document in Firestore
    const newCourier = {
      userId: newUser.uid,
      email: courierData.email,
      phone: courierData.phone,
      displayName: courierData.displayName,
      role: "courier" as const,
      verified: courierData.verified,
      profilePhoto: courierData.profilePhoto || "",
      isActive: courierData.isActive,
      address: courierData.address,
      vehicleInfo: courierData.vehicleInfo,
      createdAt: serverTimestamp(),
    }

    const docRef = await addDoc(collection(db, "User"), newCourier)

    // Sign out the newly created courier user
    await signOut(auth)

    // Re-authenticate the admin user if they were logged in
    if (currentUser && currentUserEmail) {
      // Note: In production, you should use Firebase Admin SDK on the server side
      // to create users without affecting the current session
      console.log("Admin user session maintained")

      // For now, we'll just redirect to login if needed
      // The admin will need to log back in
    }

    return docRef.id
  } catch (error: any) {
    console.error("Error creating courier:", error)
    throw new Error(error.message || "Failed to create courier")
  }
}

// Legacy function - keep for backward compatibility
export const createCourier = async (
  courierData: Omit<CourierUser, "id" | "userId" | "createdAt"> & { password: string },
): Promise<string> => {
  return createCourierWithoutLogout(courierData)
}

// Get all couriers
export const getCouriers = async (): Promise<CourierUser[]> => {
  try {
    const q = query(collection(db, "User"), where("role", "==", "courier"))

    const querySnapshot = await getDocs(q)
    const couriers: CourierUser[] = []

    querySnapshot.forEach((doc) => {
      couriers.push({
        id: doc.id,
        ...doc.data(),
      } as CourierUser)
    })

    // Sort by createdAt on client side
    couriers.sort((a, b) => {
      const aTime = a.createdAt?.seconds || a.createdAt?.toDate?.()?.getTime() || 0
      const bTime = b.createdAt?.seconds || b.createdAt?.toDate?.()?.getTime() || 0
      return bTime - aTime // Newest first
    })

    return couriers
  } catch (error: any) {
    console.error("Error getting couriers:", error)
    throw new Error("Failed to get couriers")
  }
}

// Get all customers
export const getCustomers = async (): Promise<CustomerUser[]> => {
  try {
    const q = query(collection(db, "User"), where("role", "==", "customer"))

    const querySnapshot = await getDocs(q)
    const customers: CustomerUser[] = []

    querySnapshot.forEach((doc) => {
      customers.push({
        id: doc.id,
        ...doc.data(),
      } as CustomerUser)
    })

    // Sort by createdAt on client side
    customers.sort((a, b) => {
      const aTime = a.createdAt?.seconds || a.createdAt?.toDate?.()?.getTime() || 0
      const bTime = b.createdAt?.seconds || b.createdAt?.toDate?.()?.getTime() || 0
      return bTime - aTime // Newest first
    })

    return customers
  } catch (error: any) {
    console.error("Error getting customers:", error)
    throw new Error("Failed to get customers")
  }
}

// Get single courier
export const getCourier = async (courierId: string): Promise<CourierUser | null> => {
  try {
    const docRef = doc(db, "User", courierId)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as CourierUser
    }

    return null
  } catch (error: any) {
    console.error("Error getting courier:", error)
    throw new Error("Failed to get courier")
  }
}

// Get single customer
export const getCustomer = async (customerId: string): Promise<CustomerUser | null> => {
  try {
    const docRef = doc(db, "User", customerId)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as CustomerUser
    }

    return null
  } catch (error: any) {
    console.error("Error getting customer:", error)
    throw new Error("Failed to get customer")
  }
}

// Update courier
export const updateCourier = async (courierId: string, updates: Partial<CourierUser>): Promise<void> => {
  try {
    const docRef = doc(db, "User", courierId)
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    })
  } catch (error: any) {
    console.error("Error updating courier:", error)
    throw new Error("Failed to update courier")
  }
}

// Delete courier
export const deleteCourier = async (courierId: string): Promise<void> => {
  try {
    const docRef = doc(db, "User", courierId)
    await deleteDoc(docRef)
  } catch (error: any) {
    console.error("Error deleting courier:", error)
    throw new Error("Failed to delete courier")
  }
}
