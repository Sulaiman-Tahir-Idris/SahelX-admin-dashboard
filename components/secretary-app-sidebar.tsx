"use client"

import * as React from "react"
import {
  Home, Truck, Users, Box, Layers, Map, MessageSquare, PlusCircle, LogOut, Receipt
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
import { auth } from "@/lib/firebase/config"
import { signOut } from "firebase/auth"

type NavItem = { title: string; url: string; icon: any; section: string }

const secretaryNavItems: NavItem[] = [
  { title: "Dashboard",           url: "/secretary/dashboard",           icon: Home,       section: "overview" },
  { title: "Riders",              url: "/secretary/riders",              icon: Truck,      section: "operations" },
  { title: "Customers",           url: "/secretary/customers",           icon: Users,      section: "operations" },
  { title: "Deliveries",          url: "/secretary/deliveries",          icon: Box,        section: "operations" },
  { title: "Create Delivery",     url: "/secretary/create-delivery",     icon: PlusCircle, section: "operations" },
  { title: "Multiple Deliveries", url: "/secretary/multiple-deliveries", icon: Layers,     section: "operations" },
  { title: "Expenses",            url: "/secretary/expenses",            icon: Receipt,    section: "operations" },
  { title: "Messages",            url: "/secretary/messages",            icon: MessageSquare, section: "tools" },
  { title: "Live Map",            url: "/secretary/live-map",            icon: Map,        section: "tools" },
]

export function SecretaryAppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const router = useRouter()

  const groups = [
    { label: "Overview",   items: secretaryNavItems.filter(i => i.section === "overview") },
    { label: "Operations", items: secretaryNavItems.filter(i => i.section === "operations") },
    { label: "Tools",      items: secretaryNavItems.filter(i => i.section === "tools") },
  ].filter(g => g.items.length > 0)

  const handleLogout = async () => {
    try {
      await signOut(auth)
      localStorage.removeItem("secretaryUser")
      localStorage.removeItem("isSecretaryLoggedIn")
      router.push("/secretary/login")
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
