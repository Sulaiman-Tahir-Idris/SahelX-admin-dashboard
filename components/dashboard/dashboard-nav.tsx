"use client"

import { useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  Home, Users, Truck, Box, Layers, Map,
  LayoutDashboard, DollarSign, Receipt, BookOpen, Building2,
  FileBarChart2, PieChart, SlidersHorizontal, MessageSquare, Shield, Settings,
  Menu, ChevronRight, LogOut, Banknote
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-utils"
import { useRole } from "@/lib/hooks/use-role"
import { Button } from "@/components/ui/button"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
  SheetDescription, SheetTrigger,
} from "@/components/ui/sheet"
import Image from "next/image"

// ─── Nav Definition ────────────────────────────────────
type NavItem  = { title: string; href: string; icon: any; section?: string }
type NavGroup = { label: string; items: NavItem[] }

const allNavItems: NavItem[] = [
  { title: "Dashboard",           href: "/admin/dashboard",                icon: Home,              section: "overview" },
  { title: "Riders",              href: "/admin/riders",                   icon: Truck,             section: "operations" },
  { title: "Customers",           href: "/admin/customers",                icon: Users,             section: "operations" },
  { title: "Deliveries",          href: "/admin/deliveries",               icon: Box,               section: "operations" },
  { title: "Multiple Deliveries", href: "/admin/multiple-deliveries",      icon: Layers,            section: "operations" },
  { title: "Live Map",            href: "/admin/live-map",                 icon: Map,               section: "operations" },
  { title: "Finance Dashboard",   href: "/admin/finance/dashboard",        icon: LayoutDashboard,   section: "finance" },
  { title: "Revenue",             href: "/admin/revenue",                  icon: DollarSign,        section: "finance" },
  { title: "Expenses",            href: "/admin/finance/expenses",         icon: Receipt,           section: "finance" },
  { title: "Cash Book",           href: "/admin/finance/cash",             icon: BookOpen,          section: "finance" },
  { title: "Bank Accounts",       href: "/admin/finance/bank",             icon: Building2,         section: "finance" },
  { title: "Salary",              href: "/admin/finance/salary",           icon: Banknote,          section: "finance" },
  { title: "Reports",             href: "/admin/finance/reports",          icon: FileBarChart2,     section: "finance" },
  { title: "Analytics",           href: "/admin/finance/analytics",        icon: PieChart,          section: "finance" },
  { title: "Finance Settings",    href: "/admin/finance/settings",         icon: SlidersHorizontal, section: "finance" },
  { title: "Messages",            href: "/admin/messages",                 icon: MessageSquare,     section: "system" },
  { title: "Admin Users",         href: "/admin/admin-users",              icon: Shield,            section: "system" },
  { title: "Secretaries",         href: "/admin/create-secretary",         icon: Users,             section: "system" },
  { title: "Settings",            href: "/admin/settings",                 icon: Settings,          section: "system" },
]

const navGroups: NavGroup[] = [
  { label: "Overview",    items: allNavItems.filter(i => i.section === "overview") },
  { label: "Operations",  items: allNavItems.filter(i => i.section === "operations") },
  { label: "Finance",     items: allNavItems.filter(i => i.section === "finance") },
  { label: "System",      items: allNavItems.filter(i => i.section === "system") },
]

const filterNavByRole = (items: NavItem[], role?: string): NavItem[] => {
  if (!role) return items
  const r = role.toLowerCase()
  if (r === "ceo" || r === "cto") return items
  const liveMap = "/admin/live-map"
  if (r === "cfo") {
    const allowed = new Set(["/admin/dashboard", "/admin/finance/dashboard", "/admin/revenue", "/admin/finance/expenses", "/admin/finance/cash", "/admin/finance/bank", "/admin/finance/reports", "/admin/finance/analytics", "/admin/finance/settings", "/admin/finance/salary", "/admin/messages", "/admin/settings"])
    return items.filter(i => allowed.has(i.href))
  }
  if (r === "coo") {
    const allowed = new Set(["/admin/dashboard", "/admin/riders", "/admin/customers", "/admin/deliveries", "/admin/multiple-deliveries", "/admin/create-secretary", "/admin/messages", liveMap])
    return items.filter(i => allowed.has(i.href))
  }
  return items
}

// ─── Shared Nav Item ───────────────────────────────────
function NavItem({ item, pathname, onClick }: { item: NavItem; pathname: string; onClick: (href: string) => void }) {
  const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
  return (
    <motion.button
      key={item.href}
      onClick={() => onClick(item.href)}
      whileTap={{ scale: 0.97 }}
      className={cn(
        "sidebar-item w-full text-left group",
        isActive ? "sidebar-item-active" : "sidebar-item-inactive",
      )}
    >
      <div className={cn(
        "flex items-center justify-center w-8 h-8 rounded-lg transition-colors duration-200 shrink-0",
        isActive ? "bg-primary/15 text-primary" : "text-muted-foreground group-hover:text-foreground",
      )}>
        <item.icon className="w-4 h-4" />
      </div>
      <span className="truncate">{item.title}</span>
      {isActive && (
        <motion.div
          layoutId="active-indicator"
          className="ml-auto w-1.5 h-1.5 rounded-full bg-primary"
        />
      )}
    </motion.button>
  )
}

// ─── Mobile Sheet ──────────────────────────────────────
export function MobileNav() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useAuth()

  const role  = useRole() || undefined
  const items = filterNavByRole(allNavItems, role)

  const handleNav = (href: string) => { router.push(href); setOpen(false) }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden w-8 h-8 rounded-lg">
          <Menu className="h-4 w-4" />
          <span className="sr-only">Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] p-0 bg-sidebar border-sidebar-border">
        <SheetHeader className="px-4 pt-5 pb-4 border-b border-sidebar-border">
          <Image src="/images/black1.png" alt="SahelX" width={110} height={36} className="h-6 w-auto dark:invert mb-1" />
          <SheetTitle className="text-sm font-semibold text-sidebar-foreground">Navigation</SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">Admin portal sections</SheetDescription>
        </SheetHeader>
        <div className="overflow-y-auto py-3 px-2 space-y-1">
          {items.map(item => <NavItem key={item.href} item={item} pathname={pathname} onClick={handleNav} />)}
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ─── Desktop Sidebar ───────────────────────────────────
export function DashboardNav() {
  const pathname = usePathname()
  const router   = useRouter()
  const { user } = useAuth()

  const role   = useRole() || undefined
  const items  = filterNavByRole(allNavItems, role)

  const groups = navGroups.map(g => ({
    ...g,
    items: g.items.filter(i => items.some(a => a.href === i.href)),
  })).filter(g => g.items.length > 0)

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' as const }}
      className="hidden md:flex fixed left-0 top-16 bottom-0 z-40 flex-col w-[240px] border-r border-sidebar-border bg-sidebar overflow-y-auto"
    >
      {/* Brand strip */}
      <div className="px-4 py-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <Truck className="w-3.5 h-3.5 text-primary" />
          </div>
          <div>
            <p className="text-xs font-bold text-sidebar-foreground">SahelX Admin</p>
            <p className="text-[10px] text-muted-foreground">Delivery Management</p>
          </div>
        </div>
      </div>

      {/* Nav groups */}
      <nav className="flex-1 py-3 px-2 space-y-4">
        {groups.map(group => (
          <div key={group.label}>
            <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map(item => (
                <NavItem key={item.href} item={item} pathname={pathname} onClick={(href) => router.push(href)} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-sidebar-border">
        <p className="text-[10px] text-muted-foreground/50 text-center">
          SahelX · v1.0
        </p>
      </div>
    </motion.aside>
  )
}
