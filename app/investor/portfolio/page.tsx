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
                    <div className="text-2xl font-bold">
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
                    <div className="text-2xl font-bold">{investor?.numberOfBikes ?? 0}</div>
                    <p className="text-xs text-muted-foreground mt-1">Active registered bikes</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={cardVariants}>
                <Card className="h-full shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Number of Payouts</CardTitle>
                    <ListOrdered className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{payouts.length}</div>
                    <p className="text-xs text-muted-foreground mt-1">Payouts received</p>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          )}
        </motion.section>

        {/* ── Payout History ── */}
        <motion.section variants={sectionVariants} className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-4 rounded-full bg-emerald-500" />
            <h2 className="font-heading text-base font-semibold text-foreground">Payout History</h2>
          </div>

          <Card className="shadow-sm">
            <CardContent className="p-0">
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
