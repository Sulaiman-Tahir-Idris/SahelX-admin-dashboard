"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Users, ShoppingBag, Star, TrendingUp, Crown, MapPin } from "lucide-react"

export function CustomerAnalytics() {
  // Mock data - replace with actual Firebase queries
  const customerStats = {
    totalCustomers: 2847,
    activeCustomers: 1923,
    newCustomers: 156,
    avgOrderValue: 28.5,
    customerSatisfaction: 4.3,
  }

  const topCustomers = [
    {
      id: "1",
      name: "Sarah Johnson",
      avatar: "/placeholder.svg?height=40&width=40",
      orders: 47,
      totalSpent: 1340,
      avgRating: 4.8,
      location: "Downtown",
    },
    {
      id: "2",
      name: "Michael Chen",
      avatar: "/placeholder.svg?height=40&width=40",
      orders: 42,
      totalSpent: 1180,
      avgRating: 4.6,
      location: "Suburbs",
    },
    {
      id: "3",
      name: "Emma Wilson",
      avatar: "/placeholder.svg?height=40&width=40",
      orders: 38,
      totalSpent: 1050,
      avgRating: 4.9,
      location: "Industrial",
    },
    {
      id: "4",
      name: "David Rodriguez",
      avatar: "/placeholder.svg?height=40&width=40",
      orders: 35,
      totalSpent: 980,
      avgRating: 4.4,
      location: "Residential",
    },
    {
      id: "5",
      name: "Lisa Thompson",
      avatar: "/placeholder.svg?height=40&width=40",
      orders: 33,
      totalSpent: 920,
      avgRating: 4.7,
      location: "Downtown",
    },
  ]

  const customerSegments = [
    { segment: "VIP Customers", count: 89, percentage: 3.1, avgSpend: 850 },
    { segment: "Regular Customers", count: 567, percentage: 19.9, avgSpend: 420 },
    { segment: "Occasional Customers", count: 1234, percentage: 43.4, avgSpend: 180 },
    { segment: "New Customers", count: 957, percentage: 33.6, avgSpend: 65 },
  ]

  const orderPatterns = [
    { time: "Breakfast (6-10 AM)", orders: 234, percentage: 18.7 },
    { time: "Lunch (11 AM-2 PM)", orders: 456, percentage: 36.5 },
    { time: "Afternoon (3-5 PM)", orders: 189, percentage: 15.1 },
    { time: "Dinner (6-9 PM)", orders: 298, percentage: 23.8 },
    { time: "Late Night (10 PM-12 AM)", orders: 73, percentage: 5.9 },
  ]

  const locationAnalysis = [
    { area: "Downtown", customers: 789, orders: 2340, avgOrder: 32.5 },
    { area: "Suburbs", customers: 654, orders: 1890, avgOrder: 28.9 },
    { area: "Industrial", customers: 432, orders: 1234, avgOrder: 35.2 },
    { area: "Residential", customers: 972, orders: 2890, avgOrder: 25.8 },
  ]

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customerStats.totalCustomers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+{customerStats.newCustomers} this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customerStats.activeCustomers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((customerStats.activeCustomers / customerStats.totalCustomers) * 100)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${customerStats.avgOrderValue}</div>
            <p className="text-xs text-muted-foreground">+$3.20 from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Satisfaction</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customerStats.customerSatisfaction}/5</div>
            <p className="text-xs text-muted-foreground">+0.3 improvement</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Customers</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{customerStats.newCustomers}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="top-customers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="top-customers">Top Customers</TabsTrigger>
          <TabsTrigger value="segments">Customer Segments</TabsTrigger>
          <TabsTrigger value="patterns">Order Patterns</TabsTrigger>
          <TabsTrigger value="locations">Location Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="top-customers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Customers by Orders</CardTitle>
              <CardDescription>Most valuable customers based on order frequency and spending</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topCustomers.map((customer, index) => (
                  <div key={customer.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-bold text-muted-foreground">#{index + 1}</span>
                        {index === 0 && <Crown className="h-4 w-4 text-yellow-500" />}
                      </div>
                      <Avatar>
                        <AvatarImage src={customer.avatar || "/placeholder.svg"} alt={customer.name} />
                        <AvatarFallback>
                          {customer.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{customer.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {customer.orders} orders • {customer.location}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-lg font-bold">${customer.totalSpent}</p>
                        <div className="flex items-center space-x-1">
                          <Star className="h-3 w-3 text-yellow-500" />
                          <span className="text-xs text-muted-foreground">{customer.avgRating}</span>
                        </div>
                      </div>
                      <Badge variant={index < 3 ? "default" : "secondary"}>VIP</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="segments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Customer Segments</CardTitle>
              <CardDescription>Customer distribution by spending behavior</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {customerSegments.map((segment) => (
                  <div key={segment.segment} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Users className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{segment.segment}</p>
                        <p className="text-sm text-muted-foreground">
                          {segment.count} customers ({segment.percentage}%)
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="w-32">
                        <Progress value={segment.percentage} />
                      </div>
                      <Badge variant="outline">${segment.avgSpend} avg</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="patterns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Order Patterns by Time</CardTitle>
              <CardDescription>When customers are most likely to place orders</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orderPatterns.map((pattern) => (
                  <div key={pattern.time} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <ShoppingBag className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{pattern.time}</p>
                        <p className="text-sm text-muted-foreground">{pattern.orders} orders</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="w-32">
                        <Progress value={pattern.percentage} />
                      </div>
                      <Badge variant="outline">{pattern.percentage}%</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="locations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Customer Distribution by Location</CardTitle>
              <CardDescription>Customer density and order patterns across different areas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {locationAnalysis.map((location) => (
                  <div key={location.area} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <MapPin className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{location.area}</p>
                        <p className="text-sm text-muted-foreground">
                          {location.customers} customers • {location.orders} orders
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-lg font-bold">${location.avgOrder}</p>
                        <p className="text-xs text-muted-foreground">avg order</p>
                      </div>
                      <Badge variant="outline">
                        {Math.round(location.orders / location.customers)} orders/customer
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
