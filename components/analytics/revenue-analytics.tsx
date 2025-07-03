"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, DollarSign, Calendar, Target, CreditCard } from 'lucide-react'

interface RevenueStats {
  totalRevenue: number
  monthlyRevenue: number
  weeklyRevenue: number
  dailyRevenue: number
  monthlyGrowth: number
  weeklyGrowth: number
  avgOrderValue: number
  revenueTarget: number
  targetProgress: number
}

interface RevenueBreakdown {
  deliveryFees: number
  expressFees: number
  sameDayFees: number
  other: number
}

export function RevenueAnalytics() {
  const [stats, setStats] = useState<RevenueStats | null>(null)
  const [breakdown, setBreakdown] = useState<RevenueBreakdown | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadRevenueStats = async () => {
      try {
        // Mock data for now - replace with Firebase aggregation later
        const mockStats: RevenueStats = {
          totalRevenue: 2450000,
          monthlyRevenue: 185000,
          weeklyRevenue: 42500,
          dailyRevenue: 6800,
          monthlyGrowth: 12.5,
          weeklyGrowth: -2.3,
          avgOrderValue: 1965,
          revenueTarget: 200000,
          targetProgress: 92.5,
        }

        const mockBreakdown: RevenueBreakdown = {
          deliveryFees: 1470000,
          expressFees: 588000,
          sameDayFees: 294000,
          other: 98000,
        }

        setStats(mockStats)
        setBreakdown(mockBreakdown)
      } catch (error) {
        console.error("Failed to load revenue analytics:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadRevenueStats()
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

  if (!stats || !breakdown) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>Failed to load revenue analytics</p>
      </div>
    )
  }

  const revenueBreakdownData = [
    { name: "Delivery Fees", value: breakdown.deliveryFees, color: "#00C49F", percentage: (breakdown.deliveryFees / stats.totalRevenue * 100).toFixed(1) },
    { name: "Express Fees", value: breakdown.expressFees, color: "#0088FE", percentage: (breakdown.expressFees / stats.totalRevenue * 100).toFixed(1) },
    { name: "Same Day Fees", value: breakdown.sameDayFees, color: "#FFBB28", percentage: (breakdown.sameDayFees / stats.totalRevenue * 100).toFixed(1) },
    { name: "Other", value: breakdown.other, color: "#FF8042", percentage: (breakdown.other / stats.totalRevenue * 100).toFixed(1) },
  ]

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground mt-1">All time earnings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.monthlyRevenue)}</div>
            <div className="flex items-center mt-1">
              <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
              <p className="text-xs text-green-600">+{stats.monthlyGrowth}% from last month</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Weekly Revenue</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.weeklyRevenue)}</div>
            <div className="flex items-center mt-1">
              <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
              <p className="text-xs text-red-600">{stats.weeklyGrowth}% from last week</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.avgOrderValue)}</div>
            <p className="text-xs text-muted-foreground mt-1">Per delivery</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {revenueBreakdownData.map((item) => (
                <div key={item.name} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                      {item.name}
                    </span>
                    <span>
                      {formatCurrency(item.value)} ({item.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all duration-300"
                      style={{
                        backgroundColor: item.color,
                        width: `${item.percentage}%`,
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Monthly Target Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold">{stats.targetProgress}%</div>
                <p className="text-sm text-muted-foreground">of monthly target achieved</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Current: {formatCurrency(stats.monthlyRevenue)}</span>
                  <span>Target: {formatCurrency(stats.revenueTarget)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="h-3 rounded-full bg-green-500 transition-all duration-300"
                    style={{ width: `${Math.min(stats.targetProgress, 100)}%` }}
                  ></div>
                </div>
              </div>

              <div className="text-center">
                <Badge className={stats.targetProgress >= 100 ? "bg-green-500" : stats.targetProgress >= 80 ? "bg-yellow-500" : "bg-red-500"}>
                  {stats.targetProgress >= 100 ? "Target Achieved!" : 
                   stats.targetProgress >= 80 ? "On Track" : "Behind Target"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Revenue Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
            <p className="text-gray-500">Revenue trend chart will be displayed here</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}