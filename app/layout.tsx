"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { requireAuth } from "@/lib/auth-utils"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Loader2 } from "lucide-react"

export default function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = requireAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/admin/login")
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (!user.isAdmin) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="text-gray-600">You don't have admin privileges.</p>
        </div>
      </div>
    )
  }

  return <DashboardLayout>{children}</DashboardLayout>
}
