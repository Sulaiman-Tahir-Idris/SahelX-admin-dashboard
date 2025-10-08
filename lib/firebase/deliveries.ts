// lib/firebase/deliveries.ts
import { collection, doc, getDocs, getDoc, query, where, orderBy, limit } from "firebase/firestore"
import { db } from "./config"

export interface Delivery {
  id?: string
  customerId: string
  courierId?: string
  status: string
  pickupLocation?: {
    address: string
    lat: number
    lng: number
  }
  dropoffLocation?: {
    address: string
    lat: number
    lng: number
  }
  goodsType?: string
  goodsSize?: string
  cost?: number
  createdAt: any
  updatedAt?: any
  rating?: number
  tag?: string
}

export const getDeliveries = async (): Promise<Delivery[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, "deliveries")) // ✅ correct collection
    const deliveries: Delivery[] = []

    querySnapshot.forEach((doc) => {
      deliveries.push({
        id: doc.id,
        ...doc.data(),
      } as Delivery)
    })

    deliveries.sort((a, b) => {
      const aTime = a.createdAt?.seconds || a.createdAt?.toDate?.()?.getTime() || 0
      const bTime = b.createdAt?.seconds || b.createdAt?.toDate?.()?.getTime() || 0
      return bTime - aTime
    })

    return deliveries
  } catch (error: any) {
    console.error("Error getting deliveries:", error)
    throw new Error("Failed to get deliveries")
  }
}
