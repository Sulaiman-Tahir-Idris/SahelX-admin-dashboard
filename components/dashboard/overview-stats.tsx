"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Bike, Calendar, Package, Users } from "lucide-react"
import { getRiders } from "@/lib/firebase/riders"
import { getCustomers } from "@/lib/firebase/users"
import { getDeliveries } from "@/lib/firebase/deliveries"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

const stats = [
  {
    key: "totalDeliveries",
    label: "Total Deliveries",
    sublabel: "All-time orders",
    icon: Package,
    href: "/admin/deliveries",
  },
  {
    key: "totalRiders",
    label: "Active Riders",
    sublabel: "Fleet members",
    icon: Bike,
    href: "/admin/riders",
  },
  {
    key: "totalCustomers",
    label: "Customers",
    sublabel: "Registered users",
    icon: Users,
    href: "/admin/customers",
  },
  {
    key: "todayDeliveries",
    label: "Today's Deliveries",
    sublabel: "Since midnight",
    icon: Calendar,
    href: "/admin/deliveries",
  },
]

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
}
const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: 'easeOut' as const } },
}

function StatCardSkeleton() {
  return (
    <Card className="p-5 space-y-3 shadow-none">
      <div className="flex items-center justify-between">
        <div className="w-28 h-3.5 rounded-md skeleton" />
        <div className="w-4 h-4 rounded-full skeleton" />
      </div>
      <div className="w-20 h-8 rounded-lg skeleton" />
      <div className="w-24 h-3 rounded-md skeleton" />
    </Card>
  )
}

export function OverviewStats() {
  const [data, setData] = useState({ totalDeliveries: 0, totalRiders: 0, totalCustomers: 0, todayDeliveries: 0 })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => { loadStats() }, [])

  const loadStats = async () => {
    try {
      const [riders, customers, deliveries] = await Promise.all([getRiders(), getCustomers(), getDeliveries()])
      const today = new Date(); today.setHours(0, 0, 0, 0)
      const todayCount = deliveries.filter(d => {
        const date = d.createdAt?.toDate ? d.createdAt.toDate() : new Date(0)
        return date >= today
      }).length
      setData({ totalDeliveries: deliveries.length, totalRiders: riders.length, totalCustomers: customers.length, todayDeliveries: todayCount })
    } catch {
      setData({ totalDeliveries: 0, totalRiders: 0, totalCustomers: 0, todayDeliveries: 0 })
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[1,2,3,4].map(i => <StatCardSkeleton key={i} />)}
      </div>
    )
  }

  return (
    <motion.div
      className="grid gap-4 grid-cols-2 lg:grid-cols-4"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {stats.map((stat) => {
        const Icon  = stat.icon
        const value = data[stat.key as keyof typeof data]
        return (
          <motion.div key={stat.key} variants={cardVariants}>
            <Link
              href={stat.href}
              aria-label={stat.label}
              className="block outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl h-full"
            >
              <Card className="h-full hover:bg-muted/50 transition-colors shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.label}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-medium">{value.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stat.sublabel}
                  </p>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        )
      })}
    </motion.div>
  )
}
