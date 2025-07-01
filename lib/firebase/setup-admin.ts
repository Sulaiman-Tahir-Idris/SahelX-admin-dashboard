import { createUserWithEmailAndPassword } from "firebase/auth"
import { doc, setDoc, serverTimestamp } from "firebase/firestore"
import { auth, db } from "./config"

// Temporary function to create admin user - remove after setup
export const createAdminUser = async (email: string, password: string, displayName: string) => {
  try {
    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const user = userCredential.user

    // Create admin document in Firestore
    const adminData = {
      userId: user.uid,
      id: user.uid,
      role: "admin",
      permissions: ["read", "write", "delete", "manage_users", "manage_settings"],
      createdAt: serverTimestamp(),
      email: email,
      displayName: displayName,
    }

    await setDoc(doc(db, "Admin", user.uid), adminData)

    console.log("Admin user created successfully:", {
      uid: user.uid,
      email: email,
      displayName: displayName,
    })

    return {
      uid: user.uid,
      email: email,
      displayName: displayName,
    }
  } catch (error: any) {
    console.error("Error creating admin user:", error)
    throw new Error(error.message || "Failed to create admin user")
  }
}
