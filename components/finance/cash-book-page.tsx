"use client"
import { useState, useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Plus, Download, Filter, Wallet, TrendingUp, Activity, Search, Trash2 } from 'lucide-react'
import { getFinanceSettings, getCashTransactions, addCashTransaction, deleteCashTransaction } from '@/lib/firebase/finance'
import { formatNGN, buildRunningBalance, filterByDateRange, filterBySearch, startOfMonth, calcCashBalance } from '@/lib/finance/calculations'
import type { CashTransaction, FinanceSettings, DateRangeState } from '@/lib/finance/types'
import { useAuth } from '@/lib/auth-utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { DateRangeFilter } from '@/components/finance/shared/date-range-filter'
import { DataImporter } from '@/components/finance/shared/data-importer'
import { db } from '@/lib/firebase/config'
import { collection, addDoc, Timestamp } from 'firebase/firestore'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import { StatsCard } from '@/components/dashboard/stats-card'

const cashTxnSchema = z.object({
  date: z.string().min(1),
  type: z.enum(['cash_in','cash_out','transfer_to_bank','opening_balance_adjustment']),
  description: z.string().min(1),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  reference: z.string().optional(),
})

export function CashBookPage() {
  const { user } = useAuth()
  const [settings, setSettings] = useState<FinanceSettings | null>(null)
  const [transactions, setTransactions] = useState<CashTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [dateRange, setDateRange] = useState<DateRangeState>({ startDate: '', endDate: '' })
  const [typeFilter, setTypeFilter] = useState('all')

  const handleImportCash = async (data: any[]) => {
    for (const row of data) {
      const dateVal = row["Date"] instanceof Date ? row["Date"] : new Date(row["Date"])
      
      const typeStr = (row["Type (Cash In / Cash Out)"] || "").toString().toLowerCase()
      const typeVal = typeStr.includes("out") ? "cash_out" : "cash_in"

      const txn = {
        amount: Number(row["Amount"]) || 0,
        type: typeVal,
        description: row["Description"] || "Historical Import",
        createdBy: user?.uid || "admin",
        createdAt: Timestamp.fromDate(dateVal),
        date: Timestamp.fromDate(dateVal)
      }

      await addDoc(collection(db, "cash_transactions"), txn)
    }
    
    // Refresh
    const freshData = await getCashTransactions()
    setTransactions(freshData)
  }

  const form = useForm<z.infer<typeof cashTxnSchema>>({
    resolver: zodResolver(cashTxnSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      type: 'cash_in',
      description: '',
      amount: 0,
      reference: '',
    },
  })

  const loadData = () => {
    setLoading(true)
    Promise.all([getFinanceSettings(), getCashTransactions()])
      .then(([s, t]) => { setSettings(s); setTransactions(t) })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadData()
  }, [])

  const openingBalance = settings?.openingCashBalance ?? 0
  const withBalances = useMemo(() => buildRunningBalance(openingBalance, transactions), [openingBalance, transactions])
  const currentBalance = withBalances.length > 0 ? withBalances[withBalances.length - 1].runningBalance : openingBalance

  const monthStart = startOfMonth(new Date())
  const monthTxns = transactions.filter(t => t.date >= monthStart)
  const monthIn = monthTxns.filter(t => t.type === 'cash_in' || t.type === 'opening_balance_adjustment').reduce((sum, t) => sum + t.amount, 0)
  const monthOut = monthTxns.filter(t => t.type === 'cash_out' || t.type === 'transfer_to_bank').reduce((sum, t) => sum + t.amount, 0)

  let filtered = filterByDateRange(withBalances, dateRange.startDate, dateRange.endDate)
  filtered = filterBySearch(filtered, searchQuery, ['description', 'reference'])
  if (typeFilter !== 'all') {
    filtered = filtered.filter(t => t.type === typeFilter)
  }

  const isFiltered = searchQuery !== '' || dateRange.startDate !== '' || dateRange.endDate !== '' || typeFilter !== 'all'
  
  // Sort by date DESC for display
  const displayTxns = [...filtered].sort((a, b) => b.date.getTime() - a.date.getTime())

  const onSubmit = async (values: z.infer<typeof cashTxnSchema>) => {
    try {
      await addCashTransaction({
        date: new Date(values.date),
        description: values.description,
        amount: values.amount,
        type: values.type,
        reference: values.reference || '',
        createdBy: user?.uid || 'admin'
      })
      toast.success("Transaction recorded")
      setIsDialogOpen(false)
      form.reset()
      loadData()
    } catch (error) {
      toast.error("Failed to record transaction")
    }
  }

  const handleDeleteTransaction = async (id: string) => {
    try {
      await deleteCashTransaction(id)
      toast.success("Transaction deleted")
      loadData()
    } catch (error) {
      toast.error("Failed to delete transaction")
    }
  }

  const handleExport = () => {
    const rows = displayTxns.map(t => ({
      Date: t.date.toLocaleDateString(),
      Type: t.type,
      Description: t.description,
      'Cash In': t.type === 'cash_in' || t.type === 'opening_balance_adjustment' ? t.amount : 0,
      'Cash Out': t.type === 'cash_out' ? t.amount : 0,
      Transfer: t.type === 'transfer_to_bank' ? t.amount : 0,
      Balance: t.runningBalance,
      Reference: t.reference || ''
    }))
    
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Cash Book")
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" })
    saveAs(new Blob([wbout], { type: "application/octet-stream" }), "cash-book.xlsx")
  }

  if (loading) return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-32 w-full" /></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">Cash Book</h1>
          <p className="text-sm text-muted-foreground">Manage physical cash in the office</p>
        </div>
        <div className="flex gap-2">
          <DataImporter 
            title="Import History" 
            templateName="Historical_CashBook"
            columns={["Date", "Type (Cash In / Cash Out)", "Amount", "Description"]}
            dropdownLists={{
              "Type (Cash In / Cash Out)": ["Cash In", "Cash Out"]
            }}
            onImport={handleImportCash}
          />
          <Button onClick={() => setIsDialogOpen(true)}><Plus className="mr-2 h-4 w-4" /> Record Transaction</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatsCard title="Opening Balance" value={formatNGN(openingBalance)} icon={Wallet} color="gray" />
        <StatsCard title="Current Balance" value={formatNGN(currentBalance)} icon={TrendingUp} color={currentBalance >= 0 ? "green" : "red"} />
        <StatsCard title="Net Movement (This Month)" value={formatNGN(monthIn - monthOut)} icon={Activity} color="blue" />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="flex flex-col sm:flex-row items-center gap-4 p-4 border-b">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search description or reference..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-8 w-full" />
            </div>
            <DateRangeFilter value={dateRange} onChange={setDateRange} />
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="cash_in">Cash In</SelectItem>
                <SelectItem value="cash_out">Cash Out</SelectItem>
                <SelectItem value="transfer_to_bank">Transfer to Bank</SelectItem>
                <SelectItem value="opening_balance_adjustment">Opening Balance Adjustment</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handleExport}><Download className="mr-2 h-4 w-4" /> Export</Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Cash In</TableHead>
                <TableHead className="text-right">Cash Out</TableHead>
                <TableHead className="text-right">Transfer</TableHead>
                {!isFiltered && <TableHead className="text-right">Balance</TableHead>}
                <TableHead>Reference</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayTxns.length > 0 ? displayTxns.map((txn) => (
                <TableRow key={txn.id}>
                  <TableCell className="whitespace-nowrap">{txn.date.toLocaleDateString()}</TableCell>
                  <TableCell>{txn.description}{txn.type === 'opening_balance_adjustment' && <span className="ml-2 text-xs text-muted-foreground">(Adj)</span>}</TableCell>
                  <TableCell className="text-right text-green-600 font-medium">
                    {(txn.type === 'cash_in' || txn.type === 'opening_balance_adjustment') ? formatNGN(txn.amount) : ''}
                  </TableCell>
                  <TableCell className="text-right text-red-600 font-medium">
                    {txn.type === 'cash_out' ? formatNGN(txn.amount) : ''}
                  </TableCell>
                  <TableCell className="text-right text-blue-600 font-medium">
                    {txn.type === 'transfer_to_bank' ? formatNGN(txn.amount) : ''}
                  </TableCell>
                  {!isFiltered && (
                    <TableCell className={`text-right font-medium ${txn.runningBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatNGN(txn.runningBalance)}
                    </TableCell>
                  )}
                  <TableCell>{txn.reference}</TableCell>
                  <TableCell className="text-right">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 h-8 w-8">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Transaction?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this cash book entry? This will instantly recalculate your running cash balance.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => handleDeleteTransaction(txn.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={isFiltered ? 7 : 8} className="text-center py-6 text-muted-foreground">No transactions found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-[95vw] max-w-xl">
          <DialogHeader>
            <DialogTitle>Record Cash Transaction</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="date" render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="type" render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="cash_in">Cash In</SelectItem>
                      <SelectItem value="cash_out">Cash Out</SelectItem>
                      <SelectItem value="transfer_to_bank">Transfer to Bank</SelectItem>
                      <SelectItem value="opening_balance_adjustment">Opening Balance Adjustment</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl><Input placeholder="E.g. Daily sales, petty cash..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="amount" render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl><Input type="number" min="0.01" step="0.01" {...field} onChange={e => field.onChange(e.target.value ? Number(e.target.value) : 0)} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="reference" render={({ field }) => (
                <FormItem>
                  <FormLabel>Reference (Optional)</FormLabel>
                  <FormControl><Input placeholder="Receipt no. etc." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit">Record Transaction</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
