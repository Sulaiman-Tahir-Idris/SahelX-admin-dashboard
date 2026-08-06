"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { TrendingUp, Calendar, Download, Filter, DollarSign, CreditCard, Activity, Pencil, Trash2, Plus, Search } from "lucide-react"
import { getAllPayments, type Payment } from "@/lib/firebase/payments"
import { getRevenueEntries, addRevenueEntry, updateRevenueEntry, deleteRevenueEntry } from '@/lib/firebase/finance'
import type { RevenueEntry } from '@/lib/finance/types'
import { formatNGN, filterByDateRange, filterBySearch, startOfMonth } from '@/lib/finance/calculations'
import { DateRangeFilter } from '@/components/finance/shared/date-range-filter'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from '@/components/ui/pagination'
import { useAuth } from '@/lib/auth-utils'
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

import { DataImporter } from '@/components/finance/shared/data-importer'
import { db } from '@/lib/firebase/config'
import { collection, addDoc, Timestamp } from 'firebase/firestore'
import { getAllRiders, type Rider } from '@/lib/firebase/riders'

import { saveAs } from "file-saver"

const revenueEntrySchema = z.object({
  date: z.string().min(1, "Date is required"),
  customer: z.string().min(1, "Customer name is required"),
  rider: z.string().min(1, "Rider name is required"),
  deliveryCount: z.coerce.number().min(1, "At least 1 delivery"),
  amount: z.coerce.number().min(0, "Amount cannot be negative"),
  paymentMethod: z.enum(["Cash", "Transfer", "Card", "Gateway"]),
  reference: z.string().optional(),
  notes: z.string().optional(),
})
type RevenueEntryFormValues = z.infer<typeof revenueEntrySchema>

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

  const handleImportRevenue = async (data: any[]) => {
    // Generate historical deliveries and payments
    for (const row of data) {
      const dateVal = row["Date"] instanceof Date ? row["Date"] : new Date(row["Date"])
      
      // Extract courierId from "Name (ID)" format
      const riderField = row["Rider Name"] || ""
      const match = riderField.match(/\(([^)]+)\)$/)
      const courierId = match ? match[1] : (riderField || "Unknown Rider")
      const courierName = riderField.replace(/\s*\([^)]+\)$/, "") || "Unknown Rider"
      
      const delivery = {
        trackingId: `HIST_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        customerId: row["Customer Name"] || "Historical Customer",
        courierId: courierId,
        courierName: courierName,
        pickupLocation: { address: row["Pickup Address"] || "", phone: "", lat: null, lng: null },
        pickupPhoneNumber: "",
        dropoffLocation: { address: row["Dropoff Address"] || "", lat: null, lng: null },
        receiverPhoneNumber: "",
        goodsType: row["Package Type"] || "Others",
        goodsSize: row["Size"] || "Medium",
        cost: Number(row["Amount"]) || 0,
        status: "delivered",
        type: "historical",
        timestamp: Timestamp.fromDate(dateVal),
        createdAt: Timestamp.fromDate(dateVal),
        assignedAt: Timestamp.fromDate(dateVal),
        tag: null,
        deliveryEvidence: null,
        eta: null,
        distance: null,
        rating: null,
        paymentLink: null,
        paymentReference: `HIST_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        paymentStatus: "paid",
        history: [{ status: "delivered", timestamp: Timestamp.fromDate(dateVal) }],
        updatedAt: Timestamp.fromDate(dateVal),
      }

      const docRef = await addDoc(collection(db, "deliveries"), delivery)

      await addDoc(collection(db, "payments"), {
        amount: Number(row["Amount"]) || 0,
        createdAt: Timestamp.fromDate(dateVal),
        customerId: row["Customer Name"] || "Historical Customer",
        deliveryId: docRef.id,
        gateway: row["Payment Method"] || "Cash",
        gatewayResponse: "Historical Import",
        paidAt: Timestamp.fromDate(dateVal),
        reference: `HIST_PAY_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        status: "paid",
        type: "historical"
      })
    }
    
    // Refresh
    const freshData = await getAllPayments()
    setPayments(freshData)
  }

  // Manual Entries State
  const { user } = useAuth ? useAuth() : { user: { uid: 'system' } }
  const [entries, setEntries] = useState<RevenueEntry[]>([])
  const [riders, setRiders] = useState<Rider[]>([])
  const [entriesLoading, setEntriesLoading] = useState(true)

  useEffect(() => {
    const fetchEntriesAndRiders = async () => {
      try {
        const [data, ridersData] = await Promise.all([getRevenueEntries(), getAllRiders()])
        setEntries(data)
        setRiders(ridersData)
      } catch (error) {
        console.error('Failed to load manual entries or riders', error)
      } finally {
        setEntriesLoading(false)
      }
    }
    fetchEntriesAndRiders()
  }, [])
  const [manualSearch, setManualSearch] = useState('')
  const [manualDateRange, setManualDateRange] = useState({ startDate: '', endDate: '' })
  const [manualMethod, setManualMethod] = useState('all')
  const [manualPage, setManualPage] = useState(1)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'add'|'edit'>('add')
  const [editingEntry, setEditingEntry] = useState<RevenueEntry | null>(null)

  const form = useForm<RevenueEntryFormValues>({
    resolver: zodResolver(revenueEntrySchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      customer: '', rider: '', deliveryCount: 1, amount: 0,
      paymentMethod: 'Cash', reference: '', notes: ''
    }
  })

  useEffect(() => {
    setIsClient(true)
    Promise.all([getAllPayments(), getRevenueEntries()]).then(([paymentsData, entriesData]) => {
      setPayments(paymentsData.map(p => ({
        ...p,
        paidAt: p.paidAt ? new Date(p.paidAt) : new Date(p.createdAt),
      })))
      setEntries(entriesData)
      setEntriesLoading(false)
      setLoading(false)
    }).catch(() => {
      setLoading(false)
      setEntriesLoading(false)
    })
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

  const loadEntries = async () => {
    setEntriesLoading(true)
    const data = await getRevenueEntries()
    setEntries(data)
    setEntriesLoading(false)
  }

  const handleOpenAdd = () => {
    setDialogMode('add')
    setEditingEntry(null)
    form.reset({ date: new Date().toISOString().split('T')[0], customer: '', rider: '', deliveryCount: 1, amount: 0, paymentMethod: 'Cash', reference: '', notes: '' })
    setIsDialogOpen(true)
  }

  const handleOpenEdit = (entry: RevenueEntry) => {
    setDialogMode('edit')
    setEditingEntry(entry)
    form.reset({ date: new Date(entry.date).toISOString().split('T')[0], customer: entry.customer, rider: entry.rider, deliveryCount: entry.deliveryCount, amount: entry.amount, paymentMethod: entry.paymentMethod, reference: entry.reference || '', notes: entry.notes || '' })
    setIsDialogOpen(true)
  }

  const onSubmitEntry = async (values: RevenueEntryFormValues) => {
    try {
      if (dialogMode === 'add') {
        await addRevenueEntry({ ...values, date: new Date(values.date), source: 'manual', createdBy: user?.uid || 'system' })
        toast.success('Revenue entry saved')
      } else if (editingEntry) {
        await updateRevenueEntry(editingEntry.id, { ...values, date: new Date(values.date) })
        toast.success('Revenue entry updated')
      }
      setIsDialogOpen(false)
      loadEntries()
    } catch (err) {
      toast.error('Failed to save entry')
    }
  }

  const handleDeleteEntry = async (id: string) => {
    try {
      await deleteRevenueEntry(id)
      toast.success('Entry deleted')
      loadEntries()
    } catch (err) {
      toast.error('Failed to delete entry')
    }
  }

  const filteredEntries = filterBySearch(
    filterByDateRange(entries, manualDateRange.startDate, manualDateRange.endDate),
    manualSearch, ['customer', 'rider', 'reference']
  ).filter(e => manualMethod === 'all' || e.paymentMethod === manualMethod)

  const ITEMS_PER_PAGE = 10
  const totalPages = Math.ceil(filteredEntries.length / ITEMS_PER_PAGE)
  const paginatedEntries = filteredEntries.slice((manualPage - 1) * ITEMS_PER_PAGE, manualPage * ITEMS_PER_PAGE)
  
  const manualTotalAmount = entries.reduce((s, e) => s + e.amount, 0)
  const manualThisMonth = entries.filter(e => new Date(e.date) >= startOfMonth(new Date())).reduce((s, e) => s + e.amount, 0)
  const manualTotalCount = entries.length
  const manualTotalDeliveries = entries.reduce((s, e) => s + e.deliveryCount, 0)
  const manualAvgPerDelivery = manualTotalDeliveries > 0 ? manualTotalAmount / manualTotalDeliveries : 0

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

  const handleExport = async () => {
    const XLSX = await import('xlsx-js-style')
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

    const manualRows = filteredEntries.map(e => ({ Date: new Date(e.date).toLocaleDateString(), Customer: e.customer, Rider: e.rider, Deliveries: e.deliveryCount, Amount: e.amount, Method: e.paymentMethod, Reference: e.reference || '' }))
    const wsManual = XLSX.utils.json_to_sheet(manualRows)
    XLSX.utils.book_append_sheet(wb, wsManual, "Manual Revenue")

    const fileName = `${companyName.replace(/\s+/g, "_")}_Revenue_Report_${generatedAt.toISOString().split("T")[0]}.xlsx`
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" })
    try {
      saveAs(new Blob([wbout], { type: "application/octet-stream" }), fileName)
    } catch {
      (window as any).location.href = URL.createObjectURL(new Blob([wbout]))
    }
  }

  return (
    <div className="space-y-6 overflow-hidden">
      {/* Revenue Cards matching dashboard-01 */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
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
          <TabsList className="w-full flex-wrap justify-start h-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="manual">Manual Entries</TabsTrigger>
          </TabsList>
          <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-2">
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
        <TabsContent value="manual" className="space-y-6 outline-none">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">Revenue</h1>
              <p className="text-sm text-muted-foreground">Monitor and analyze income from all sources</p>
            </div>
            <div className="flex gap-2">
              <DataImporter 
                title="Import History" 
                templateName="Historical_Revenue"
                columns={["Date", "Customer Name", "Pickup Address", "Dropoff Address", "Package Type", "Size", "Amount", "Payment Method", "Rider Name"]}
                dropdownLists={{
                  "Rider Name": riders.map(r => `${r.displayName} (${r.id})`)
                }}
                onImport={handleImportRevenue}
              />
              <Button variant="outline" className="gap-2" onClick={handleExport}>
                <Download className="h-4 w-4" /> Export Report
              </Button>
              <Button onClick={handleOpenAdd}><Plus className="mr-2 h-4 w-4" /> Add Entry</Button>
            </div>
          </div>

          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Manual Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNGN(manualTotalAmount)}</div>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">This Month</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNGN(manualThisMonth)}</div>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{manualTotalCount}</div>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg per Delivery</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNGN(manualAvgPerDelivery)}</div>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-sm">
            <CardHeader>
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex flex-1 items-center gap-4">
                  <div className="relative w-64">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search entries..." value={manualSearch} onChange={e => setManualSearch(e.target.value)} className="pl-8" />
                  </div>
                  <DateRangeFilter value={manualDateRange} onChange={setManualDateRange} />
                  <Select value={manualMethod} onValueChange={setManualMethod}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Payment Method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Methods</SelectItem>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="Transfer">Transfer</SelectItem>
                      <SelectItem value="Card">Card</SelectItem>
                      <SelectItem value="Gateway">Gateway</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="outline" onClick={handleExport}><Download className="mr-2 h-4 w-4" /> Export</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Rider</TableHead>
                      <TableHead>Deliveries</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entriesLoading ? (
                      <TableRow><TableCell colSpan={8} className="text-center py-6 text-muted-foreground">Loading...</TableCell></TableRow>
                    ) : paginatedEntries.length > 0 ? (
                      paginatedEntries.map(entry => (
                        <TableRow key={entry.id}>
                          <TableCell className="whitespace-nowrap">{new Date(entry.date).toLocaleDateString('en-GB')}</TableCell>
                          <TableCell>{entry.customer}</TableCell>
                          <TableCell>{entry.rider}</TableCell>
                          <TableCell>{entry.deliveryCount}</TableCell>
                          <TableCell className="font-medium">{formatNGN(entry.amount)}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={
                              entry.paymentMethod === 'Cash' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                              entry.paymentMethod === 'Transfer' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                              entry.paymentMethod === 'Card' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                              'bg-gray-100 text-gray-800 border-gray-200'
                            }>
                              {entry.paymentMethod}
                            </Badge>
                          </TableCell>
                          <TableCell>{entry.reference}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(entry)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Entry?</AlertDialogTitle>
                                    <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteEntry(entry.id)}>Delete</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow><TableCell colSpan={8} className="text-center py-6 text-muted-foreground">No manual entries found.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              {totalPages > 1 && (
                <div className="mt-4">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious onClick={() => setManualPage(p => Math.max(1, p - 1))} className={manualPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'} />
                      </PaginationItem>
                      <PaginationItem>
                        <span className="text-sm text-muted-foreground mx-4">Page {manualPage} of {totalPages}</span>
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationNext onClick={() => setManualPage(p => Math.min(totalPages, p + 1))} className={manualPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'} />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-xl md:w-full">
          <DialogHeader>
            <DialogTitle>{dialogMode === 'add' ? 'Add Revenue Entry' : 'Edit Revenue Entry'}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitEntry)} className="space-y-4">
              <FormField control={form.control} name="date" render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="customer" render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer</FormLabel>
                  <FormControl><Input placeholder="Customer name" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="rider" render={({ field }) => (
                <FormItem>
                  <FormLabel>Rider</FormLabel>
                  <FormControl><Input placeholder="Rider name" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="deliveryCount" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Delivery Count</FormLabel>
                    <FormControl><Input type="number" min={1} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="amount" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount (₦)</FormLabel>
                    <FormControl><Input type="number" min={0} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="paymentMethod" render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Method</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="Transfer">Transfer</SelectItem>
                      <SelectItem value="Card">Card</SelectItem>
                      <SelectItem value="Gateway">Gateway</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="reference" render={({ field }) => (
                <FormItem>
                  <FormLabel>Reference / Transaction ID</FormLabel>
                  <FormControl><Input placeholder="Optional" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl><Textarea placeholder="Optional" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit">Save Entry</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
