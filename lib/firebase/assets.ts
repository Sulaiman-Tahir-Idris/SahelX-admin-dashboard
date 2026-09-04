import { db } from "./config"
import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  orderBy,
  query,
} from "firebase/firestore"

export interface Asset {
  id?: string
  name?: string
  description?: string
  value?: number
  purchaseDate?: string
  status?: string
  serialNumber?: string
  location?: string
  notes?: string
  createdAt?: any
  updatedAt?: any
}

const COLLECTION_NAME = "assets"

export async function getAssets(): Promise<Asset[]> {
  const q = query(collection(db, COLLECTION_NAME), orderBy("createdAt", "desc"))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Asset))
}

export async function addAsset(data: Asset): Promise<string> {
  const docRef = await addDoc(collection(db, COLLECTION_NAME), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return docRef.id
}

export async function updateAsset(id: string, data: Partial<Asset>): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, id)
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteAsset(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION_NAME, id))
}
