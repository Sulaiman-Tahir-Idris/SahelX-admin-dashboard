"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Users, Star, Clock, Award } from "lucide-react"

export function RiderAnalytics() {
  // Mock data - replace with actual Firebase queries
  const riderStats = {
    totalRiders: 45,
    activeRiders: 38,
    avgRating: 4.6,
    avgDeliveryTime: 28,
    topPerformer: "Ahmed Hassan",
  }

  const topRiders = [
    {
      id: "1",
      name: "Ahmed Hassan",
      avatar: "/placeholder.svg?height=40&width=40",
      deliveries: 156,
      rating: 4.9,
      onTime: 96,
      earnings: 2340,
    },
    {
      id: "2",
      name: "Fatima Al-Zahra",
      avatar: "/placeholder.svg?height=40&width=40",
      deliveries: 142,
      rating: 4.8,
      onTime: 94,
      earnings: 2180,
    },
    {
      id: "3",
      name: "Omar Khalil",
      avatar: "/placeholder.svg?height=40&width=40",
      deliveries: 138,
      rating: 4.7,
      onTime: 92,
      earnings: 2050,
    },
    {
      id: "4",
      name: "Aisha Mohamed",
      avatar: "/placeholder.svg?height=40&width=40",
      deliveries: 134,
      rating: 4.8,
      onTime: 93,
      earnings: 1980,
    },
    {
      id: "5",
      name: "Hassan Ali",
      avatar: "/placeholder.svg?height=40&width=40",
      deliveries: 129,
      rating: 4.6,
      onTime: 89,
      earnings: 1890,
    },
  ]

  const performanceMetrics = [
    { metric: "Average Deliveries/Day", value: "12.3", change: "+8%" },
    { metric: "Customer Satisfaction", value: "4.6/5", change: "+0.2" },
    { metric: "On-Time Delivery Rate", value: "87%", change: "+5%" },
    { metric: "Average Earnings/Rider", value: "$1,850", change: "+12%" },
  ]

  const riderActivity = [
    { time: "6-9 AM", active: 28, total: 45 },
    { time: "9-12 PM", active: 35, total: 45 },
    { time: "12-3 PM", active: 42, total: 45 },
    { time: "3-6 PM", active: 38, total: 45 },
    { time: "6-9 PM", active: 32, total: 45 },
    { time: "9-12 AM", active: 15, total: 45 },
  ]

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Riders</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{riderStats.totalRiders}</div>
            <p className="text-xs text-muted-foreground">{riderStats.activeRiders} currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{riderStats.avgRating}/5</div>
            <p className="text-xs text-muted-foreground">+0.2 from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Delivery Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{riderStats.avgDeliveryTime} min</div>
            <p className="text-xs text-muted-foreground">-2 min improvement</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Performer</CardTitle>
            <Award className="h-4 w-4 text-gold-500" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{riderStats.topPerformer}</div>
            <p className="text-xs text-muted-foreground">156 deliveries this month</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="leaderboard" className="space-y-4">
        <TabsList>
          <TabsTrigger value="leaderboard">Top Performers</TabsTrigger>
          <TabsTrigger value="activity">Activity Patterns</TabsTrigger>
          <TabsTrigger value="performance">Performance Metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="leaderboard" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Riders</CardTitle>
              <CardDescription>Ranked by deliveries completed this month</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topRiders.map((rider, index) => (
                  <div key={rider.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-bold text-muted-foreground">#{index + 1}</span>
                        {index === 0 && <Award className="h-4 w-4 text-yellow-500" />}
                      </div>
                      <Avatar>
                        <AvatarImage src={rider.avatar || "/placeholder.svg"} alt={rider.name} />
                        <AvatarFallback>
                          {rider.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{rider.name}</p>
                        <p className="text-sm text-muted-foreground">{rider.deliveries} deliveries</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="flex items-center space-x-1">
                          <Star className="h-4 w-4 text-yellow-500" />
                          <span className="text-sm font-medium">{rider.rating}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{rider.onTime}% on-time</p>
                      </div>
                      <Badge variant="outline">${rider.earnings}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rider Activity by Time</CardTitle>
              <CardDescription>Number of active riders throughout the day</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {riderActivity.map((period) => (
                  <div key={period.time} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{period.time}</p>
                        <p className="text-sm text-muted-foreground">
                          {period.active} of {period.total} riders active
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="w-32">
                        <Progress value={(period.active / period.total) * 100} />
                      </div>
                      <Badge variant="outline">{Math.round((period.active / period.total) * 100)}%</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>Key performance indicators for the rider fleet</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {performanceMetrics.map((metric) => (
                  <div key={metric.metric} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{metric.metric}</p>
                      <Badge variant={metric.change.startsWith("+") ? "default" : "secondary"}>{metric.change}</Badge>
                    </div>
                    <p className="text-2xl font-bold mt-2">{metric.value}</p>
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
