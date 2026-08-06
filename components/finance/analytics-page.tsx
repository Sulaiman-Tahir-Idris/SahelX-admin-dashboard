"use client"

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis, Pie, PieChart, Cell } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { getAllPayments } from '@/lib/firebase/payments'
import { getRevenueEntries, getExpenses, getCashTransactions } from '@/lib/firebase/finance'
import type { Payment } from '@/lib/firebase/payments'
import type { RevenueEntry, Expense, CashTransaction, Department } from '@/lib/finance/types'
import { groupByMonth, formatNGN, calcGrowthPct, calcNetProfit, calcProfitMargin } from '@/lib/finance/calculations'
import { DEPARTMENT_COLORS } from '@/lib/finance/types'

export function FinanceAnalyticsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [revenueEntries, setRevenueEntries] = useState<RevenueEntry[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [cashTxns, setCashTxns] = useState<CashTransaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getAllPayments(),
      getRevenueEntries(),
      getExpenses(),
      getCashTransactions(),
    ]).then(([p, r, e, c]) => {
      setPayments(p)
      setRevenueEntries(r)
      setExpenses(e)
      setCashTxns(c)
    }).finally(() => setLoading(false))
  }, [])

  const allRevenue = useMemo(() => {
    return [
      ...payments.filter(p => p.status === 'paid').map(p => ({
        date: new Date(p.paidAt ?? p.createdAt), amount: Number(p.amount), method: p.gateway
      })),
      ...revenueEntries.map(e => ({
        date: new Date(e.date), amount: Number(e.amount), method: e.paymentMethod
      }))
    ].sort((a, b) => a.date.getTime() - b.date.getTime())
  }, [payments, revenueEntries])

  const approvedExpenses = useMemo(() => expenses.filter(e => e.status !== 'rejected'), [expenses])

  if (loading) {
    return (
      <div className="flex h-[400px] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm">Loading analytics data...</p>
        </div>
      </div>
    )
  }

  const monthlyData = groupByMonth(allRevenue, approvedExpenses.map(e => ({ date: new Date(e.date), amount: e.amount })), 6)
  
  const currentMonthData = monthlyData[monthlyData.length - 1] || { revenue: 0, expenses: 0 }
  const priorMonthData = monthlyData[monthlyData.length - 2] || { revenue: 0, expenses: 0 }

  const revGrowth = calcGrowthPct(currentMonthData.revenue, priorMonthData.revenue)
  const expGrowth = calcGrowthPct(currentMonthData.expenses, priorMonthData.expenses)
  const profitMargin = calcProfitMargin(currentMonthData.revenue, currentMonthData.expenses)
  
  const totalDeliveries = payments.filter(p => p.status === 'paid').length + revenueEntries.reduce((s, e) => s + e.deliveryCount, 0)
  const totalRev = allRevenue.reduce((s, r) => s + r.amount, 0)
  const avgRevPerDelivery = totalDeliveries > 0 ? totalRev / totalDeliveries : 0

  const chartConfigOverview = {
    revenue:  { label: 'Revenue',  color: 'hsl(var(--primary))' },
    expenses: { label: 'Expenses', color: 'hsl(38 92% 50%)' },
  } satisfies ChartConfig

  const chartConfigCash = {
    cashIn:   { label: 'Cash In',  color: 'hsl(160 84% 39%)' },
    cashOut:  { label: 'Cash Out', color: 'hsl(0 65% 52%)' },
  } satisfies ChartConfig

  const chartConfigDept = {
    amount: { label: 'Amount', color: 'hsl(var(--primary))' },
  } satisfies ChartConfig

  const deptData = approvedExpenses.reduce((acc, e) => {
    acc[e.department] = (acc[e.department] || 0) + e.amount
    return acc
  }, {} as Record<string, number>)
  const deptBarData = Object.entries(deptData).map(([name, amount]) => ({ name, amount, fill: DEPARTMENT_COLORS[name as Department] || 'hsl(var(--primary))' }))
  
  const catData = approvedExpenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount
    return acc
  }, {} as Record<string, number>)
  const catBarData = Object.entries(catData).map(([name, amount]) => ({ name, amount })).sort((a,b) => b.amount - a.amount).slice(0, 5)

  const methodData = allRevenue.reduce((acc, r) => {
    acc[r.method] = (acc[r.method] || 0) + r.amount
    return acc
  }, {} as Record<string, number>)
  const methodPieData = Object.entries(methodData).map(([name, amount]) => ({ name, amount }))

  const mostExpensiveDept = deptBarData.length > 0 ? deptBarData.reduce((a, b) => a.amount > b.amount ? a : b).name : 'N/A'

  const cashFlowMonthly = cashTxns.reduce((acc, txn) => {
    const d = new Date(txn.date)
    const m = d.toLocaleString("en-NG", { month: "short", year: "2-digit" })
    if (!acc[m]) acc[m] = { month: m, cashIn: 0, cashOut: 0 }
    if (txn.type === 'cash_in' || txn.type === 'opening_balance_adjustment') {
      acc[m].cashIn += txn.amount
    } else {
      acc[m].cashOut += txn.amount
    }
    return acc
  }, {} as Record<string, {month: string, cashIn: number, cashOut: number}>)
  const cashFlowData = Object.values(cashFlowMonthly).slice(-6)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Finance Analytics</h1>
        <p className="text-sm text-muted-foreground">Automated financial insights</p>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Revenue Growth</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{revGrowth > 0 ? '+' : ''}{revGrowth}%</div>
            <p className="text-xs text-muted-foreground mt-1">vs prior month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Expense Growth</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{expGrowth > 0 ? '+' : ''}{expGrowth}%</div>
            <p className="text-xs text-muted-foreground mt-1">vs prior month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Profit Margin</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profitMargin}%</div>
            <p className="text-xs text-muted-foreground mt-1">current month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Avg Rev / Delivery</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNGN(avgRevPerDelivery)}</div>
            <p className="text-xs text-muted-foreground mt-1">all-time</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="w-full flex-wrap justify-start h-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="cashflow">Cash Flow</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Revenue vs Expenses</CardTitle>
                <CardDescription>Last 6 months</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfigOverview} className="h-[300px] w-full">
                  <AreaChart data={monthlyData}>
                    <defs>
                      <linearGradient id="fillRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="fillExp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-expenses)" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="var(--color-expenses)" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                    <YAxis tickLine={false} axisLine={false} tickMargin={8} tickFormatter={v => `₦${v/1000}k`} />
                    <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                    <Area type="monotone" dataKey="revenue" stroke="var(--color-revenue)" fill="url(#fillRev)" strokeWidth={2} />
                    <Area type="monotone" dataKey="expenses" stroke="var(--color-expenses)" fill="url(#fillExp)" strokeWidth={2} />
                  </AreaChart>
                </ChartContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Department Spending</CardTitle>
                <CardDescription>All-time breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfigDept} className="h-[300px] w-full">
                  <BarChart data={deptBarData} layout="vertical" margin={{ top: 0, right: 0, left: 30, bottom: 0 }}>
                    <CartesianGrid horizontal={false} strokeDasharray="3 3" className="stroke-border" />
                    <XAxis type="number" tickLine={false} axisLine={false} tickFormatter={v => `₦${v/1000}k`} />
                    <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
                    <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                    <Bar dataKey="amount" fill="var(--color-amount)" radius={[0, 4, 4, 0]}>
                      {deptBarData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Payment Method</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfigDept} className="h-[300px] w-full">
                  <BarChart data={methodPieData}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
                    <YAxis tickLine={false} axisLine={false} tickMargin={8} tickFormatter={v => `₦${v/1000}k`} />
                    <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                    <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Top 3 Revenue Months</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfigOverview} className="h-[300px] w-full">
                  <BarChart data={[...monthlyData].sort((a,b)=>b.revenue-a.revenue).slice(0,3)}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                    <YAxis tickLine={false} axisLine={false} tickMargin={8} tickFormatter={v => `₦${v/1000}k`} />
                    <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                    <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4">
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top Expense Categories</CardTitle>
                <CardDescription>Most Expensive Dept: {mostExpensiveDept}</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfigDept} className="h-[300px] w-full">
                  <BarChart data={catBarData}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
                    <YAxis tickLine={false} axisLine={false} tickMargin={8} tickFormatter={v => `₦${v/1000}k`} />
                    <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                    <Bar dataKey="amount" fill="hsl(38 92% 50%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="cashflow" className="space-y-4">
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Cash Flow Summary</CardTitle>
                <CardDescription>In vs Out (Last 6 months)</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfigCash} className="h-[300px] w-full">
                  <BarChart data={cashFlowData}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                    <YAxis tickLine={false} axisLine={false} tickMargin={8} tickFormatter={v => `₦${v/1000}k`} />
                    <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                    <Bar dataKey="cashIn" fill="var(--color-cashIn)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="cashOut" fill="var(--color-cashOut)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Net Cash Flow</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfigCash} className="h-[300px] w-full">
                  <AreaChart data={cashFlowData.map(d => ({ month: d.month, net: d.cashIn - d.cashOut }))}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                    <YAxis tickLine={false} axisLine={false} tickMargin={8} tickFormatter={v => `₦${v/1000}k`} />
                    <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                    <Area type="monotone" dataKey="net" stroke="hsl(217 91% 60%)" fill="hsl(217 91% 60%)" fillOpacity={0.2} strokeWidth={2} />
                  </AreaChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
