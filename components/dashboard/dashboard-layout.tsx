"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardNav } from "./dashboard-nav"
import { DashboardHeader } from "./dashboard-header"

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    // Check if user is logged in
    const isLoggedIn = localStorage.getItem("isAdminLoggedIn")
    const storedUser = localStorage.getItem("adminUser")

    if (!isLoggedIn || !storedUser) {
      // Redirect to splash screen if not logged in
      router.push("/")
      return
    }

    setUser(JSON.parse(storedUser))
    setIsLoading(false)
  }, [router])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <DashboardHeader user={user} />
      <div className="flex">
        <DashboardNav />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pt-20 md:pt-24 md:ml-[240px]">{children}</main>
      </div>
    </div>
  )
}
