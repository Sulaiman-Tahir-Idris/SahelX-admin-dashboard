import { collection, doc, setDoc, getDocs, serverTimestamp, query, limit } from "firebase/firestore"
import { db } from "./config"

export interface Pricing {
  baseFee: number
  feePerKm: number
  feePerKg: number
}

export interface GeoBoundary {
  lat: number
  lng: number
  radius: number
}

export interface AppSettings {
  id?: string
  pricing: Pricing
  serviceAreas: GeoBoundary[]
  notificationTemplates: {
    [key: string]: any
  }
  createdAt: any
  updatedAt?: any
}

// Default settings
const defaultSettings: Omit<AppSettings, "id" | "createdAt" | "updatedAt"> = {
  pricing: {
    baseFee: 1000,
    feePerKm: 150,
    feePerKg: 50,
  },
  serviceAreas: [
    { lat: 6.5244, lng: 3.3792, radius: 10 }, // Lagos
    { lat: 9.0579, lng: 7.4951, radius: 15 }, // Abuja
    { lat: 11.9804, lng: 8.5214, radius: 12 }, // Kano
  ],
  notificationTemplates: {
    orderCreated: "Your order has been created and is being processed.",
    orderAccepted: "A courier has accepted your delivery request.",
    orderInTransit: "Your order is on the way!",
    orderCompleted: "Your order has been delivered successfully.",
    orderCancelled: "Your order has been cancelled.",
  },
}

// Initialize settings with default values
export const initializeSettings = async (): Promise<string> => {
  try {
    const docRef = doc(collection(db, "Setting"))
    await setDoc(docRef, {
      ...defaultSettings,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    console.log("Settings initialized with ID:", docRef.id)
    return docRef.id
  } catch (error: any) {
    console.error("Error initializing settings:", error)
    throw new Error("Failed to initialize settings")
  }
}

// Get app settings
export const getAppSettings = async (): Promise<AppSettings | null> => {
  try {
    // Get the first (and should be only) settings document
    const q = query(collection(db, "Setting"), limit(1))
    const querySnapshot = await getDocs(q)

    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0]
      return {
        id: doc.id,
        ...doc.data(),
      } as AppSettings
    }

    return null
  } catch (error: any) {
    console.error("Error getting settings:", error)
    throw new Error("Failed to get settings")
  }
}

// Get or create app settings
export const getOrCreateAppSettings = async (): Promise<AppSettings> => {
  try {
    let settings = await getAppSettings()

    if (!settings) {
      console.log("No settings found, creating default settings...")
      const settingsId = await initializeSettings()
      settings = await getAppSettings()

      if (!settings) {
        throw new Error("Failed to create settings")
      }
    }

    return settings
  } catch (error: any) {
    console.error("Error getting or creating settings:", error)
    throw new Error("Failed to get or create settings")
  }
}

// Update app settings
export const updateAppSettings = async (settings: Omit<AppSettings, "id" | "createdAt">): Promise<void> => {
  try {
    // Get existing settings to update or create new one
    const existingSettings = await getOrCreateAppSettings()

    const docRef = doc(db, "Setting", existingSettings.id!)
    await setDoc(
      docRef,
      {
        ...settings,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    )
  } catch (error: any) {
    console.error("Error updating settings:", error)
    throw new Error("Failed to update settings")
  }
}

// Update pricing only
export const updatePricing = async (pricing: Pricing): Promise<void> => {
  try {
    const existingSettings = await getOrCreateAppSettings()

    const docRef = doc(db, "Setting", existingSettings.id!)
    await setDoc(
      docRef,
      {
        pricing,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    )
  } catch (error: any) {
    console.error("Error updating pricing:", error)
    throw new Error("Failed to update pricing")
  }
}

// Update service areas only
export const updateServiceAreas = async (serviceAreas: GeoBoundary[]): Promise<void> => {
  try {
    const existingSettings = await getOrCreateAppSettings()

    const docRef = doc(db, "Setting", existingSettings.id!)
    await setDoc(
      docRef,
      {
        serviceAreas,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    )
  } catch (error: any) {
    console.error("Error updating service areas:", error)
    throw new Error("Failed to update service areas")
  }
}
