"use client"

import { useState } from "react"
import { BarChart3, Box, Home, Map, Settings, Truck, Users, Menu, Shield, DollarSign } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet"
import { usePathname, useRouter } from "next/navigation"

const navItems = [
  {
    title: "Dashboard",
    href: "/admin/dashboard",
    icon: Home,
  },
  {
    title: "Riders",
    href: "/admin/riders",
    icon: Truck,
  },
  {
    title: "Customers",
    href: "/admin/customers",
    icon: Users,
  },
  {
    title: "Deliveries",
    href: "/admin/deliveries",
    icon: Box,
  },
  {
    title: "Revenue",
    href: "/admin/revenue",
    icon: DollarSign,
  },
  {
    title: "Live Map",
    href: "/admin/live-map",
    icon: Map,
  },
  // {
  //   title: "Analytics",
  //   href: "/admin/analytics",
  //   icon: BarChart3,
  // },
  {
    title: "Admin Users",
    href: "/admin/admin-users",
    icon: Shield,
  },
  {
    title: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
]

// Mobile Navigation Component
export function MobileNav() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  const handleNavigation = (href: string) => {
    router.push(href)
    setOpen(false) // Close mobile menu after navigation
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden text-gray-600 hover:text-gray-900">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] sm:w-[300px] p-0">
        <SheetHeader className="p-4 border-b border-gray-200">
          <SheetTitle className="text-lg font-semibold text-gray-900">Navigation Menu</SheetTitle>
          <SheetDescription className="text-sm text-gray-600">Access all admin dashboard sections</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col space-y-1 p-4">
          {navItems.map((item) => (
            <Button
              key={item.href}
              variant="ghost"
              className={cn(
                "h-12 w-full justify-start text-gray-700 hover:bg-gray-100 hover:text-gray-900 font-medium",
                pathname === item.href && "bg-sahelx-50 text-sahelx-700 border-r-2 border-sahelx-600",
              )}
              onClick={() => handleNavigation(item.href)}
            >
              <item.icon className="h-5 w-5" />
              <span className="ml-3">{item.title}</span>
            </Button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  )
}

// Desktop Navigation Component
export function DashboardNav() {
  const pathname = usePathname()
  const router = useRouter()

  const handleNavigation = (href: string) => {
    router.push(href)
  }

  return (
    <div className="hidden md:flex fixed left-0 top-16 bottom-0 z-40 flex-col border-r border-gray-200 bg-white px-3 py-6 w-[240px]">
      <div className="flex flex-col space-y-1">
        {navItems.map((item) => (
          <Button
            key={item.href}
            variant="ghost"
            className={cn(
              "h-10 w-full justify-start text-gray-700 hover:bg-gray-100 hover:text-gray-900 font-medium",
              pathname === item.href && "bg-sahelx-50 text-sahelx-700 border-r-2 border-sahelx-600",
            )}
            onClick={() => handleNavigation(item.href)}
          >
            <item.icon className="h-5 w-5" />
            <span className="ml-3">{item.title}</span>
          </Button>
        ))}
      </div>
    </div>
  )
}
