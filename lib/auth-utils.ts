"use client"

import { useEffect, useState } from "react"
import type { AdminUser } from "./firebase/auth"
import { onAdminAuthStateChanged } from "./firebase/auth"
import { type SecretaryUser, getCurrentSecretary } from "./firebase/secretaryAuth"
import { onAuthStateChanged } from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"
import { auth, db } from "./firebase/config"

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

export const useSecretaryAuth = () => {
  const [user, setUser] = useState<SecretaryUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (!authUser) {
        setUser(null)
        setLoading(false)
        return
      }
      try {
        const docSnap = await getDoc(doc(db, "Secretary", authUser.uid))
        if (docSnap.exists()) {
          const data = docSnap.data() as SecretaryUser
          setUser({
            ...data,
            userId: authUser.uid,
            email: authUser.email || "",
            displayName: authUser.displayName || data.displayName || "",
          })
        } else {
          setUser(null)
        }
      } catch (err) {
        setUser(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  return { user, loading }
}
