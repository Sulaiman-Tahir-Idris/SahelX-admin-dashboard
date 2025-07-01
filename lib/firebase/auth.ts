import { signInWithEmailAndPassword, signOut, onAuthStateChanged, type User, type UserCredential } from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"
import { auth, db } from "./config"

export interface AdminUser extends User {
  isAdmin?: boolean
  role?: string
}

// Sign in admin user
export const signInAdmin = async (email: string, password: string): Promise<UserCredential> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)

    // Check if user is admin
    const userDoc = await getDoc(doc(db, "admin_users", userCredential.user.uid))
    if (!userDoc.exists() || userDoc.data()?.role !== "admin") {
      await signOut(auth)
      throw new Error("Access denied. Admin privileges required.")
    }

    return userCredential
  } catch (error) {
    console.error("Admin sign in error:", error)
    throw error
  }
}

// Sign out admin user
export const signOutAdmin = async (): Promise<void> => {
  try {
    await signOut(auth)
  } catch (error) {
    console.error("Admin sign out error:", error)
    throw error
  }
}

// Listen to admin auth state changes
export const onAdminAuthStateChanged = (callback: (user: AdminUser | null) => void) => {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      try {
        // Check if user is admin
        const userDoc = await getDoc(doc(db, "admin_users", user.uid))
        if (userDoc.exists() && userDoc.data()?.role === "admin") {
          const adminUser: AdminUser = {
            ...user,
            isAdmin: true,
            role: "admin",
          }
          callback(adminUser)
        } else {
          callback(null)
        }
      } catch (error) {
        console.error("Error checking admin status:", error)
        callback(null)
      }
    } else {
      callback(null)
    }
  })
}

// Get current admin user
export const getCurrentAdminUser = (): AdminUser | null => {
  return auth.currentUser as AdminUser | null
}

// Check if current user is admin
export const isCurrentUserAdmin = async (): Promise<boolean> => {
  const user = auth.currentUser
  if (!user) return false

  try {
    const userDoc = await getDoc(doc(db, "admin_users", user.uid))
    return userDoc.exists() && userDoc.data()?.role === "admin"
  } catch (error) {
    console.error("Error checking admin status:", error)
    return false
  }
}
