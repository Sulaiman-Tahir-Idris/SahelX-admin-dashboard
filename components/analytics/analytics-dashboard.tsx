"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function AnalyticsDashboard() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    )
  }

  // Mock data for charts
  const deliveryData = [
    { name: "Mon", deliveries: 45, revenue: 112500 },
    { name: "Tue", deliveries: 52, revenue: 130000 },
    { name: "Wed", deliveries: 38, revenue: 95000 },
    { name: "Thu", deliveries: 61, revenue: 152500 },
    { name: "Fri", deliveries: 73, revenue: 182500 },
    { name: "Sat", deliveries: 89, revenue: 222500 },
    { name: "Sun", deliveries: 67, revenue: 167500 },
  ]

  const riderPerformance = [
    { name: "John Rider", deliveries: 45, rating: 4.8 },
    { name: "Jane Smith", deliveries: 38, rating: 4.9 },
    { name: "Mike Johnson", deliveries: 42, rating: 4.7 },
    { name: "Sarah Wilson", deliveries: 35, rating: 4.6 },
    { name: "David Brown", deliveries: 40, rating: 4.8 },
  ]

  const statusDistribution = [
    { name: "Completed", value: 245, color: "#00C49F" },
    { name: "In Transit", value: 23, color: "#0088FE" },
    { name: "Pending", value: 12, color: "#FFBB28" },
    { name: "Cancelled", value: 8, color: "#FF8042" },
  ]

  return (
    <Tabs defaultValue="deliveries" className="space-y-6">
      <TabsList>
        <TabsTrigger value="deliveries">Delivery Analytics</TabsTrigger>
        <TabsTrigger value="riders">Rider Performance</TabsTrigger>
        <TabsTrigger value="revenue">Revenue Insights</TabsTrigger>
        <TabsTrigger value="customers">Customer Analytics</TabsTrigger>
      </TabsList>

      <TabsContent value="deliveries" className="space-y-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Delivery Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
                <div className="text-center">
                  <p className="text-gray-500">Chart visualization will be displayed here</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Weekly deliveries: {deliveryData.reduce((sum, d) => sum + d.deliveries, 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Delivery Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] space-y-4">
                {statusDistribution.map((item) => (
                  <div key={item.name} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: item.color }}></div>
                      <span className="font-medium">{item.name}</span>
                    </div>
                    <span className="text-lg font-bold">{item.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="riders" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Riders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {riderPerformance.map((rider, index) => (
                <div key={rider.name} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                    <span className="font-medium">{rider.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{rider.deliveries} deliveries</div>
                    <div className="text-sm text-gray-500">{rider.rating}/5 rating</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="revenue" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[400px] flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
              <div className="text-center">
                <p className="text-gray-500">Revenue chart will be displayed here</p>
                <p className="text-sm text-gray-400 mt-2">
                  Total weekly revenue: ₦{deliveryData.reduce((sum, d) => sum + d.revenue, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="customers" className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Total Customers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">1,247</div>
              <p className="text-sm text-muted-foreground">+12% from last month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Active Customers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">892</div>
              <p className="text-sm text-muted-foreground">71.5% of total</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Avg. Orders per Customer</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">3.2</div>
              <p className="text-sm text-muted-foreground">+0.3 from last month</p>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </Tabs>
  )
}
