"use client"

import { useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Home, Truck, Users, Box, Map, Menu, Layers, PlusCircle, MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
  SheetDescription, SheetTrigger,
} from "@/components/ui/sheet"
import Image from "next/image"

type NavItem = { title: string; href: string; icon: any; section: string }

const navItems: NavItem[] = [
  { title: "Dashboard",           href: "/secretary/dashboard",           icon: Home,       section: "overview" },
  { title: "Riders",              href: "/secretary/riders",              icon: Truck,      section: "operations" },
  { title: "Customers",           href: "/secretary/customers",           icon: Users,      section: "operations" },
  { title: "Deliveries",          href: "/secretary/deliveries",          icon: Box,        section: "operations" },
  { title: "Create Delivery",     href: "/secretary/create-delivery",     icon: PlusCircle, section: "operations" },
  { title: "Multiple Deliveries", href: "/secretary/multiple-deliveries", icon: Layers,     section: "operations" },
  { title: "Messages",            href: "/secretary/messages",            icon: MessageSquare, section: "tools" },
  { title: "Live Map",            href: "/secretary/live-map",            icon: Map,        section: "tools" },
]

function NavItem({ item, pathname, onClick }: { item: NavItem; pathname: string; onClick: (href: string) => void }) {
  const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
  return (
    <motion.button
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
          layoutId="sec-active-indicator"
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
          <SheetDescription className="text-xs text-muted-foreground">Secretary portal sections</SheetDescription>
        </SheetHeader>
        <div className="overflow-y-auto py-3 px-2 space-y-1">
          {navItems.map(item => <NavItem key={item.href} item={item} pathname={pathname} onClick={handleNav} />)}
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ─── Desktop Sidebar ───────────────────────────────────
export function SecretaryDashboardNav() {
  const pathname = usePathname()
  const router   = useRouter()

  const groups = [
    { label: "Overview",    items: navItems.filter(i => i.section === "overview") },
    { label: "Operations",  items: navItems.filter(i => i.section === "operations") },
    { label: "Tools",       items: navItems.filter(i => i.section === "tools") },
  ]

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
          <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <Users className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-sidebar-foreground">SahelX Secretary</p>
            <p className="text-[10px] text-muted-foreground">Operations Staff</p>
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
        <p className="text-[10px] text-muted-foreground/50 text-center">SahelX · v1.0</p>
      </div>
    </motion.aside>
  )
}
