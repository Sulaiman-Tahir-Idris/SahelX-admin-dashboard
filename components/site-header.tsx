"use client"

import { usePathname, useRouter } from "next/navigation"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { useAuth } from "@/lib/auth-utils"
import { UserCircle, Sun, Moon, LogOut, User, ChevronDown } from "lucide-react"
import { useEffect, useState } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { signOutAdmin } from "@/lib/firebase/auth"
import { toast } from "@/components/ui/use-toast"

import { useTheme } from "next-themes"

const roleLabels: Record<string, string> = {
  ceo: "CEO", cto: "CTO", cfo: "CFO", coo: "COO",
  admin: "Admin", superadmin: "Super Admin",
}

export function SiteHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useAuth()
  const { theme, setTheme } = useTheme()
  const isDark = theme === "dark"

  const getTitle = () => {
    if (pathname.includes("/admin/dashboard")) return "Dashboard"
    if (pathname.includes("/admin/riders")) return "Riders"
    if (pathname.includes("/admin/customers")) return "Customers"
    if (pathname.includes("/admin/deliveries")) return "Deliveries"
    if (pathname.includes("/admin/multiple-deliveries")) return "Multiple Deliveries"
    if (pathname.includes("/admin/revenue")) return "Revenue"
    if (pathname.includes("/admin/live-map")) return "Live Map"
    if (pathname.includes("/admin/messages")) return "Messages"
    if (pathname.includes("/admin/admin-users")) return "Admin Users"
    if (pathname.includes("/admin/create-secretary")) return "Secretaries"
    if (pathname.includes("/admin/settings")) return "Settings"
    return "Admin Portal"
  }

  const roleLabel = roleLabels[(user?.role || "").toLowerCase()] || (user?.role ?? "Admin")
  const initials  = (user?.displayName || "A").charAt(0).toUpperCase()

  const handleLogout = async () => {
    try {
      await signOutAdmin()
      localStorage.removeItem("isAdminLoggedIn")
      localStorage.removeItem("adminUser")
      toast({ title: "Logged out", description: "See you next time!" })
      router.push("/")
    } catch (error: any) {
      toast({ title: "Logout failed", description: error.message, variant: "destructive" })
    }
  }

  return (
    <header className="group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 flex h-14 shrink-0 items-center justify-between border-b bg-background px-4 lg:px-6 transition-[width,height] ease-linear">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-2 h-4" />
        <h1 className="text-sm font-semibold">{getTitle()}</h1>
      </div>
      <div className="flex items-center gap-1.5 md:gap-2">
        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(isDark ? "light" : "dark")}
          aria-label="Toggle theme"
          className="flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* User Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 h-9 px-2 rounded-xl hover:bg-muted"
            >
              <Avatar className="h-7 w-7 border-2 border-primary/20">
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:flex flex-col items-start">
                <span className="text-xs font-semibold text-foreground leading-none">
                  {user?.displayName || "Admin User"}
                </span>
                <span className="text-[10px] text-muted-foreground leading-none mt-0.5">
                  {roleLabel}
                </span>
              </div>
              <ChevronDown className="hidden md:block w-3 h-3 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-64 rounded-xl border-border shadow-card-lg p-1.5">
            <div className="flex items-center gap-3 px-3 py-3 mb-1">
              <Avatar className="h-10 w-10 border-2 border-primary/20">
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-base">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">
                  {user?.displayName || "Admin User"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.email}
                </p>
                <span className="mt-1 inline-flex self-start text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  {roleLabel}
                </span>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => router.push("/admin/profile")}
              className="rounded-lg cursor-pointer gap-2 text-sm"
            >
              <User className="w-4 h-4" /> Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="rounded-lg cursor-pointer gap-2 text-sm text-destructive focus:text-destructive focus:bg-destructive/10"
            >
              <LogOut className="w-4 h-4" /> Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
