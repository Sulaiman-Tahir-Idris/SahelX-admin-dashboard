import { collection, doc, getDocs, query, where, orderBy, limit, onSnapshot } from "firebase/firestore"
import { db } from "./config"

export interface Delivery {
  deliveryId: string
  customerId: string
  courierId?: string
  pickupLocation: {
    address: string
    lat: number
    lng: number
  }
  dropoffLocation: {
    address: string
    lat: number
    lng: number
  }
  goodsType: string
  goodsSize: string
  distance: number
  eta: number
  cost: number
  status: "pending" | "assigned" | "accepted" | "picked_up" | "delivered" | "canceled" | "returned"
  paymentStatus: "pending" | "paid" | "failed" | "refunded"
  createdAt: any
  updatedAt: any
  deliveryEvidence?: {
    photoUrl: string
    deliveredAt: any
  }
  rating?: {
    byCustomer?: number
    byCourier?: number
  }
  history: Array<{
    status: string
    timestamp: any
    note?: string
  }>
}

// Get all deliveries
export const getDeliveries = async (): Promise<Delivery[]> => {
  try {
    const q = query(collection(db, "deliveries"), orderBy("createdAt", "desc"))

    const querySnapshot = await getDocs(q)
    const deliveries: Delivery[] = []

    querySnapshot.forEach((doc) => {
      deliveries.push({
        deliveryId: doc.id,
        ...doc.data(),
      } as Delivery)
    })

    return deliveries
  } catch (error: any) {
    throw new Error(`Failed to fetch deliveries: ${error.message}`)
  }
}

// Get deliveries by status
export const getDeliveriesByStatus = async (status: string): Promise<Delivery[]> => {
  try {
    const q = query(collection(db, "deliveries"), where("status", "==", status), orderBy("createdAt", "desc"))

    const querySnapshot = await getDocs(q)
    const deliveries: Delivery[] = []

    querySnapshot.forEach((doc) => {
      deliveries.push({
        deliveryId: doc.id,
        ...doc.data(),
      } as Delivery)
    })

    return deliveries
  } catch (error: any) {
    throw new Error(`Failed to fetch deliveries: ${error.message}`)
  }
}

// Get recent deliveries
export const getRecentDeliveries = async (limitCount = 10): Promise<Delivery[]> => {
  try {
    const q = query(collection(db, "deliveries"), orderBy("createdAt", "desc"), limit(limitCount))

    const querySnapshot = await getDocs(q)
    const deliveries: Delivery[] = []

    querySnapshot.forEach((doc) => {
      deliveries.push({
        deliveryId: doc.id,
        ...doc.data(),
      } as Delivery)
    })

    return deliveries
  } catch (error: any) {
    throw new Error(`Failed to fetch recent deliveries: ${error.message}`)
  }
}

// Get rider delivery history
export const fetchRiderDeliveryHistory = async (riderId: string): Promise<Delivery[]> => {
  try {
    const q = query(collection(db, "deliveries"), where("courierId", "==", riderId), orderBy("createdAt", "desc"))

    const querySnapshot = await getDocs(q)
    const deliveries: Delivery[] = []

    querySnapshot.forEach((doc) => {
      deliveries.push({
        deliveryId: doc.id,
        ...doc.data(),
      } as Delivery)
    })

    return deliveries
  } catch (error: any) {
    throw new Error(`Failed to fetch rider delivery history: ${error.message}`)
  }
}

// Subscribe to rider location updates
export const subscribeToRiderLocation = (riderId: string, callback: (data: any) => void) => {
  const docRef = doc(db, "users", riderId)

  return onSnapshot(docRef, (doc) => {
    if (doc.exists()) {
      callback(doc.data())
    } else {
      callback(null)
    }
  })
}

// Get delivery statistics
export const getDeliveryStats = async () => {
  try {
    const deliveriesRef = collection(db, "deliveries")
    const allDeliveries = await getDocs(deliveriesRef)

    let totalDeliveries = 0
    let completedDeliveries = 0
    let pendingDeliveries = 0
    let totalRevenue = 0

    allDeliveries.forEach((doc) => {
      const delivery = doc.data() as Delivery
      totalDeliveries++

      if (delivery.status === "delivered") {
        completedDeliveries++
        if (delivery.paymentStatus === "paid") {
          totalRevenue += delivery.cost
        }
      } else if (delivery.status === "pending" || delivery.status === "assigned") {
        pendingDeliveries++
      }
    })

    return {
      totalDeliveries,
      completedDeliveries,
      pendingDeliveries,
      totalRevenue,
      completionRate: totalDeliveries > 0 ? (completedDeliveries / totalDeliveries) * 100 : 0,
    }
  } catch (error: any) {
    throw new Error(`Failed to fetch delivery stats: ${error.message}`)
  }
}
