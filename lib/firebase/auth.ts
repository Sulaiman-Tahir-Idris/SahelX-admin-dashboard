import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updateProfile } from "firebase/auth"
import { doc, setDoc, getDoc } from "firebase/firestore"
import { auth, db } from "./config"

export interface AdminUser {
  uid: string
  email: string
  displayName?: string
  role: "admin" | "super_admin"
  createdAt: Date
  lastLogin: Date
}

export async function signInAdmin(email: string, password: string): Promise<AdminUser> {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    const user = userCredential.user

    // Check if user is admin
    const adminDoc = await getDoc(doc(db, "admins", user.uid))
    if (!adminDoc.exists()) {
      throw new Error("Access denied. Admin privileges required.")
    }

    const adminData = adminDoc.data() as AdminUser

    // Update last login
    await setDoc(
      doc(db, "admins", user.uid),
      {
        ...adminData,
        lastLogin: new Date(),
      },
      { merge: true },
    )

    return {
      uid: user.uid,
      email: user.email!,
      displayName: user.displayName || adminData.displayName,
      role: adminData.role,
      createdAt: adminData.createdAt,
      lastLogin: new Date(),
    }
  } catch (error: any) {
    throw new Error(error.message || "Failed to sign in")
  }
}

export async function createAdmin(
  email: string,
  password: string,
  displayName: string,
  role: "admin" | "super_admin" = "admin",
): Promise<AdminUser> {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const user = userCredential.user

    // Update user profile
    await updateProfile(user, { displayName })

    // Create admin document
    const adminData: AdminUser = {
      uid: user.uid,
      email: user.email!,
      displayName,
      role,
      createdAt: new Date(),
      lastLogin: new Date(),
    }

    await setDoc(doc(db, "admins", user.uid), adminData)

    return adminData
  } catch (error: any) {
    throw new Error(error.message || "Failed to create admin")
  }
}

export async function signOutAdmin(): Promise<void> {
  try {
    await signOut(auth)
  } catch (error: any) {
    throw new Error(error.message || "Failed to sign out")
  }
}

export async function getCurrentAdmin(): Promise<AdminUser | null> {
  const user = auth.currentUser
  if (!user) return null

  try {
    const adminDoc = await getDoc(doc(db, "admins", user.uid))
    if (!adminDoc.exists()) return null

    return adminDoc.data() as AdminUser
  } catch (error) {
    console.error("Error getting current admin:", error)
    return null
  }
}
