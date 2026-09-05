"use client"
import { useState, useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Plus, Building2, X, Download, Filter, Search, Trash2, Pencil } from 'lucide-react'
import { getBankAccounts, addBankAccount, updateBankAccount, deleteBankAccount, getBankTransactions, addBankTransaction, deleteBankTransaction } from '@/lib/firebase/finance'
import { formatNGN, calcBankBalance, buildBankRunningBalance, filterByDateRange, filterBySearch } from '@/lib/finance/calculations'
import type { BankAccount, BankTransaction, DateRangeState } from '@/lib/finance/types'
import { useAuth } from '@/lib/auth-utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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

import { saveAs } from 'file-saver'

const addAccountSchema = z.object({
  bankName: z.string().min(1, 'Bank name is required'),
  accountName: z.string().min(1, 'Account name is required'),
  accountNumber: z.string().min(1, 'Account number is required'),
  openingBalance: z.number().min(0),
})

const addTxnSchema = z.object({
  date: z.string().min(1),
  type: z.enum(['Credit', 'Debit']),
  description: z.string().min(1),
  amount: z.number().min(0.01),
  reference: z.string().optional(),
})

export function BankAccountsPage() {
  const { user } = useAuth()
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null)
  const [transactions, setTransactions] = useState<BankTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [txnLoading, setTxnLoading] = useState(false)
  
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false)
  const [isEditAccountOpen, setIsEditAccountOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null)
  const [isAddTxnOpen, setIsAddTxnOpen] = useState(false)

  const [searchQuery, setSearchQuery] = useState('')
  const [dateRange, setDateRange] = useState<DateRangeState>({ startDate: '', endDate: '' })

  const handleImportBank = async (data: any[]) => {
    for (const row of data) {
      const dateVal = row["Date"] instanceof Date ? row["Date"] : new Date(row["Date"])
      
      const typeStr = (row["Type (Money In / Money Out)"] || "").toString().toLowerCase()
      const amt = Number(row["Amount"]) || 0
      const isCredit = typeStr.includes("in")
      
      // Auto register the bank account if it doesn't exist
      const bankName = row["Bank Name"] || "Unknown Bank"
      let acc = accounts.find(a => a.bankName === bankName)
      if (!acc) {
        const id = await addBankAccount({ bankName, accountNumber: "HISTORICAL", accountName: "Historical Import", openingBalance: 0 })
        acc = { id, bankName, accountNumber: "HISTORICAL", accountName: "Historical Import", openingBalance: 0, createdAt: new Date() }
        setAccounts(prev => [...prev, acc!])
      }

      const txn = {
        accountId: acc.id,
        credit: isCredit ? amt : 0,
        debit: !isCredit ? amt : 0,
        description: row["Description"] || "Historical Import",
        reference: `HIST_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        createdBy: user?.uid || "admin",
        createdAt: Timestamp.fromDate(dateVal),
        date: Timestamp.fromDate(dateVal)
      }

      await addDoc(collection(db, "bank_transactions"), txn)
    }
    
    // Refresh
    if (selectedAccount) {
      const freshData = await getBankTransactions(selectedAccount.id)
      setTransactions(freshData)
    }
  }

  const [typeFilter, setTypeFilter] = useState('all')

  const accountForm = useForm<z.infer<typeof addAccountSchema>>({
    resolver: zodResolver(addAccountSchema),
    defaultValues: { bankName: '', accountName: '', accountNumber: '', openingBalance: 0 },
  })

  const txnForm = useForm<z.infer<typeof addTxnSchema>>({
    resolver: zodResolver(addTxnSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      type: 'Credit',
      description: '',
      amount: 0,
      reference: '',
    },
  })

  const [accountBalances, setAccountBalances] = useState<Record<string, number>>({})

  const loadAccounts = async () => {
    setLoading(true)
    try {
      const accs = await getBankAccounts()
      setAccounts(accs)
      // Pre-load current balances for all accounts
      const balanceMap: Record<string, number> = {}
      await Promise.all(accs.map(async (acc) => {
        try {
          const txns = await getBankTransactions(acc.id)
          balanceMap[acc.id] = calcBankBalance(acc.openingBalance, txns)
        } catch {
          balanceMap[acc.id] = Number(acc.openingBalance) || 0
        }
      }))
      setAccountBalances(balanceMap)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAccounts()
  }, [])

  const selectAccount = (account: BankAccount) => {
    setSelectedAccount(account)
    setTxnLoading(true)
    getBankTransactions(account.id)
      .then(txns => {
        setTransactions(txns)
        // Update balance for this account in the map
        setAccountBalances(prev => ({
          ...prev,
          [account.id]: calcBankBalance(account.openingBalance, txns)
        }))
      })
      .finally(() => setTxnLoading(false))
  }

  const editAccountForm = useForm<z.infer<typeof addAccountSchema>>({
    resolver: zodResolver(addAccountSchema),
    defaultValues: { bankName: '', accountName: '', accountNumber: '', openingBalance: 0 },
  })

  const onAddAccount = async (values: z.infer<typeof addAccountSchema>) => {
    try {
      await addBankAccount({ ...values })
      toast.success("Bank account added")
      setIsAddAccountOpen(false)
      accountForm.reset()
      loadAccounts()
    } catch (error) {
      toast.error("Failed to add account")
    }
  }

  const handleOpenEdit = (account: BankAccount) => {
    setEditingAccount(account)
    editAccountForm.reset({
      bankName: account.bankName,
      accountName: account.accountName,
      accountNumber: account.accountNumber,
      openingBalance: account.openingBalance,
    })
    setIsEditAccountOpen(true)
  }

  const onEditAccount = async (values: z.infer<typeof addAccountSchema>) => {
    if (!editingAccount) return
    try {
      await updateBankAccount(editingAccount.id, { ...values })
      toast.success("Bank account updated")
      setIsEditAccountOpen(false)
      setEditingAccount(null)
      // Update local state to reflect changes
      setAccounts(prev => prev.map(a => a.id === editingAccount.id ? { ...a, ...values } : a))
      if (selectedAccount?.id === editingAccount.id) {
        setSelectedAccount(prev => prev ? { ...prev, ...values } : null)
      }
    } catch (error) {
      toast.error("Failed to update account")
    }
  }

  const handleDeleteAccount = async (accountId: string) => {
    try {
      await deleteBankAccount(accountId)
      toast.success("Bank account deleted")
      setAccounts(prev => prev.filter(a => a.id !== accountId))
      if (selectedAccount?.id === accountId) {
        setSelectedAccount(null)
        setTransactions([])
      }
    } catch (error) {
      toast.error("Failed to delete account")
    }
  }

  const onAddTxn = async (values: z.infer<typeof addTxnSchema>) => {
    if (!selectedAccount) return
    try {
      await addBankTransaction(selectedAccount.id, {
        date: new Date(values.date),
        description: values.description,
        credit: values.type === 'Credit' ? values.amount : 0,
        debit: values.type === 'Debit' ? values.amount : 0,
        reference: values.reference || '',
        createdBy: user?.uid || 'admin'
      })
      toast.success("Transaction recorded")
      setIsAddTxnOpen(false)
      txnForm.reset()
      selectAccount(selectedAccount)
    } catch (error) {
      toast.error("Failed to record transaction")
    }
  }

  const handleDeleteTransaction = async (accountId: string, txnId: string) => {
    try {
      await deleteBankTransaction(accountId, txnId)
      toast.success("Transaction deleted")
      // re-fetch
      if (selectedAccount) await selectAccount(selectedAccount)
    } catch (error) {
      toast.error("Failed to delete transaction")
    }
  }

  const currentBankBalance = selectedAccount ? calcBankBalance(selectedAccount.openingBalance, transactions) : 0
  
  const withBalances = useMemo(() => {
    if (!selectedAccount) return []
    return buildBankRunningBalance(selectedAccount.openingBalance, transactions)
  }, [selectedAccount, transactions])

  let filtered = filterByDateRange(withBalances, dateRange.startDate, dateRange.endDate)
  filtered = filterBySearch(filtered, searchQuery, ['description', 'reference'])
  if (typeFilter === 'Credit') {
    filtered = filtered.filter(t => t.credit > 0)
  } else if (typeFilter === 'Debit') {
    filtered = filtered.filter(t => t.debit > 0)
  }

  const isFiltered = searchQuery !== '' || dateRange.startDate !== '' || dateRange.endDate !== '' || typeFilter !== 'all'
  const displayTxns = [...filtered].sort((a, b) => b.date.getTime() - a.date.getTime())

  const totalOpeningBalances = accounts.reduce((sum, acc) => sum + acc.openingBalance, 0)

  if (loading) return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-32 w-full" /></div>

  return (
    <div className="space-y-6 min-w-0">
      <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">Bank Accounts</h1>
            <p className="text-sm text-muted-foreground">Manage corporate accounts and transactions</p>
          </div>
          <div className="flex gap-2">
            <DataImporter 
              title="Import History" 
              templateName="Historical_Bank"
              columns={["Date", "Bank Name", "Type (Money In / Money Out)", "Amount", "Description"]}
              dropdownLists={{
                "Type (Money In / Money Out)": ["Money In", "Money Out"]
              }}
              onImport={handleImportBank}
            />
            <Button onClick={() => setIsAddAccountOpen(true)} variant="outline"><Building2 className="mr-2 h-4 w-4" /> Add Account</Button>
            <Button onClick={() => setIsAddTxnOpen(true)}><Plus className="mr-2 h-4 w-4" /> Record Transaction</Button>
          </div>
        </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {accounts.map(account => (
          <Card key={account.id} className={`cursor-pointer hover:border-primary/50 transition-colors ${selectedAccount?.id === account.id ? 'border-primary' : ''}`} onClick={() => selectAccount(account)}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">{account.bankName}</CardTitle>
                  <CardDescription>{account.accountName}</CardDescription>
                </div>
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenEdit(account)} title="Edit account">
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50" title="Delete account">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Bank Account?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete <strong>{account.bankName} — {account.accountName}</strong>? This will remove the account record but will not delete associated transactions.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => handleDeleteAccount(account.id)}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Account No.</p>
              <p className="font-mono text-sm">{account.accountNumber}</p>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div>
                  <p className="text-xs text-muted-foreground">Opening Balance</p>
                  <p className="text-sm font-medium">{formatNGN(Number(account.openingBalance) || 0)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Current Balance</p>
                  <p className={`text-sm font-semibold ${(accountBalances[account.id] ?? 0) < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatNGN((accountBalances[account.id] ?? Number(account.openingBalance)) || 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {accounts.length === 0 && (
          <div className="col-span-full py-8 text-center border rounded-lg bg-muted/20">
            <p className="text-muted-foreground">No bank accounts added yet.</p>
          </div>
        )}
      </div>

      {selectedAccount && (
        <Card className="mt-8">
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>{selectedAccount.bankName} — {selectedAccount.accountName}</CardTitle>
                <CardDescription>Current Balance: {formatNGN(currentBankBalance)} | Account: {selectedAccount.accountNumber}</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setIsAddTxnOpen(true)}><Plus className="mr-2 h-4 w-4" /> Add Transaction</Button>
                <Button variant="ghost" size="icon" onClick={() => setSelectedAccount(null)}><X className="h-4 w-4" /></Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            {txnLoading ? (
               <div className="p-4"><Skeleton className="h-32 w-full" /></div>
            ) : (
              <>
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
                      <SelectItem value="Credit">Credit (In)</SelectItem>
                      <SelectItem value="Debit">Debit (Out)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Credit</TableHead>
                      <TableHead className="text-right">Debit</TableHead>
                      {!isFiltered && <TableHead className="text-right">Balance</TableHead>}
                      <TableHead>Reference</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayTxns.length > 0 ? displayTxns.map((txn) => (
                      <TableRow key={txn.id}>
                        <TableCell className="whitespace-nowrap">{txn.date.toLocaleDateString()}</TableCell>
                        <TableCell>{txn.description}</TableCell>
                        <TableCell className="text-right text-green-600 font-medium">
                          {txn.credit > 0 ? formatNGN(txn.credit) : ''}
                        </TableCell>
                        <TableCell className="text-right text-red-600 font-medium">
                          {txn.debit > 0 ? formatNGN(txn.debit) : ''}
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
                                  Are you sure you want to delete this bank transaction? This will automatically recalculate the bank account running balance.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => selectedAccount && handleDeleteTransaction(selectedAccount.id, txn.id)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={isFiltered ? 6 : 7} className="text-center py-6 text-muted-foreground">No transactions found.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Add Account Dialog */}
      <Dialog open={isAddAccountOpen} onOpenChange={setIsAddAccountOpen}>
        <DialogContent className="sm:max-w-xl md:w-full">
          <DialogHeader>
            <DialogTitle>Add Bank Account</DialogTitle>
          </DialogHeader>
          <Form {...accountForm}>
            <form onSubmit={accountForm.handleSubmit(onAddAccount)} className="space-y-4">
              <FormField control={accountForm.control} name="bankName" render={({ field }) => (
                <FormItem><FormLabel>Bank Name</FormLabel><FormControl><Input placeholder="E.g. GTBank" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={accountForm.control} name="accountName" render={({ field }) => (
                <FormItem><FormLabel>Account Name</FormLabel><FormControl><Input placeholder="E.g. SahelX Operations" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={accountForm.control} name="accountNumber" render={({ field }) => (
                <FormItem><FormLabel>Account Number</FormLabel><FormControl><Input placeholder="0123456789" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={accountForm.control} name="openingBalance" render={({ field }) => (
                <FormItem><FormLabel>Opening Balance (₦)</FormLabel><FormControl><Input type="number" min="0" step="0.01" {...field} onChange={e => field.onChange(e.target.value ? Number(e.target.value) : 0)} /></FormControl><FormMessage /></FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddAccountOpen(false)}>Cancel</Button>
                <Button type="submit">Add Account</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Add Transaction Dialog */}
      <Dialog open={isAddTxnOpen} onOpenChange={setIsAddTxnOpen}>
        <DialogContent className="sm:max-w-xl md:w-full">
          <DialogHeader>
            <DialogTitle>Record Bank Transaction</DialogTitle>
          </DialogHeader>
          <Form {...txnForm}>
            <form onSubmit={txnForm.handleSubmit(onAddTxn)} className="space-y-4">
              <FormField control={txnForm.control} name="date" render={({ field }) => (
                <FormItem><FormLabel>Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={txnForm.control} name="type" render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="Credit">Credit (Money In)</SelectItem>
                      <SelectItem value="Debit">Debit (Money Out)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={txnForm.control} name="description" render={({ field }) => (
                <FormItem><FormLabel>Description</FormLabel><FormControl><Input placeholder="E.g. Payment for delivery" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={txnForm.control} name="amount" render={({ field }) => (
                <FormItem><FormLabel>Amount</FormLabel><FormControl><Input type="number" min="0.01" step="0.01" {...field} onChange={e => field.onChange(e.target.value ? Number(e.target.value) : 0)} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={txnForm.control} name="reference" render={({ field }) => (
                <FormItem><FormLabel>Reference (Optional)</FormLabel><FormControl><Input placeholder="Transfer ref" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddTxnOpen(false)}>Cancel</Button>
                <Button type="submit">Record Transaction</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Account Dialog */}
      <Dialog open={isEditAccountOpen} onOpenChange={(open) => { setIsEditAccountOpen(open); if (!open) setEditingAccount(null) }}>
        <DialogContent className="sm:max-w-xl md:w-full">
          <DialogHeader>
            <DialogTitle>Edit Bank Account</DialogTitle>
          </DialogHeader>
          <Form {...editAccountForm}>
            <form onSubmit={editAccountForm.handleSubmit(onEditAccount)} className="space-y-4">
              <FormField control={editAccountForm.control} name="bankName" render={({ field }) => (
                <FormItem><FormLabel>Bank Name</FormLabel><FormControl><Input placeholder="E.g. GTBank" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={editAccountForm.control} name="accountName" render={({ field }) => (
                <FormItem><FormLabel>Account Name</FormLabel><FormControl><Input placeholder="E.g. SahelX Operations" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={editAccountForm.control} name="accountNumber" render={({ field }) => (
                <FormItem><FormLabel>Account Number</FormLabel><FormControl><Input placeholder="0123456789" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={editAccountForm.control} name="openingBalance" render={({ field }) => (
                <FormItem><FormLabel>Opening Balance (₦)</FormLabel><FormControl><Input type="number" min="0" step="0.01" {...field} onChange={e => field.onChange(e.target.value ? Number(e.target.value) : 0)} /></FormControl><FormMessage /></FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditAccountOpen(false)}>Cancel</Button>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
