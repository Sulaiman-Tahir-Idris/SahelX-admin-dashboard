"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Calendar, CheckCircle2, Circle, Phone, Mail } from "lucide-react"
import { InvestorDashboardLayout } from "@/components/dashboard/investor-dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { getCurrentInvestor, type InvestorUser } from "@/lib/firebase/investorAuth"
import { getCompanyContacts, type CompanyContacts } from "@/lib/firebase/companyContacts"
import { Progress } from "@/components/ui/progress"

const sectionVariants = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" as const } },
}
const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
}

export default function InvestorDashboardPage() {
  const [investor, setInvestor] = useState<InvestorUser | null>(null)
  const [investorName, setInvestorName] = useState("")
  const [todayLabel, setTodayLabel] = useState("")
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
        const [inv, companyContactsData] = await Promise.all([
          getCurrentInvestor(),
          getCompanyContacts()
        ])
        if (inv) {
          setInvestor(inv)
          setInvestorName(inv.displayName?.split(" ")[0] || "Investor")
        }
        if (companyContactsData) setContacts(companyContactsData)
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

  // Calculate onboarding progress
  const checklist = [
    { key: "bikePurchase", label: "Bike Purchase" },
    { key: "documentsReady", label: "Documents Ready" },
    { key: "riderReadiness", label: "Rider Readiness" },
    { key: "bikeReadiness", label: "Bike Readiness" },
  ];

  const completedCount = checklist.filter(item => investor?.[item.key as keyof InvestorUser]).length;
  const progressPercentage = (completedCount / checklist.length) * 100;

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
              Track your onboarding progress and company contacts.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-card shadow-card-sm text-sm font-medium text-muted-foreground shrink-0">
            <Calendar className="h-4 w-4 text-emerald-600" />
            {todayLabel || "…"}
          </div>
        </motion.div>

        {/* ── Onboarding Progress ── */}
        <motion.section variants={sectionVariants}>
          {isLoading ? (
            <Card className="p-8"><div className="w-full h-8 skeleton rounded" /></Card>
          ) : (
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Onboarding Progress</CardTitle>
                <CardDescription>Track the setup status of your investment</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-medium">
                    <span>Setup Completion</span>
                    <span>{progressPercentage}%</span>
                  </div>
                  <Progress value={progressPercentage} className="h-3" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {checklist.map((item) => {
                    const isCompleted = investor?.[item.key as keyof InvestorUser];
                    return (
                      <div key={item.key} className={`flex items-center gap-3 p-4 rounded-lg border ${isCompleted ? 'bg-emerald-50/50 border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-900/30' : 'bg-muted/30 border-transparent'}`}>
                        {isCompleted ? (
                          <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                        ) : (
                          <Circle className="h-6 w-6 text-muted-foreground opacity-30" />
                        )}
                        <span className={`font-medium ${isCompleted ? 'text-emerald-900 dark:text-emerald-300' : 'text-muted-foreground'}`}>
                          {item.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </motion.section>

        {/* ── Company Contacts ── */}
        <motion.section
          variants={sectionVariants}
          className="grid grid-cols-1 gap-6"
        >
          <div className="flex flex-col gap-3">
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
                  <a href={`mailto:${contacts?.ceoEmail || "tahir@sahelx.com"}`} className="flex items-center gap-3 text-sm text-muted-foreground hover:text-emerald-600 transition-colors">
                    <div className="bg-emerald-50 dark:bg-emerald-500/10 p-2 rounded-full">
                      <Mail className="h-4 w-4 text-emerald-600" />
                    </div>
                    {contacts?.ceoEmail || "tahir@sahelx.com"}
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
                  <a href={`mailto:${contacts?.cfoEmail || "finance@sahelx.com"}`} className="flex items-center gap-3 text-sm text-muted-foreground hover:text-emerald-600 transition-colors">
                    <div className="bg-emerald-50 dark:bg-emerald-500/10 p-2 rounded-full">
                      <Mail className="h-4 w-4 text-emerald-600" />
                    </div>
                    {contacts?.cfoEmail || "finance@sahelx.com"}
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
