"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bike, Calendar, Package, Users } from "lucide-react"

export function OverviewStats() {
  const stats = {
    totalDeliveries: 1247,
    activeRiders: 23,
    totalCustomers: 892,
    todayDeliveries: 45,
  }

  return (
    <div className="grid gap-4 md:gap-6 grid-cols-2 lg:grid-cols-4">
      <Card className="border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs md:text-sm font-medium text-gray-700">Total Deliveries</CardTitle>
          <div className="rounded-full bg-gray-100 p-1.5 md:p-2">
            <Package className="h-3 w-3 md:h-4 md:w-4 text-gray-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-lg md:text-2xl font-bold text-gray-900">{stats.totalDeliveries.toLocaleString()}</div>
          <p className="text-xs text-gray-500 mt-1">All time deliveries</p>
        </CardContent>
      </Card>
      <Card className="border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs md:text-sm font-medium text-gray-700">Active Riders</CardTitle>
          <div className="rounded-full bg-gray-100 p-1.5 md:p-2">
            <Bike className="h-3 w-3 md:h-4 md:w-4 text-gray-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-lg md:text-2xl font-bold text-gray-900">{stats.activeRiders}</div>
          <p className="text-xs text-gray-500 mt-1">Currently available</p>
        </CardContent>
      </Card>
      <Card className="border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs md:text-sm font-medium text-gray-700">Total Customers</CardTitle>
          <div className="rounded-full bg-gray-100 p-1.5 md:p-2">
            <Users className="h-3 w-3 md:h-4 md:w-4 text-gray-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-lg md:text-2xl font-bold text-gray-900">{stats.totalCustomers.toLocaleString()}</div>
          <p className="text-xs text-gray-500 mt-1">Registered users</p>
        </CardContent>
      </Card>
      <Card className="border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs md:text-sm font-medium text-gray-700">Today's Deliveries</CardTitle>
          <div className="rounded-full bg-gray-100 p-1.5 md:p-2">
            <Calendar className="h-3 w-3 md:h-4 md:w-4 text-gray-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-lg md:text-2xl font-bold text-gray-900">{stats.todayDeliveries}</div>
          <p className="text-xs text-gray-500 mt-1">+12% from yesterday</p>
        </CardContent>
      </Card>
    </div>
  )
}
