"use client"

import { useEffect, useState } from "react"
import { onAuthStateChanged, type User } from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"
import { auth, db } from "@/lib/firebase/config"

export interface AdminUser extends User {
  role?: string
  isAdmin?: boolean
}

export function useAuth() {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Check if user is admin
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid))
          const userData = userDoc.data()

          const adminUser: AdminUser = {
            ...firebaseUser,
            role: userData?.role || "user",
            isAdmin: userData?.role === "admin",
          }

          setUser(adminUser)
        } catch (error) {
          console.error("Error fetching user data:", error)
          setUser(firebaseUser as AdminUser)
        }
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  return { user, loading }
}

export function requireAuth() {
  const { user, loading } = useAuth()

  if (typeof window === "undefined") {
    return { user: null, loading: true }
  }

  return { user, loading }
}
