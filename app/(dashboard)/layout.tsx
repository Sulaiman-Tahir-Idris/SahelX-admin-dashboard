import type React from "react"
<<<<<<< HEAD
import { redirect } from "next/navigation"
import { DashboardNav } from "@/components/dashboard/dashboard-nav"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { getCurrentUser } from "@/lib/auth-utils"

export default async function DashboardLayout({
=======

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-utils"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"

export default function Layout({
>>>>>>> parent of f759a1e (BUILD FIX)
  children,
}: {
  children: React.ReactNode
}) {
<<<<<<< HEAD
  const user = await getCurrentUser()
=======
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/admin/login")
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }
>>>>>>> parent of f759a1e (BUILD FIX)

  if (!user) {
    redirect("/admin/login")
  }

  return <DashboardLayout>{children}</DashboardLayout>
}
