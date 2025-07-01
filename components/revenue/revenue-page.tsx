"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { TrendingUp, TrendingDown, DollarSign, Calendar, Download, Filter } from "lucide-react"

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

export function RevenuePage() {
  // Mock revenue data
  const revenueStats = {
    totalRevenue: 2450000,
    monthlyRevenue: 185000,
    weeklyRevenue: 42500,
    dailyRevenue: 6800,
    monthlyGrowth: 12.5,
    weeklyGrowth: -2.3,
    totalDeliveries: 1247,
    avgOrderValue: 1965,
  }

  const monthlyRevenueData = [
    { month: "Jan", revenue: 145000, deliveries: 98 },
    { month: "Feb", revenue: 162000, deliveries: 112 },
    { month: "Mar", revenue: 178000, deliveries: 125 },
    { month: "Apr", revenue: 195000, deliveries: 138 },
    { month: "May", revenue: 210000, deliveries: 152 },
    { month: "Jun", revenue: 185000, deliveries: 134 },
  ]

  const dailyRevenueData = [
    { day: "Mon", revenue: 8500 },
    { day: "Tue", revenue: 7200 },
    { day: "Wed", revenue: 9100 },
    { day: "Thu", revenue: 6800 },
    { day: "Fri", revenue: 10200 },
    { day: "Sat", revenue: 12400 },
    { day: "Sun", revenue: 8900 },
  ]

  const revenueByCategory = [
    { name: "Standard Delivery", value: 45, revenue: 82800 },
    { name: "Express Delivery", value: 30, revenue: 55500 },
    { name: "Same Day", value: 15, revenue: 27750 },
    { name: "Scheduled", value: 10, revenue: 18500 },
  ]

  const topEarningRiders = [
    { name: "John Rider", earnings: 45000, deliveries: 89, rating: 4.8 },
    { name: "Jane Smith", earnings: 38000, deliveries: 76, rating: 4.9 },
    { name: "Mike Johnson", earnings: 35000, deliveries: 71, rating: 4.7 },
    { name: "Sarah Wilson", earnings: 32000, deliveries: 68, rating: 4.6 },
    { name: "David Brown", earnings: 29000, deliveries: 62, rating: 4.8 },
  ]

  const recentTransactions = [
    { id: "TXN001", date: "2024-01-15", amount: 2500, type: "Delivery Fee", status: "Completed" },
    { id: "TXN002", date: "2024-01-15", amount: 1800, type: "Express Fee", status: "Completed" },
    { id: "TXN003", date: "2024-01-14", amount: 3200, type: "Same Day", status: "Completed" },
    { id: "TXN004", date: "2024-01-14", amount: 1500, type: "Standard", status: "Pending" },
    { id: "TXN005", date: "2024-01-13", amount: 2800, type: "Express Fee", status: "Completed" },
  ]

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      {/* Revenue Overview Cards */}
      <div className="grid gap-4 md:gap-6 grid-cols-2 lg:grid-cols-4">
        <Card className="border-gray-200 bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{formatCurrency(revenueStats.totalRevenue)}</div>
            <p className="text-xs text-gray-500 mt-1">All time earnings</p>
          </CardContent>
        </Card>

        <Card className="border-gray-200 bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Monthly Revenue</CardTitle>
            <Calendar className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{formatCurrency(revenueStats.monthlyRevenue)}</div>
            <div className="flex items-center mt-1">
              <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
              <p className="text-xs text-green-600">+{revenueStats.monthlyGrowth}% from last month</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Weekly Revenue</CardTitle>
            <Calendar className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{formatCurrency(revenueStats.weeklyRevenue)}</div>
            <div className="flex items-center mt-1">
              <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
              <p className="text-xs text-red-600">{revenueStats.weeklyGrowth}% from last week</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Avg Order Value</CardTitle>
            <DollarSign className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{formatCurrency(revenueStats.avgOrderValue)}</div>
            <p className="text-xs text-gray-500 mt-1">Per delivery</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="riders">Top Riders</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Revenue Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyRevenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [formatCurrency(Number(value)), "Revenue"]} />
                    <Line type="monotone" dataKey="revenue" stroke="#dc2626" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Daily Revenue (This Week)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dailyRevenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip formatter={(value) => [formatCurrency(Number(value)), "Revenue"]} />
                    <Bar dataKey="revenue" fill="#dc2626" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Service Type</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={revenueByCategory}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {revenueByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name, props) => [formatCurrency(props.payload.revenue), name]} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue vs Deliveries</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyRevenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Bar yAxisId="left" dataKey="revenue" fill="#dc2626" name="Revenue" />
                    <Bar yAxisId="right" dataKey="deliveries" fill="#16a34a" name="Deliveries" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="riders" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Earning Riders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rider</TableHead>
                      <TableHead>Earnings</TableHead>
                      <TableHead>Deliveries</TableHead>
                      <TableHead>Rating</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topEarningRiders.map((rider, index) => (
                      <TableRow key={rider.name}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className="w-6 h-6 rounded-full p-0 flex items-center justify-center"
                            >
                              {index + 1}
                            </Badge>
                            <span className="font-medium">{rider.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{formatCurrency(rider.earnings)}</TableCell>
                        <TableCell>{rider.deliveries}</TableCell>
                        <TableCell>
                          <Badge className="bg-green-500">{rider.rating}/5</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Transaction ID</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="font-medium">{transaction.id}</TableCell>
                        <TableCell>{transaction.date}</TableCell>
                        <TableCell>{transaction.type}</TableCell>
                        <TableCell className="font-medium">{formatCurrency(transaction.amount)}</TableCell>
                        <TableCell>
                          <Badge
                            className={
                              transaction.status === "Completed"
                                ? "bg-green-500"
                                : transaction.status === "Pending"
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                            }
                          >
                            {transaction.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
