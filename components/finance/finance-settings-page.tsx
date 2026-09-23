"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Settings2,
  Wallet,
  Tag,
  Trash2,
  Plus,
  ShieldAlert,
  Pencil,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  getFinanceSettings,
  updateFinanceSettings,
  getExpenseCategories,
  addExpenseCategory,
  updateExpenseCategory,
  deleteExpenseCategory,
  getDepartments,
  addDepartment,
  deleteDepartment,
} from "@/lib/firebase/finance";
import { useCurrency } from "@/components/providers/currency-provider";
import type {
  FinanceSettings,
  ExpenseCategory,
  FinanceDepartment,
} from "@/lib/finance/types";
import { useAuth } from "@/lib/auth-utils";
import { useRole } from "@/lib/hooks/use-role";

// ─── Schemas ──────────────────────────────────────────────────────────────────
const balanceSchema = z.object({
  openingCashBalance: z.coerce.number().min(0, "Balance cannot be negative"),
});

const deptSchema = z.object({
  name: z.string().min(1, "Department name is required").max(60),
  color: z.string().min(1, "Color is required"),
});

const categorySchema = z.object({
  name: z.string().min(1, "Category name is required").max(60),
  department: z.string().min(1, "Department is required"),
});

type BalanceForm = z.infer<typeof balanceSchema>;
type CategoryForm = z.infer<typeof categorySchema>;
type DeptForm = z.infer<typeof deptSchema>;

// ─── Component ────────────────────────────────────────────────────────────────
export function FinanceSettingsPage() {
  const { formatAmount } = useCurrency();
  const { user } = useAuth();
  const role = useRole();
  const canEdit = role === "ceo" || role === "cfo";

  const [settings, setSettings] = useState<FinanceSettings | null>(null);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [departments, setDepartments] = useState<FinanceDepartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingBalance, setSavingBalance] = useState(false);
  const [addCatOpen, setAddCatOpen] = useState(false);
  const [editCatId, setEditCatId] = useState<string | null>(null);
  const [savingCat, setSavingCat] = useState(false);
  const [filterDept, setFilterDept] = useState<string>("all");

  const balanceForm = useForm<BalanceForm>({
    resolver: zodResolver(balanceSchema),
    defaultValues: { openingCashBalance: 0 },
  });

  const [addDeptOpen, setAddDeptOpen] = useState(false);
  const [savingDept, setSavingDept] = useState(false);

  const deptForm = useForm<DeptForm>({
    resolver: zodResolver(deptSchema),
    defaultValues: { name: "", color: "#3b82f6" },
  });

  const onAddDepartment = async (data: DeptForm) => {
    setSavingDept(true);
    try {
      const id = await addDepartment(data.name, data.color);
      setDepartments((prev) => [
        ...prev,
        { id, name: data.name, color: data.color, createdAt: new Date() },
      ]);
      deptForm.reset();
      setAddDeptOpen(false);
      toast.success(`Department "${data.name}" added`);
    } catch {
      toast.error("Failed to add department");
    } finally {
      setSavingDept(false);
    }
  };

  const onDeleteDepartment = async (id: string, name: string) => {
    try {
      await deleteDepartment(id);
      setDepartments((prev) => prev.filter((d) => d.id !== id));
      toast.success(`Department "${name}" deleted`);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete department");
    }
  };

  const catForm = useForm<CategoryForm>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: "", department: "" },
  });

  useEffect(() => {
    Promise.all([getFinanceSettings(), getExpenseCategories(), getDepartments()])
      .then(([s, c, d]) => {
        if (s) {
          setSettings(s);
          balanceForm.reset({ openingCashBalance: s.openingCashBalance });
        }
        setCategories(c);
        setDepartments(d);
      })
      .catch(() => toast.error("Failed to load finance settings"))
      .finally(() => setLoading(false));
  }, []);

  const onSaveBalance = async (data: BalanceForm) => {
    if (!canEdit) return;
    setSavingBalance(true);
    try {
      await updateFinanceSettings(
        { openingCashBalance: data.openingCashBalance },
        user?.id ?? "admin",
      );
      setSettings((prev) =>
        prev
          ? {
              ...prev,
              openingCashBalance: data.openingCashBalance,
              updatedAt: new Date(),
            }
          : prev,
      );
      toast.success("Opening cash balance updated");
    } catch {
      toast.error("Failed to update balance");
    } finally {
      setSavingBalance(false);
    }
  };

  const onSaveCategory = async (data: CategoryForm) => {
    setSavingCat(true);
    try {
      if (editCatId) {
        await updateExpenseCategory(editCatId, {
          name: data.name,
          department: data.department,
        });
        setCategories((prev) =>
          prev.map((c) =>
            c.id === editCatId
              ? { ...c, name: data.name, department: data.department }
              : c
          )
        );
        toast.success(`Category updated`);
      } else {
        const id = await addExpenseCategory({
          name: data.name,
          department: data.department,
        });
        setCategories((prev) => [
          ...prev,
          {
            id,
            name: data.name,
            department: data.department,
            createdAt: new Date(),
          },
        ]);
        toast.success(`Category "${data.name}" added`);
      }
      catForm.reset();
      setAddCatOpen(false);
      setEditCatId(null);
    } catch {
      toast.error(editCatId ? "Failed to update category" : "Failed to add category");
    } finally {
      setSavingCat(false);
    }
  };

  const onDeleteCategory = async (id: string, name: string) => {
    try {
      await deleteExpenseCategory(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
      toast.success(`Category "${name}" deleted`);
    } catch {
      toast.error("Failed to delete category");
    }
  };

  const filteredCats =
    filterDept === "all"
      ? categories
      : categories.filter((c) => c.department === filterDept);

  if (loading) {
    return (
      <div className="space-y-6 overflow-hidden">
        <div className="h-8 w-52 rounded-md skeleton" />
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
          {[1, 2].map((i) => (
            <Card key={i} className="p-6 space-y-4">
              <div className="h-5 w-32 rounded-md skeleton" />
              <div className="h-10 w-full rounded-md skeleton" />
              <div className="h-9 w-24 rounded-md skeleton" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Settings2 className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            Finance Settings
          </h1>
          <p className="text-sm text-muted-foreground">
            Configure opening balances and manage expense categories
          </p>
        </div>
      </div>

      {!canEdit && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          Finance settings can only be modified by CEO or CFO.
        </div>
      )}

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Opening Balance */}
        <Card className="overflow-hidden">
          <CardHeader>
            <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-2">
              <Wallet className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">Opening Cash Balance</CardTitle>
            </div>
            <CardDescription>
              Starting balance for the Cash Book ledger. Changes are saved with
              an audit trail.
              {settings?.updatedAt && (
                <span className="block mt-1 text-xs opacity-70">
                  Last updated: {settings.updatedAt.toLocaleString()}
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...balanceForm}>
              <form
                onSubmit={balanceForm.handleSubmit(onSaveBalance)}
                className="space-y-4"
              >
                <FormField
                  control={balanceForm.control}
                  name="openingCashBalance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Balance (₦)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          placeholder="0"
                          disabled={!canEdit}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Current:{" "}
                    <span className="font-semibold text-foreground">
                      {formatAmount(settings?.openingCashBalance ?? 0)}
                    </span>
                  </p>
                  <Button
                    type="submit"
                    disabled={!canEdit || savingBalance}
                    size="sm"
                  >
                    {savingBalance ? "Saving…" : "Save Balance"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Category summary */}
        <Card className="overflow-hidden">
          <CardHeader>
            <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-2">
              <Tag className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">Category Overview</CardTitle>
            </div>
            <CardDescription>
              {categories.length} categories across {departments.length}{" "}
              departments
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {departments.map((dept) => {
              const count = categories.filter(
                (c) => c.department === dept.name,
              ).length;
              return (
                <div
                  key={dept.id}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-muted-foreground">{dept.name}</span>
                  <span className="font-medium">{count}</span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Departments */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Departments
            </h2>
            <p className="text-sm text-muted-foreground">
              Manage organization departments and their assigned colors.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => {
              deptForm.reset();
              setAddDeptOpen(true);
            }}
          >
            <Plus className="h-3.5 w-3.5 mr-1" /> Add Department
          </Button>
        </div>

        {departments.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
            No departments found.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {departments.map((dept) => (
              <div
                key={dept.id}
                className="group flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:border-primary/30"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="h-4 w-4 rounded-full"
                    style={{ backgroundColor: dept.color }}
                  />
                  <p className="text-sm font-medium text-foreground">
                    {dept.name}
                  </p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive/70 hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Department</AlertDialogTitle>
                      <AlertDialogDescription>
                        Delete &ldquo;{dept.name}&rdquo;?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={() => onDeleteDepartment(dept.id, dept.name)}
                      >
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

      <Separator />

      {/* Expense Categories */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Expense Categories
            </h2>
            <p className="text-sm text-muted-foreground">
              Appear in the Expense form, filtered by department.
            </p>
          </div>
          <div className="flex gap-2">
            <Select
              value={filterDept}
              onValueChange={(v) => setFilterDept(v as Department | "all")}
            >
              <SelectTrigger className="h-8 w-44 text-xs">
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((d) => (
                  <SelectItem key={d.id} value={d.name}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              onClick={() => {
                catForm.reset();
                setAddCatOpen(true);
              }}
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Category
            </Button>
          </div>
        </div>

        {filteredCats.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
            No categories found.{" "}
            <button
              className="text-primary hover:underline"
              onClick={() => {
                catForm.reset();
                setAddCatOpen(true);
              }}
            >
              Add the first one.
            </button>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredCats.map((cat) => (
              <div
                key={cat.id}
                className="group flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:border-primary/30"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {cat.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {cat.department}
                  </p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      setEditCatId(cat.id);
                      catForm.reset({
                        name: cat.name,
                        department: cat.department,
                      });
                      setAddCatOpen(true);
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive/70 hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Category</AlertDialogTitle>
                      <AlertDialogDescription>
                        Delete &ldquo;{cat.name}&rdquo;? Existing expenses that
                        use it won&apos;t be affected.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={() => onDeleteCategory(cat.id, cat.name)}
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Category Dialog */}
      <Dialog open={addCatOpen} onOpenChange={(open) => {
        setAddCatOpen(open);
        if (!open) {
          setEditCatId(null);
          catForm.reset();
        }
      }}>
        <DialogContent className="sm:max-w-[400px] md:w-full">
          <DialogHeader>
            <DialogTitle>{editCatId ? "Edit Expense Category" : "Add Expense Category"}</DialogTitle>
          </DialogHeader>
          <Form {...catForm}>
            <form
              onSubmit={catForm.handleSubmit(onSaveCategory)}
              className="space-y-4"
            >
              <FormField
                control={catForm.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {departments.map((d) => (
                          <SelectItem key={d.id} value={d.name}>
                            {d.name}
                          </SelectItem>
                        ))}
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
                      <Input
                        placeholder="e.g. Fuel, Maintenance, Salary…"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setAddCatOpen(false);
                    setEditCatId(null);
                    catForm.reset();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={savingCat}>
                  {savingCat ? "Saving…" : editCatId ? "Save Changes" : "Add Category"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      {/* Add Department Dialog */}
      <Dialog open={addDeptOpen} onOpenChange={setAddDeptOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Add Department</DialogTitle>
          </DialogHeader>
          <Form {...deptForm}>
            <form
              onSubmit={deptForm.handleSubmit(onAddDepartment)}
              className="space-y-4"
            >
              <FormField
                control={deptForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Operations, IT, Sales..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={deptForm.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Color Code</FormLabel>
                    <FormControl>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          className="w-12 h-10 p-1"
                          {...field}
                        />
                        <Input placeholder="#000000" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAddDeptOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={savingDept}>
                  {savingDept ? "Adding..." : "Add Department"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
