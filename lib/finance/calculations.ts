// ─── SahelX Finance Module — Pure Calculation Utilities ──────────────────────
// All functions are pure (no side effects, no Firebase calls).
// Currency: NGN (₦). No floating-point division on kobo-level amounts.

import type {
  CashTransaction,
  CashTransactionWithBalance,
  BankTransaction,
  BankTransactionWithBalance,
  Expense,
  Department,
  MonthlyDataPoint,
  DailyDataPoint,
  DepartmentBreakdown,
  DEPARTMENT_COLORS,
} from "./types"

import { DEPARTMENT_COLORS as DEPT_COLORS } from "./types"

// ─── Currency Formatting ──────────────────────────────────────────────────────
export function formatNGN(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatNGNCompact(amount: number): string {
  const abs = Math.abs(amount)
  const sign = amount < 0 ? "-" : ""
  if (abs >= 1_000_000) return `${sign}₦${(abs / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000)     return `${sign}₦${(abs / 1_000).toFixed(1)}K`
  return formatNGN(amount)
}

// ─── Growth / Margin ──────────────────────────────────────────────────────────
export function calcGrowthPct(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / Math.abs(previous)) * 1000) / 10
}

export function calcNetProfit(revenue: number, expenses: number): number {
  return revenue - expenses
}

export function calcProfitMargin(revenue: number, expenses: number): number {
  if (revenue === 0) return 0
  return Math.round(((revenue - expenses) / revenue) * 1000) / 10
}

// ─── Cash Ledger ──────────────────────────────────────────────────────────────
export function calcCashBalance(openingBalance: number, txns: CashTransaction[]): number {
  return txns.reduce((bal, txn) => {
    switch (txn.type) {
      case "cash_in":
      case "opening_balance_adjustment":
        return bal + txn.amount
      case "cash_out":
      case "transfer_to_bank":
        return bal - txn.amount
      default:
        return bal
    }
  }, openingBalance)
}

export function buildRunningBalance(
  openingBalance: number,
  txns: CashTransaction[]
): CashTransactionWithBalance[] {
  const sorted = [...txns].sort((a, b) => a.date.getTime() - b.date.getTime())
  let bal = openingBalance
  return sorted.map((txn) => {
    switch (txn.type) {
      case "cash_in":
      case "opening_balance_adjustment": bal += txn.amount; break
      case "cash_out":
      case "transfer_to_bank":          bal -= txn.amount; break
    }
    return { ...txn, runningBalance: bal }
  })
}

// ─── Bank Ledger ──────────────────────────────────────────────────────────────
export function calcBankBalance(openingBalance: number, txns: BankTransaction[]): number {
  const opening = Number(openingBalance) || 0
  return txns.reduce((bal, txn) => bal + (Number(txn.credit) || 0) - (Number(txn.debit) || 0), opening)
}

export function buildBankRunningBalance(
  openingBalance: number,
  txns: BankTransaction[]
): BankTransactionWithBalance[] {
  const sorted = [...txns].sort((a, b) => a.date.getTime() - b.date.getTime())
  let bal = Number(openingBalance) || 0
  return sorted.map((txn) => {
    bal = bal + (Number(txn.credit) || 0) - (Number(txn.debit) || 0)
    return { ...txn, runningBalance: bal }
  })
}

// ─── Expense Aggregations ─────────────────────────────────────────────────────
export function calcDepartmentBreakdown(expenses: Expense[]): DepartmentBreakdown[] {
  const approved = expenses.filter((e) => e.status !== "rejected")
  const total = approved.reduce((s, e) => s + e.amount, 0)
  const map: Partial<Record<Department, number>> = {}
  approved.forEach((e) => {
    map[e.department] = (map[e.department] ?? 0) + e.amount
  })
  return (Object.entries(map) as [Department, number][])
    .map(([department, amt]) => ({
      department,
      total: amt,
      percentage: total > 0 ? Math.round((amt / total) * 1000) / 10 : 0,
      color: DEPT_COLORS[department],
    }))
    .sort((a, b) => b.total - a.total)
}

export function calcCategoryTotals(expenses: Expense[]): Record<string, number> {
  const map: Record<string, number> = {}
  expenses
    .filter((e) => e.status !== "rejected")
    .forEach((e) => { map[e.category] = (map[e.category] ?? 0) + e.amount })
  return map
}

export function sumExpenses(expenses: Expense[]): number {
  return expenses
    .filter((e) => e.status !== "rejected")
    .reduce((s, e) => s + e.amount, 0)
}

// ─── Date Helpers ─────────────────────────────────────────────────────────────
export function startOfDay(d: Date = new Date()): Date {
  const r = new Date(d); r.setHours(0, 0, 0, 0); return r
}
export function startOfWeek(d: Date = new Date()): Date {
  const r = new Date(d); r.setDate(r.getDate() - r.getDay()); r.setHours(0, 0, 0, 0); return r
}
export function startOfMonth(d: Date = new Date()): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}
export function startOfPrevMonth(d: Date = new Date()): Date {
  return new Date(d.getFullYear(), d.getMonth() - 1, 1)
}
export function endOfPrevMonth(d: Date = new Date()): Date {
  return new Date(d.getFullYear(), d.getMonth(), 0, 23, 59, 59)
}
export function startOfYear(d: Date = new Date()): Date {
  return new Date(d.getFullYear(), 0, 1)
}

// ─── Revenue / Amount from date-keyed items ───────────────────────────────────
export function sumInRange(
  items: Array<{ date: Date; amount: number }>,
  from: Date,
  to: Date = new Date()
): number {
  return items
    .filter((i) => i.date >= from && i.date <= to)
    .reduce((s, i) => s + i.amount, 0)
}

// ─── Chart Grouping ───────────────────────────────────────────────────────────
/** Returns an array of {month, revenue, expenses} for the last N months */
export function groupByMonth(
  revenues: Array<{ date: Date; amount: number }>,
  expenses: Array<{ date: Date; amount: number }>,
  monthsBack = 6
): MonthlyDataPoint[] {
  const now = new Date()
  const points: MonthlyDataPoint[] = []

  for (let i = monthsBack - 1; i >= 0; i--) {
    const ref = new Date(now.getFullYear(), now.getMonth() - i, 1)
    points.push({
      month: ref.toLocaleDateString("en-NG", { month: "short", year: "2-digit" }),
      revenue: 0,
      expenses: 0,
    })
  }

  const addTo = (
    items: Array<{ date: Date; amount: number }>,
    field: "revenue" | "expenses"
  ) => {
    items.forEach((item) => {
      const d = item.date instanceof Date ? item.date : new Date(item.date)
      for (let i = monthsBack - 1; i >= 0; i--) {
        const ref = new Date(now.getFullYear(), now.getMonth() - i, 1)
        if (d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth()) {
          points[monthsBack - 1 - i][field] += item.amount
          break
        }
      }
    })
  }

  addTo(revenues, "revenue")
  addTo(expenses, "expenses")
  return points
}

export function groupByDay(
  items: Array<{ date: Date; amount: number }>,
  days = 7
): DailyDataPoint[] {
  const now = new Date()
  const slots = Array.from({ length: days }, (_, i) => {
    const d = new Date(now)
    d.setDate(now.getDate() - (days - 1 - i))
    d.setHours(0, 0, 0, 0)
    return { day: d.toLocaleDateString("en-NG", { weekday: "short" }), date: d, value: 0 }
  })

  items.forEach((item) => {
    const d = item.date instanceof Date ? item.date : new Date(item.date)
    const dayKey = new Date(d); dayKey.setHours(0, 0, 0, 0)
    slots.forEach((s) => {
      if (s.date.getTime() === dayKey.getTime()) s.value += item.amount
    })
  })

  return slots.map(({ day, value }) => ({ day, value }))
}

// ─── Filter helpers ───────────────────────────────────────────────────────────
export function filterByDateRange<T extends { date: Date }>(
  items: T[],
  startDate: string,
  endDate: string
): T[] {
  return items.filter((item) => {
    const d = item.date instanceof Date ? item.date : new Date(item.date as any)
    if (startDate && d < new Date(startDate)) return false
    if (endDate   && d > new Date(endDate + "T23:59:59")) return false
    return true
  })
}

export function filterBySearch<T>(
  items: T[],
  search: string,
  fields: (keyof T)[]
): T[] {
  if (!search.trim()) return items
  const q = search.toLowerCase()
  return items.filter((item) =>
    fields.some((f) => String(item[f] ?? "").toLowerCase().includes(q))
  )
}
