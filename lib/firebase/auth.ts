import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth"
import { doc, setDoc, getDoc } from "firebase/firestore"
import { auth, db } from "./config"

export interface AdminUser extends User {
  isAdmin: boolean
  role: string
}

// Sign in admin user
export const signInAdmin = async (email: string, password: string): Promise<AdminUser> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    const user = userCredential.user

    // Check if user is admin
    const adminDoc = await getDoc(doc(db, "admins", user.uid))
    if (!adminDoc.exists()) {
      await signOut(auth)
      throw new Error("Access denied. Admin privileges required.")
    }

    return {
      ...user,
      isAdmin: true,
      role: "admin",
    } as AdminUser
  } catch (error: any) {
    throw new Error(error.message || "Login failed")
  }
}

// Sign out admin user
export const signOutAdmin = async (): Promise<void> => {
  try {
    await signOut(auth)
  } catch (error: any) {
    throw new Error(error.message || "Logout failed")
  }
}

// Listen to admin auth state changes
export const onAdminAuthStateChanged = (callback: (user: AdminUser | null) => void) => {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      try {
        const adminDoc = await getDoc(doc(db, "admins", user.uid))
        if (adminDoc.exists()) {
          callback({
            ...user,
            isAdmin: true,
            role: "admin",
          } as AdminUser)
        } else {
          callback(null)
        }
      } catch (error) {
        callback(null)
      }
    } else {
      callback(null)
    }
  })
}

// Get current admin user
export const getCurrentAdminUser = (): AdminUser | null => {
  const user = auth.currentUser
  if (!user) return null

  return {
    ...user,
    isAdmin: true,
    role: "admin",
  } as AdminUser | null
}

// Check if current user is admin
export const isCurrentUserAdmin = async (): Promise<boolean> => {
  const user = auth.currentUser
  if (!user) return false

  try {
    const adminDoc = await getDoc(doc(db, "admins", user.uid))
    return adminDoc.exists()
  } catch (error) {
    return false
  }
}

// Create admin user
export const createAdminUser = async (email: string, password: string, displayName: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const user = userCredential.user

    // Update profile
    await updateProfile(user, { displayName })

    // Add to admins collection
    await setDoc(doc(db, "admins", user.uid), {
      email: user.email,
      displayName,
      role: "admin",
      createdAt: new Date().toISOString(),
      isActive: true,
    })

    return user
  } catch (error: any) {
    throw new Error(error.message || "Failed to create admin user")
  }
}
