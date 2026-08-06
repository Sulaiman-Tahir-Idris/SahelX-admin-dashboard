"use client"
import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Calendar, TrendingUp, TrendingDown, Receipt, Wallet, Building2, Package, Activity } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { StatsCard } from '@/components/dashboard/stats-card'
import { getAllPayments } from '@/lib/firebase/payments'
import { getRevenueEntries, getExpenses, getCashTransactions, getBankAccounts, getFinanceSettings } from '@/lib/firebase/finance'
import { formatNGN, formatNGNCompact, groupByDay, groupByMonth, calcCashBalance, sumExpenses, startOfDay, startOfWeek, startOfMonth, sumInRange, calcGrowthPct, calcNetProfit, calcDepartmentBreakdown, calcBankBalance } from '@/lib/finance/calculations'
import type { RevenueEntry, Expense, CashTransaction, BankAccount, FinanceSettings, Department } from '@/lib/finance/types'
import { DEPARTMENT_COLORS } from '@/lib/finance/types'
import type { Payment } from '@/lib/firebase/payments'

const sectionVariants = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' as const } } }
const staggerContainer = { hidden: {}, show: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } } }

export function FinanceDashboardPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [entries, setEntries] = useState<RevenueEntry[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [cashTxns, setCashTxns] = useState<CashTransaction[]>([])
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [settings, setSettings] = useState<FinanceSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [todayLabel, setTodayLabel] = useState("")

  useEffect(() => {
    setTodayLabel(
      new Date().toLocaleDateString("en-US", {
        weekday: "long", month: "long", day: "numeric",
      })
    )
    Promise.all([
      getAllPayments(),
      getRevenueEntries(),
      getExpenses(),
      getCashTransactions(),
      getBankAccounts(),
      getFinanceSettings(),
    ]).then(([p, e, ex, c, a, s]) => {
      setPayments(p)
      setEntries(e)
      setExpenses(ex)
      setCashTxns(c)
      setAccounts(a)
      setSettings(s)
    }).finally(() => setLoading(false))
  }, [])

  const allRevenue = useMemo(() => [
    ...payments.filter(p => p.status === 'paid').map(p => ({ date: new Date(p.paidAt ?? p.createdAt), amount: Number(p.amount) })),
    ...entries.map(e => ({ date: new Date(e.date), amount: e.amount })),
  ], [payments, entries])

  if (loading) return (
    <div className="space-y-6">
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[1,2,3,4].map(i => <Card key={i} className="p-5 space-y-3"><div className="w-28 h-3.5 rounded-md skeleton" /><div className="w-20 h-8 rounded-lg skeleton" /></Card>)}
      </div>
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[1,2,3,4].map(i => <Card key={i} className="p-5 space-y-3"><div className="w-28 h-3.5 rounded-md skeleton" /><div className="w-20 h-8 rounded-lg skeleton" /></Card>)}
      </div>
    </div>
  )

  const todayRevenue = sumInRange(allRevenue, startOfDay())
  const weeklyRevenue = sumInRange(allRevenue, startOfWeek())
  const monthlyRevenue = sumInRange(allRevenue, startOfMonth())
  
  const approvedExpensesThisMonth = expenses.filter(e => e.status !== 'rejected' && new Date(e.date) >= startOfMonth())
  const monthlyExpensesAmount = sumExpenses(approvedExpensesThisMonth)
  
  const netProfit = monthlyRevenue - monthlyExpensesAmount
  const cashBalance = calcCashBalance(settings?.openingCashBalance ?? 0, cashTxns)
  const bankBalance = accounts.reduce((sum, acc) => sum + calcBankBalance(acc.openingBalance, []), 0) // Approximation using opening balances
  const totalDeliveries = payments.filter(p => p.status === 'paid').length + entries.reduce((s,e) => s + e.deliveryCount, 0)

  const revenueTrendData = groupByDay(allRevenue, 7)
  const expenseTrendData = groupByDay(expenses.filter(e=>e.status!=='rejected').map(e=>({date: new Date(e.date),amount:e.amount})), 7)

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

  const deptData = expenses.filter(e => e.status !== 'rejected').reduce((acc, e) => {
    acc[e.department] = (acc[e.department] || 0) + e.amount
    return acc
  }, {} as Record<string, number>)
  const deptBarData = Object.entries(deptData).map(([name, amount]) => ({ name, amount, fill: DEPARTMENT_COLORS[name as Department] || 'hsl(var(--primary))' }))
  
  const monthlyData = groupByMonth(allRevenue, expenses.filter(e => e.status !== 'rejected').map(e => ({ date: new Date(e.date), amount: e.amount })), 6)

  const chartConfigOverview = {
    revenue:  { label: 'Revenue',  color: 'hsl(var(--primary))' },
    expenses: { label: 'Expenses', color: 'hsl(38 92% 50%)' },
    amount:   { label: 'Amount',   color: 'hsl(var(--primary))' },
    cashIn:   { label: 'Cash In',  color: 'hsl(160 84% 39%)' },
    cashOut:  { label: 'Cash Out', color: 'hsl(0 65% 52%)' },
  } satisfies ChartConfig

  const recentRevenue = [
    ...payments.filter(p => p.status === 'paid').map(p => ({ id: p.id, date: new Date(p.paidAt ?? p.createdAt), amount: Number(p.amount), reference: p.reference, customer: '' })),
    ...entries.map(e => ({ id: e.id, date: new Date(e.date), amount: e.amount, reference: e.reference || 'Manual', customer: e.customer }))
  ].sort((a,b) => b.date.getTime() - a.date.getTime()).slice(0, 5)

  const recentExpenses = [...expenses].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5)
  const recentCashTxns = [...cashTxns].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5)

  return (
    <motion.div className="flex flex-col gap-8" variants={staggerContainer} initial="hidden" animate="show">
      <motion.div variants={sectionVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Finance Dashboard
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Financial overview and key metrics</p>
        </div>
        <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-card shadow-card-sm text-sm font-medium text-muted-foreground shrink-0">
          <Calendar className="h-4 w-4 text-primary" />
          {todayLabel}
        </div>
      </motion.div>

      <motion.section variants={sectionVariants}>
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <StatsCard title="Today's Revenue" value={formatNGN(todayRevenue)} icon={TrendingUp} description="Since midnight" color="green" />
          <StatsCard title="Weekly Revenue" value={formatNGN(weeklyRevenue)} icon={TrendingUp} description="This week" color="blue" />
          <StatsCard title="Monthly Revenue" value={formatNGN(monthlyRevenue)} icon={Receipt} description="This month" color="purple" />
          <StatsCard title="Monthly Expenses" value={formatNGN(monthlyExpensesAmount)} icon={TrendingDown} description="This month" color="amber" />
        </div>
      </motion.section>

      <motion.section variants={sectionVariants}>
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <StatsCard title="Net Profit" value={formatNGN(netProfit)} icon={Activity} description="This month" color={netProfit >= 0 ? "green" : "red"} />
          <StatsCard title="Cash Balance" value={formatNGN(cashBalance)} icon={Wallet} description="In hand" color="green" />
          <StatsCard title="Bank Balance" value={formatNGN(bankBalance)} icon={Building2} description="Approx opening balances" color="blue" />
          <StatsCard title="Total Deliveries" value={totalDeliveries} icon={Package} description="All-time completed" color="gray" />
        </div>
      </motion.section>

      <motion.section variants={sectionVariants}>
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Revenue Trend (Last 7 Days)</CardTitle></CardHeader>
            <CardContent>
              <ChartContainer config={chartConfigOverview} className="h-[250px] w-full">
                <AreaChart data={revenueTrendData}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis tickLine={false} axisLine={false} tickMargin={8} tickFormatter={v => `₦${v/1000}k`} />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                  <Area type="monotone" dataKey="value" stroke="var(--color-revenue)" fill="var(--color-revenue)" fillOpacity={0.2} />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Expense Trend (Last 7 Days)</CardTitle></CardHeader>
            <CardContent>
              <ChartContainer config={chartConfigOverview} className="h-[250px] w-full">
                <AreaChart data={expenseTrendData}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis tickLine={false} axisLine={false} tickMargin={8} tickFormatter={v => `₦${v/1000}k`} />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                  <Area type="monotone" dataKey="value" stroke="var(--color-expenses)" fill="var(--color-expenses)" fillOpacity={0.2} />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Cash Flow</CardTitle></CardHeader>
            <CardContent>
              <ChartContainer config={chartConfigOverview} className="h-[250px] w-full">
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
            <CardHeader><CardTitle>Department Spending</CardTitle></CardHeader>
            <CardContent>
              <ChartContainer config={chartConfigOverview} className="h-[250px] w-full">
                <BarChart data={deptBarData}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis tickLine={false} axisLine={false} tickMargin={8} tickFormatter={v => `₦${v/1000}k`} />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                  <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                    {deptBarData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle>Revenue vs Expenses</CardTitle></CardHeader>
            <CardContent>
              <ChartContainer config={chartConfigOverview} className="h-[250px] w-full">
                <AreaChart data={monthlyData}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis tickLine={false} axisLine={false} tickMargin={8} tickFormatter={v => `₦${v/1000}k`} />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                  <Area type="monotone" dataKey="revenue" stroke="var(--color-revenue)" fill="var(--color-revenue)" fillOpacity={0.2} />
                  <Area type="monotone" dataKey="expenses" stroke="var(--color-expenses)" fill="var(--color-expenses)" fillOpacity={0.2} />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      </motion.section>

      <motion.section variants={sectionVariants}>
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
          <Card>
            <CardHeader><CardTitle className="text-sm font-semibold">Recent Revenue</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {recentRevenue.map(item => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium">{item.customer || item.reference || 'Gateway'}</p>
                    <p className="text-xs text-muted-foreground">{item.date.toLocaleDateString()}</p>
                  </div>
                  <span className="text-emerald-600 font-semibold">{formatNGN(item.amount)}</span>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm font-semibold">Recent Expenses</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {recentExpenses.map(item => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium">{item.vendor || item.category}</p>
                    <p className="text-xs text-muted-foreground">{new Date(item.date).toLocaleDateString()}</p>
                  </div>
                  <span className="text-amber-600 font-semibold">{formatNGN(item.amount)}</span>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm font-semibold">Recent Cash Transactions</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {recentCashTxns.map(item => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium">{item.description || item.type}</p>
                    <p className="text-xs text-muted-foreground">{new Date(item.date).toLocaleDateString()}</p>
                  </div>
                  <span className={item.type === 'cash_in' || item.type === 'opening_balance_adjustment' ? "text-emerald-600 font-semibold" : "text-red-600 font-semibold"}>
                    {item.type === 'cash_in' || item.type === 'opening_balance_adjustment' ? '+' : '-'}{formatNGN(item.amount)}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </motion.section>
    </motion.div>
  )
}
