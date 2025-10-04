"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TrendingUp, Calendar, Download, Filter } from "lucide-react"
import { getAllPayments, type Payment } from "@/lib/firebase/payments"
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, BarChart, Bar, CartesianGrid } from "recharts"

export function RevenuePage() {
  const [isClient, setIsClient] = useState(false)
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setIsClient(true)
    const fetchData = async () => {
      try {
        const data = await getAllPayments()
        setPayments(
          data.map(p => ({
            ...p,
            paidAt: p.paidAt ? new Date(p.paidAt) : new Date(p.createdAt), // prefer paidAt
          }))
        )
      } catch (err) {
        console.error("Error fetching payments:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (!isClient || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading revenue data...</p>
        </div>
      </div>
    )
  }

  // ===================== 📊 Aggregate Stats =====================
  const paidPayments = payments.filter(p => p.status === "paid")
  const totalRevenue = paidPayments.reduce((sum, p) => sum + p.amount, 0)
  const totalDeliveries = paidPayments.length
  const avgOrderValue = totalDeliveries > 0 ? totalRevenue / totalDeliveries : 0

  // ===================== Monthly Revenue =====================
  const monthlyMap: Record<string, number> = {}
  paidPayments.forEach(p => {
    const d = new Date(p.paidAt)
    const key = `${d.getFullYear()}-${d.getMonth()}` // unique per year+month
    monthlyMap[key] = (monthlyMap[key] || 0) + p.amount
  })
  const monthlyRevenueData = Object.entries(monthlyMap)
    .map(([key, revenue]) => {
      const [year, monthIdx] = key.split("-").map(Number)
      return {
        month: new Date(year, monthIdx).toLocaleString("default", { month: "short" }),
        revenue,
      }
    })
    .sort((a, b) => new Date(`01 ${a.month}`).getMonth() - new Date(`01 ${b.month}`).getMonth())

  const currentMonthRevenue = (() => {
    const now = new Date()
    const key = `${now.getFullYear()}-${now.getMonth()}`
    return monthlyMap[key] || 0
  })()

  // ===================== Weekly Revenue =====================
  const today = new Date()
  const thisWeekStart = new Date(today)
  thisWeekStart.setDate(today.getDate() - today.getDay()) // Sunday
  const lastWeekStart = new Date(thisWeekStart)
  lastWeekStart.setDate(thisWeekStart.getDate() - 7)

  let thisWeekTotal = 0
  let lastWeekTotal = 0

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() - (6 - i))
    return { date: d, total: 0 }
  })

  paidPayments.forEach(p => {
    const d = new Date(p.paidAt)

    // this week revenue
    if (d >= thisWeekStart && d <= today) thisWeekTotal += p.amount
    // last week revenue
    if (d >= lastWeekStart && d < thisWeekStart) lastWeekTotal += p.amount

    // last 7 days
    last7Days.forEach(day => {
      if (
        d.getDate() === day.date.getDate() &&
        d.getMonth() === day.date.getMonth() &&
        d.getFullYear() === day.date.getFullYear()
      ) {
        day.total += p.amount
      }
    })
  })

  const weeklyGrowth =
    lastWeekTotal > 0 ? ((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100 : thisWeekTotal > 0 ? 100 : 0

  const weeklyRevenueData = last7Days.map(d => ({
    day: d.date.toLocaleDateString("en-US", { weekday: "short" }),
    revenue: d.total,
  }))

  // ===================== Yearly Revenue =====================
  const yearlyMap: Record<string, number> = {}
  paidPayments.forEach(p => {
    const d = new Date(p.paidAt)
    const month = d.toLocaleString("default", { month: "short" })
    yearlyMap[month] = (yearlyMap[month] || 0) + p.amount
  })
  const yearlyRevenueData = Object.entries(yearlyMap).map(([month, revenue]) => ({ month, revenue }))

  // ===================== Recent Transactions =====================
  const recentTransactions = paidPayments.slice(0, 10)

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(amount)

  return (
    <div className="space-y-6">
      {/* Revenue Overview Cards */}
      <div className="grid gap-4 md:gap-6 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <span className="text-lg">₦</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">All time earnings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <Calendar className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(currentMonthRevenue)}</div>
            <p className="text-xs text-green-600 flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              Current month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(thisWeekTotal)}</div>
            <p className={`text-xs ${weeklyGrowth >= 0 ? "text-green-600" : "text-red-600"}`}>
              {weeklyGrowth.toFixed(1)}% from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
            <span className="text-lg">₦</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(avgOrderValue)}</div>
            <p className="text-xs text-muted-foreground">Per delivery</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
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

        {/* Charts */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Monthly Line Chart */}
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
                    <Tooltip formatter={(v: number) => formatCurrency(v)} />
                    <Line type="monotone" dataKey="revenue" stroke="#2563EB" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Revenue by Gateway */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Payment Gateway</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={Object.entries(
                      paidPayments.reduce((acc, p) => {
                        acc[p.gateway] = (acc[p.gateway] || 0) + p.amount
                        return acc
                      }, {} as Record<string, number>)
                    ).map(([gateway, revenue]) => ({ gateway, revenue }))}
                  >
                    <XAxis dataKey="gateway" />
                    <YAxis />
                    <Tooltip formatter={(v: number) => formatCurrency(v)} />
                    <Bar dataKey="revenue" fill="#10B981" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Weekly Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Weekly Revenue (Last 7 Days)</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyRevenueData}>
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Bar dataKey="revenue" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Yearly Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Yearly Revenue (Jan – Dec)</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={yearlyRevenueData}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Bar dataKey="revenue" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transactions Table */}
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
                      <TableHead>Reference</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Gateway</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentTransactions.map(txn => (
                      <TableRow key={txn.id}>
                        <TableCell className="font-medium">{txn.reference}</TableCell>
                        <TableCell>{new Date(txn.paidAt).toLocaleDateString()}</TableCell>
                        <TableCell className="font-medium">{formatCurrency(txn.amount)}</TableCell>
                        <TableCell>
                          <Badge
                            className={
                              txn.status === "paid"
                                ? "bg-green-500"
                                : txn.status === "pending"
                                ? "bg-yellow-500"
                                : "bg-red-500"
                            }
                          >
                            {txn.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{txn.gateway}</TableCell>
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
