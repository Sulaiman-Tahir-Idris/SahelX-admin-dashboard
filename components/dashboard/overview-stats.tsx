"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bike, Calendar, Package, Users } from "lucide-react"

export function OverviewStats() {
  // Mock data for preview - replace with Firebase calls later
  const stats = {
    totalDeliveries: 1247,
    activeRiders: 23,
    totalCustomers: 892,
    todayDeliveries: 45,
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
          <CardTitle className="text-sm font-medium text-red-800 dark:text-red-200">Today's Deliveries</CardTitle>
          <Calendar className="h-4 w-4 text-red-600 dark:text-red-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-900 dark:text-red-100">{stats.todayDeliveries}</div>
          <p className="text-xs text-red-600 dark:text-red-400">+12% from yesterday</p>
        </CardContent>
      </Card>
    </div>
  )
}
