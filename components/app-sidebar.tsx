"use client"

import * as React from "react"
import {
  Home, Truck, Users, Box, Layers, DollarSign, Map, MessageSquare, Shield, Settings, LogOut,
  LayoutDashboard, Receipt, BookOpen, Building2, FileBarChart2, PieChart, SlidersHorizontal, Banknote, TrendingUp, Package
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
import { useRole } from "@/lib/hooks/use-role"
import { auth } from "@/lib/firebase/config"
import { signOut } from "firebase/auth"

import { useNotifications } from "@/lib/hooks/use-notifications"
import { doc, onSnapshot, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase/config"

type NavItem = { title: string; url: string; icon: any; section: string }

const allNavItems: NavItem[] = [
  { title: "Dashboard",           url: "/admin/dashboard",                 icon: Home,              section: "overview" },
  { title: "Riders",              url: "/admin/riders",                    icon: Truck,             section: "operations" },
  { title: "Customers",           url: "/admin/customers",                 icon: Users,             section: "operations" },
  { title: "Deliveries",          url: "/admin/deliveries",                icon: Box,               section: "operations" },
  { title: "Multiple Deliveries", url: "/admin/multiple-deliveries",       icon: Layers,            section: "operations" },
  { title: "Live Map",            url: "/admin/live-map",                  icon: Map,               section: "operations" },
  { title: "Assets",              url: "/admin/assets",                    icon: Package,           section: "operations" },
  // ── Finance ────────────────────────────────────────────────────────────────
  { title: "Finance Dashboard",   url: "/admin/finance/dashboard",         icon: LayoutDashboard,   section: "finance" },
  { title: "Revenue",             url: "/admin/revenue",                   icon: DollarSign,        section: "finance" },
  { title: "Expenses",            url: "/admin/finance/expenses",          icon: Receipt,           section: "finance" },
  { title: "Cash Book",           url: "/admin/finance/cash",              icon: BookOpen,          section: "finance" },
  { title: "Bank Accounts",       url: "/admin/finance/bank",              icon: Building2,         section: "finance" },
  { title: "Salary",              url: "/admin/finance/salary",            icon: Banknote,          section: "finance" },
  { title: "Reports",             url: "/admin/finance/reports",           icon: FileBarChart2,     section: "finance" },
  { title: "Analytics",           url: "/admin/finance/analytics",         icon: PieChart,          section: "finance" },
  { title: "Investors",           url: "/admin/finance/investors",         icon: TrendingUp,        section: "finance" },
  { title: "Finance Settings",    url: "/admin/finance/settings",          icon: SlidersHorizontal, section: "finance" },
  // ── System ─────────────────────────────────────────────────────────────────
  { title: "Messages",            url: "/admin/messages",                  icon: MessageSquare,     section: "system" },
  { title: "Admin Users",         url: "/admin/admin-users",               icon: Shield,            section: "system" },
  { title: "Secretaries",         url: "/admin/create-secretary",          icon: Users,             section: "system" },
  { title: "Settings",            url: "/admin/settings",                  icon: Settings,          section: "system" },
]

const filterNavByRole = (items: NavItem[], role?: string): NavItem[] => {
  if (!role) return items
  const r = role.toLowerCase()
  if (r === "ceo" || r === "cto") return items
  const liveMap = "/admin/live-map"
  if (r === "cfo") {
    const allowed = new Set([
      "/admin/dashboard",
      "/admin/finance/dashboard", "/admin/revenue", "/admin/finance/expenses",
      "/admin/finance/cash", "/admin/finance/bank", "/admin/finance/salary", "/admin/finance/reports",
      "/admin/finance/analytics", "/admin/finance/settings",
      "/admin/riders", "/admin/create-secretary", "/admin/messages", liveMap, "/admin/assets"
    ])
    return items.filter(i => allowed.has(i.url))
  }
  if (r === "coo") {
    const allowed = new Set(["/admin/dashboard", "/admin/riders", "/admin/customers", "/admin/deliveries", "/admin/multiple-deliveries", "/admin/create-secretary", "/admin/messages", liveMap, "/admin/assets"])
    return items.filter(i => allowed.has(i.url))
  }
  return items
}



export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useAuth()

  const role = useRole() || undefined
  const items = filterNavByRole(allNavItems, role)

  const [lastSeen, setLastSeen] = React.useState<Timestamp | null>(null)

  // Load lastSeenMessageAt from Firestore
  React.useEffect(() => {
    if (!user?.userId) return
    const collection = role?.toLowerCase() === "secretary" ? "Secretary" : "Admin"
    const unsub = onSnapshot(doc(db, collection, user.userId), (snap) => {
      setLastSeen(snap.data()?.lastSeenMessageAt ?? null)
    })
    return () => unsub()
  }, [user?.userId, role])

  // Register FCM + show toasts + track unread count
  const { unreadCount } = useNotifications({
    userId: user?.userId ?? "",
    userCollection: role?.toLowerCase() === "secretary" ? "Secretary" : "Admin",
    lastSeenAt: lastSeen,
    isChatOpen: pathname.includes("/messages"),
  })

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
                      <span className="flex-1">{item.title}</span>
                      {item.title === "Messages" && unreadCount > 0 && (
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                          {unreadCount > 99 ? "99+" : unreadCount}
                        </div>
                      )}
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
