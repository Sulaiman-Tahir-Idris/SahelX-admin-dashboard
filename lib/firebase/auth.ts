import { signInWithEmailAndPassword, signOut, onAuthStateChanged, type User } from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"
import { auth, db } from "./config"

export const signInAdmin = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    const user = userCredential.user

    // Check if user is admin
    const adminDoc = await getDoc(doc(db, "admins", user.uid))
    if (!adminDoc.exists()) {
      await signOut(auth)
      throw new Error("Access denied. Admin privileges required.")
    }

    return user
  } catch (error) {
    throw error
  }
}

export const signOutAdmin = async () => {
  try {
    await signOut(auth)
  } catch (error) {
    throw error
  }
}

export const onAdminAuthStateChanged = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      // Check if user is admin
      try {
        const adminDoc = await getDoc(doc(db, "admins", user.uid))
        if (adminDoc.exists()) {
          callback(user)
        } else {
          await signOut(auth)
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

export const getCurrentUser = () => {
  return auth.currentUser
}
