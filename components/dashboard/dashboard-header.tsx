"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogOut, User } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { MobileNav } from "./dashboard-nav"
import Image from "next/image"

export function DashboardHeader({ user }: { user?: any }) {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    if (!user) {
      const storedUser = localStorage.getItem("adminUser")
      if (storedUser) {
        setCurrentUser(JSON.parse(storedUser))
      }
    } else {
      setCurrentUser(user)
    }
  }, [user])

  const handleLogout = () => {
    localStorage.removeItem("isAdminLoggedIn")
    localStorage.removeItem("adminUser")

    toast({
      title: "Logged out successfully",
      description: "You have been logged out of the admin dashboard.",
    })

    router.push("/")
  }

  const handleProfileClick = () => {
    router.push("/admin/profile")
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex h-16 w-full items-center justify-between border-b border-gray-200 bg-white/95 backdrop-blur-sm px-4 md:px-6 shadow-sm">
      <div className="flex items-center space-x-3 md:space-x-4">
        {/* Mobile menu trigger */}
        <MobileNav />

        <Image src="/images/black1.png" alt="SahelX Logo" width={120} height={40} className="h-6 w-auto md:h-8" />
        <div className="h-4 w-px bg-gray-300 md:h-6"></div>
        <h1 className="text-sm font-medium text-gray-900 md:text-lg">Admin Portal</h1>
      </div>
      <div className="flex items-center space-x-2 md:space-x-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-7 w-7 md:h-8 md:w-8 border-2 border-gray-200">
                <AvatarImage src="/placeholder.svg?height=32&width=32" alt={currentUser?.fullName || ""} />
                <AvatarFallback className="bg-gray-100 text-gray-700 text-xs md:text-sm">
                  {(currentUser?.fullName || "A").charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="border-gray-200 w-56">
            <div className="flex items-center justify-start gap-2 p-3">
              <div className="flex flex-col space-y-1 leading-none">
                <p className="font-medium text-gray-900 text-sm">{currentUser?.fullName || "Admin User"}</p>
                <p className="text-xs text-gray-600">{currentUser?.email || "admin@sahelx.com"}</p>
              </div>
            </div>
            <DropdownMenuSeparator className="bg-gray-200" />
            <DropdownMenuItem onClick={handleProfileClick} className="text-gray-700 hover:bg-gray-50 cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-gray-200" />
            <DropdownMenuItem onClick={handleLogout} className="text-gray-700 hover:bg-gray-50 cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
