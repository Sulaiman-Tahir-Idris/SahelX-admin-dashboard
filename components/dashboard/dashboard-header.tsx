"use client"

import { useTheme } from "next-themes"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogOut, Moon, Sun, User } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import Image from "next/image"
import type { AdminUser } from "@/lib/firebase/auth"

export function DashboardHeader({ user }: { user: AdminUser }) {
  const { theme, setTheme } = useTheme()
  const { signOut } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await signOut()
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of the admin dashboard.",
      })
      router.push("/")
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to logout",
        variant: "destructive",
      })
    }
  }

  const handleProfileClick = () => {
    router.push("/admin/profile")
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex h-16 w-full items-center justify-between border-b border-red-200 bg-white/95 backdrop-blur-sm px-4 shadow-sm dark:border-red-800 dark:bg-red-950/95">
      <div className="flex items-center space-x-3">
        <Image src="/images/sahelx-logo.png" alt="SahelX Logo" width={120} height={40} className="h-8 w-auto" />
        <div className="h-6 w-px bg-red-300 dark:bg-red-700"></div>
        <h1 className="text-lg font-bold text-red-900 dark:text-red-100">Admin Portal</h1>
      </div>
      <div className="flex items-center space-x-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900"
            >
              {theme === "dark" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              <span className="sr-only">Toggle theme</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="border-red-200 dark:border-red-800">
            <DropdownMenuItem onClick={() => setTheme("light")}>Light</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("dark")}>Dark</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("system")}>System</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8 border-2 border-red-200 dark:border-red-800">
                <AvatarImage src="/placeholder.svg?height=32&width=32" alt={user.displayName} />
                <AvatarFallback className="bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">
                  {user.displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="border-red-200 dark:border-red-800">
            <div className="flex items-center justify-start gap-2 p-2">
              <div className="flex flex-col space-y-1 leading-none">
                <p className="font-medium text-red-900 dark:text-red-100">{user.displayName}</p>
                <p className="text-sm text-red-600 dark:text-red-400">{user.email}</p>
              </div>
            </div>
            <DropdownMenuSeparator className="bg-red-200 dark:bg-red-800" />
            <DropdownMenuItem
              onClick={handleProfileClick}
              className="text-red-700 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-900 cursor-pointer"
            >
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-red-200 dark:bg-red-800" />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-red-700 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-900 cursor-pointer"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
