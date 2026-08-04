"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogOut, User, Sun, Moon, ChevronDown } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { signOutSecretary, type SecretaryUser } from "@/lib/firebase/secretaryAuth"
import { MobileNav } from "./secretary-dashboard-nav"
import Image from "next/image"

function useTheme() {
  const [dark, setDark] = useState(false)
  useEffect(() => {
    const stored = localStorage.getItem("sahelx-theme")
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    const isDark = stored ? stored === "dark" : prefersDark
    setDark(isDark)
    document.documentElement.classList.toggle("dark", isDark)
  }, [])
  const toggle = () => {
    const next = !dark
    setDark(next)
    localStorage.setItem("sahelx-theme", next ? "dark" : "light")
    document.documentElement.classList.toggle("dark", next)
  }
  return { dark, toggle }
}

export function SecretaryDashboardHeader({ user }: { user?: SecretaryUser }) {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<SecretaryUser | null>(null)
  const { dark, toggle } = useTheme()

  useEffect(() => {
    if (!user) {
      const stored = localStorage.getItem("secretaryUser")
      if (stored) setCurrentUser(JSON.parse(stored))
    } else {
      setCurrentUser(user)
    }
  }, [user])

  const initials = (currentUser?.displayName || "S").charAt(0).toUpperCase()

  const handleLogout = async () => {
    try {
      await signOutSecretary()
      localStorage.removeItem("isSecretaryLoggedIn")
      localStorage.removeItem("secretaryUser")
      toast({ title: "Logged out", description: "See you next time!" })
      router.push("/secretary/login")
    } catch (error: any) {
      toast({ title: "Logout failed", description: error.message, variant: "destructive" })
    }
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex h-16 w-full items-center justify-between border-b border-border/50 bg-background/90 backdrop-blur-xl px-4 md:px-6">
      {/* Left */}
      <div className="flex items-center gap-3">
        <MobileNav />
        <Image
          src="/images/black1.png"
          alt="SahelX"
          width={110}
          height={36}
          className="h-6 w-auto md:h-7 dark:invert"
          priority
        />
        <div className="hidden sm:block h-4 w-px bg-border" />
        <motion.span
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground bg-muted px-2.5 py-1 rounded-full"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          Secretary Portal
        </motion.span>
      </div>

      {/* Right */}
      <div className="flex items-center gap-1.5 md:gap-2">
        <button
          onClick={toggle}
          aria-label="Toggle theme"
          className="flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 h-9 px-2 rounded-xl hover:bg-muted">
              <Avatar className="h-7 w-7 border-2 border-amber-500/30">
                <AvatarFallback className="bg-amber-500/10 text-amber-600 text-xs font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:flex flex-col items-start">
                <span className="text-xs font-semibold text-foreground leading-none">
                  {currentUser?.displayName || "Secretary"}
                </span>
                <span className="text-[10px] text-muted-foreground leading-none mt-0.5">Operations Staff</span>
              </div>
              <ChevronDown className="hidden md:block w-3 h-3 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-64 rounded-xl border-border shadow-card-lg p-1.5">
            <div className="flex items-center gap-3 px-3 py-3 mb-1">
              <Avatar className="h-10 w-10 border-2 border-amber-500/30">
                <AvatarFallback className="bg-amber-500/10 text-amber-600 font-bold text-base">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">
                  {currentUser?.displayName || "Secretary User"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {currentUser?.email}
                </p>
                <span className="mt-1 inline-flex self-start text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full">
                  Secretary
                </span>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => router.push("/secretary/profile")}
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
