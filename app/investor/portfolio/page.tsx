"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Calendar, Bike, Banknote, ListOrdered, AlertCircle, History } from "lucide-react"
import { InvestorDashboardLayout } from "@/components/dashboard/investor-dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getCurrentInvestor, type InvestorUser } from "@/lib/firebase/investorAuth"
import { getInvestor } from "@/lib/firebase/investors"
import { getInvestorPayouts, type InvestorPayout } from "@/lib/firebase/investorPayouts"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  Legend,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  TooltipProps,
} from "recharts"

const sectionVariants = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" as const } },
}
const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
}
const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  show:   { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: "easeOut" as const } },
}

function StatCardSkeleton() {
  return (
    <Card className="p-5 space-y-3 shadow-none">
      <div className="flex items-center justify-between">
        <div className="w-28 h-3.5 rounded-md skeleton" />
        <div className="w-4 h-4 rounded-full skeleton" />
      </div>
      <div className="w-20 h-8 rounded-lg skeleton" />
      <div className="w-24 h-3 rounded-md skeleton" />
    </Card>
  )
}

export default function InvestorPortfolioPage() {
  const [investor, setInvestor] = useState<InvestorUser | null>(null)
  const [payouts, setPayouts] = useState<InvestorPayout[]>([])
  const [todayLabel, setTodayLabel] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setTodayLabel(
      new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })
    )
  }, [])

  useEffect(() => {
    async function fetchPortfolio() {
      try {
        const user = await getCurrentInvestor()
        if (user?.id) {
          const freshData = await getInvestor(user.id)
          setInvestor(freshData || user)

          const fetchedPayouts = await getInvestorPayouts(user.id)
          setPayouts(fetchedPayouts)
        }
      } catch (e) {
        console.error("Error fetching portfolio", e)
      } finally {
        setIsLoading(false)
      }
    }
    fetchPortfolio()
  }, [])

  return (
    <InvestorDashboardLayout>
      <motion.div
        className="flex flex-col gap-8 min-h-screen"
        variants={staggerContainer}
        initial="hidden"
        animate="show"
      >
        {/* ── Page Header ── */}
        <motion.div
          variants={sectionVariants}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div>
            <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              My{" "}
              <span className="text-emerald-600">Portfolio</span>
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Track your fleet contribution, investments, and payouts.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-card shadow-card-sm text-sm font-medium text-muted-foreground shrink-0">
            <Calendar className="h-4 w-4 text-emerald-600" />
            {todayLabel || "…"}
          </div>
        </motion.div>

        {/* ── Notes from Admin ── */}
        {investor?.notes && (
          <motion.div variants={sectionVariants}>
            <Alert className="bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-300 rounded-xl">
              <AlertCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <AlertDescription>
                <span className="font-semibold">Note from Admin: </span>
                {investor.notes}
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        {/* ── Portfolio Stat Cards ── */}
        <motion.section variants={sectionVariants}>
          {isLoading ? (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-3 lg:grid-cols-3">
              {[1, 2, 3].map(i => <StatCardSkeleton key={i} />)}
            </div>
          ) : (
            <motion.div
              className="grid gap-4 grid-cols-1 sm:grid-cols-3 lg:grid-cols-3"
              variants={staggerContainer}
              initial="hidden"
              animate="show"
            >
              <motion.div variants={cardVariants}>
                <Card className="h-full shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Amount Invested</CardTitle>
                    <Banknote className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-medium">
                      ₦{(investor?.totalInvested ?? 0).toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Capital invested</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={cardVariants}>
                <Card className="h-full shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Number of Bikes</CardTitle>
                    <Bike className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-medium">{investor?.numberOfBikes ?? 0}</div>
                    <p className="text-xs text-muted-foreground mt-1">Active registered bikes</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={cardVariants}>
                <Card className="h-full shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Amount of Payouts</CardTitle>
                    <ListOrdered className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-medium">
                      ₦{payouts.reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Total revenue received</p>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          )}
        </motion.section>

        {/* ── Charts Section ── */}
        {!isLoading && payouts.length > 0 && (
          <motion.section variants={sectionVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* ROI Line Chart */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-4 rounded-full bg-emerald-500" />
                <h2 className="font-heading text-base font-semibold text-foreground">ROI Timeline (Remaining Capital)</h2>
              </div>
              <Card className="shadow-sm">
                <CardContent className="p-6 h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={(() => {
                        const sorted = [...payouts].sort((a, b) => a.date.getTime() - b.date.getTime());
                        let cumulativePayout = 0;
                        const initialInvested = investor?.totalInvested || 0;
                        
                        const chartData = [
                          {
                            date: "Initial",
                            roi: initialInvested,
                          }
                        ];
                        
                        sorted.forEach(p => {
                          cumulativePayout += p.amount;
                          chartData.push({
                            date: p.date.toLocaleDateString("en-US", { month: 'short', year: '2-digit' }),
                            roi: initialInvested - cumulativePayout,
                          });
                        });
                        
                        return chartData;
                      })()}
                      margin={{ top: 10, right: 10, left: 20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="date" 
                        axisLine={false} 
                        tickLine={false}
                        tick={{ fill: '#6b7280', fontSize: 12 }}
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false}
                        tick={{ fill: '#6b7280', fontSize: 12 }}
                        tickFormatter={(value) => `₦${value.toLocaleString()}`}
                      />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-background border border-border rounded-lg shadow-sm p-3">
                                <p className="text-sm font-medium mb-1">{label}</p>
                                <p className="text-sm font-bold text-emerald-600">
                                  ₦{payload[0].value?.toLocaleString()}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">Remaining Capital</p>
                              </div>
                            )
                          }
                          return null
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="roi"
                        stroke="#10b981"
                        strokeWidth={3}
                        dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }}
                        activeDot={{ r: 6, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Invested vs Payout Bar Chart */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-4 rounded-full bg-emerald-500" />
                <h2 className="font-heading text-base font-semibold text-foreground">Invested vs Paid Out</h2>
              </div>
              <Card className="shadow-sm">
                <CardContent className="p-6 h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        {
                          name: "Comparison",
                          invested: investor?.totalInvested || 0,
                          payouts: payouts.reduce((sum, p) => sum + p.amount, 0)
                        }
                      ]}
                      margin={{ top: 10, right: 10, left: 20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false}
                        tick={{ fill: '#6b7280', fontSize: 12 }}
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false}
                        tick={{ fill: '#6b7280', fontSize: 12 }}
                        tickFormatter={(value) => `₦${value.toLocaleString()}`}
                      />
                      <Tooltip
                        cursor={{ fill: 'transparent' }}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-background border border-border rounded-lg shadow-sm p-3 space-y-2">
                                <div className="flex items-center justify-between gap-4">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                                    <span className="text-sm font-medium">Total Invested</span>
                                  </div>
                                  <span className="text-sm font-bold">₦{payload[0].value?.toLocaleString()}</span>
                                </div>
                                <div className="flex items-center justify-between gap-4">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                    <span className="text-sm font-medium">Total Paid Out</span>
                                  </div>
                                  <span className="text-sm font-bold">₦{payload[1].value?.toLocaleString()}</span>
                                </div>
                              </div>
                            )
                          }
                          return null
                        }}
                      />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                      <Bar dataKey="invested" name="Total Invested" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                      <Bar dataKey="payouts" name="Total Paid Out" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </motion.section>
        )}

        {/* ── Payout History ── */}
        <motion.section variants={sectionVariants} className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-4 rounded-full bg-emerald-500" />
            <h2 className="font-heading text-base font-semibold text-foreground">Payout History</h2>
          </div>

          <Card className="shadow-sm">
            <CardContent className="p-0 overflow-x-auto">
              {isLoading ? (
                <div className="p-8 text-center text-muted-foreground">Loading payouts...</div>
              ) : payouts.length === 0 ? (
                <div className="p-12 text-center flex flex-col items-center">
                  <History className="h-10 w-10 text-muted-foreground mb-3 opacity-20" />
                  <p className="text-muted-foreground font-medium">No payouts recorded yet.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="pl-6">Date</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead className="text-right pr-6">Amount Received (₦)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payouts.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="pl-6 font-medium">
                          {p.date.toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric' })}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{p.notes || "-"}</TableCell>
                        <TableCell className="text-right pr-6 font-semibold text-emerald-600">
                          ₦{p.amount.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </motion.section>
      </motion.div>
    </InvestorDashboardLayout>
  )
}
