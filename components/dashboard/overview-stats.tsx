"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bike, Calendar, Package, Users, Loader2 } from "lucide-react"
import { getCouriers, getCustomers } from "@/lib/firebase/users"
import { getDeliveryStats } from "@/lib/firebase/deliveries"

export function OverviewStats() {
  const [stats, setStats] = useState({
    totalDeliveries: 0,
    activeRiders: 0,
    totalCustomers: 0,
    todayDeliveries: 0,
    totalRevenue: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      setLoading(true)

      // Load all stats in parallel
      const [deliveryStats, couriers, customers] = await Promise.all([
        getDeliveryStats(),
        getCouriers(),
        getCustomers(),
      ])

      // Count active riders (available or busy)
      const activeRiders = couriers.filter(
        (courier) => courier.status === "available" || courier.status === "busy",
      ).length

      setStats({
        totalDeliveries: deliveryStats.totalDeliveries,
        activeRiders,
        totalCustomers: customers.length,
        todayDeliveries: deliveryStats.pendingDeliveries,
        totalRevenue: deliveryStats.totalRevenue,
      })
    } catch (error) {
      console.error("Failed to load stats:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card
            key={i}
            className="border-red-200 bg-gradient-to-br from-red-50 to-white dark:border-red-800 dark:from-red-950 dark:to-red-900"
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-center h-16">
                <Loader2 className="h-6 w-6 animate-spin text-red-600" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="border-red-200 bg-gradient-to-br from-red-50 to-white dark:border-red-800 dark:from-red-950 dark:to-red-900">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-red-800 dark:text-red-200">Total Deliveries</CardTitle>
          <Package className="h-4 w-4 text-red-600 dark:text-red-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-900 dark:text-red-100">
            {stats.totalDeliveries.toLocaleString()}
          </div>
          <p className="text-xs text-red-600 dark:text-red-400">All time deliveries</p>
        </CardContent>
      </Card>
      <Card className="border-red-200 bg-gradient-to-br from-red-50 to-white dark:border-red-800 dark:from-red-950 dark:to-red-900">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-red-800 dark:text-red-200">Active Riders</CardTitle>
          <Bike className="h-4 w-4 text-red-600 dark:text-red-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-900 dark:text-red-100">{stats.activeRiders}</div>
          <p className="text-xs text-red-600 dark:text-red-400">Currently available</p>
        </CardContent>
      </Card>
      <Card className="border-red-200 bg-gradient-to-br from-red-50 to-white dark:border-red-800 dark:from-red-950 dark:to-red-900">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-red-800 dark:text-red-200">Total Customers</CardTitle>
          <Users className="h-4 w-4 text-red-600 dark:text-red-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-900 dark:text-red-100">
            {stats.totalCustomers.toLocaleString()}
          </div>
          <p className="text-xs text-red-600 dark:text-red-400">Registered users</p>
        </CardContent>
      </Card>
      <Card className="border-red-200 bg-gradient-to-br from-red-50 to-white dark:border-red-800 dark:from-red-950 dark:to-red-900">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-red-800 dark:text-red-200">Pending Deliveries</CardTitle>
          <Calendar className="h-4 w-4 text-red-600 dark:text-red-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-900 dark:text-red-100">{stats.todayDeliveries}</div>
          <p className="text-xs text-red-600 dark:text-red-400">Awaiting assignment</p>
        </CardContent>
      </Card>
    </div>
  )
}
