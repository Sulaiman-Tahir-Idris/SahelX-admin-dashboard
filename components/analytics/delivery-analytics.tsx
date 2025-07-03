"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Package, Clock, CheckCircle, TrendingUp, MapPin } from "lucide-react"

export function DeliveryAnalytics() {
  // Mock data - replace with actual Firebase queries
  const deliveryStats = {
    total: 1247,
    completed: 1089,
    pending: 98,
    cancelled: 60,
    avgDeliveryTime: 28,
    onTimeRate: 87.3,
  }

  const zonePerformance = [
    { zone: "Downtown", deliveries: 342, avgTime: 25, onTime: 92 },
    { zone: "Suburbs", deliveries: 298, avgTime: 35, onTime: 85 },
    { zone: "Industrial", deliveries: 187, avgTime: 22, onTime: 94 },
    { zone: "Residential", deliveries: 420, avgTime: 30, onTime: 83 },
  ]

  const timeSlots = [
    { time: "9-12 AM", deliveries: 156, success: 94 },
    { time: "12-3 PM", deliveries: 298, success: 89 },
    { time: "3-6 PM", deliveries: 387, success: 85 },
    { time: "6-9 PM", deliveries: 406, success: 82 },
  ]

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Deliveries</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deliveryStats.total.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+12% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{deliveryStats.completed}</div>
            <p className="text-xs text-muted-foreground">
              {((deliveryStats.completed / deliveryStats.total) * 100).toFixed(1)}% success rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Delivery Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deliveryStats.avgDeliveryTime} min</div>
            <p className="text-xs text-muted-foreground">-3 min from last week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On-Time Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deliveryStats.onTimeRate}%</div>
            <Progress value={deliveryStats.onTimeRate} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="zones" className="space-y-4">
        <TabsList>
          <TabsTrigger value="zones">Zone Performance</TabsTrigger>
          <TabsTrigger value="time">Time Analysis</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="zones" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Delivery Performance by Zone</CardTitle>
              <CardDescription>Performance metrics across different delivery zones</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {zonePerformance.map((zone) => (
                  <div key={zone.zone} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <MapPin className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{zone.zone}</p>
                        <p className="text-sm text-muted-foreground">{zone.deliveries} deliveries</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">{zone.avgTime} min avg</p>
                        <p className="text-xs text-muted-foreground">delivery time</p>
                      </div>
                      <Badge variant={zone.onTime >= 90 ? "default" : zone.onTime >= 80 ? "secondary" : "destructive"}>
                        {zone.onTime}% on-time
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="time" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Delivery Performance by Time Slot</CardTitle>
              <CardDescription>Success rates across different time periods</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {timeSlots.map((slot) => (
                  <div key={slot.time} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{slot.time}</p>
                        <p className="text-sm text-muted-foreground">{slot.deliveries} deliveries</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="w-32">
                        <Progress value={slot.success} />
                      </div>
                      <Badge
                        variant={slot.success >= 90 ? "default" : slot.success >= 80 ? "secondary" : "destructive"}
                      >
                        {slot.success}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Delivery Trends</CardTitle>
              <CardDescription>Weekly and monthly delivery patterns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium mb-2">This Week vs Last Week</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <p className="text-2xl font-bold text-green-600">+12%</p>
                      <p className="text-sm text-muted-foreground">Total deliveries</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">+5%</p>
                      <p className="text-sm text-muted-foreground">Success rate</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2">Peak Hours</h4>
                  <p className="text-sm text-muted-foreground mb-2">Highest delivery volume: 3-6 PM (387 deliveries)</p>
                  <p className="text-sm text-muted-foreground">Best success rate: 9-12 AM (94% success)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
