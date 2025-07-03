"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { DollarSign, TrendingUp, Target, CreditCard, PieChart, Calendar } from "lucide-react"

export function RevenueAnalytics() {
  // Mock data - replace with actual Firebase queries
  const revenueStats = {
    totalRevenue: 45680,
    monthlyGrowth: 12.5,
    avgOrderValue: 28.5,
    monthlyTarget: 50000,
    completedTarget: 91.4,
  }

  const revenueBreakdown = [
    { category: "Delivery Fees", amount: 18500, percentage: 40.5 },
    { category: "Service Charges", amount: 13700, percentage: 30.0 },
    { category: "Premium Services", amount: 9140, percentage: 20.0 },
    { category: "Subscriptions", amount: 4340, percentage: 9.5 },
  ]

  const monthlyRevenue = [
    { month: "Jan", revenue: 38200, target: 40000 },
    { month: "Feb", revenue: 41500, target: 42000 },
    { month: "Mar", revenue: 39800, target: 41000 },
    { month: "Apr", revenue: 43200, target: 44000 },
    { month: "May", revenue: 45680, target: 46000 },
    { month: "Jun", revenue: 0, target: 48000 },
  ]

  const paymentMethods = [
    { method: "Credit Card", transactions: 1247, amount: 28340, percentage: 62.1 },
    { method: "Digital Wallet", transactions: 892, amount: 12450, percentage: 27.3 },
    { method: "Cash on Delivery", transactions: 234, amount: 3890, percentage: 8.5 },
    { method: "Bank Transfer", transactions: 89, amount: 1000, percentage: 2.1 },
  ]

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${revenueStats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+{revenueStats.monthlyGrowth}% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${revenueStats.avgOrderValue}</div>
            <p className="text-xs text-muted-foreground">+$2.30 from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Target</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${revenueStats.monthlyTarget.toLocaleString()}</div>
            <Progress value={revenueStats.completedTarget} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">{revenueStats.completedTarget}% completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">+{revenueStats.monthlyGrowth}%</div>
            <p className="text-xs text-muted-foreground">Month over month</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="breakdown" className="space-y-4">
        <TabsList>
          <TabsTrigger value="breakdown">Revenue Breakdown</TabsTrigger>
          <TabsTrigger value="trends">Monthly Trends</TabsTrigger>
          <TabsTrigger value="payments">Payment Methods</TabsTrigger>
        </TabsList>

        <TabsContent value="breakdown" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue by Category</CardTitle>
              <CardDescription>Breakdown of revenue sources for this month</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {revenueBreakdown.map((item) => (
                  <div key={item.category} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <PieChart className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{item.category}</p>
                        <p className="text-sm text-muted-foreground">{item.percentage}% of total revenue</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="w-32">
                        <Progress value={item.percentage} />
                      </div>
                      <Badge variant="outline">${item.amount.toLocaleString()}</Badge>
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
              <CardTitle>Monthly Revenue Trends</CardTitle>
              <CardDescription>Revenue performance vs targets over the past 6 months</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {monthlyRevenue.map((month) => (
                  <div key={month.month} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{month.month} 2024</p>
                        <p className="text-sm text-muted-foreground">Target: ${month.target.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-lg font-bold">
                          ${month.revenue > 0 ? month.revenue.toLocaleString() : "TBD"}
                        </p>
                        {month.revenue > 0 && (
                          <p className="text-xs text-muted-foreground">
                            {month.revenue >= month.target ? "Target met" : "Below target"}
                          </p>
                        )}
                      </div>
                      {month.revenue > 0 && (
                        <Badge variant={month.revenue >= month.target ? "default" : "secondary"}>
                          {Math.round((month.revenue / month.target) * 100)}%
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment Method Analysis</CardTitle>
              <CardDescription>Revenue distribution by payment methods</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {paymentMethods.map((method) => (
                  <div key={method.method} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <CreditCard className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{method.method}</p>
                        <p className="text-sm text-muted-foreground">{method.transactions} transactions</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-lg font-bold">${method.amount.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">{method.percentage}% of total</p>
                      </div>
                      <div className="w-24">
                        <Progress value={method.percentage} />
                      </div>
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
