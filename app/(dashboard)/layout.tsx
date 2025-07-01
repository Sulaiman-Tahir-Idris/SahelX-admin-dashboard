"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { useAuth } from "@/lib/auth-utils"
import { Loader2 } from "lucide-react"

export default function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!loading && !user && isClient) {
      router.push("/admin/login")
    }
  }, [user, loading, router, isClient])

  if (loading || !isClient) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-sahelx-600" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return <DashboardLayout>{children}</DashboardLayout>
}
