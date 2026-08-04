"use client"

import * as React from "react"
import {
  Home, Truck, Users, Box, Layers, DollarSign, Map, MessageSquare, Shield, Settings, LogOut
} from "lucide-react"
import { usePathname, useRouter } from "next/navigation"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useAuth } from "@/lib/auth-utils"
import { auth } from "@/lib/firebase"
import { signOut } from "firebase/auth"

type NavItem = { title: string; url: string; icon: any; section: string }

const allNavItems: NavItem[] = [
  { title: "Dashboard",           url: "/admin/dashboard",            icon: Home,         section: "overview" },
  { title: "Riders",              url: "/admin/riders",               icon: Truck,        section: "operations" },
  { title: "Customers",           url: "/admin/customers",            icon: Users,        section: "operations" },
  { title: "Deliveries",          url: "/admin/deliveries",           icon: Box,          section: "operations" },
  { title: "Multiple Deliveries", url: "/admin/multiple-deliveries",  icon: Layers,       section: "operations" },
  { title: "Revenue",             url: "/admin/revenue",              icon: DollarSign,   section: "finance" },
  { title: "Live Map",            url: "/admin/live-map",             icon: Map,          section: "operations" },
  { title: "Messages",            url: "/admin/messages",             icon: MessageSquare,section: "system" },
  { title: "Admin Users",         url: "/admin/admin-users",          icon: Shield,       section: "system" },
  { title: "Secretaries",         url: "/admin/create-secretary",     icon: Users,        section: "system" },
  { title: "Settings",            url: "/admin/settings",             icon: Settings,     section: "system" },
]

const filterNavByRole = (items: NavItem[], role?: string): NavItem[] => {
  if (!role) return items
  const r = role.toLowerCase()
  if (r === "ceo" || r === "cto") return items
  const liveMap = "/admin/live-map"
  if (r === "cfo") {
    const allowed = new Set(["/admin/dashboard", "/admin/revenue", "/admin/riders", "/admin/create-secretary", "/admin/messages", liveMap])
    return items.filter(i => allowed.has(i.url))
  }
  if (r === "coo") {
    const allowed = new Set(["/admin/dashboard", "/admin/riders", "/admin/customers", "/admin/deliveries", "/admin/multiple-deliveries", "/admin/create-secretary", "/admin/messages", liveMap])
    return items.filter(i => allowed.has(i.url))
  }
  return items
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useAuth()

  const getStoredRole = () => {
    try { return JSON.parse(localStorage.getItem("adminUser") || "{}").role } catch { return undefined }
  }
  const role = user?.role ?? (typeof window !== "undefined" ? getStoredRole() : undefined)
  const items = filterNavByRole(allNavItems, role)

  const groups = [
    { label: "Overview",   items: items.filter(i => i.section === "overview") },
    { label: "Operations", items: items.filter(i => i.section === "operations") },
    { label: "Finance",    items: items.filter(i => i.section === "finance") },
    { label: "System",     items: items.filter(i => i.section === "system") },
  ].filter(g => g.items.length > 0)

  const handleLogout = async () => {
    try {
      await signOut(auth)
      localStorage.removeItem("adminUser")
      router.push("/admin/login")
    } catch (error) {
      console.error("Logout error", error)
    }
  }

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarContent className="pt-4">
        {groups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="text-xs uppercase tracking-widest text-muted-foreground/60">{group.label}</SidebarGroupLabel>
            <SidebarMenu>
              {group.items.map((item) => {
                const isActive = pathname === item.url || pathname.startsWith(item.url + "/")
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      isActive={isActive} 
                      onClick={() => router.push(item.url)}
                      tooltip={item.title}
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout}>
              <LogOut />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
