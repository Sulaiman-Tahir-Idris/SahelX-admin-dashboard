import { doc, getDoc, setDoc, collection, getDocs, query, where, updateDoc, deleteDoc } from 'firebase/firestore'
import { db } from './config'

export interface SalaryConfig {
  riderBase: number
  riderComm: number
  secretaryBase: number
  secretaryComm: number
  ceoBase: number
  ceoComm: number
  cfoBase: number
  cfoComm: number
  ctoBase: number
  ctoComm: number
}

const DEFAULT_CONFIG: SalaryConfig = {
  riderBase: 5000,
  riderComm: 5,
  secretaryBase: 50000,
  secretaryComm: 1,
  ceoBase: 200000,
  ceoComm: 2,
  cfoBase: 150000,
  cfoComm: 1.5,
  ctoBase: 150000,
  ctoComm: 1.5
}

// ─── CONFIGURATION ─────────────────────────────────────────────────────────────

export async function getSalaryConfig(): Promise<SalaryConfig> {
  const docRef = doc(db, 'settings', 'salary_config')
  const snap = await getDoc(docRef)
  
  if (snap.exists()) {
    return { ...DEFAULT_CONFIG, ...snap.data() } as SalaryConfig
  }
  
  // Initialize if it doesn't exist
  await setDoc(docRef, DEFAULT_CONFIG)
  return DEFAULT_CONFIG
}

export async function updateSalaryConfig(newConfig: Partial<SalaryConfig>): Promise<void> {
  const docRef = doc(db, 'settings', 'salary_config')
  const snap = await getDoc(docRef)
  if (!snap.exists()) {
    await setDoc(docRef, { ...DEFAULT_CONFIG, ...newConfig })
  } else {
    await updateDoc(docRef, newConfig)
  }
}

// ─── PAYROLL RECORDS ─────────────────────────────────────────────────────────

export interface PayrollRecord {
  id: string
  monthYear: string // e.g. "2026-08"
  role: string // "Rider", "CEO", "Secretary", etc.
  employeeId: string // UID
  employeeName: string
  basePay: number
  commissionEarned: number
  bonus?: number
  deduction?: number
  advancePaid?: number
  totalPay: number
  status: "unpaid" | "partial" | "paid"
  updatedAt?: Date
}

export async function getPayrollRecords(monthYear: string): Promise<PayrollRecord[]> {
  const q = query(collection(db, 'payrolls'), where('monthYear', '==', monthYear))
  const snap = await getDocs(q)
  
  const records: PayrollRecord[] = []
  snap.forEach(doc => {
    const data = doc.data()
    records.push({
      id: doc.id,
      ...data,
      updatedAt: data.updatedAt?.toDate()
    } as PayrollRecord)
  })
  return records
}

export async function markPayrollAsPaid(recordId: string): Promise<void> {
  const docRef = doc(db, 'payrolls', recordId)
  await updateDoc(docRef, {
    status: 'paid',
    updatedAt: new Date()
  })
}

export async function savePayrollRecord(record: Omit<PayrollRecord, 'id'>): Promise<string> {
  const coll = collection(db, 'payrolls')
  
  // Check if it already exists to update it instead
  const q = query(
    coll, 
    where('monthYear', '==', record.monthYear), 
    where('employeeId', '==', record.employeeId)
  )
  const snap = await getDocs(q)
  
  if (!snap.empty) {
    const existingDoc = snap.docs[0]
    await updateDoc(existingDoc.ref, {
      ...record,
      updatedAt: new Date()
    })
    return existingDoc.id
  }
  
  const docRef = doc(coll)
  await setDoc(docRef, {
    ...record,
    updatedAt: new Date()
  })
  return docRef.id
}

export async function deletePayrollRecord(recordId: string): Promise<void> {
  await deleteDoc(doc(db, 'payrolls', recordId))
}
