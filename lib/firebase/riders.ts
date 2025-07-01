import {
  collection,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  onSnapshot,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore"
import { db } from "./config"

export interface Rider {
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
  currentLocation?: {
    lat: number
    lng: number
    timestamp?: any
  }
  status?: "available" | "on_delivery" | "offline"
  stats?: {
    totalDeliveries: number
    completionRate: number
    avgRating: number
  }
  createdAt: any
  updatedAt?: any
}

// Get all riders/couriers - simplified query without orderBy to avoid index requirement
export const getRiders = async (): Promise<Rider[]> => {
  try {
    const q = query(collection(db, "User"), where("role", "==", "courier"))

    const querySnapshot = await getDocs(q)
    const riders: Rider[] = []

    querySnapshot.forEach((doc) => {
      riders.push({
        id: doc.id,
        ...doc.data(),
      } as Rider)
    })

    // Sort by createdAt on the client side
    riders.sort((a, b) => {
      const aTime = a.createdAt?.seconds || a.createdAt?.toDate?.()?.getTime() || 0
      const bTime = b.createdAt?.seconds || b.createdAt?.toDate?.()?.getTime() || 0
      return bTime - aTime // Newest first
    })

    return riders
  } catch (error: any) {
    console.error("Error getting riders:", error)
    throw new Error("Failed to get riders")
  }
}

// Alternative: Get all riders without any complex queries
export const getAllRiders = async (): Promise<Rider[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, "User"))
    const riders: Rider[] = []

    querySnapshot.forEach((doc) => {
      const data = doc.data()
      // Filter for couriers on the client side
      if (data.role === "courier") {
        riders.push({
          id: doc.id,
          ...data,
        } as Rider)
      }
    })

    // Sort by createdAt on the client side
    riders.sort((a, b) => {
      const aTime = a.createdAt?.seconds || a.createdAt?.toDate?.()?.getTime() || 0
      const bTime = b.createdAt?.seconds || b.createdAt?.toDate?.()?.getTime() || 0
      return bTime - aTime // Newest first
    })

    return riders
  } catch (error: any) {
    console.error("Error getting all riders:", error)
    throw new Error("Failed to get riders")
  }
}

// Get single rider
export const getRider = async (riderId: string): Promise<Rider | null> => {
  try {
    const docRef = doc(db, "User", riderId)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as Rider
    }

    return null
  } catch (error: any) {
    console.error("Error getting rider:", error)
    throw new Error("Failed to get rider")
  }
}

// Update rider status
export const updateRiderStatus = async (
  riderId: string,
  status: "available" | "on_delivery" | "offline",
): Promise<void> => {
  try {
    const docRef = doc(db, "User", riderId)
    await updateDoc(docRef, {
      status,
      updatedAt: serverTimestamp(),
    })
  } catch (error: any) {
    console.error("Error updating rider status:", error)
    throw new Error("Failed to update rider status")
  }
}

// Update rider verification status
export const updateRiderVerification = async (riderId: string, verified: boolean): Promise<void> => {
  try {
    const docRef = doc(db, "User", riderId)
    await updateDoc(docRef, {
      verified,
      "vehicleInfo.verified": verified,
      updatedAt: serverTimestamp(),
    })
  } catch (error: any) {
    console.error("Error updating rider verification:", error)
    throw new Error("Failed to update rider verification")
  }
}

// Update rider active status
export const updateRiderActiveStatus = async (riderId: string, isActive: boolean): Promise<void> => {
  try {
    const docRef = doc(db, "User", riderId)
    await updateDoc(docRef, {
      isActive,
      updatedAt: serverTimestamp(),
    })
  } catch (error: any) {
    console.error("Error updating rider active status:", error)
    throw new Error("Failed to update rider active status")
  }
}

// Delete rider
export const deleteRider = async (riderId: string): Promise<void> => {
  try {
    const docRef = doc(db, "User", riderId)
    await deleteDoc(docRef)
  } catch (error: any) {
    console.error("Error deleting rider:", error)
    throw new Error("Failed to delete rider")
  }
}

// Subscribe to rider location updates
export const subscribeToRiderLocation = (riderId: string, callback: (riderData: Rider | null) => void) => {
  const docRef = doc(db, "User", riderId)

  return onSnapshot(
    docRef,
    (doc) => {
      if (doc.exists()) {
        callback({
          id: doc.id,
          ...doc.data(),
        } as Rider)
      } else {
        callback(null)
      }
    },
    (error) => {
      console.error("Error subscribing to rider location:", error)
      callback(null)
    },
  )
}

// Get riders by status - simplified without orderBy
export const getRidersByStatus = async (status: "available" | "on_delivery" | "offline"): Promise<Rider[]> => {
  try {
    const q = query(collection(db, "User"), where("role", "==", "courier"), where("status", "==", status))

    const querySnapshot = await getDocs(q)
    const riders: Rider[] = []

    querySnapshot.forEach((doc) => {
      riders.push({
        id: doc.id,
        ...doc.data(),
      } as Rider)
    })

    return riders
  } catch (error: any) {
    console.error("Error getting riders by status:", error)
    // Fallback: get all riders and filter client-side
    try {
      const allRiders = await getRiders()
      return allRiders.filter((rider) => rider.status === status)
    } catch (fallbackError) {
      throw new Error("Failed to get riders by status")
    }
  }
}
