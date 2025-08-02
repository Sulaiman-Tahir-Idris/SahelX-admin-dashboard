import { collection, doc, getDocs, getDoc, query, where } from "firebase/firestore"
import { db } from "./config"

export interface Customer {
  id?: string
  userId: string
  email: string
  phone: string
  fullName: string
  displayName:string
  role: "customer"
  isActive: boolean
  profileImage?: string
  totalOrders: number
  createdAt: any
  lastOrder?: any
  address?: {
    street?: string
    city?: string
    state?: string
    country?: string
  }
}

// Get all customers from User collection with role 'customer'
export const getCustomers = async (): Promise<Customer[]> => {
  try {
    const q = query(collection(db, "User"), where("role", "==", "customer"))

    const querySnapshot = await getDocs(q)
    const customers: Customer[] = []

    querySnapshot.forEach((doc) => {
      customers.push({
        id: doc.id,
        ...doc.data(),
      } as Customer)
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

// Get single customer
export const getCustomer = async (customerId: string): Promise<Customer | null> => {
  try {
    const docRef = doc(db, "User", customerId)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      const data = docSnap.data()
      
      // Verify this is a customer
      if (data.role !== "customer") {
        return null
      }

      return {
        id: docSnap.id,
        ...data,
      } as Customer
    }

    return null
  } catch (error: any) {
    console.error("Error getting customer:", error)
    throw new Error("Failed to get customer")
  }
}