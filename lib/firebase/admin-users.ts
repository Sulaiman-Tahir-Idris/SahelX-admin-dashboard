import { collection, doc, getDocs, getDoc, deleteDoc } from "firebase/firestore"
import { db } from "./config"

export interface AdminUser {
  id?: string
  userId: string
  role: string
  permissions: string[]
  createdAt: any
  email?: string
  displayName?: string
}

// Get all admin users
export const getAdminUsers = async (): Promise<AdminUser[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, "Admin"))
    const adminUsers: AdminUser[] = []

    querySnapshot.forEach((doc) => {
      adminUsers.push({
        id: doc.id,
        ...doc.data(),
      } as AdminUser)
    })

    // Sort by createdAt on client side
    adminUsers.sort((a, b) => {
      const aTime = a.createdAt?.seconds || a.createdAt?.toDate?.()?.getTime() || 0
      const bTime = b.createdAt?.seconds || b.createdAt?.toDate?.()?.getTime() || 0
      return bTime - aTime // Newest first
    })

    return adminUsers
  } catch (error: any) {
    console.error("Error getting admin users:", error)
    throw new Error("Failed to get admin users")
  }
}

// Get single admin user
export const getAdminUser = async (adminId: string): Promise<AdminUser | null> => {
  try {
    const docRef = doc(db, "Admin", adminId)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as AdminUser
    }

    return null
  } catch (error: any) {
    console.error("Error getting admin user:", error)
    throw new Error("Failed to get admin user")
  }
}

// Delete admin user
export const deleteAdminUser = async (adminId: string): Promise<void> => {
  try {
    // Delete from Firestore
    const docRef = doc(db, "Admin", adminId)
    await deleteDoc(docRef)

    // Note: We can't delete the Firebase Auth user from here as it requires
    // the user to be currently signed in or admin SDK on server side
    console.log("Admin user deleted from Firestore:", adminId)
  } catch (error: any) {
    console.error("Error deleting admin user:", error)
    throw new Error("Failed to delete admin user")
  }
}
