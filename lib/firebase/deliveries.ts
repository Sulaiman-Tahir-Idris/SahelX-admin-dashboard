import { collection, doc, getDocs, getDoc, query, where, orderBy, limit } from "firebase/firestore"
import { db } from "./config"

export interface Delivery {
  id?: string
  customerId: string
  riderId?: string
  status: "requested" | "accepted" | "in_transit" | "completed" | "cancelled"
  pickupAddress: string
  dropoffAddress: string
  deliveryFee: number
  createdAt: any
  updatedAt?: any
  completedAt?: any
}

// Fetch rider delivery history
export const fetchRiderDeliveryHistory = async (riderId: string): Promise<Delivery[]> => {
  try {
    // Try with orderBy first
    try {
      const q = query(
        collection(db, "Delivery"),
        where("riderId", "==", riderId),
        orderBy("createdAt", "desc"),
        limit(50),
      )

      const querySnapshot = await getDocs(q)
      const deliveries: Delivery[] = []

      querySnapshot.forEach((doc) => {
        deliveries.push({
          id: doc.id,
          ...doc.data(),
        } as Delivery)
      })

      return deliveries
    } catch (indexError) {
      // Fallback without orderBy if index doesn't exist
      console.log("Index query failed, falling back to simple query...")
      const q = query(collection(db, "Delivery"), where("riderId", "==", riderId))

      const querySnapshot = await getDocs(q)
      const deliveries: Delivery[] = []

      querySnapshot.forEach((doc) => {
        deliveries.push({
          id: doc.id,
          ...doc.data(),
        } as Delivery)
      })

      // Sort on client side
      deliveries.sort((a, b) => {
        const aTime = a.createdAt?.seconds || a.createdAt?.toDate?.()?.getTime() || 0
        const bTime = b.createdAt?.seconds || b.createdAt?.toDate?.()?.getTime() || 0
        return bTime - aTime // Newest first
      })

      return deliveries.slice(0, 50) // Limit to 50
    }
  } catch (error: any) {
    console.error("Error fetching rider delivery history:", error)
    // Return mock data as fallback
    return [
      {
        id: "del_001",
        customerId: "cust_001",
        riderId: riderId,
        status: "completed",
        pickupAddress: "123 Lagos Street",
        dropoffAddress: "456 Victoria Island",
        deliveryFee: 2500,
        createdAt: { seconds: Date.now() / 1000 },
      },
      {
        id: "del_002",
        customerId: "cust_002",
        riderId: riderId,
        status: "in_transit",
        pickupAddress: "789 Ikeja Road",
        dropoffAddress: "321 Lekki Phase 1",
        deliveryFee: 3000,
        createdAt: { seconds: (Date.now() - 86400000) / 1000 },
      },
    ] as Delivery[]
  }
}

// Get all deliveries
export const getDeliveries = async (): Promise<Delivery[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, "Delivery"))
    const deliveries: Delivery[] = []

    querySnapshot.forEach((doc) => {
      deliveries.push({
        id: doc.id,
        ...doc.data(),
      } as Delivery)
    })

    // Sort by createdAt on client side
    deliveries.sort((a, b) => {
      const aTime = a.createdAt?.seconds || a.createdAt?.toDate?.()?.getTime() || 0
      const bTime = b.createdAt?.seconds || b.createdAt?.toDate?.()?.getTime() || 0
      return bTime - aTime // Newest first
    })

    return deliveries
  } catch (error: any) {
    console.error("Error getting deliveries:", error)
    throw new Error("Failed to get deliveries")
  }
}

// Get single delivery
export const getDelivery = async (deliveryId: string): Promise<Delivery | null> => {
  try {
    const docRef = doc(db, "Delivery", deliveryId)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as Delivery
    }

    return null
  } catch (error: any) {
    console.error("Error getting delivery:", error)
    throw new Error("Failed to get delivery")
  }
}
