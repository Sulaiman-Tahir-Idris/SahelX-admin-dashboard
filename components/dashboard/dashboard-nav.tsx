"use client"

import { useState, useEffect } from "react"
import { BarChart3, Box, ChevronLeft, ChevronRight, Home, Map, Settings, Truck, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
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
    title: "Live Map",
    href: "/admin/live-map",
    icon: Map,
  },
  {
    title: "Analytics",
    href: "/admin/analytics",
    icon: BarChart3,
  },
  {
    title: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
]

export function DashboardNav() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  const handleNavigation = (href: string) => {
    router.push(href)
  }

  useEffect(() => {
    document.documentElement.style.setProperty("--sidebar-width", isCollapsed ? "80px" : "240px")
  }, [isCollapsed])

  return (
    <TooltipProvider>
      <div
        className={cn(
          "group fixed left-0 top-16 bottom-0 z-40 flex flex-col border-r border-red-200 bg-red-50/50 px-3 py-4 transition-all duration-300 dark:border-red-800 dark:bg-red-950/30 overflow-y-auto",
          isCollapsed ? "w-[80px]" : "w-[240px]",
        )}
      >
        <div className="flex flex-col space-y-2">
          {navItems.map((item) => (
            <Tooltip key={item.href} delayDuration={0}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    "h-10 w-full justify-start text-red-700 hover:bg-red-100 hover:text-red-800 dark:text-red-300 dark:hover:bg-red-900 dark:hover:text-red-200",
                    isCollapsed && "justify-center",
                    pathname === item.href && "bg-red-200 text-red-900 dark:bg-red-800 dark:text-red-100",
                  )}
                  onClick={() => handleNavigation(item.href)}
                >
                  <item.icon className="h-5 w-5" />
                  {!isCollapsed && <span className="ml-2">{item.title}</span>}
                </Button>
              </TooltipTrigger>
              {isCollapsed && (
                <TooltipContent
                  side="right"
                  className="border-red-200 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-900 dark:text-red-100"
                >
                  {item.title}
                </TooltipContent>
              )}
            </Tooltip>
          ))}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="absolute -right-3 top-4 z-10 h-6 w-6 rounded-full border border-red-200 bg-white text-red-600 hover:bg-red-50 dark:border-red-800 dark:bg-red-950 dark:text-red-400 dark:hover:bg-red-900"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </Button>
      </div>
    </TooltipProvider>
  )
}
