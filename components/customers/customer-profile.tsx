"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { MapPin, Phone, Mail, Calendar, Star, ShoppingBag, Clock, TrendingUp } from "lucide-react"

interface CustomerProfileProps {
  customerId: string
}

export function CustomerProfile({ customerId }: CustomerProfileProps) {
  // Mock data - replace with actual Firebase query
  const customer = {
    id: customerId,
    name: "Sarah Johnson",
    email: "sarah.johnson@email.com",
    phone: "+1 (555) 123-4567",
    avatar: "/placeholder.svg?height=80&width=80",
    joinDate: "2023-08-15",
    status: "VIP",
    totalOrders: 47,
    totalSpent: 1340,
    avgOrderValue: 28.5,
    lastOrderDate: "2024-01-15",
    rating: 4.8,
    address: {
      street: "123 Main Street",
      city: "Downtown",
      state: "CA",
      zipCode: "90210",
    },
    preferences: {
      deliveryTime: "Evening (6-8 PM)",
      paymentMethod: "Credit Card",
      specialInstructions: "Leave at door, ring bell",
    },
    stats: {
      avgDeliveryTime: 25,
      onTimeDeliveries: 94,
      cancelledOrders: 2,
      favoriteCategory: "Fast Food",
    },
  }

  const recentActivity = [
    { date: "2024-01-15", action: "Order placed", details: "Order #1247 - $32.50", status: "completed" },
    { date: "2024-01-12", action: "Order delivered", details: "Order #1234 - $28.90", status: "completed" },
    { date: "2024-01-08", action: "Rating given", details: "5 stars for Order #1220", status: "feedback" },
    { date: "2024-01-05", action: "Order placed", details: "Order #1220 - $45.20", status: "completed" },
  ]

  return (
    <div className="space-y-6">
      {/* Customer Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={customer.avatar || "/placeholder.svg"} alt={customer.name} />
                <AvatarFallback className="text-lg">
                  {customer.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-2xl font-bold">{customer.name}</h2>
                  <Badge variant={customer.status === "VIP" ? "default" : "secondary"}>{customer.status}</Badge>
                </div>
                <p className="text-muted-foreground">{customer.email}</p>
                <div className="flex items-center space-x-4 mt-2">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Joined {new Date(customer.joinDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm font-medium">{customer.rating}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <Phone className="h-4 w-4 mr-2" />
                Call
              </Button>
              <Button variant="outline" size="sm">
                <Mail className="h-4 w-4 mr-2" />
                Email
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Customer Stats */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <div className="text-center p-4 border rounded-lg">
                  <ShoppingBag className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-2xl font-bold">{customer.totalOrders}</p>
                  <p className="text-sm text-muted-foreground">Total Orders</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <TrendingUp className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <p className="text-2xl font-bold">${customer.totalSpent}</p>
                  <p className="text-sm text-muted-foreground">Total Spent</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <Clock className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <p className="text-2xl font-bold">${customer.avgOrderValue}</p>
                  <p className="text-sm text-muted-foreground">Avg Order</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <Star className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                  <p className="text-2xl font-bold">{customer.stats.onTimeDeliveries}%</p>
                  <p className="text-sm text-muted-foreground">On-Time Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest customer interactions and orders</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center space-x-4 p-3 border rounded-lg">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        activity.status === "completed"
                          ? "bg-green-500"
                          : activity.status === "feedback"
                            ? "bg-blue-500"
                            : "bg-gray-500"
                      }`}
                    />
                    <div className="flex-1">
                      <p className="font-medium">{activity.action}</p>
                      <p className="text-sm text-muted-foreground">{activity.details}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">{new Date(activity.date).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Customer Details */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{customer.email}</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{customer.phone}</span>
              </div>
              <div className="flex items-start space-x-3">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="text-sm">
                  <p>{customer.address.street}</p>
                  <p>
                    {customer.address.city}, {customer.address.state} {customer.address.zipCode}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium">Preferred Delivery Time</p>
                <p className="text-sm text-muted-foreground">{customer.preferences.deliveryTime}</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium">Payment Method</p>
                <p className="text-sm text-muted-foreground">{customer.preferences.paymentMethod}</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium">Special Instructions</p>
                <p className="text-sm text-muted-foreground">{customer.preferences.specialInstructions}</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium">Favorite Category</p>
                <p className="text-sm text-muted-foreground">{customer.stats.favoriteCategory}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm">Avg Delivery Time</span>
                <span className="text-sm font-medium">{customer.stats.avgDeliveryTime} min</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Cancelled Orders</span>
                <span className="text-sm font-medium">{customer.stats.cancelledOrders}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Last Order</span>
                <span className="text-sm font-medium">{new Date(customer.lastOrderDate).toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
