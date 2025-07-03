"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { TrendingUp, Users, Star, Bike, Clock, Award } from 'lucide-react'

interface RiderStats {
  totalRiders: number
  activeRiders: number
  avgRating: number
  topPerformer: {
    name: string
    deliveries: number
    rating: number
  }
  avgDeliveriesPerRider: number
  riderGrowth: number
}

interface TopRider {
  id: string
  name: string
  deliveries: number
  rating: number
  earnings: number
  avatar?: string
}

export function RiderAnalytics() {
  const [stats, setStats] = useState<RiderStats | null>(null)
  const [topRiders, setTopRiders] = useState<TopRider[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadRiderStats = async () => {
      try {
        // Mock data for now - replace with Firebase aggregation later
        const mockStats: RiderStats = {
          totalRiders: 45,
          activeRiders: 32,
          avgRating: 4.6,
          topPerformer: {
            name: "John Rider",
            deliveries: 89,
            rating: 4.9,
          },
          avgDeliveriesPerRider: 27.8,
          riderGrowth: 8.5,
        }

        const mockTopRiders: TopRider[] = [
          { id: "1", name: "John Rider", deliveries: 89, rating: 4.9, earnings: 45000 },
          { id: "2", name: "Jane Smith", deliveries: 76, rating: 4.8, earnings: 38000 },
          { id: "3", name: "Mike Johnson", deliveries: 71, rating: 4.7, earnings: 35000 },
          { id: "4", name: "Sarah Wilson", deliveries: 68, rating: 4.6, earnings: 32000 },
          { id: "5", name: "David Brown", deliveries: 62, rating: 4.8, earnings: 29000 },
        ]

        setStats(mockStats)
        setTopRiders(mockTopRiders)
      } catch (error) {
        console.error("Failed to load rider analytics:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadRiderStats()
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-16 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>Failed to load rider analytics</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Riders</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRiders}</div>
            <div className="flex items-center mt-1">
              <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
              <p className="text-xs text-green-600">+{stats.riderGrowth}% this month</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Riders</CardTitle>
            <Bike className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeRiders}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {((stats.activeRiders / stats.totalRiders) * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgRating}/5</div>
            <p className="text-xs text-muted-foreground mt-1">Overall rider rating</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Deliveries</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgDeliveriesPerRider}</div>
            <p className="text-xs text-muted-foreground mt-1">Per rider this month</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Top Performing Riders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topRiders.map((rider, index) => (
                <div key={rider.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge
                      variant="outline"
                      className="w-6 h-6 rounded-full p-0 flex items-center justify-center"
                    >
                      {index + 1}
                    </Badge>
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={rider.avatar || "/placeholder.svg"} alt={rider.name} />
                      <AvatarFallback>{rider.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{rider.name}</p>
                      <p className="text-xs text-muted-foreground">{rider.deliveries} deliveries</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className="bg-green-500 mb-1">{rider.rating}/5</Badge>
                    <p className="text-xs text-muted-foreground">{formatCurrency(rider.earnings)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rider Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg bg-green-50">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="font-medium">Available</span>
                </div>
                <span className="text-lg font-bold">15</span>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg bg-blue-50">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="font-medium">On Delivery</span>
                </div>
                <span className="text-lg font-bold">12</span>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                  <span className="font-medium">Offline</span>
                </div>
                <span className="text-lg font-bold">5</span>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg bg-yellow-50">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span className="font-medium">On Break</span>
                </div>
                <span className="text-lg font-bold">3</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Rider Performance Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
            <p className="text-gray-500">Rider performance trend chart will be displayed here</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}