"use client"

import { useState, useEffect, useMemo } from "react"
import { useAuth } from "@/lib/auth-utils"
import { useRole } from "@/lib/hooks/use-role"
import { getSalaryConfig, updateSalaryConfig, getPayrollRecords, savePayrollRecord, markPayrollAsPaid, deletePayrollRecord, type SalaryConfig, type PayrollRecord } from "@/lib/firebase/salary"
import { getAllRiders, type Rider } from "@/lib/firebase/riders"
import { getRevenueEntries, getBankAccounts, addExpense, addCashTransaction, addBankTransaction, getExpenses, deleteExpense } from "@/lib/firebase/finance"
import { getAllPayments, type Payment } from "@/lib/firebase/payments"
import { getAdminUsers, type AdminUser } from "@/lib/firebase/admin-users"
import { getSecretaryUsers, type SecretaryUser } from "@/lib/firebase/secretary-users"
import { db } from "@/lib/firebase/config"
import { collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Banknote, Users, Download, Save, ShieldAlert, CheckCircle2, Trash2 } from "lucide-react"

import { useCurrency } from "@/components/providers/currency-provider"
import type { BankAccount } from "@/lib/finance/types"
import { saveAs } from "file-saver"

export function SalaryPage() {
  const { formatAmount } = useCurrency()
  const { user } = useAuth()
  const role = useRole()
  const canEditSettings = role === 'ceo' || role === 'cfo' || role === 'admin'

  const [loading, setLoading] = useState(true)
  const [config, setConfig] = useState<SalaryConfig | null>(null)
  
  // State for Month Selection (YYYY-MM format)
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })

  // Data State
  const [riders, setRiders] = useState<Rider[]>([])
  const [admins, setAdmins] = useState<AdminUser[]>([])
  const [secretaries, setSecretaries] = useState<SecretaryUser[]>([])
  const [deliveries, setDeliveries] = useState<any[]>([])
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [totalDeliveryFees, setTotalDeliveryFees] = useState(0)

  // Payment UI State
  const [payingPayroll, setPayingPayroll] = useState<PayrollRecord | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<"Cash" | "Transfer">("Cash")
  const [selectedBankId, setSelectedBankId] = useState<string>("")
  const [payrolls, setPayrolls] = useState<PayrollRecord[]>([])
  
  const [savingSettings, setSavingSettings] = useState(false)
  const [processingId, setProcessingId] = useState<string | null>(null)
  
  // Advanced Payroll State
  const [adjustingPayroll, setAdjustingPayroll] = useState<PayrollRecord | null>(null)
  const [bonus, setBonus] = useState(0)
  const [deduction, setDeduction] = useState(0)
  const [amountToPay, setAmountToPay] = useState(0)

  // Settings Draft Form
  const [draftConfig, setDraftConfig] = useState<SalaryConfig | null>(null)

  useEffect(() => {
    fetchInitialData()
  }, [])

  useEffect(() => {
    if (config) fetchMonthlyData(selectedMonth)
  }, [selectedMonth, config])

  const fetchInitialData = async () => {
    try {
      const [conf, rids, adm, sec, banks] = await Promise.all([
        getSalaryConfig(),
        getAllRiders(),
        getAdminUsers(),
        getSecretaryUsers(),
        getBankAccounts()
      ])
      setConfig(conf)
      setDraftConfig(conf)
      setRiders(rids)
      setAdmins(adm)
      setSecretaries(sec)
      setBankAccounts(banks)
    } catch (e) {
      toast.error("Failed to load salary configuration")
    }
  }

  const fetchMonthlyData = async (monthYear: string) => {
    setLoading(true)
    try {
      const [year, month] = monthYear.split('-')
      const startDate = new Date(Number(year), Number(month) - 1, 1)
      const endDate = new Date(Number(year), Number(month), 0, 23, 59, 59, 999)

      // 1. Fetch Deliveries
      const q = query(
        collection(db, "deliveries"),
        where("createdAt", ">=", startDate),
        where("createdAt", "<=", endDate)
      )
      const delivSnap = await getDocs(q)
      const delivs = delivSnap.docs.map(d => ({ id: d.id, ...d.data() } as any))
      setDeliveries(delivs)

      // Calculate Total Delivery Fees
      const delivTotal = delivs.reduce((acc, d) => acc + (Number(d.cost) || 0), 0)
      setTotalDeliveryFees(delivTotal)

      // 2. Fetch System Revenue & Manual Revenue (For Total Company Revenue)
      const [sysPayments, manualEntries] = await Promise.all([
        getAllPayments(),
        getRevenueEntries()
      ])
      
      const monthlySys = sysPayments.filter(p => p.createdAt >= startDate && p.createdAt <= endDate)
      const monthlyMan = manualEntries.filter(m => m.date >= startDate && m.date <= endDate)
      
      const revTotal = 
        monthlySys.reduce((acc, p) => acc + p.amount, 0) + 
        monthlyMan.reduce((acc, m) => acc + m.amount, 0)
      
      setTotalRevenue(revTotal)

      // 3. Fetch Existing Payrolls for the month
      const pr = await getPayrollRecords(monthYear)
      setPayrolls(pr)

    } catch (e) {
      toast.error("Failed to load monthly data")
    } finally {
      setLoading(false)
    }
  }

  // ─── CALCULATIONS ────────────────────────────────────────────────────────

  const calculatedRiderPayrolls = useMemo(() => {
    if (!config) return []
    return riders.map(r => {
      // Calculate dynamic commission
      const myDeliveries = deliveries.filter(d => d.courierId === r.id)
      const myFees = myDeliveries.reduce((acc, d) => acc + (Number(d.cost) || 0), 0)
      const commission = (myFees * config.riderComm) / 100
      const basePay = config.riderBase
      
      // Find existing locked or partial payroll
      const existing = payrolls.find(p => p.employeeId === r.id)
      const b = existing?.bonus || 0
      const d = existing?.deduction || 0
      const adv = existing?.advancePaid || 0
      
      const totalPay = basePay + commission + b - d
      const remaining = totalPay - adv
      
      let status = existing?.status || "unpaid"
      if (adv > 0) {
        status = remaining <= 0 ? "paid" : "partial"
      }
      
      return {
        id: existing?.id || `draft_${r.id}`,
        monthYear: selectedMonth,
        role: "Rider",
        employeeId: r.id || "unknown",
        employeeName: r.displayName || "Unknown",
        basePay,
        commissionEarned: commission,
        bonus: b,
        deduction: d,
        advancePaid: adv,
        totalPay,
        status: status as "unpaid" | "partial" | "paid",
        updatedAt: existing?.updatedAt
      }
    })
  }, [riders, deliveries, config, payrolls, selectedMonth])

  const calculatedExecPayrolls = useMemo(() => {
    if (!config) return []
    
    return admins
      .filter(a => ["ceo", "cfo", "cto", "admin"].includes((a.role || "").toLowerCase()))
      .map(adm => {
        let r = (adm.role || "").toLowerCase()
        const email = (adm.email || "").toLowerCase()
        
        // If role is generic admin, infer from email
        if (r === "admin") {
          if (email.includes("ceo")) r = "ceo"
          else if (email.includes("cfo")) r = "cfo"
          else if (email.includes("cto")) r = "cto"
        }
        let base = 0
        let commPct = 0
        let roleName = "Executive"
        
        if (r === "ceo") { base = config.ceoBase; commPct = config.ceoComm; roleName = "Chief Executive Officer" }
        else if (r === "cfo") { base = config.cfoBase; commPct = config.cfoComm; roleName = "Chief Financial Officer" }
        else if (r === "cto") { base = config.ctoBase; commPct = config.ctoComm; roleName = "Chief Technology Officer" }

        const commission = (totalRevenue * commPct) / 100

        const existing = payrolls.find(p => p.employeeId === adm.id)
        const b = existing?.bonus || 0
        const d = existing?.deduction || 0
        const adv = existing?.advancePaid || 0
        
        const totalPay = base + commission + b - d
        const remaining = totalPay - adv
        
        let status = existing?.status || "unpaid"
        if (adv > 0) {
          status = remaining <= 0 ? "paid" : "partial"
        }

        return {
          id: existing?.id || `draft_${adm.id}`,
          monthYear: selectedMonth,
          role: roleName,
          employeeId: adm.id || "unknown",
          employeeName: adm.displayName || adm.email || "Admin",
          basePay: base,
          commissionEarned: commission,
          bonus: b,
          deduction: d,
          advancePaid: adv,
          totalPay,
          status: status as "unpaid" | "partial" | "paid",
          updatedAt: existing?.updatedAt
        }
    })
  }, [admins, totalRevenue, config, payrolls, selectedMonth])

  const calculatedSecretaryPayrolls = useMemo(() => {
    if (!config) return []

    return secretaries.map(sec => {
      // Find manual deliveries created by this specific secretary
      const secDeliveries = deliveries.filter(
        d => d.type === "manual" && d.createdBy === sec.id
      )
      
      const secDeliveryTotal = secDeliveries.reduce((acc, d) => acc + (Number(d.cost) || 0), 0)
      const commission = (secDeliveryTotal * config.secretaryComm) / 100

      const existing = payrolls.find(p => p.employeeId === sec.id)
      const b = existing?.bonus || 0
      const d = existing?.deduction || 0
      const adv = existing?.advancePaid || 0
      
      const totalPay = config.secretaryBase + commission + b - d
      const remaining = totalPay - adv
      
      let status = existing?.status || "unpaid"
      if (adv > 0) {
        status = remaining <= 0 ? "paid" : "partial"
      }

      return {
        id: existing?.id || `draft_${sec.id}`,
        monthYear: selectedMonth,
        role: "Dispatch Manager",
        employeeId: sec.id || "sec",
        employeeName: sec.displayName || sec.email || "Secretary",
        basePay: config.secretaryBase,
        commissionEarned: commission,
        bonus: b,
        deduction: d,
        advancePaid: adv,
        totalPay,
        status: status as "unpaid" | "partial" | "paid",
        updatedAt: existing?.updatedAt
      }
    })
  }, [secretaries, deliveries, config, payrolls, selectedMonth])

  const allPayrolls = [...calculatedExecPayrolls, ...calculatedSecretaryPayrolls, ...calculatedRiderPayrolls]
  const grandTotal = allPayrolls.filter(p => p.status !== "paid").reduce((sum, p) => sum + (p.totalPay - (p.advancePaid || 0)), 0)
  const riderTotal = calculatedRiderPayrolls.filter(p => p.status !== "paid").reduce((sum, p) => sum + (p.totalPay - (p.advancePaid || 0)), 0)
  const execTotal = calculatedExecPayrolls.filter(p => p.status !== "paid").reduce((sum, p) => sum + (p.totalPay - (p.advancePaid || 0)), 0)
  const secretaryTotal = calculatedSecretaryPayrolls.filter(p => p.status !== "paid").reduce((sum, p) => sum + (p.totalPay - (p.advancePaid || 0)), 0)


  // ─── ACTIONS ─────────────────────────────────────────────────────────────

  const handleMarkAsPaid = async (payroll: PayrollRecord) => {
    setPayingPayroll(payroll)
    setPaymentMethod("Cash")
    setSelectedBankId("")
    const remaining = payroll.totalPay - (payroll.advancePaid || 0)
    setAmountToPay(remaining > 0 ? remaining : 0)
  }

  const handleAdjust = (payroll: PayrollRecord) => {
    setAdjustingPayroll(payroll)
    setBonus(payroll.bonus || 0)
    setDeduction(payroll.deduction || 0)
  }

  const handleSaveAdjustments = async () => {
    if (!adjustingPayroll) return
    setProcessingId(adjustingPayroll.id)
    try {
      const record = {
        monthYear: adjustingPayroll.monthYear,
        role: adjustingPayroll.role,
        employeeId: adjustingPayroll.employeeId,
        employeeName: adjustingPayroll.employeeName,
        basePay: adjustingPayroll.basePay,
        commissionEarned: adjustingPayroll.commissionEarned,
        bonus: bonus,
        deduction: deduction,
        advancePaid: adjustingPayroll.advancePaid || 0,
        totalPay: adjustingPayroll.basePay + adjustingPayroll.commissionEarned + bonus - deduction,
        status: adjustingPayroll.status
      }
      
      if (adjustingPayroll.id.startsWith("draft_")) {
        await savePayrollRecord(record)
      } else {
        const { updateDoc, doc } = await import('firebase/firestore')
        await updateDoc(doc(db, 'payrolls', adjustingPayroll.id), record)
      }
      
      toast.success("Adjustments saved")
      setAdjustingPayroll(null)
      fetchMonthlyData(selectedMonth)
    } catch (e) {
      toast.error("Failed to save adjustments")
    } finally {
      setProcessingId(null)
    }
  }

  const handleDeletePayroll = async (p: PayrollRecord) => {
    try {
      await deletePayrollRecord(p.id)
      
      const allExpenses = await getExpenses()
      const relatedExpense = allExpenses.find(e => 
        e.category === "Payroll" && 
        e.vendor === p.employeeName &&
        e.description.includes(p.monthYear)
      )
      
      if (relatedExpense) {
        if (relatedExpense.paymentMethod === 'Cash') {
          await addCashTransaction({
            date: new Date(),
            description: `Refund for Deleted Salary: ${relatedExpense.description}`,
            amount: relatedExpense.amount,
            type: 'cash_in',
            reference: `REFUND-EXP-${relatedExpense.id.slice(-6).toUpperCase()}`,
            createdBy: user?.uid ?? 'system'
          })
        } else if (relatedExpense.bankAccountId) {
          await addBankTransaction(relatedExpense.bankAccountId, {
            date: new Date(),
            description: `Refund for Deleted Salary: ${relatedExpense.description}`,
            credit: relatedExpense.amount,
            debit: 0,
            reference: `REFUND-EXP-${relatedExpense.id.slice(-6).toUpperCase()}`,
            createdBy: user?.uid ?? 'system'
          })
        }
        await deleteExpense(relatedExpense.id)
      }
      
      toast.success("Payroll record deleted")
      fetchMonthlyData(selectedMonth)
    } catch (e) {
      toast.error("Failed to delete payroll")
    }
  }

  const handleConfirmPay = async () => {
    if (!payingPayroll) return
    if (paymentMethod === "Transfer" && !selectedBankId) {
      toast.error("Please select a bank account")
      return
    }
    
    if (amountToPay <= 0) {
      toast.error("Enter a valid amount to pay")
      return
    }

    setProcessingId(payingPayroll.id)
    try {
      const isPartial = amountToPay < (payingPayroll.totalPay - (payingPayroll.advancePaid || 0))
      const newAdvance = (payingPayroll.advancePaid || 0) + amountToPay
      const newStatus = isPartial ? "partial" : "paid"
      
      const desc = isPartial 
        ? `Partial Salary Advance for ${payingPayroll.employeeName} (${payingPayroll.monthYear})`
        : `Salary payout for ${payingPayroll.employeeName} (${payingPayroll.monthYear})`
      
      // 1. Automatically create Expense Record
      await addExpense({
        date: new Date(),
        department: "Administration",
        category: "Payroll",
        vendor: payingPayroll.employeeName,
        description: desc,
        amount: amountToPay,
        paymentMethod: paymentMethod as any,
        status: "approved",
        createdBy: user?.uid ?? "system"
      })

      // 2. Automatically deduct funds
      if (paymentMethod === "Cash") {
        await addCashTransaction({
          date: new Date(),
          description: desc,
          amount: amountToPay,
          type: "cash_out",
          reference: "Payroll Auto",
          createdBy: user?.uid ?? "system"
        })
      } else {
        await addBankTransaction(selectedBankId, {
          date: new Date(),
          description: desc,
          amount: amountToPay,
          type: "withdrawal",
          reference: "Payroll Auto",
          createdBy: user?.uid ?? "system"
        })
      }

      // Save payroll record
      const record = {
        monthYear: payingPayroll.monthYear,
        role: payingPayroll.role,
        employeeId: payingPayroll.employeeId,
        employeeName: payingPayroll.employeeName,
        basePay: payingPayroll.basePay,
        commissionEarned: payingPayroll.commissionEarned,
        bonus: payingPayroll.bonus || 0,
        deduction: payingPayroll.deduction || 0,
        advancePaid: newAdvance,
        totalPay: payingPayroll.totalPay,
        status: newStatus as "partial" | "paid"
      }

      if (payingPayroll.id.startsWith("draft_")) {
        await savePayrollRecord(record)
      } else {
        const { updateDoc, doc } = await import('firebase/firestore')
        await updateDoc(doc(db, 'payrolls', payingPayroll.id), record)
      }

      // 3. Send Notification to all Executives & Secretaries
      let adjustmentsText = ""
      if ((payingPayroll.bonus || 0) > 0 || (payingPayroll.deduction || 0) > 0) {
        const parts = []
        if (payingPayroll.bonus) parts.push(`+${formatAmount(payingPayroll.bonus)} bonus`)
        if (payingPayroll.deduction) parts.push(`-${formatAmount(payingPayroll.deduction)} deduction`)
        adjustmentsText = ` (incl. ${parts.join(" and ")})`
      }

      const notificationMessage = isPartial
        ? `A partial salary advance of ${formatAmount(amountToPay)} was disbursed to ${payingPayroll.employeeName} (${payingPayroll.role}) for ${payingPayroll.monthYear} via ${paymentMethod}.${adjustmentsText}`
        : `A final salary settlement of ${formatAmount(amountToPay)} was disbursed to ${payingPayroll.employeeName} (${payingPayroll.role}) for ${payingPayroll.monthYear} via ${paymentMethod}.${adjustmentsText}`
      
      await addDoc(collection(db, "adminChats", "global", "messages"), {
        senderId: user?.uid ?? "system",
        senderName: "Finance Automation",
        text: notificationMessage,
        createdAt: serverTimestamp(),
      })

      toast.success(`${payingPayroll.employeeName} paid ${formatAmount(amountToPay)} & funds deducted!`)
      fetchMonthlyData(selectedMonth) // refresh
    } catch (e) {
      console.error(e)
      toast.error("Failed to process payment")
    } finally {
      setProcessingId(null)
      setPayingPayroll(null)
    }
  }

  const handleSaveSettings = async () => {
    if (!draftConfig) return
    setSavingSettings(true)
    try {
      await updateSalaryConfig(draftConfig)
      setConfig(draftConfig)
      toast.success("Salary configuration updated successfully")
    } catch (e) {
      toast.error("Failed to save settings")
    } finally {
      setSavingSettings(false)
    }
  }

  const handleExport = async () => {
    const XLSX = await import('xlsx-js-style')
    const ws = XLSX.utils.json_to_sheet(allPayrolls.map(p => ({
      "Role": p.role,
      "Name": p.employeeName,
      "Base Pay": p.basePay,
      "Commission": p.commissionEarned,
      "Total Pay": p.totalPay,
      "Status": p.status
    })))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Payroll")
    XLSX.writeFile(wb, `Payroll_${selectedMonth}.xlsx`)
  }

  // ─── RENDER ──────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex h-[400px] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          <p>Loading salary data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">Salary & Payroll</h1>
          <p className="text-sm text-muted-foreground">Automated payroll calculation based on performance.</p>
        </div>
        <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-2">
          <Input 
            type="month" 
            value={selectedMonth} 
            onChange={e => setSelectedMonth(e.target.value)}
            className="w-48"
          />
          <Button variant="outline" className="gap-2" onClick={handleExport}>
            <Download className="h-4 w-4" /> Export Excel
          </Button>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Unpaid Total Payroll</CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-medium text-red-600">{formatAmount(grandTotal)}</div>
          </CardContent>
        </Card>
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Unpaid Rider Payroll</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-medium">{formatAmount(riderTotal)}</div>
            <p className="text-xs text-muted-foreground mt-1">Based on {totalDeliveryFees > 0 ? formatAmount(totalDeliveryFees) : "0"} delivery fees</p>
          </CardContent>
        </Card>
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Unpaid Exec Payroll</CardTitle>
            <ShieldAlert className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-medium">{formatAmount(execTotal)}</div>
            <p className="text-xs text-muted-foreground mt-1">Based on {totalRevenue > 0 ? formatAmount(totalRevenue) : "0"} total company revenue</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="riders">
        <TabsList className="w-full flex-wrap justify-start h-auto">
          <TabsTrigger value="riders">Riders Payroll</TabsTrigger>
          <TabsTrigger value="execs">Executives Payroll</TabsTrigger>
          <TabsTrigger value="secretaries">Secretaries Payroll</TabsTrigger>
          {canEditSettings && <TabsTrigger value="settings">Salary Settings</TabsTrigger>}
        </TabsList>

        <TabsContent value="riders" className="mt-4">
          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rider Name</TableHead>
                  <TableHead>Base Pay</TableHead>
                  <TableHead>Commission ({config?.riderComm}%)</TableHead>
                  <TableHead>Adjs/Adv</TableHead>
                  <TableHead>Total Pay</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {calculatedRiderPayrolls.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.employeeName}</TableCell>
                    <TableCell>{formatAmount(p.basePay)}</TableCell>
                    <TableCell>{formatAmount(p.commissionEarned)}</TableCell>
                    <TableCell>
                      {p.bonus ? <div className="text-xs text-green-600">+B: {formatAmount(p.bonus)}</div> : null}
                      {p.deduction ? <div className="text-xs text-red-600">-D: {formatAmount(p.deduction)}</div> : null}
                      {p.advancePaid ? <div className="text-xs text-blue-600">-Adv: {formatAmount(p.advancePaid)}</div> : null}
                    </TableCell>
                    <TableCell className="font-bold">
                      <div>{formatAmount(p.totalPay)}</div>
                      {p.advancePaid ? <div className="text-xs text-muted-foreground">Rem: {formatAmount(p.totalPay - p.advancePaid)}</div> : null}
                    </TableCell>
                    <TableCell>
                      <Badge variant={p.status === "paid" ? "success" : "secondary"}>
                        {p.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {p.status !== "paid" ? (
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleAdjust(p)}>Adjust</Button>
                          <Button size="sm" onClick={() => handleMarkAsPaid(p)}>
                            <CheckCircle2 className="h-4 w-4 mr-1" /> Pay
                          </Button>
                        </div>
                      ) : (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 h-8 w-8">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Payroll Record?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this paid payroll record? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => handleDeletePayroll(p)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="execs" className="mt-4">
          <Card className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Executive</TableHead>
                  <TableHead>Base Pay</TableHead>
                  <TableHead>Commission</TableHead>
                  <TableHead>Adjs/Adv</TableHead>
                  <TableHead>Total Pay</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {calculatedExecPayrolls.map(p => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="font-medium">{p.employeeName}</div>
                      <div className="text-xs text-muted-foreground">{p.role}</div>
                    </TableCell>
                    <TableCell>{formatAmount(p.basePay)}</TableCell>
                    <TableCell>{formatAmount(p.commissionEarned)}</TableCell>
                    <TableCell>
                      {p.bonus ? <div className="text-xs text-green-600">+B: {formatAmount(p.bonus)}</div> : null}
                      {p.deduction ? <div className="text-xs text-red-600">-D: {formatAmount(p.deduction)}</div> : null}
                      {p.advancePaid ? <div className="text-xs text-blue-600">-Adv: {formatAmount(p.advancePaid)}</div> : null}
                    </TableCell>
                    <TableCell className="font-bold">
                      <div>{formatAmount(p.totalPay)}</div>
                      {p.advancePaid ? <div className="text-xs text-muted-foreground">Rem: {formatAmount(p.totalPay - p.advancePaid)}</div> : null}
                    </TableCell>
                    <TableCell>
                      <Badge variant={p.status === "paid" ? "success" : "secondary"}>
                        {p.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {p.status !== "paid" ? (
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleAdjust(p)}>Adjust</Button>
                          <Button size="sm" onClick={() => handleMarkAsPaid(p)}>
                            <CheckCircle2 className="h-4 w-4 mr-1" /> Pay
                          </Button>
                        </div>
                      ) : (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 h-8 w-8">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Payroll Record?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this paid payroll record? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => handleDeletePayroll(p)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="secretaries" className="mt-4">
          <Card className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Secretary Name</TableHead>
                  <TableHead>Base Pay</TableHead>
                  <TableHead>Commission ({config?.secretaryComm}%)</TableHead>
                  <TableHead>Adjs/Adv</TableHead>
                  <TableHead>Total Pay</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {calculatedSecretaryPayrolls.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.employeeName}</TableCell>
                    <TableCell>{formatAmount(p.basePay)}</TableCell>
                    <TableCell>{formatAmount(p.commissionEarned)}</TableCell>
                    <TableCell>
                      {p.bonus ? <div className="text-xs text-green-600">+B: {formatAmount(p.bonus)}</div> : null}
                      {p.deduction ? <div className="text-xs text-red-600">-D: {formatAmount(p.deduction)}</div> : null}
                      {p.advancePaid ? <div className="text-xs text-blue-600">-Adv: {formatAmount(p.advancePaid)}</div> : null}
                    </TableCell>
                    <TableCell className="font-bold">
                      <div>{formatAmount(p.totalPay)}</div>
                      {p.advancePaid ? <div className="text-xs text-muted-foreground">Rem: {formatAmount(p.totalPay - p.advancePaid)}</div> : null}
                    </TableCell>
                    <TableCell>
                      <Badge variant={p.status === "paid" ? "success" : "secondary"}>
                        {p.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {p.status !== "paid" ? (
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleAdjust(p)}>Adjust</Button>
                          <Button size="sm" onClick={() => handleMarkAsPaid(p)}>
                            <CheckCircle2 className="h-4 w-4 mr-1" /> Pay
                          </Button>
                        </div>
                      ) : (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 h-8 w-8">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Payroll Record?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this paid payroll record? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => handleDeletePayroll(p)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {canEditSettings && draftConfig && (
          <TabsContent value="settings" className="mt-4">
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
              <Card className="overflow-x-auto">
                <CardHeader>
                  <CardTitle>Rider Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Base Pay (₦)</label>
                    <Input 
                      type="number" 
                      value={draftConfig.riderBase} 
                      onChange={e => setDraftConfig({...draftConfig, riderBase: Number(e.target.value)})} 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Commission % (from Delivery Fees)</label>
                    <Input 
                      type="number" step="0.1"
                      value={draftConfig.riderComm} 
                      onChange={e => setDraftConfig({...draftConfig, riderComm: Number(e.target.value)})} 
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="overflow-x-auto">
                <CardHeader>
                  <CardTitle>Secretary Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Base Pay (₦)</label>
                    <Input 
                      type="number" 
                      value={draftConfig.secretaryBase} 
                      onChange={e => setDraftConfig({...draftConfig, secretaryBase: Number(e.target.value)})} 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Commission % (from Delivery Fees)</label>
                    <Input 
                      type="number" step="0.1"
                      value={draftConfig.secretaryComm} 
                      onChange={e => setDraftConfig({...draftConfig, secretaryComm: Number(e.target.value)})} 
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="overflow-x-auto">
                <CardHeader>
                  <CardTitle>CEO Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Base Pay (₦)</label>
                    <Input 
                      type="number" 
                      value={draftConfig.ceoBase} 
                      onChange={e => setDraftConfig({...draftConfig, ceoBase: Number(e.target.value)})} 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Commission % (from Total Revenue)</label>
                    <Input 
                      type="number" step="0.1"
                      value={draftConfig.ceoComm} 
                      onChange={e => setDraftConfig({...draftConfig, ceoComm: Number(e.target.value)})} 
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="overflow-x-auto">
                <CardHeader>
                  <CardTitle>CFO Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Base Pay (₦)</label>
                    <Input 
                      type="number" 
                      value={draftConfig.cfoBase} 
                      onChange={e => setDraftConfig({...draftConfig, cfoBase: Number(e.target.value)})} 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Commission % (from Total Revenue)</label>
                    <Input 
                      type="number" step="0.1"
                      value={draftConfig.cfoComm} 
                      onChange={e => setDraftConfig({...draftConfig, cfoComm: Number(e.target.value)})} 
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>CTO Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 max-w-md">
                    <label className="text-sm font-medium">Base Pay (₦)</label>
                    <Input 
                      type="number" 
                      value={draftConfig.ctoBase} 
                      onChange={e => setDraftConfig({...draftConfig, ctoBase: Number(e.target.value)})} 
                    />
                  </div>
                  <div className="space-y-2 max-w-md">
                    <label className="text-sm font-medium">Commission % (from Total Revenue)</label>
                    <Input 
                      type="number" step="0.1"
                      value={draftConfig.ctoComm} 
                      onChange={e => setDraftConfig({...draftConfig, ctoComm: Number(e.target.value)})} 
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="mt-6 flex justify-end">
              <Button onClick={handleSaveSettings} disabled={savingSettings} size="lg" className="gap-2">
                <Save className="h-4 w-4" /> {savingSettings ? "Saving..." : "Save All Salary Settings"}
              </Button>
            </div>
          </TabsContent>
        )}
      </Tabs>
      
      <Dialog open={!!payingPayroll} onOpenChange={(val) => !val && setPayingPayroll(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Salary Payout</DialogTitle>
            <DialogDescription>
              This will disburse funds for <strong>{payingPayroll?.employeeName}</strong> for {payingPayroll?.monthYear}, deduct the amount from your books, and notify the executives.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Amount to Pay (₦)</label>
              <Input 
                type="number" 
                value={amountToPay || ''} 
                onChange={(e) => setAmountToPay(Number(e.target.value))}
                max={(payingPayroll?.totalPay || 0) - (payingPayroll?.advancePaid || 0)}
              />
              <p className="text-xs text-muted-foreground">Total remaining balance: {formatAmount((payingPayroll?.totalPay || 0) - (payingPayroll?.advancePaid || 0))}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Payment Method</label>
              <Select value={paymentMethod} onValueChange={(val: any) => setPaymentMethod(val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">Cash (Cash Book)</SelectItem>
                  <SelectItem value="Transfer">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {paymentMethod === "Transfer" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Source Bank Account</label>
                <Select value={selectedBankId} onValueChange={setSelectedBankId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select bank account" />
                  </SelectTrigger>
                  <SelectContent>
                    {bankAccounts.map(b => (
                      <SelectItem key={b.id} value={b.id}>{b.bankName} - {b.accountName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayingPayroll(null)}>Cancel</Button>
            <Button disabled={processingId === payingPayroll?.id} onClick={handleConfirmPay}>
              {processingId === payingPayroll?.id ? "Processing..." : "Confirm & Pay"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={!!adjustingPayroll} onOpenChange={(val) => !val && setAdjustingPayroll(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Salary</DialogTitle>
            <DialogDescription>
              Add a bonus or deduction for <strong>{adjustingPayroll?.employeeName}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-green-600">Bonus (₦)</label>
              <Input 
                type="number" 
                value={bonus || ''} 
                onChange={(e) => setBonus(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-red-600">Deduction (₦)</label>
              <Input 
                type="number" 
                value={deduction || ''} 
                onChange={(e) => setDeduction(Number(e.target.value))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustingPayroll(null)}>Cancel</Button>
            <Button disabled={processingId === adjustingPayroll?.id} onClick={handleSaveAdjustments}>
              {processingId === adjustingPayroll?.id ? "Saving..." : "Save Adjustments"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
