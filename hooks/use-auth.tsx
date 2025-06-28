"use client"

import type React from "react"

import { useState, useEffect, createContext, useContext } from "react"
import { signInAdmin, signOutAdmin, onAdminAuthStateChanged, type AdminUser } from "@/lib/firebase/auth"

interface AuthContextType {
  user: AdminUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<AdminUser>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAdminAuthStateChanged((user) => {
      setUser(user)
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const signIn = async (email: string, password: string): Promise<AdminUser> => {
    const user = await signInAdmin(email, password)
    setUser(user)
    return user
  }

  const signOut = async () => {
    await signOutAdmin()
    setUser(null)
  }

  const value = {
    user,
    loading,
    signIn,
    signOut,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
