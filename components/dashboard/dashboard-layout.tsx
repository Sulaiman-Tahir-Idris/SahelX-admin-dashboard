"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { onAdminAuthStateChanged, type AdminUser } from "@/lib/firebase/auth"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<AdminUser | null>(null)

  useEffect(() => {
    const unsubscribe = onAdminAuthStateChanged((adminUser) => {
      if (!adminUser) {
        router.push("/")
        return
      }

      setUser(adminUser)
      localStorage.setItem("isAdminLoggedIn", "true")
      localStorage.setItem("adminUser", JSON.stringify(adminUser))
      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [router])

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-background">
        <div className="hidden md:flex w-[240px] border-r flex-col gap-3 p-4">
          <div className="w-full h-10 rounded-lg skeleton" />
          {[1,2,3,4,5].map(i => (
            <div key={i} className="w-full h-10 rounded-lg skeleton" style={{ opacity: 1 - i * 0.15 }} />
          ))}
        </div>
        <div className="flex-1 flex flex-col">
          <div className="h-14 border-b flex items-center px-6">
            <div className="w-32 h-5 rounded-lg skeleton" />
          </div>
          <div className="p-6 space-y-6">
            <div className="w-48 h-8 rounded-lg skeleton" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1,2,3,4].map(i => <div key={i} className="h-32 rounded-xl skeleton" />)}
            </div>
            <div className="h-64 rounded-xl skeleton" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset className="min-w-0">
        <SiteHeader />
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-muted/20 min-w-0">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
