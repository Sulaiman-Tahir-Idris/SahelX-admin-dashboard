"use client"

import { useState, useEffect, useMemo } from "react"
import { useAuth } from "@/lib/auth-utils"
import { useRole } from "@/lib/hooks/use-role"
import { getPayrollRecords, savePayrollRecord, markPayrollAsPaid, deletePayrollRecord, type PayrollRecord } from "@/lib/firebase/salary"
import { getAllStaff } from "@/lib/firebase/staff"
import type { StaffProfile } from "@/lib/finance/types"
import { getBankAccounts, addExpense, addCashTransaction, addBankTransaction, getExpenses, deleteExpense } from "@/lib/firebase/finance"
import { db } from "@/lib/firebase/config"
import { collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Banknote, Download, CheckCircle2, Trash2 } from "lucide-react"

import { useCurrency } from "@/components/providers/currency-provider"
import type { BankAccount } from "@/lib/finance/types"

export function SalaryPage() {
  const { formatAmount } = useCurrency()
  const { user } = useAuth()
  const role = useRole()

  const [loading, setLoading] = useState(true)
  
  // State for Month Selection (YYYY-MM format)
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })

  // Data State
  const [staffList, setStaffList] = useState<StaffProfile[]>([])
  const [deliveries, setDeliveries] = useState<any[]>([])
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])

  // Payment UI State
  const [payingPayroll, setPayingPayroll] = useState<PayrollRecord | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<"Cash" | "Transfer">("Cash")
  const [selectedBankId, setSelectedBankId] = useState<string>("")
  const [payrolls, setPayrolls] = useState<PayrollRecord[]>([])
  
  const [processingId, setProcessingId] = useState<string | null>(null)
  
  // Advanced Payroll State
  const [adjustingPayroll, setAdjustingPayroll] = useState<PayrollRecord | null>(null)
  const [bonus, setBonus] = useState(0)
  const [deduction, setDeduction] = useState(0)
  const [amountToPay, setAmountToPay] = useState(0)

  useEffect(() => {
    fetchInitialData()
  }, [])

  useEffect(() => {
    fetchMonthlyData(selectedMonth)
  }, [selectedMonth])

  const fetchInitialData = async () => {
    try {
      const [staff, banks] = await Promise.all([
        getAllStaff(),
        getBankAccounts()
      ])
      setStaffList(staff)
      setBankAccounts(banks)
    } catch (e) {
      toast.error("Failed to load staff or bank accounts")
      setLoading(false)
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

      // 2. Fetch Existing Payrolls for the month
      const pr = await getPayrollRecords(monthYear)
      setPayrolls(pr)

    } catch (e) {
      toast.error("Failed to load monthly data")
    } finally {
      setLoading(false)
    }
  }

  // ─── CALCULATIONS ────────────────────────────────────────────────────────

  const calculatedPayrolls = useMemo(() => {
    return staffList.map(staff => {
      const basePay = staff.baseSalary || 0
      let commissionEarned = 0

      if (staff.role === 'rider' || staff.role === 'courier') {
        const myDeliveries = deliveries.filter(d => d.courierId === staff.id)
        const totalDeliveryFees = myDeliveries.reduce((acc, d) => acc + (Number(d.cost) || 0), 0)
        commissionEarned = (totalDeliveryFees * (staff.commissionRate || 0)) / 100
      }

      const existing = payrolls.find(p => p.employeeId === staff.id)
      const b = existing?.bonus || 0
      const d = existing?.deduction || 0
      const adv = existing?.advancePaid || 0
      
      const totalPay = basePay + commissionEarned + b - d
      const remaining = totalPay - adv
      
      let status = existing?.status || "unpaid"
      if (adv > 0) {
        status = remaining <= 0 ? "paid" : "partial"
      }
      
      return {
        id: existing?.id || `draft_${staff.id}`,
        monthYear: selectedMonth,
        role: staff.role,
        employeeId: staff.id,
        employeeName: staff.name || "Unknown",
        basePay,
        commissionEarned,
        bonus: b,
        deduction: d,
        advancePaid: adv,
        totalPay,
        status: status as "unpaid" | "partial" | "paid",
        updatedAt: existing?.updatedAt
      }
    })
  }, [staffList, deliveries, payrolls, selectedMonth])

  const grandTotal = calculatedPayrolls.filter(p => p.status !== "paid").reduce((sum, p) => sum + (p.totalPay - (p.advancePaid || 0)), 0)

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
            createdBy: user?.id ?? 'system'
          })
        } else if (relatedExpense.bankAccountId) {
          await addBankTransaction(relatedExpense.bankAccountId, {
            date: new Date(),
            description: `Refund for Deleted Salary: ${relatedExpense.description}`,
            credit: relatedExpense.amount,
            debit: 0,
            reference: `REFUND-EXP-${relatedExpense.id.slice(-6).toUpperCase()}`,
            createdBy: user?.id ?? 'system'
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
        createdBy: user?.id ?? "system"
      })

      // 2. Automatically deduct funds
      if (paymentMethod === "Cash") {
        await addCashTransaction({
          date: new Date(),
          description: desc,
          amount: amountToPay,
          type: "cash_out",
          reference: "Payroll Auto",
          createdBy: user?.id ?? "system"
        })
      } else {
        await addBankTransaction(selectedBankId, {
          date: new Date(),
          description: desc,
          amount: amountToPay,
          type: "withdrawal",
          reference: "Payroll Auto",
          createdBy: user?.id ?? "system"
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
        senderId: user?.id ?? "system",
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

  const handleExport = async () => {
    const XLSX = await import('xlsx-js-style')
    const ws = XLSX.utils.json_to_sheet(calculatedPayrolls.map(p => ({
      "Role": p.role,
      "Name": p.employeeName,
      "Base Pay": p.basePay,
      "Commission": p.commissionEarned,
      "Bonus": p.bonus || 0,
      "Deduction": p.deduction || 0,
      "Advance": p.advancePaid || 0,
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
      </div>

      <Card className="overflow-hidden mt-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Staff Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Base Pay</TableHead>
              <TableHead>Commission</TableHead>
              <TableHead>Adjs/Adv</TableHead>
              <TableHead>Total Pay</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {calculatedPayrolls.map(p => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.employeeName}</TableCell>
                <TableCell className="capitalize">{p.role}</TableCell>
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

      {/* PAY DIALOG */}
      <Dialog open={!!payingPayroll} onOpenChange={open => !open && setPayingPayroll(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Make Payroll Payment</DialogTitle>
            <DialogDescription>
              Record a payment for {payingPayroll?.employeeName}. 
              <br/>Remaining balance: <b>{payingPayroll ? formatAmount(payingPayroll.totalPay - (payingPayroll.advancePaid || 0)) : ''}</b>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Payment Method</label>
              <Select value={paymentMethod} onValueChange={(val: any) => setPaymentMethod(val)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">Cash (Deducts from Cash Book)</SelectItem>
                  <SelectItem value="Transfer">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {paymentMethod === "Transfer" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">From Bank Account</label>
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
            <div className="space-y-2">
              <label className="text-sm font-medium">Amount to Pay</label>
              <Input 
                type="number" 
                value={amountToPay || ""} 
                onChange={e => setAmountToPay(Number(e.target.value))} 
              />
              <p className="text-xs text-muted-foreground">
                Enter an amount less than the balance to record a partial advance.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayingPayroll(null)}>Cancel</Button>
            <Button onClick={handleConfirmPay} disabled={!!processingId}>
              {processingId === payingPayroll?.id ? "Processing..." : "Confirm Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ADJUST DIALOG */}
      <Dialog open={!!adjustingPayroll} onOpenChange={open => !open && setAdjustingPayroll(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Payroll</DialogTitle>
            <DialogDescription>Add a bonus or deduction for {adjustingPayroll?.employeeName}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Bonus Amount</label>
              <Input type="number" value={bonus || ""} onChange={e => setBonus(Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Deduction Amount</label>
              <Input type="number" value={deduction || ""} onChange={e => setDeduction(Number(e.target.value))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustingPayroll(null)}>Cancel</Button>
            <Button onClick={handleSaveAdjustments} disabled={!!processingId}>
              {processingId ? "Saving..." : "Save Adjustments"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}
