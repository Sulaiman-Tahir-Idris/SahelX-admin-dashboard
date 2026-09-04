"use client"
import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, CheckCircle2, XCircle, Filter, Download, Receipt, Search } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Skeleton } from '@/components/ui/skeleton'
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from '@/components/ui/pagination'
import { Progress } from '@/components/ui/progress'
import { DateRangeFilter } from '@/components/finance/shared/date-range-filter'
import { DataImporter } from '@/components/finance/shared/data-importer'
import { getExpenses, addExpense, updateExpense, updateExpenseStatus, deleteExpense, getExpenseCategories, getBankAccounts, addBankTransaction, addCashTransaction } from '@/lib/firebase/finance'
import { formatNGN, filterByDateRange, filterBySearch, calcDepartmentBreakdown, calcCategoryTotals, startOfMonth, sumExpenses } from '@/lib/finance/calculations'
import type { Expense, ExpenseCategory, Department, DateRangeState, BankAccount } from '@/lib/finance/types'
import { DEPARTMENTS, DEPARTMENT_COLORS, EXPENSE_PAYMENT_METHODS } from '@/lib/finance/types'
import { useAuth } from '@/lib/auth-utils'
import { useRole } from '@/lib/hooks/use-role'
import { db } from '@/lib/firebase/config'
import { collection, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore'
import { saveAs } from 'file-saver'

const expenseSchema = z.object({
  date: z.string().min(1, "Date is required"),
  department: z.enum(['Operations','Marketing','Office','Technology','Administration']),
  category: z.string().min(1, 'Select a category'),
  vendor: z.string().min(1, 'Vendor is required'),
  description: z.string().min(1, 'Description is required'),
  amount: z.coerce.number().min(1, 'Amount must be greater than 0'),
  paymentMethod: z.enum(['Cash','Transfer','Card','Cheque']),
  bankAccountId: z.string().optional(),
  notes: z.string().optional(),
})

type ExpenseFormValues = z.infer<typeof expenseSchema>

export function ExpensesPage() {
  const { user } = useAuth ? useAuth() : { user: null }
  
  const role = useRole()
  const isAdmin = role === 'ceo' || role === 'cfo' || role === 'cto' || role === 'admin'

  const [expenses, setExpenses] = useState<Expense[]>([])
  const [categories, setCategories] = useState<ExpenseCategory[]>([])
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [search, setSearch] = useState('')
  const [dateRange, setDateRange] = useState<DateRangeState>({ startDate: '', endDate: '' })

  const handleImportExpenses = async (data: any[]) => {
    for (const row of data) {
      const dateVal = row["Date"] instanceof Date ? row["Date"] : new Date(row["Date"])
      
      const expense = {
        amount: Number(row["Amount"]) || 0,
        category: row["Category"] || "Other",
        department: row["Department"] || "Administration",
        description: row["Description"] || "Historical Import",
        paymentMethod: row["Payment Method"] || "Cash",
        vendor: row["Vendor"] || "Unknown Vendor",
        status: "approved",
        createdBy: user?.uid || "admin",
        createdAt: Timestamp.fromDate(dateVal),
        date: Timestamp.fromDate(dateVal)
      }

      await addDoc(collection(db, "expenses"), expense)
    }
    
    // Refresh
    const freshData = await getExpenses()
    setExpenses(freshData)
  }

  const [filterDept, setFilterDept] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [page, setPage] = useState(1)
  
  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'add'|'edit'>('add')
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      department: 'Operations',
      category: '',
      vendor: '',
      description: '',
      amount: 0,
      paymentMethod: 'Transfer',
      bankAccountId: 'none',
      notes: ''
    }
  })

  const selectedDept = form.watch('department')
  const availableCategories = categories.filter(c => c.department === selectedDept)

  const loadData = async () => {
    setLoading(true)
    try {
      const [expData, catData, bankData] = await Promise.all([getExpenses(), getExpenseCategories(), getBankAccounts()])
      setExpenses(expData)
      setCategories(catData)
      setBankAccounts(bankData)
    } catch (err) {
      console.error(err)
      toast.error('Failed to load expenses')
    }
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleOpenAdd = () => {
    setDialogMode('add')
    setEditingExpense(null)
    form.reset({
      date: new Date().toISOString().split('T')[0],
      department: 'Operations',
      category: '',
      vendor: '',
      description: '',
      amount: 0,
      paymentMethod: 'Transfer',
      bankAccountId: 'none',
      notes: ''
    })
    setIsDialogOpen(true)
  }

  const handleOpenEdit = (expense: Expense) => {
    setDialogMode('edit')
    setEditingExpense(expense)
    form.reset({
      date: new Date(expense.date).toISOString().split('T')[0],
      department: expense.department,
      category: expense.category,
      vendor: expense.vendor,
      description: expense.description,
      amount: expense.amount,
      paymentMethod: expense.paymentMethod,
      bankAccountId: expense.bankAccountId || 'none',
      notes: expense.notes || ''
    })
    setIsDialogOpen(true)
  }

  const onSubmit = async (values: ExpenseFormValues) => {
    try {
      const payload: any = {
        ...values,
        date: new Date(values.date)
      }
      if (payload.bankAccountId === 'none') {
        delete payload.bankAccountId
      }

      if (dialogMode === 'add') {
        const expId = await addExpense({
          ...payload,
          status: 'approved',
          createdBy: user?.uid || 'system'
        })
        
        // Auto deduct
        if (payload.paymentMethod === 'Cash') {
          await addCashTransaction({
            date: payload.date,
            description: `Expense: ${payload.description}`,
            amount: payload.amount,
            type: 'cash_out',
            reference: `EXP-${expId.slice(-6).toUpperCase()}`,
            createdBy: user?.uid ?? 'system'
          })
        } else if (payload.bankAccountId) {
          await addBankTransaction(payload.bankAccountId, {
            date: payload.date,
            description: `Expense: ${payload.description}`,
            credit: 0,
            debit: payload.amount,
            reference: `EXP-${expId.slice(-6).toUpperCase()}`,
            createdBy: user?.uid ?? 'system'
          })
        }

        toast.success('Expense recorded and deducted')
      } else if (editingExpense) {
        await updateExpense(editingExpense.id, payload)
        toast.success('Expense updated')
      }
      setIsDialogOpen(false)
      loadData()
    } catch (err) {
      toast.error('Failed to save expense')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const expense = expenses.find(e => e.id === id);
      if (expense) {
        if (expense.paymentMethod === 'Cash') {
          await addCashTransaction({
            date: new Date(),
            description: `Refund for Deleted Expense: ${expense.description}`,
            amount: expense.amount,
            type: 'cash_in',
            reference: `REFUND-EXP-${expense.id.slice(-6).toUpperCase()}`,
            createdBy: user?.uid ?? 'system'
          })
        } else if (expense.bankAccountId) {
          await addBankTransaction(expense.bankAccountId, {
            date: new Date(),
            description: `Refund for Deleted Expense: ${expense.description}`,
            credit: expense.amount,
            debit: 0,
            reference: `REFUND-EXP-${expense.id.slice(-6).toUpperCase()}`,
            createdBy: user?.uid ?? 'system'
          })
        }
      }
      await deleteExpense(id)
      toast.success('Expense deleted and refunded')
      loadData()
    } catch (err) {
      toast.error('Failed to delete expense')
    }
  }

  const handleExport = async () => {
    const XLSX = await import('xlsx-js-style')
    const summaryWb = XLSX.utils.book_new()
    
    // Summary
    const deptTotals = calcDepartmentBreakdown(expenses)
    const wsSummary = XLSX.utils.json_to_sheet(deptTotals)
    XLSX.utils.book_append_sheet(summaryWb, wsSummary, 'Summary')
    
    // Expenses
    const exportRows = filteredExpenses.map(e => ({
      Date: new Date(e.date).toLocaleDateString(),
      Department: e.department,
      Category: e.category,
      Vendor: e.vendor,
      Description: e.description,
      Amount: e.amount,
      Method: e.paymentMethod,
      Status: e.status
    }))
    const wsExpenses = XLSX.utils.json_to_sheet(exportRows)
    XLSX.utils.book_append_sheet(summaryWb, wsExpenses, 'Expenses')
    
    const wbout = XLSX.write(summaryWb, { bookType: 'xlsx', type: 'array' })
    try {
      saveAs(new Blob([wbout], { type: 'application/octet-stream' }), `Expenses_Report_${new Date().toISOString().split('T')[0]}.xlsx`)
    } catch {
      (window as any).location.href = URL.createObjectURL(new Blob([wbout]))
    }
  }

  const filteredExpenses = filterBySearch(
    filterByDateRange(expenses, dateRange.startDate, dateRange.endDate),
    search,
    ['vendor', 'description', 'category']
  ).filter(e => filterDept === 'all' || e.department === filterDept)
   .filter(e => filterStatus === 'all' || e.status === filterStatus)

  const ITEMS_PER_PAGE = 10
  const totalPages = Math.ceil(filteredExpenses.length / ITEMS_PER_PAGE)
  const paginatedExpenses = filteredExpenses.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  const thisMonthExpenses = sumExpenses(expenses.filter(e => new Date(e.date) >= startOfMonth(new Date())))
  const pendingApprovals = expenses.filter(e => e.status === 'pending').length
  const approvedThisMonth = expenses.filter(e => e.status === 'approved' && new Date(e.date) >= startOfMonth(new Date())).length
  const deptBreakdown = calcDepartmentBreakdown(expenses.filter(e => new Date(e.date) >= startOfMonth(new Date())))
  const topDepartment = deptBreakdown.length > 0 ? deptBreakdown[0].department : 'N/A'

  return (
    <div className="space-y-6 overflow-hidden">
      <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Expenses</h1>
              <p className="text-sm text-muted-foreground">Track and manage all company expenses</p>
            </div>
            <div className="flex gap-2">
              <DataImporter 
                title="Import History" 
                templateName="Historical_Expenses"
                columns={["Date", "Department", "Category", "Vendor", "Description", "Amount", "Payment Method"]}
                dropdownLists={{
                  "Department": [...DEPARTMENTS],
                  "Payment Method": [...EXPENSE_PAYMENT_METHODS],
                  "Category": categories.map(c => c.name)
                }}
                onImport={handleImportExpenses}
              />
              <Button onClick={handleOpenAdd}><Plus className="mr-2 h-4 w-4" /> Add Expense</Button>
            </div>
          </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNGN(thisMonthExpenses)}</div>
          </CardContent>
        </Card>
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingApprovals}</div>
          </CardContent>
        </Card>
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedThisMonth}</div>
          </CardContent>
        </Card>
          <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 min-w-0">
              <CardTitle className="text-sm font-medium truncate">Top Department</CardTitle>
            </CardHeader>
            <CardContent className="min-w-0">
              <div className="text-2xl font-bold truncate" title={topDepartment || ''}>{topDepartment}</div>
            </CardContent>
          </Card>
      </div>

      <Tabs defaultValue="all">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
          <TabsList className="w-full flex-wrap justify-start h-auto">
            <TabsTrigger value="all">All Expenses</TabsTrigger>
            <TabsTrigger value="by-department">By Department</TabsTrigger>
            <TabsTrigger value="by-category">By Category</TabsTrigger>
          </TabsList>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-48">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-9" />
            </div>
            <DateRangeFilter value={dateRange} onChange={setDateRange} />
            <Select value={filterDept} onValueChange={setFilterDept}>
              <SelectTrigger className="w-[140px] h-9">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Depts</SelectItem>
                {DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[130px] h-9">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={handleExport} className="h-9">
              <Download className="mr-2 h-4 w-4" /> Export
            </Button>
          </div>
        </div>

        <TabsContent value="all" className="space-y-4">
          <Card className="overflow-hidden">
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Loading expenses...</TableCell></TableRow>
                  ) : paginatedExpenses.length > 0 ? (
                    paginatedExpenses.map(expense => (
                      <TableRow key={expense.id}>
                        <TableCell className="whitespace-nowrap">{new Date(expense.date).toLocaleDateString('en-GB')}</TableCell>
                        <TableCell>
                          <Badge variant="outline" style={{ color: DEPARTMENT_COLORS[expense.department], borderColor: DEPARTMENT_COLORS[expense.department] }}>
                            {expense.department}
                          </Badge>
                        </TableCell>
                        <TableCell>{expense.category}</TableCell>
                        <TableCell>{expense.vendor}</TableCell>
                        <TableCell className="max-w-[200px] truncate" title={expense.description}>{expense.description}</TableCell>
                        <TableCell className="font-medium">{formatNGN(expense.amount)}</TableCell>
                        <TableCell>{expense.paymentMethod}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={
                            expense.status === 'approved' ? 'bg-green-100 text-green-800 border-green-200' :
                            expense.status === 'rejected' ? 'bg-red-100 text-red-800 border-red-200' :
                            'bg-amber-100 text-amber-800 border-amber-200'
                          }>
                            {expense.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {isAdmin && (
                              <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(expense)} title="Edit">
                                <Pencil className="h-4 w-4" />
                              </Button>
                            )}
                            {isAdmin && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700" title="Delete">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Expense?</AlertDialogTitle>
                                    <AlertDialogDescription>This action cannot be undone. The amount will be refunded to the appropriate account.</AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(expense.id)}>Delete</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">No expenses found.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          {totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious onClick={() => setPage(p => Math.max(1, p - 1))} className={page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'} />
                </PaginationItem>
                <PaginationItem>
                  <span className="text-sm text-muted-foreground mx-4">Page {page} of {totalPages}</span>
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext onClick={() => setPage(p => Math.min(totalPages, p + 1))} className={page === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'} />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </TabsContent>

        <TabsContent value="by-department" className="space-y-4">
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {DEPARTMENTS.map(dept => {
              const deptExpenses = expenses.filter(e => e.department === dept && e.status !== 'rejected')
              const total = sumExpenses(deptExpenses)
              const thisMonth = sumExpenses(deptExpenses.filter(e => new Date(e.date) >= startOfMonth(new Date())))
              const pct = thisMonthExpenses > 0 ? (thisMonth / thisMonthExpenses) * 100 : 0
              return (
                <Card key={dept}>
                  <CardHeader>
                    <CardTitle style={{ color: DEPARTMENT_COLORS[dept] }}>{dept}</CardTitle>
                    <CardDescription>{formatNGN(thisMonth)} this month</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span>% of total spend</span>
                          <span>{pct.toFixed(1)}%</span>
                        </div>
                        <Progress value={pct} />
                      </div>
                      <div className="text-sm font-medium mt-4">Total All-Time: {formatNGN(total)}</div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="by-category" className="space-y-4">
          <Card className="overflow-hidden">
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead className="text-right">Total Amount</TableHead>
                    <TableHead className="text-right"># Entries</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(
                    expenses.filter(e => e.status !== 'rejected').reduce((acc, curr) => {
                      const key = `${curr.category}||${curr.department}`;
                      if (!acc[key]) acc[key] = { category: curr.category, department: curr.department, amount: 0, count: 0 }
                      acc[key].amount += curr.amount;
                      acc[key].count += 1;
                      return acc;
                    }, {} as Record<string, { category: string, department: string, amount: number, count: number }>)
                  ).map(([key, data]) => (
                    <TableRow key={key}>
                      <TableCell className="font-medium">{data.category}</TableCell>
                      <TableCell>
                        <Badge variant="outline" style={{ color: DEPARTMENT_COLORS[data.department as Department], borderColor: DEPARTMENT_COLORS[data.department as Department] }}>
                          {data.department}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">{formatNGN(data.amount)}</TableCell>
                      <TableCell className="text-right">{data.count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-2xl md:w-full">
          <DialogHeader>
            <DialogTitle>{dialogMode === 'add' ? 'Add Expense' : 'Edit Expense'}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="date" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="department" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department</FormLabel>
                    <Select onValueChange={(val) => { field.onChange(val); form.setValue('category', ''); }} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select dept" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="category" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={!selectedDept}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={selectedDept ? "Select category" : "Select dept first"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableCategories.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="paymentMethod" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Method</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {EXPENSE_PAYMENT_METHODS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="bankAccountId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Paid From Bank (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || 'none'}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select bank account" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">None (Cash / Other)</SelectItem>
                        {bankAccounts.map(b => (
                          <SelectItem key={b.id} value={b.id}>
                            {b.bankName} - {b.accountName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="vendor" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vendor / Payee</FormLabel>
                    <FormControl><Input placeholder="Vendor name" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              
              <FormField control={form.control} name="amount" render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount (₦)</FormLabel>
                  <FormControl><Input type="number" min={0} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl><Textarea placeholder="What was this expense for?" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              
              <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl><Textarea placeholder="Additional notes" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit">{dialogMode === 'add' ? 'Submit Expense' : 'Save Changes'}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
