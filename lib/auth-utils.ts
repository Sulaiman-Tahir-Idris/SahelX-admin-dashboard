"use client"

import { useEffect, useState } from "react"
import { onAdminAuthStateChanged, type AdminUser } from "./firebase/auth"

export function useAdminAuth() {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAdminAuthStateChanged((user) => {
      setUser(user)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  return { user, loading, isAdmin: !!user?.isAdmin }
}
