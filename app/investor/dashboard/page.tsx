"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Calendar, Package, Bike, Users } from "lucide-react"
import { InvestorDashboardLayout } from "@/components/dashboard/investor-dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getCurrentInvestor, type InvestorUser } from "@/lib/firebase/investorAuth"
import { getRiders } from "@/lib/firebase/riders"
import { getCustomers, getCouriers } from "@/lib/firebase/users"
import { getDeliveries } from "@/lib/firebase/deliveries"
import { getCompanyContacts, type CompanyContacts } from "@/lib/firebase/companyContacts"
import { Phone, Mail } from "lucide-react"
import dynamic from "next/dynamic"

const ChartAreaInteractive = dynamic(
  () => import("@/components/chart-area-interactive").then(m => m.ChartAreaInteractive),
  { ssr: false }
)
const RiderStatusChart = dynamic(
  () => import("@/components/dashboard/rider-status-chart").then(m => m.RiderStatusChart),
  { ssr: false }
)

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

const statCards = [
  { key: "totalDeliveries", label: "Total Deliveries",   sublabel: "All-time orders",   Icon: Package },
  { key: "totalRiders",     label: "Active Riders",      sublabel: "Fleet members",      Icon: Bike    },
  { key: "totalCustomers",  label: "Customers",          sublabel: "Registered users",   Icon: Users   },
  { key: "todayDeliveries", label: "Today's Deliveries", sublabel: "Since midnight",     Icon: Calendar },
]

export default function InvestorDashboardPage() {
  const [investorName, setInvestorName] = useState("")
  const [todayLabel, setTodayLabel] = useState("")
  const [data, setData] = useState({ totalDeliveries: 0, totalRiders: 0, totalCustomers: 0, todayDeliveries: 0 })
  const [contacts, setContacts] = useState<CompanyContacts | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setTodayLabel(
      new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })
    )
  }, [])

  useEffect(() => {
    async function fetchData() {
      try {
        const [investor, riders, customers, deliveries, companyContactsData] = await Promise.all([
          getCurrentInvestor(),
          getCouriers(),
          getCustomers(),
          getDeliveries(),
          getCompanyContacts()
        ])
        if (investor) setInvestorName(investor.displayName?.split(" ")[0] || "Investor")
        if (companyContactsData) setContacts(companyContactsData)

        const today = new Date(); today.setHours(0, 0, 0, 0)
        const todayCount = deliveries.filter(d => {
          const date = d.createdAt?.toDate ? d.createdAt.toDate() : new Date(0)
          return date >= today
        }).length

        const activeRiders = riders.filter(r => r.isActive).length

        setData({
          totalDeliveries: deliveries.length,
          totalRiders: activeRiders,
          totalCustomers: customers.length,
          todayDeliveries: todayCount,
        })
      } catch (e) {
        console.error(e)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return "Good morning"
    if (h < 17) return "Good afternoon"
    return "Good evening"
  }

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
              {greeting()},{" "}
              <span className="text-emerald-600">{investorName || "Investor"}</span>
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Here's the live operational overview of SahelX today.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-card shadow-card-sm text-sm font-medium text-muted-foreground shrink-0">
            <Calendar className="h-4 w-4 text-emerald-600" />
            {todayLabel || "…"}
          </div>
        </motion.div>

        {/* ── Stat Cards ── */}
        <motion.section variants={sectionVariants}>
          {isLoading ? (
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
              {[1,2,3,4].map(i => <StatCardSkeleton key={i} />)}
            </div>
          ) : (
            <motion.div
              className="grid gap-4 grid-cols-2 lg:grid-cols-4"
              variants={staggerContainer}
              initial="hidden"
              animate="show"
            >
              {statCards.map(({ key, label, sublabel, Icon }) => (
                <motion.div key={key} variants={cardVariants}>
                  <Card className="h-full shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">{label}</CardTitle>
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {data[key as keyof typeof data].toLocaleString()}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{sublabel}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}
        </motion.section>

        {/* ── Delivery Volume Chart ── */}
        <motion.section variants={sectionVariants} className="w-full">
          <ChartAreaInteractive />
        </motion.section>

        {/* ── Fleet Status & Contacts ── */}
        <motion.section
          variants={sectionVariants}
          className="grid grid-cols-1 gap-6 lg:grid-cols-5"
        >
          <div className="lg:col-span-2 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-4 rounded-full bg-emerald-500" />
              <h2 className="font-heading text-base font-semibold text-foreground">Fleet Status</h2>
            </div>
            <RiderStatusChart />
          </div>

          <div className="lg:col-span-3 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-4 rounded-full bg-emerald-500" />
              <h2 className="font-heading text-base font-semibold text-foreground">Company Contacts</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 h-full">
              <Card className="shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Chief Executive Officer</CardTitle>
                  <p className="text-sm font-medium text-emerald-600">{contacts?.ceoName || "Abdulsalam Tahir Idris"}</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <a href={`tel:${contacts?.ceoPhone || "+2348000000000"}`} className="flex items-center gap-3 text-sm text-muted-foreground hover:text-emerald-600 transition-colors">
                    <div className="bg-emerald-50 dark:bg-emerald-500/10 p-2 rounded-full">
                      <Phone className="h-4 w-4 text-emerald-600" />
                    </div>
                    {contacts?.ceoPhone || "+234 800 000 0000"}
                  </a>
                  <a href={`mailto:${contacts?.ceoEmail || "[email protected]"}`} className="flex items-center gap-3 text-sm text-muted-foreground hover:text-emerald-600 transition-colors">
                    <div className="bg-emerald-50 dark:bg-emerald-500/10 p-2 rounded-full">
                      <Mail className="h-4 w-4 text-emerald-600" />
                    </div>
                    {contacts?.ceoEmail || "[email protected]"}
                  </a>
                </CardContent>
              </Card>
              <Card className="shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Chief Financial Officer</CardTitle>
                  <p className="text-sm font-medium text-emerald-600">{contacts?.cfoName || "Finance Team"}</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <a href={`tel:${contacts?.cfoPhone || "+2348000000000"}`} className="flex items-center gap-3 text-sm text-muted-foreground hover:text-emerald-600 transition-colors">
                    <div className="bg-emerald-50 dark:bg-emerald-500/10 p-2 rounded-full">
                      <Phone className="h-4 w-4 text-emerald-600" />
                    </div>
                    {contacts?.cfoPhone || "+234 800 000 0000"}
                  </a>
                  <a href={`mailto:${contacts?.cfoEmail || "[email protected]"}`} className="flex items-center gap-3 text-sm text-muted-foreground hover:text-emerald-600 transition-colors">
                    <div className="bg-emerald-50 dark:bg-emerald-500/10 p-2 rounded-full">
                      <Mail className="h-4 w-4 text-emerald-600" />
                    </div>
                    {contacts?.cfoEmail || "[email protected]"}
                  </a>
                </CardContent>
              </Card>
            </div>
          </div>
        </motion.section>
      </motion.div>
    </InvestorDashboardLayout>
  )
}
