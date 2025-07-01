"use client"

import { useEffect, useState } from "react"
import { onAdminAuthStateChanged, type AdminUser } from "./firebase/auth"

export const useAuth = () => {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAdminAuthStateChanged((adminUser) => {
      setUser(adminUser)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  return { user, loading, isAdmin: user?.isAdmin || false }
}

export const useAdminAuth = () => {
  return useAuth()
}

export const requireAuth = () => {
  return useAuth()
}
