"use client"

import { useEffect, useState } from "react"
import type { User } from "firebase/auth"
import { onAdminAuthStateChanged } from "./firebase/auth"

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAdminAuthStateChanged((user) => {
      setUser(user)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  return { user, loading }
}
<<<<<<< HEAD

// Server-side function for getting current user
export async function getCurrentUser(): Promise<AdminUser | null> {
  try {
    return await getCurrentAdmin()
  } catch (error) {
    console.error("Error getting current user:", error)
    return null
  }
}
=======
>>>>>>> parent of f759a1e (BUILD FIX)
