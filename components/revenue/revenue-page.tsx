"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { TrendingUp, Calendar, Download, Filter, DollarSign, CreditCard, Activity } from "lucide-react"
import { getAllPayments, type Payment } from "@/lib/firebase/payments"
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis
} from "recharts"
import {
  ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig
} from "@/components/ui/chart"
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"

import * as XLSX from "xlsx"
import { saveAs } from "file-saver"

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "hsl(var(--primary))",
  },
  gateway: {
    label: "Gateway",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig

export function RevenuePage() {
  const [isClient, setIsClient] = useState(false)
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    status: "all", gateway: "all", startDate: "", endDate: "",
  })

  useEffect(() => {
    setIsClient(true)
    getAllPayments().then(data => {
      setPayments(data.map(p => ({
        ...p,
        paidAt: p.paidAt ? new Date(p.paidAt) : new Date(p.createdAt),
      })))
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  if (!isClient || loading) {
    return (
      <div className="flex h-[400px] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm">Loading financial data...</p>
        </div>
      </div>
    )
  }

  const filteredPayments = payments.filter((p) => {
    const matchesStatus = filters.status === "all" || p.status === filters.status
    const matchesGateway = filters.gateway === "all" || p.gateway === filters.gateway
    const date = new Date(p.paidAt)
    const matchesStart = !filters.startDate || date >= new Date(filters.startDate)
    const matchesEnd = !filters.endDate || date <= new Date(filters.endDate)
    return matchesStatus && matchesGateway && matchesStart && matchesEnd
  })

  const filteredPaidPayments = filteredPayments.filter(p => p.status === "paid")

  const totalRevenue = filteredPaidPayments.reduce((sum, p) => sum + Number(p.amount), 0)
  const totalDeliveries = filteredPaidPayments.length
  const avgOrderValue = totalDeliveries > 0 ? totalRevenue / totalDeliveries : 0

  const monthlyMap: Record<string, number> = {}
  filteredPaidPayments.forEach((p) => {
    const d = new Date(p.paidAt)
    const key = `${d.getFullYear()}-${d.getMonth()}`
    monthlyMap[key] = (monthlyMap[key] || 0) + Number(p.amount)
  })
  const monthlyRevenueData = Object.entries(monthlyMap)
    .map(([key, revenue]) => {
      const [year, m] = key.split("-").map(Number)
      return {
        month: new Date(year, m).toLocaleString("default", { month: "short" }),
        revenue,
      }
    })
    .sort((a, b) => new Date(`01 ${a.month}`).getMonth() - new Date(`01 ${b.month}`).getMonth())

  const currentMonthRevenue = (() => {
    const now = new Date()
    const key = `${now.getFullYear()}-${now.getMonth()}`
    return monthlyMap[key] || 0
  })()

  const today = new Date()
  const thisWeekStart = new Date(today)
  thisWeekStart.setDate(today.getDate() - today.getDay())
  const lastWeekStart = new Date(thisWeekStart)
  lastWeekStart.setDate(thisWeekStart.getDate() - 7)

  let thisWeekTotal = 0
  let lastWeekTotal = 0
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() - (6 - i))
    return { date: d, total: 0 }
  })

  filteredPaidPayments.forEach((p) => {
    const d = new Date(p.paidAt)
    if (d >= thisWeekStart && d <= today) thisWeekTotal += Number(p.amount)
    if (d >= lastWeekStart && d < thisWeekStart) lastWeekTotal += Number(p.amount)
    last7Days.forEach((day) => {
      if (d.getDate() === day.date.getDate() && d.getMonth() === day.date.getMonth() && d.getFullYear() === day.date.getFullYear()) {
        day.total += Number(p.amount)
      }
    })
  })

  const weeklyGrowth = lastWeekTotal > 0 ? ((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100 : thisWeekTotal > 0 ? 100 : 0
  const weeklyRevenueData = last7Days.map((d) => ({
    day: d.date.toLocaleDateString("en-US", { weekday: "short" }),
    revenue: d.total,
  }))

  const yearlyMap: Record<string, number> = {}
  filteredPaidPayments.forEach((p) => {
    const d = new Date(p.paidAt)
    const m = d.toLocaleString("default", { month: "short" })
    yearlyMap[m] = (yearlyMap[m] || 0) + Number(p.amount)
  })
  const yearlyRevenueData = Object.entries(yearlyMap).map(([month, revenue]) => ({ month, revenue }))
  const recentTransactions = filteredPaidPayments.slice(0, 10)

  const formatCurrency = (amt: number) => new Intl.NumberFormat("en-NG", {
    style: "currency", currency: "NGN", minimumFractionDigits: 0,
  }).format(amt)

  const handleExport = () => {
    const companyName = "SahelX Delivery System"
    const generatedAt = new Date()
    const summaryValues: Record<string, number> = {
      "Total Revenue (₦)": totalRevenue,
      "Filtered Transactions": filteredPayments.length,
      "Paid Transactions": filteredPaidPayments.length,
      "Pending Transactions": filteredPayments.filter((p) => p.status === "pending").length,
      "Failed Transactions": filteredPayments.filter((p) => p.status === "failed").length,
      "Average Order Value (₦)": avgOrderValue,
      "This Week Revenue (₦)": thisWeekTotal,
      "Current Month Revenue (₦)": currentMonthRevenue,
    }
    const transactionRows = filteredPayments.map((p) => ({
      Reference: p.reference,
      Date: new Date(p.paidAt).toLocaleString(),
      Amount: Number(p.amount),
      Status: p.status,
      Gateway: p.gateway,
    }))

    const wb = XLSX.utils.book_new()
    const summaryAoA: Array<Array<string | number>> = []
    summaryAoA.push([companyName], ["Revenue Report"], ["Generated At:", generatedAt.toLocaleString()], [], ["Metric", "Value"])
    for (const [label, value] of Object.entries(summaryValues)) summaryAoA.push([label, value])
    
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryAoA)
    wsSummary["!cols"] = [{ wch: 25 }, { wch: 20 }]
    XLSX.utils.book_append_sheet(wb, wsSummary, "Summary")

    const wsTrans = XLSX.utils.json_to_sheet(transactionRows)
    const keys = transactionRows.length > 0 ? Object.keys(transactionRows[0]) : ["Reference", "Date", "Amount", "Status", "Gateway"]
    wsTrans["!cols"] = keys.map((k) => ({ wch: Math.max(k.length + 2, 15) }))
    XLSX.utils.book_append_sheet(wb, wsTrans, "Transactions")

    const fileName = `${companyName.replace(/\s+/g, "_")}_Revenue_Report_${generatedAt.toISOString().split("T")[0]}.xlsx`
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" })
    try {
      saveAs(new Blob([wbout], { type: "application/octet-stream" }), fileName)
    } catch {
      (window as any).location.href = URL.createObjectURL(new Blob([wbout]))
    }
  }

  return (
    <div className="space-y-6">
      {/* Revenue Cards matching dashboard-01 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground mt-1">All-time (filtered)</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(currentMonthRevenue)}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center">
              Current month
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(thisWeekTotal)}</div>
            <p className={`text-xs mt-1 ${weeklyGrowth >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
              {weeklyGrowth > 0 ? "+" : ""}{weeklyGrowth.toFixed(1)}% from last week
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(avgOrderValue)}</div>
            <p className="text-xs text-muted-foreground mt-1">Per delivery</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 shadow-sm">
                  <Filter className="mr-2 h-4 w-4" /> Filter
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64" align="end">
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs">Status</Label>
                    <Select value={filters.status} onValueChange={(v) => setFilters(prev => ({ ...prev, status: v }))}>
                      <SelectTrigger className="h-8 mt-1.5"><SelectValue placeholder="All" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Gateway</Label>
                    <Select value={filters.gateway} onValueChange={(v) => setFilters(prev => ({ ...prev, gateway: v }))}>
                      <SelectTrigger className="h-8 mt-1.5"><SelectValue placeholder="All" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        {Array.from(new Set(payments.map(p => p.gateway))).map(g => (
                          <SelectItem key={g} value={g}>{g}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Date Range</Label>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Input type="date" className="h-8 text-xs" value={filters.startDate} onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))} />
                      <span className="text-xs text-muted-foreground">to</span>
                      <Input type="date" className="h-8 text-xs" value={filters.endDate} onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))} />
                    </div>
                  </div>
                  <Button variant="secondary" size="sm" className="w-full mt-2" onClick={() => setFilters({ status: "all", gateway: "all", startDate: "", endDate: "" })}>
                    Clear Filters
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
            <Button variant="outline" size="sm" onClick={handleExport} className="h-8 shadow-sm">
              <Download className="mr-2 h-4 w-4" /> Export
            </Button>
          </div>
        </div>

        <TabsContent value="overview" className="space-y-6 outline-none">
          {/* Interactive Charts replacing Recharts defaults */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Monthly Revenue Trend</CardTitle>
                <CardDescription>Revenue grouped by month</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                  <AreaChart data={monthlyRevenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                    <YAxis tickLine={false} axisLine={false} tickMargin={8} tickFormatter={v => `₦${v/1000}k`} />
                    <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                    <Area type="monotone" dataKey="revenue" stroke="var(--color-revenue)" fill="url(#fillRevenue)" strokeWidth={2} />
                  </AreaChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Revenue by Gateway</CardTitle>
                <CardDescription>Comparison of payment providers</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                  <BarChart data={Object.entries(filteredPaidPayments.reduce((acc, p) => { acc[p.gateway] = (acc[p.gateway] || 0) + Number(p.amount); return acc }, {} as Record<string, number>)).map(([gateway, revenue]) => ({ gateway, revenue }))}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="gateway" tickLine={false} axisLine={false} tickMargin={8} />
                    <YAxis tickLine={false} axisLine={false} tickMargin={8} tickFormatter={v => `₦${v/1000}k`} />
                    <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                    <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Weekly Revenue</CardTitle>
                <CardDescription>Last 7 days</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[250px] w-full">
                  <BarChart data={weeklyRevenueData}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} />
                    <YAxis tickLine={false} axisLine={false} tickMargin={8} tickFormatter={v => `₦${v/1000}k`} />
                    <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                    <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Yearly Revenue</CardTitle>
                <CardDescription>Jan – Dec breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[250px] w-full">
                  <BarChart data={yearlyRevenueData}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                    <YAxis tickLine={false} axisLine={false} tickMargin={8} tickFormatter={v => `₦${v/1000}k`} />
                    <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                    <Bar dataKey="revenue" fill="var(--color-revenue)" opacity={0.8} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="transactions" className="outline-none">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>A list of recent settled payments.</CardDescription>
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
                    {recentTransactions.length > 0 ? recentTransactions.map((txn) => (
                      <TableRow key={txn.id || txn.reference}>
                        <TableCell className="font-medium text-xs sm:text-sm">{txn.reference}</TableCell>
                        <TableCell className="text-xs sm:text-sm text-muted-foreground">{new Date(txn.paidAt).toLocaleDateString()}</TableCell>
                        <TableCell className="font-medium text-xs sm:text-sm">{formatCurrency(txn.amount)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={
                            txn.status === "paid" ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : 
                            txn.status === "pending" ? "border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-400" : 
                            "border-red-500/50 bg-red-500/10 text-red-600 dark:text-red-400"
                          }>
                            {txn.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm">{txn.gateway}</TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                          No transactions found.
                        </TableCell>
                      </TableRow>
                    )}
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
