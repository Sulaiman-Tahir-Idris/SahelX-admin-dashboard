"use client"

import { useEffect, useState } from "react"
import type { AdminUser } from "./firebase/auth"
import { onAdminAuthStateChanged, getCurrentAdmin } from "./firebase/auth"

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

// Server-side function for getting current user
export async function getCurrentUser(): Promise<AdminUser | null> {
  try {
    return await getCurrentAdmin()
  } catch (error) {
    console.error("Error getting current user:", error)
    return null
  }
}
