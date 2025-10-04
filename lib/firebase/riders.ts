// riders.ts
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
  isAvailable: boolean
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

// Normalize Firestore data to our Rider shape
const normalizeRider = (docId: string, data: any): Rider => {
  return {
    id: docId,
    ...data,
    currentLocation: data.currentLocation
      ? {
          lat: data.currentLocation.latitude ?? data.currentLocation.lat,
          lng: data.currentLocation.longitude ?? data.currentLocation.lng,
          timestamp: data.currentLocation.timestamp,
        }
      : undefined,
  } as Rider
}

// Get all riders/couriers
export const getRiders = async (): Promise<Rider[]> => {
  try {
    const q = query(collection(db, "User"), where("role", "==", "courier"))
    const querySnapshot = await getDocs(q)
    const riders: Rider[] = []

    querySnapshot.forEach((docSnap) => {
      riders.push(normalizeRider(docSnap.id, docSnap.data()))
    })

    // Sort by createdAt (newest first)
    riders.sort((a, b) => {
      const aTime = a.createdAt?.seconds || a.createdAt?.toDate?.()?.getTime() || 0
      const bTime = b.createdAt?.seconds || b.createdAt?.toDate?.()?.getTime() || 0
      return bTime - aTime
    })

    return riders
  } catch (error: any) {
    console.error("Error getting riders:", error)
    throw new Error("Failed to get riders")
  }
}

// Get all riders (client-side filter)
export const getAllRiders = async (): Promise<Rider[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, "User"))
    const riders: Rider[] = []

    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data()
      if (data.role === "courier") {
        riders.push(normalizeRider(docSnap.id, data))
      }
    })

    riders.sort((a, b) => {
      const aTime = a.createdAt?.seconds || a.createdAt?.toDate?.()?.getTime() || 0
      const bTime = b.createdAt?.seconds || b.createdAt?.toDate?.()?.getTime() || 0
      return bTime - aTime
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
      return normalizeRider(docSnap.id, docSnap.data())
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

// Update rider availability status
export const updateRiderAvailability = async (riderId: string, isAvailable: boolean): Promise<void> => {
  try {
    const docRef = doc(db, "User", riderId)
    await updateDoc(docRef, {
      isAvailable,
      updatedAt: serverTimestamp(),
    })
  } catch (error: any) {
    console.error("Error updating rider availability:", error)
    throw new Error("Failed to update rider availability")
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

// Subscribe to a single rider's updates
export const subscribeToRiderLocation = (
  riderId: string,
  callback: (riderData: Rider | null) => void,
) => {
  const docRef = doc(db, "User", riderId)

  return onSnapshot(
    docRef,
    (docSnap) => {
      if (docSnap.exists()) {
        callback(normalizeRider(docSnap.id, docSnap.data()))
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

// ✅ Subscribe to ALL riders (couriers) in real-time
export const subscribeToRiders = (
  callback: (riders: Rider[]) => void,
  options?: { onlyActive?: boolean; onlyAvailable?: boolean },
) => {
  const filters = [where("role", "==", "courier")] as any[]
  if (options?.onlyActive) filters.push(where("isActive", "==", true))
  if (options?.onlyAvailable) filters.push(where("isAvailable", "==", true))

  const q = query(collection(db, "User"), ...filters)

  return onSnapshot(
    q,
    (snapshot) => {
      const riders = snapshot.docs.map((d) => normalizeRider(d.id, d.data()))
      callback(riders)
    },
    (error) => {
      console.error("Error subscribing to riders:", error)
      callback([])
    },
  )
}

// Get riders by status
export const getRidersByStatus = async (
  status: "available" | "on_delivery" | "offline",
): Promise<Rider[]> => {
  try {
    const q = query(
      collection(db, "User"),
      where("role", "==", "courier"),
      where("status", "==", status),
    )

    const querySnapshot = await getDocs(q)
    const riders: Rider[] = []

    querySnapshot.forEach((docSnap) => {
      riders.push(normalizeRider(docSnap.id, docSnap.data()))
    })

    return riders
  } catch (error: any) {
    console.error("Error getting riders by status:", error)
    try {
      const allRiders = await getRiders()
      return allRiders.filter((rider) => rider.status === status)
    } catch {
      throw new Error("Failed to get riders by status")
    }
  }
}
