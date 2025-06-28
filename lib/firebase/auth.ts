import { signInWithEmailAndPassword, signOut, onAuthStateChanged, type User } from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"
import { auth, db } from "./config"

export interface AdminUser {
  uid: string
  email: string
  displayName: string
  role: "superadmin" | "manager" | "staff"
  permissions: string[]
  isActive: boolean
  createdAt: any
}

// Sign in admin user
export const signInAdmin = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    const user = userCredential.user

    // Check if user is an admin
    const adminDoc = await getDoc(doc(db, "admins", user.uid))
    if (!adminDoc.exists()) {
      await signOut(auth)
      throw new Error("Access denied. Admin privileges required.")
    }

    const adminData = adminDoc.data()
    if (!adminData.isActive) {
      await signOut(auth)
      throw new Error("Account is deactivated. Contact system administrator.")
    }

    // Get user profile
    const userDoc = await getDoc(doc(db, "users", user.uid))
    const userData = userDoc.data()

    return {
      uid: user.uid,
      email: user.email!,
      displayName: userData?.displayName || "Admin User",
      role: adminData.role,
      permissions: adminData.permissions || [],
      isActive: adminData.isActive,
      createdAt: adminData.createdAt,
    } as AdminUser
  } catch (error: any) {
    throw new Error(error.message || "Failed to sign in")
  }
}

// Sign out
export const signOutAdmin = async () => {
  try {
    await signOut(auth)
  } catch (error: any) {
    throw new Error(error.message || "Failed to sign out")
  }
}

// Get current admin user
export const getCurrentAdmin = async (): Promise<AdminUser | null> => {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      unsubscribe()

      if (!user) {
        resolve(null)
        return
      }

      try {
        // Check if user is an admin
        const adminDoc = await getDoc(doc(db, "admins", user.uid))
        if (!adminDoc.exists()) {
          resolve(null)
          return
        }

        const adminData = adminDoc.data()
        const userDoc = await getDoc(doc(db, "users", user.uid))
        const userData = userDoc.data()

        resolve({
          uid: user.uid,
          email: user.email!,
          displayName: userData?.displayName || "Admin User",
          role: adminData.role,
          permissions: adminData.permissions || [],
          isActive: adminData.isActive,
          createdAt: adminData.createdAt,
        } as AdminUser)
      } catch (error) {
        resolve(null)
      }
    })
  })
}

// Listen to auth state changes
export const onAdminAuthStateChanged = (callback: (user: AdminUser | null) => void) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (!user) {
      callback(null)
      return
    }

    try {
      const adminDoc = await getDoc(doc(db, "admins", user.uid))
      if (!adminDoc.exists()) {
        callback(null)
        return
      }

      const adminData = adminDoc.data()
      const userDoc = await getDoc(doc(db, "users", user.uid))
      const userData = userDoc.data()

      callback({
        uid: user.uid,
        email: user.email!,
        displayName: userData?.displayName || "Admin User",
        role: adminData.role,
        permissions: adminData.permissions || [],
        isActive: adminData.isActive,
        createdAt: adminData.createdAt,
      } as AdminUser)
    } catch (error) {
      callback(null)
    }
  })
}
