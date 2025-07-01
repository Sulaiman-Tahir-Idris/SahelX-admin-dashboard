"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bike, Calendar, Package, Users, Loader2 } from "lucide-react"
import { getRiders } from "@/lib/firebase/riders"
import { getCustomers } from "@/lib/firebase/users"

export function OverviewStats() {
  const [stats, setStats] = useState({
    totalDeliveries: 1247, // Keep as mock for now
    totalRiders: 0,
    totalCustomers: 0,
    todayDeliveries: 45, // Keep as mock for now
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      setIsLoading(true)

      // Load real data from Firebase
      const [riders, customers] = await Promise.all([getRiders(), getCustomers()])

      setStats({
        totalDeliveries: 1247, // Mock data for now
        totalRiders: riders.length,
        totalCustomers: customers.length,
        todayDeliveries: 45, // Mock data for now
      })
    } catch (error) {
      console.error("Error loading stats:", error)
      // Keep default values on error
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="grid gap-4 md:gap-6 grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border-gray-200 bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-center h-16">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
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
          <CardTitle className="text-xs md:text-sm font-medium text-gray-700">Total Riders</CardTitle>
          <div className="rounded-full bg-gray-100 p-1.5 md:p-2">
            <Bike className="h-3 w-3 md:h-4 md:w-4 text-gray-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-lg md:text-2xl font-bold text-gray-900">{stats.totalRiders}</div>
          <p className="text-xs text-gray-500 mt-1">Registered riders</p>
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
