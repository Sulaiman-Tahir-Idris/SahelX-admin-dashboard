"use client"

import * as React from "react"
import { Home, PieChart, LogOut } from "lucide-react"
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

const investorNavItems: NavItem[] = [
  { title: "Dashboard", url: "/investor/dashboard", icon: Home, section: "overview" },
  { title: "My Portfolio", url: "/investor/portfolio", icon: PieChart, section: "overview" },
]

export function InvestorAppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const router = useRouter()

  const groups = [
    { label: "Overview", items: investorNavItems.filter(i => i.section === "overview") },
  ].filter(g => g.items.length > 0)

  const handleLogout = async () => {
    try {
      await signOut(auth)
      localStorage.removeItem("investorUser")
      localStorage.removeItem("isInvestorLoggedIn")
      router.push("/investor/login")
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
                      className={isActive ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 hover:text-emerald-700" : ""}
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
