import {
  collection,
  doc,
  getDocs,
  getDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore"
import { createUserWithEmailAndPassword } from "firebase/auth"
import { db, auth } from "./config"

export interface User {
  uid: string
  email: string
  phone: string
  displayName: string
  role: "customer" | "courier" | "admin"
  verified: boolean
  profilePhoto?: string
  address?: {
    street: string
    city: string
    state: string
    country: string
    lat: number
    lng: number
  }
  isActive: boolean
  createdAt: any
  updatedAt: any
  // Courier specific fields
  vehicleInfo?: {
    type: string
    plateNumber: string
    model: string
    color: string
    verified: boolean
  }
  // Admin specific fields
  permissions?: string[]
}

export interface Courier extends User {
  role: "courier"
  vehicleInfo: {
    type: string
    plateNumber: string
    model: string
    color: string
    verified: boolean
  }
  status: "available" | "busy" | "offline"
  currentLocation?: {
    lat: number
    lng: number
    updatedAt: any
  }
  stats?: {
    totalDeliveries: number
    completionRate: number
    avgRating: number
  }
}

// Get all couriers
export const getCouriers = async (): Promise<Courier[]> => {
  try {
    const q = query(collection(db, "users"), where("role", "==", "courier"), orderBy("createdAt", "desc"))

    const querySnapshot = await getDocs(q)
    const couriers: Courier[] = []

    querySnapshot.forEach((doc) => {
      couriers.push({
        uid: doc.id,
        ...doc.data(),
      } as Courier)
    })

    return couriers
  } catch (error: any) {
    throw new Error(`Failed to fetch couriers: ${error.message}`)
  }
}

// Get single courier
export const getCourier = async (courierId: string): Promise<Courier | null> => {
  try {
    const docRef = doc(db, "users", courierId)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      return {
        uid: docSnap.id,
        ...docSnap.data(),
      } as Courier
    }

    return null
  } catch (error: any) {
    throw new Error(`Failed to fetch courier: ${error.message}`)
  }
}

// Create new courier
export const createCourier = async (courierData: {
  email: string
  password: string
  displayName: string
  phone: string
  vehicleType: string
  plateNumber?: string
  model?: string
  color?: string
  address?: any
}) => {
  try {
    // Create auth user
    const userCredential = await createUserWithEmailAndPassword(auth, courierData.email, courierData.password)

    const user = userCredential.user

    // Create user document
    const userData: Partial<User> = {
      uid: user.uid,
      email: courierData.email,
      phone: courierData.phone,
      displayName: courierData.displayName,
      role: "courier",
      verified: false,
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      vehicleInfo: {
        type: courierData.vehicleType,
        plateNumber: courierData.plateNumber || "",
        model: courierData.model || "",
        color: courierData.color || "",
        verified: false,
      },
      address: courierData.address,
    }

    await updateDoc(doc(db, "users", user.uid), userData)

    return {
      uid: user.uid,
      email: courierData.email,
      password: courierData.password,
    }
  } catch (error: any) {
    throw new Error(`Failed to create courier: ${error.message}`)
  }
}

// Update courier
export const updateCourier = async (courierId: string, updates: Partial<Courier>) => {
  try {
    const docRef = doc(db, "users", courierId)
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    })
  } catch (error: any) {
    throw new Error(`Failed to update courier: ${error.message}`)
  }
}

// Delete courier
export const deleteCourier = async (courierId: string) => {
  try {
    const batch = writeBatch(db)

    // Delete user document
    batch.delete(doc(db, "users", courierId))

    // Delete admin document if exists
    const adminDocRef = doc(db, "admins", courierId)
    const adminDoc = await getDoc(adminDocRef)
    if (adminDoc.exists()) {
      batch.delete(adminDocRef)
    }

    await batch.commit()
  } catch (error: any) {
    throw new Error(`Failed to delete courier: ${error.message}`)
  }
}

// Get all admins
export const getAdmins = async () => {
  try {
    const q = query(collection(db, "admins"), orderBy("createdAt", "desc"))

    const querySnapshot = await getDocs(q)
    const admins: any[] = []

    for (const adminDoc of querySnapshot.docs) {
      const adminData = adminDoc.data()

      // Get user data
      const userDoc = await getDoc(doc(db, "users", adminDoc.id))
      const userData = userDoc.data()

      admins.push({
        uid: adminDoc.id,
        ...adminData,
        ...userData,
      })
    }

    return admins
  } catch (error: any) {
    throw new Error(`Failed to fetch admins: ${error.message}`)
  }
}

// Create new admin
export const createAdmin = async (adminData: {
  email: string
  password: string
  displayName: string
  phone: string
  role: "superadmin" | "manager" | "staff"
  permissions: string[]
}) => {
  try {
    // Create auth user
    const userCredential = await createUserWithEmailAndPassword(auth, adminData.email, adminData.password)

    const user = userCredential.user

    const batch = writeBatch(db)

    // Create user document
    const userDocRef = doc(db, "users", user.uid)
    batch.set(userDocRef, {
      uid: user.uid,
      email: adminData.email,
      phone: adminData.phone,
      displayName: adminData.displayName,
      role: "admin",
      verified: true,
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    // Create admin document
    const adminDocRef = doc(db, "admins", user.uid)
    batch.set(adminDocRef, {
      userId: user.uid,
      role: adminData.role,
      permissions: adminData.permissions,
      isActive: true,
      createdAt: serverTimestamp(),
    })

    await batch.commit()

    return {
      uid: user.uid,
      email: adminData.email,
      password: adminData.password,
    }
  } catch (error: any) {
    throw new Error(`Failed to create admin: ${error.message}`)
  }
}

// Get all customers
export const getCustomers = async () => {
  try {
    const q = query(collection(db, "users"), where("role", "==", "customer"), orderBy("createdAt", "desc"))

    const querySnapshot = await getDocs(q)
    const customers: User[] = []

    querySnapshot.forEach((doc) => {
      customers.push({
        uid: doc.id,
        ...doc.data(),
      } as User)
    })

    return customers
  } catch (error: any) {
    throw new Error(`Failed to fetch customers: ${error.message}`)
  }
}
