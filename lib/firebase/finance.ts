// ─── SahelX Finance Module — Firebase/Firestore Service ──────────────────────
// All CRUD for finance collections. Converts Timestamp ↔ Date on boundary.

import { db } from "./config"
import {
  collection, doc, getDocs, addDoc, updateDoc, deleteDoc,
  getDoc, query, orderBy, serverTimestamp, setDoc, Timestamp,
} from "firebase/firestore"
import type {
  RevenueEntry, Expense, ExpenseCategory, CashTransaction,
  BankAccount, BankTransaction, FinanceSettings, ExpenseStatus,
} from "@/lib/finance/types"

// ─── Timestamp converter ──────────────────────────────────────────────────────
function mapDoc<T>(snap: any): T {
  const data = snap.data()
  const result: any = { id: snap.id }
  for (const key of Object.keys(data)) {
    const v = data[key]
    result[key] = v instanceof Timestamp ? v.toDate() : v
  }
  return result as T
}

function toTimestamp(d: Date | string | undefined): Timestamp | undefined {
  if (!d) return undefined
  const date = d instanceof Date ? d : new Date(d)
  return Timestamp.fromDate(date)
}

// ─── Revenue Entries ──────────────────────────────────────────────────────────
export async function getRevenueEntries(): Promise<RevenueEntry[]> {
  const snap = await getDocs(query(collection(db, "revenueEntries"), orderBy("date", "desc")))
  return snap.docs.map((d) => mapDoc<RevenueEntry>(d))
}

export async function addRevenueEntry(
  data: Omit<RevenueEntry, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  const ref = await addDoc(collection(db, "revenueEntries"), {
    ...data,
    date: toTimestamp(data.date),
    source: "manual",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateRevenueEntry(
  id: string,
  data: Partial<Omit<RevenueEntry, "id" | "createdAt">>
): Promise<void> {
  const payload: any = { ...data, updatedAt: serverTimestamp() }
  if (data.date) payload.date = toTimestamp(data.date as any)
  await updateDoc(doc(db, "revenueEntries", id), payload)
}

export async function deleteRevenueEntry(id: string): Promise<void> {
  await deleteDoc(doc(db, "revenueEntries", id))
}

// ─── Expenses ─────────────────────────────────────────────────────────────────
export async function getExpenses(): Promise<Expense[]> {
  const snap = await getDocs(query(collection(db, "expenses"), orderBy("date", "desc")))
  return snap.docs.map((d) => mapDoc<Expense>(d))
}

export async function addExpense(
  data: Omit<Expense, "id" | "createdAt" | "updatedAt"> & { status?: ExpenseStatus }
): Promise<string> {
  const ref = await addDoc(collection(db, "expenses"), {
    ...data,
    date: toTimestamp(data.date),
    status: data.status || "pending",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateExpense(
  id: string,
  data: Partial<Omit<Expense, "id" | "createdAt">>
): Promise<void> {
  const payload: any = { ...data, updatedAt: serverTimestamp() }
  if (data.date) payload.date = toTimestamp(data.date as any)
  await updateDoc(doc(db, "expenses", id), payload)
}

export async function updateExpenseStatus(
  id: string,
  status: "approved" | "rejected"
): Promise<void> {
  await updateDoc(doc(db, "expenses", id), { status, updatedAt: serverTimestamp() })
}

export async function deleteExpense(id: string): Promise<void> {
  await deleteDoc(doc(db, "expenses", id))
}

// ─── Expense Categories ───────────────────────────────────────────────────────
export async function getExpenseCategories(): Promise<ExpenseCategory[]> {
  const snap = await getDocs(query(collection(db, "expenseCategories"), orderBy("name")))
  return snap.docs.map((d) => mapDoc<ExpenseCategory>(d))
}

export async function addExpenseCategory(
  data: Omit<ExpenseCategory, "id" | "createdAt">
): Promise<string> {
  const ref = await addDoc(collection(db, "expenseCategories"), {
    ...data, createdAt: serverTimestamp(),
  })
  return ref.id
}

export async function deleteExpenseCategory(id: string): Promise<void> {
  await deleteDoc(doc(db, "expenseCategories", id))
}

// ─── Cash Transactions ────────────────────────────────────────────────────────
export async function getCashTransactions(): Promise<CashTransaction[]> {
  const snap = await getDocs(query(collection(db, "cashTransactions"), orderBy("date", "desc")))
  return snap.docs.map((d) => mapDoc<CashTransaction>(d))
}

export async function addCashTransaction(
  data: Omit<CashTransaction, "id" | "createdAt">
): Promise<string> {
  const ref = await addDoc(collection(db, "cashTransactions"), {
    ...data,
    date: toTimestamp(data.date),
    createdAt: serverTimestamp(),
  })
  return ref.id
}

// ─── Bank Accounts ────────────────────────────────────────────────────────────
export async function getBankAccounts(): Promise<BankAccount[]> {
  const snap = await getDocs(query(collection(db, "bankAccounts"), orderBy("createdAt", "desc")))
  return snap.docs.map((d) => mapDoc<BankAccount>(d))
}

export async function addBankAccount(
  data: Omit<BankAccount, "id" | "createdAt">
): Promise<string> {
  const ref = await addDoc(collection(db, "bankAccounts"), {
    ...data, createdAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateBankAccount(
  id: string,
  data: Partial<Omit<BankAccount, "id" | "createdAt">>
): Promise<void> {
  await updateDoc(doc(db, "bankAccounts", id), data)
}

export async function deleteBankAccount(id: string): Promise<void> {
  await deleteDoc(doc(db, "bankAccounts", id))
}

// Bank transactions stored as a sub-collection under each bank account
export async function getBankTransactions(accountId: string): Promise<BankTransaction[]> {
  const ref = collection(db, "bankAccounts", accountId, "transactions")
  const snap = await getDocs(query(ref, orderBy("date", "desc")))
  return snap.docs.map((d) => {
    const entry = mapDoc<BankTransaction>(d)
    entry.accountId = accountId
    return entry
  })
}

export async function addBankTransaction(
  accountId: string,
  data: Omit<BankTransaction, "id" | "accountId" | "createdAt">
): Promise<string> {
  const ref = collection(db, "bankAccounts", accountId, "transactions")
  const txnRef = await addDoc(ref, {
    ...data,
    accountId,
    date: toTimestamp(data.date),
    createdAt: serverTimestamp(),
  })
  return txnRef.id
}

// ─── Finance Settings (singleton) ─────────────────────────────────────────────
const SETTINGS_DOC = () => doc(db, "financeSettings", "singleton")

export async function getFinanceSettings(): Promise<FinanceSettings | null> {
  const snap = await getDoc(SETTINGS_DOC())
  if (!snap.exists()) return null
  const d = snap.data()!
  return {
    openingCashBalance: d.openingCashBalance ?? 0,
    updatedAt:          d.updatedAt?.toDate()  ?? new Date(),
    updatedBy:          d.updatedBy            ?? "",
  }
}

export async function updateFinanceSettings(
  data: Partial<Omit<FinanceSettings, "updatedAt">>,
  updatedBy: string
): Promise<void> {
  await setDoc(
    SETTINGS_DOC(),
    { ...data, updatedBy, updatedAt: serverTimestamp() },
    { merge: true }
  )
}

export async function deleteCashTransaction(id: string): Promise<void> {
  await deleteDoc(doc(db, "cashTransactions", id))
}

export async function deleteBankTransaction(accountId: string, txnId: string): Promise<void> {
  await deleteDoc(doc(db, "bankAccounts", accountId, "transactions", txnId))
}