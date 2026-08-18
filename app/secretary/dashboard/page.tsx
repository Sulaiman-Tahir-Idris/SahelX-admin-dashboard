"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Calendar } from "lucide-react"
import { SecretaryDashboardLayout } from "@/components/dashboard/secretary-dashboard-layout"
import { OverviewStats } from "@/components/dashboard/overview-stats"
import { RecentDeliveries } from "@/components/dashboard/recent-deliveries"
import dynamic from "next/dynamic"

const ChartAreaInteractive = dynamic(() => import("@/components/chart-area-interactive").then(m => m.ChartAreaInteractive), { ssr: false })
const RiderStatusChart = dynamic(() => import("@/components/dashboard/rider-status-chart").then(m => m.RiderStatusChart), { ssr: false })
const DeliveryMap = dynamic(() => import("@/components/dashboard/delivery-map").then(m => m.DeliveryMap), { ssr: false })
import { useSecretaryAuth } from "@/lib/auth-utils"

const sectionVariants = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" as const } },
}

const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
}

export default function SecretaryDashboard() {
  const { user: currentUser } = useSecretaryAuth()
  const [todayLabel, setTodayLabel] = useState("")

  useEffect(() => {
    setTodayLabel(
      new Date().toLocaleDateString("en-US", {
        weekday: "long", month: "long", day: "numeric",
      })
    )
  }, [])

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return "Good morning"
    if (h < 17) return "Good afternoon"
    return "Good evening"
  }

  return (
    <SecretaryDashboardLayout>
      <motion.div
        className="flex flex-col gap-8 min-h-screen"
        variants={staggerContainer}
        initial="hidden"
        animate="show"
      >
        {/* ── Page Header ───────────────────────────────────── */}
        <motion.div
          variants={sectionVariants}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div>
            <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              {greeting()},{" "}
              <span className="text-primary">{currentUser?.displayName?.split(" ")[0] || "Secretary"}</span>
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Here's what's happening with SahelX today.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-card shadow-card-sm text-sm font-medium text-muted-foreground shrink-0">
            <Calendar className="h-4 w-4 text-primary" />
            {todayLabel || "—"}
          </div>
        </motion.div>

        {/* ── Stat Cards ────────────────────────────────────── */}
        <motion.section variants={sectionVariants}>
          <OverviewStats />
        </motion.section>

        {/* ── Delivery Volume Chart ─────────────────────────── */}
        <motion.section variants={sectionVariants} className="w-full">
          <ChartAreaInteractive />
        </motion.section>

        {/* ── Recent Operations + Fleet Status ──────────────── */}
        <motion.section
          variants={sectionVariants}
          className="grid grid-cols-1 gap-6 lg:grid-cols-5"
        >
          {/* Recent Deliveries — wider col */}
          <div className="lg:col-span-3 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-4 rounded-full bg-primary" />
              <h2 className="font-heading text-base font-semibold text-foreground">Recent Operations</h2>
            </div>
            <RecentDeliveries />
          </div>

          {/* Rider Status Chart — narrower col */}
          <div className="lg:col-span-2 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-4 rounded-full bg-emerald-500" />
              <h2 className="font-heading text-base font-semibold text-foreground">Fleet Status</h2>
            </div>
            <RiderStatusChart />
          </div>
        </motion.section>

        {/* ── Live Map ──────────────────────────────────────── */}
        <motion.section variants={sectionVariants} className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-4 rounded-full bg-blue-500" />
            <h2 className="font-heading text-base font-semibold text-foreground">Live Logistics Intelligence</h2>
          </div>
          <div className="rounded-2xl border border-border overflow-hidden shadow-card-sm">
            <DeliveryMap />
          </div>
        </motion.section>
      </motion.div>
    </SecretaryDashboardLayout>
  )
}
