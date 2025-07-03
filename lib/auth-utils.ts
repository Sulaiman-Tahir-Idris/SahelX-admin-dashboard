"use client"

import { useEffect, useState } from "react"
import type { AdminUser } from "./firebase/auth"
import { onAdminAuthStateChanged, getCurrentAdmin } from "./firebase/auth"

// Client-side hook for auth state
export const useAuth = () => {
  const [user, setUser] = useState<AdminUser | null>(null)
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

// Server-side function for auth check
export const getCurrentUser = async () => {
  try {
    return await getCurrentAdmin()
  } catch (error) {
    console.error("Error getting current user:", error)
    return null
  }
}
