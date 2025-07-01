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
  orderBy,
  serverTimestamp,
} from "firebase/firestore"
import { createUserWithEmailAndPassword } from "firebase/auth"
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

// Create a new courier
export const createCourier = async (
  courierData: Omit<CourierUser, "id" | "userId" | "createdAt"> & { password: string },
): Promise<string> => {
  try {
    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(auth, courierData.email, courierData.password)
    const user = userCredential.user

    // Create courier document in Firestore
    const newCourier = {
      userId: user.uid,
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

    return docRef.id
  } catch (error: any) {
    console.error("Error creating courier:", error)
    throw new Error(error.message || "Failed to create courier")
  }
}

// Get all couriers
export const getCouriers = async (): Promise<CourierUser[]> => {
  try {
    const q = query(collection(db, "User"), where("role", "==", "courier"), orderBy("createdAt", "desc"))

    const querySnapshot = await getDocs(q)
    const couriers: CourierUser[] = []

    querySnapshot.forEach((doc) => {
      couriers.push({
        id: doc.id,
        ...doc.data(),
      } as CourierUser)
    })

    return couriers
  } catch (error: any) {
    console.error("Error getting couriers:", error)
    throw new Error("Failed to get couriers")
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
