"use client"

import type React from "react"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { DashboardNav } from "./dashboard-nav"
import { DashboardHeader } from "./dashboard-header"

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/admin/login")
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-600 border-t-transparent"></div>
          <p className="mt-2 text-sm text-red-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen">
      <DashboardHeader user={user} />
      <div className="flex">
        <DashboardNav />
        <main
          className="flex-1 overflow-y-auto p-6 transition-all duration-300"
          style={{
            marginLeft: "var(--sidebar-width, 240px)",
            paddingTop: "4rem", // Account for fixed header
          }}
        >
          {children}
        </main>
      </div>
    </div>
  )
}
