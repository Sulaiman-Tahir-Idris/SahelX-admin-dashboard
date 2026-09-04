import { db } from "@/lib/firebase/config"
import { doc, getDoc, setDoc } from "firebase/firestore"

export interface CompanyContacts {
  ceoName: string
  ceoPhone: string
  ceoEmail: string
  cfoName: string
  cfoPhone: string
  cfoEmail: string
}

const SETTINGS_DOC = "singleton"

export async function getCompanyContacts(): Promise<CompanyContacts | null> {
  const snap = await getDoc(doc(db, "companyContacts", SETTINGS_DOC))
  if (snap.exists()) {
    return snap.data() as CompanyContacts
  }
  return null
}

export async function saveCompanyContacts(data: CompanyContacts): Promise<void> {
  await setDoc(doc(db, "companyContacts", SETTINGS_DOC), data)
}
