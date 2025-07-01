import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  createUserWithEmailAndPassword,
  type User,
} from "firebase/auth"
import { doc, setDoc, getDoc } from "firebase/firestore"
import { auth, db } from "./config"

export interface AuthUser {
  uid: string
  email: string | null
  displayName: string | null
  role?: string
}

export async function signIn(email: string, password: string): Promise<AuthUser> {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    const user = userCredential.user

    // Get user role from Firestore
    const userDoc = await getDoc(doc(db, "users", user.uid))
    const userData = userDoc.data()

    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      role: userData?.role || "user",
    }
  } catch (error: any) {
    throw new Error(error.message || "Failed to sign in")
  }
}

export async function signOut(): Promise<void> {
  try {
    await firebaseSignOut(auth)
  } catch (error: any) {
    throw new Error(error.message || "Failed to sign out")
  }
}

export async function createAdminUser(email: string, password: string, displayName: string): Promise<AuthUser> {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const user = userCredential.user

    // Create user document in Firestore with admin role
    await setDoc(doc(db, "users", user.uid), {
      email: user.email,
      displayName,
      role: "admin",
      createdAt: new Date(),
      isActive: true,
    })

    return {
      uid: user.uid,
      email: user.email,
      displayName,
      role: "admin",
    }
  } catch (error: any) {
    throw new Error(error.message || "Failed to create admin user")
  }
}

export function getCurrentUser(): User | null {
  return auth.currentUser
}
