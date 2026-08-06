"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import {
  Settings2, Wallet, Tag, Trash2, Plus, ShieldAlert,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import {
  getFinanceSettings, updateFinanceSettings,
  getExpenseCategories, addExpenseCategory, deleteExpenseCategory,
} from "@/lib/firebase/finance"
import { formatNGN } from "@/lib/finance/calculations"
import type { FinanceSettings, ExpenseCategory, Department } from "@/lib/finance/types"
import { DEPARTMENTS } from "@/lib/finance/types"
import { useAuth } from "@/lib/auth-utils"

// ─── Schemas ──────────────────────────────────────────────────────────────────
const balanceSchema = z.object({
  openingCashBalance: z.coerce.number().min(0, "Balance cannot be negative"),
})

const categorySchema = z.object({
  name: z.string().min(1, "Category name is required").max(60),
  department: z.enum(["Operations", "Marketing", "Office", "Technology", "Administration"] as const),
})

type BalanceForm = z.infer<typeof balanceSchema>
type CategoryForm = z.infer<typeof categorySchema>

// ─── Component ────────────────────────────────────────────────────────────────
export function FinanceSettingsPage() {
  const { user } = useAuth()
  const getStoredRole = () => {
    try { return JSON.parse(localStorage.getItem("adminUser") || "{}").role } catch { return undefined }
  }
  const role = (user?.role ?? (typeof window !== "undefined" ? getStoredRole() : "")).toLowerCase()
  const canEdit = role === "ceo" || role === "cfo"

  const [settings, setSettings] = useState<FinanceSettings | null>(null)
  const [categories, setCategories] = useState<ExpenseCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [savingBalance, setSavingBalance] = useState(false)
  const [addCatOpen, setAddCatOpen] = useState(false)
  const [savingCat, setSavingCat] = useState(false)
  const [filterDept, setFilterDept] = useState<Department | "all">("all")

  const balanceForm = useForm<BalanceForm>({
    resolver: zodResolver(balanceSchema),
    defaultValues: { openingCashBalance: 0 },
  })

  const catForm = useForm<CategoryForm>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: "", department: "Operations" },
  })

  useEffect(() => {
    Promise.all([getFinanceSettings(), getExpenseCategories()])
      .then(([s, c]) => {
        if (s) {
          setSettings(s)
          balanceForm.reset({ openingCashBalance: s.openingCashBalance })
        }
        setCategories(c)
      })
      .catch(() => toast.error("Failed to load finance settings"))
      .finally(() => setLoading(false))
  }, [])

  const onSaveBalance = async (data: BalanceForm) => {
    if (!canEdit) return
    setSavingBalance(true)
    try {
      await updateFinanceSettings({ openingCashBalance: data.openingCashBalance }, user?.uid ?? "admin")
      setSettings((prev) => prev ? { ...prev, openingCashBalance: data.openingCashBalance, updatedAt: new Date() } : prev)
      toast.success("Opening cash balance updated")
    } catch {
      toast.error("Failed to update balance")
    } finally {
      setSavingBalance(false)
    }
  }

  const onAddCategory = async (data: CategoryForm) => {
    setSavingCat(true)
    try {
      const id = await addExpenseCategory({ name: data.name, department: data.department })
      setCategories((prev) => [...prev, { id, name: data.name, department: data.department, createdAt: new Date() }])
      catForm.reset()
      setAddCatOpen(false)
      toast.success(`Category "${data.name}" added`)
    } catch {
      toast.error("Failed to add category")
    } finally {
      setSavingCat(false)
    }
  }

  const onDeleteCategory = async (id: string, name: string) => {
    try {
      await deleteExpenseCategory(id)
      setCategories((prev) => prev.filter((c) => c.id !== id))
      toast.success(`Category "${name}" deleted`)
    } catch {
      toast.error("Failed to delete category")
    }
  }

  const filteredCats = filterDept === "all" ? categories : categories.filter((c) => c.department === filterDept)

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-52 rounded-md skeleton" />
        <div className="grid gap-6 lg:grid-cols-2">
          {[1, 2].map((i) => (
            <Card key={i} className="p-6 space-y-4">
              <div className="h-5 w-32 rounded-md skeleton" />
              <div className="h-10 w-full rounded-md skeleton" />
              <div className="h-9 w-24 rounded-md skeleton" />
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Settings2 className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Finance Settings</h1>
          <p className="text-sm text-muted-foreground">Configure opening balances and manage expense categories</p>
        </div>
      </div>

      {!canEdit && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          Finance settings can only be modified by CEO or CFO.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Opening Balance */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">Opening Cash Balance</CardTitle>
            </div>
            <CardDescription>
              Starting balance for the Cash Book ledger. Changes are saved with an audit trail.
              {settings?.updatedAt && (
                <span className="block mt-1 text-xs opacity-70">
                  Last updated: {settings.updatedAt.toLocaleString()}
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...balanceForm}>
              <form onSubmit={balanceForm.handleSubmit(onSaveBalance)} className="space-y-4">
                <FormField
                  control={balanceForm.control}
                  name="openingCashBalance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Balance (₦)</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} placeholder="0" disabled={!canEdit} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Current: <span className="font-semibold text-foreground">{formatNGN(settings?.openingCashBalance ?? 0)}</span>
                  </p>
                  <Button type="submit" disabled={!canEdit || savingBalance} size="sm">
                    {savingBalance ? "Saving…" : "Save Balance"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Category summary */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">Category Overview</CardTitle>
            </div>
            <CardDescription>
              {categories.length} categories across {DEPARTMENTS.length} departments
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {DEPARTMENTS.map((dept) => {
              const count = categories.filter((c) => c.department === dept).length
              return (
                <div key={dept} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{dept}</span>
                  <Badge variant="secondary">{count} {count === 1 ? "category" : "categories"}</Badge>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Expense Categories */}
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Expense Categories</h2>
            <p className="text-sm text-muted-foreground">Appear in the Expense form, filtered by department.</p>
          </div>
          <div className="flex gap-2">
            <Select value={filterDept} onValueChange={(v) => setFilterDept(v as Department | "all")}>
              <SelectTrigger className="h-8 w-44 text-xs">
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button size="sm" onClick={() => { catForm.reset(); setAddCatOpen(true) }}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Category
            </Button>
          </div>
        </div>

        {filteredCats.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
            No categories found.{" "}
            <button className="text-primary hover:underline" onClick={() => { catForm.reset(); setAddCatOpen(true) }}>
              Add the first one.
            </button>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredCats.map((cat) => (
              <div key={cat.id} className="group flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:border-primary/30">
                <div>
                  <p className="text-sm font-medium text-foreground">{cat.name}</p>
                  <p className="text-xs text-muted-foreground">{cat.department}</p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive/70 hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Category</AlertDialogTitle>
                      <AlertDialogDescription>
                        Delete &ldquo;{cat.name}&rdquo;? Existing expenses that use it won&apos;t be affected.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => onDeleteCategory(cat.id, cat.name)}>
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Category Dialog */}
      <Dialog open={addCatOpen} onOpenChange={setAddCatOpen}>
        <DialogContent className="w-[95vw] sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Add Expense Category</DialogTitle>
          </DialogHeader>
          <Form {...catForm}>
            <form onSubmit={catForm.handleSubmit(onAddCategory)} className="space-y-4">
              <FormField
                control={catForm.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={catForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Fuel, Maintenance, Salary…" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setAddCatOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={savingCat}>{savingCat ? "Adding…" : "Add Category"}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
