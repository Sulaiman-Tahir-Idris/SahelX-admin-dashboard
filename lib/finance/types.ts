// ─── SahelX Finance Module — All TypeScript Types ────────────────────────────
// Single source of truth for the entire Finance Module.
// All date fields are JavaScript Date (converted from Firestore Timestamp on fetch).

// ─── Enums / Literals ─────────────────────────────────────────────────────────
export type PaymentMethod = "Cash" | "Transfer" | "Card" | "Gateway" | "Cheque"
export type Department    = "Operations" | "Marketing" | "Office" | "Technology" | "Administration"
export type ExpenseStatus = "pending" | "approved" | "rejected"
export type CashTransactionType =
  | "cash_in"
  | "cash_out"
  | "transfer_to_bank"
  | "opening_balance_adjustment"

// ─── Constants ────────────────────────────────────────────────────────────────
export const DEPARTMENTS: Department[] = [
  "Operations", "Marketing", "Office", "Technology", "Administration",
]

export const PAYMENT_METHODS: PaymentMethod[] = [
  "Cash", "Transfer", "Card", "Gateway", "Cheque",
]

export const EXPENSE_PAYMENT_METHODS: PaymentMethod[] = [
  "Cash", "Transfer", "Card", "Cheque",
]

export const REVENUE_PAYMENT_METHODS: PaymentMethod[] = [
  "Cash", "Transfer", "Card", "Gateway",
]

export const CASH_TRANSACTION_LABELS: Record<CashTransactionType, string> = {
  cash_in:                   "Cash In",
  cash_out:                  "Cash Out",
  transfer_to_bank:          "Transfer to Bank",
  opening_balance_adjustment: "Opening Balance Adjustment",
}

export const DEPARTMENT_COLORS: Record<Department, string> = {
  Operations:     "hsl(0 65% 52%)",    // SahelX Red
  Marketing:      "hsl(38 92% 50%)",   // Amber
  Office:         "hsl(217 91% 60%)",  // Blue
  Technology:     "hsl(160 84% 39%)",  // Emerald
  Administration: "hsl(262 83% 58%)",  // Purple
}

// ─── Revenue Entries (manual entry, separate from gateway payments) ────────────
export interface RevenueEntry {
  id: string
  date: Date
  customer: string
  rider: string
  deliveryCount: number
  amount: number           // NGN
  paymentMethod: PaymentMethod
  reference?: string
  notes?: string
  source: "manual"         // always "manual" to distinguish from gateway
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

// ─── Expenses ─────────────────────────────────────────────────────────────────
export interface Expense {
  id: string
  date: Date
  department: Department
  category: string
  vendor: string
  description: string
  amount: number           // NGN
  paymentMethod: PaymentMethod
  receiptUrl?: string
  status: ExpenseStatus
  notes?: string
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export interface ExpenseCategory {
  id: string
  name: string
  department: Department
  createdAt: Date
}

// ─── Cash Book ────────────────────────────────────────────────────────────────
export interface CashTransaction {
  id: string
  date: Date
  description: string
  amount: number           // NGN — always positive; direction comes from type
  type: CashTransactionType
  reference?: string
  createdBy: string
  createdAt: Date
}

export interface CashTransactionWithBalance extends CashTransaction {
  runningBalance: number
}

// ─── Bank Accounts ────────────────────────────────────────────────────────────
export interface BankAccount {
  id: string
  bankName: string
  accountName: string
  accountNumber: string
  openingBalance: number   // NGN
  createdAt: Date
}

export interface BankTransaction {
  id: string
  accountId: string
  date: Date
  description: string
  credit: number           // NGN, 0 if debit transaction
  debit: number            // NGN, 0 if credit transaction
  reference?: string
  createdBy: string
  createdAt: Date
}

export interface BankTransactionWithBalance extends BankTransaction {
  runningBalance: number
}

// ─── Finance Settings (singleton Firestore document) ─────────────────────────
export interface FinanceSettings {
  openingCashBalance: number
  updatedAt: Date
  updatedBy: string
}

// ─── Chart / UI helpers ───────────────────────────────────────────────────────
export interface MonthlyDataPoint {
  month: string   // e.g. "Jan '25"
  revenue: number
  expenses: number
}

export interface DailyDataPoint {
  day: string     // e.g. "Mon"
  value: number
}

export interface DepartmentBreakdown {
  department: Department
  total: number
  percentage: number
  color: string
}

export interface DateRangeState {
  startDate: string   // "YYYY-MM-DD" or ""
  endDate: string     // "YYYY-MM-DD" or ""
}

// ─── Finance Dashboard summary ────────────────────────────────────────────────
export interface FinanceSummary {
  todayRevenue: number
  weekRevenue: number
  monthRevenue: number
  monthExpenses: number
  netProfit: number
  cashBalance: number
  bankBalance: number
  totalDeliveries: number
}
