"use client"

import { useEffect, useState } from "react"
import { onAuthStateChanged, type User } from "firebase/auth"
import { auth } from "@/lib/firebase/config"

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  return { user, loading }
}

export function isAdminLoggedIn(): boolean {
  if (typeof window === "undefined") return false
  return localStorage.getItem("isAdminLoggedIn") === "true"
}

export function getAdminUser() {
  if (typeof window === "undefined") return null
  const adminUser = localStorage.getItem("adminUser")
  return adminUser ? JSON.parse(adminUser) : null
}

export function logoutAdmin() {
  if (typeof window === "undefined") return
  localStorage.removeItem("isAdminLoggedIn")
  localStorage.removeItem("adminUser")
  auth.signOut()
}
