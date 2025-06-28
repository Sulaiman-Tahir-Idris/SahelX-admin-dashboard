import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore"
import { db } from "./config"

export interface PricingSettings {
  baseFee: number
  perKm: number
  perKg: number
  minimumFare: number
  maximumFare: number
  surgeMultiplier: number
}

export interface ServiceArea {
  name: string
  coordinates: {
    lat: number
    lng: number
  }[]
  isActive: boolean
}

export interface NotificationTemplate {
  id: string
  title: string
  body: string
  type: "delivery_created" | "delivery_assigned" | "delivery_completed" | "payment_received"
}

export interface SystemSettings {
  pricing: PricingSettings
  serviceAreas: ServiceArea[]
  notificationTemplates: NotificationTemplate[]
  autoAssignDeliveries: boolean
  maxDeliveryRadius: number
  operatingHours: {
    start: string
    end: string
  }
  supportContact: {
    phone: string
    email: string
    whatsapp: string
  }
  companyInfo: {
    name: string
    address: string
    logo: string
  }
  updatedAt: any
  updatedBy: string
}

// Get system settings
export const getSettings = async (): Promise<SystemSettings | null> => {
  try {
    const docRef = doc(db, "settings", "system")
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      return docSnap.data() as SystemSettings
    }

    // Return default settings if none exist
    return getDefaultSettings()
  } catch (error: any) {
    throw new Error(`Failed to fetch settings: ${error.message}`)
  }
}

// Update system settings
export const updateSettings = async (settings: Partial<SystemSettings>, updatedBy: string) => {
  try {
    const docRef = doc(db, "settings", "system")

    await updateDoc(docRef, {
      ...settings,
      updatedAt: serverTimestamp(),
      updatedBy,
    })
  } catch (error: any) {
    // If document doesn't exist, create it
    if (error.code === "not-found") {
      const docRef = doc(db, "settings", "system") // Declare docRef here
      await setDoc(docRef, {
        ...getDefaultSettings(),
        ...settings,
        updatedAt: serverTimestamp(),
        updatedBy,
      })
    } else {
      throw new Error(`Failed to update settings: ${error.message}`)
    }
  }
}

// Update pricing settings
export const updatePricingSettings = async (pricing: PricingSettings, updatedBy: string) => {
  try {
    const docRef = doc(db, "settings", "system")

    await updateDoc(docRef, {
      pricing,
      updatedAt: serverTimestamp(),
      updatedBy,
    })
  } catch (error: any) {
    throw new Error(`Failed to update pricing: ${error.message}`)
  }
}

// Get default settings
const getDefaultSettings = (): SystemSettings => {
  return {
    pricing: {
      baseFee: 1000,
      perKm: 150,
      perKg: 50,
      minimumFare: 500,
      maximumFare: 50000,
      surgeMultiplier: 1.0,
    },
    serviceAreas: [
      {
        name: "Lagos Island",
        coordinates: [
          { lat: 6.4541, lng: 3.3947 },
          { lat: 6.4541, lng: 3.4247 },
          { lat: 6.4341, lng: 3.4247 },
          { lat: 6.4341, lng: 3.3947 },
        ],
        isActive: true,
      },
    ],
    notificationTemplates: [
      {
        id: "delivery_created",
        title: "New Delivery Request",
        body: "You have a new delivery request",
        type: "delivery_created",
      },
      {
        id: "delivery_assigned",
        title: "Delivery Assigned",
        body: "A courier has been assigned to your delivery",
        type: "delivery_assigned",
      },
    ],
    autoAssignDeliveries: true,
    maxDeliveryRadius: 50,
    operatingHours: {
      start: "06:00",
      end: "22:00",
    },
    supportContact: {
      phone: "+234 801 234 5678",
      email: "support@sahelx.com",
      whatsapp: "+234 801 234 5678",
    },
    companyInfo: {
      name: "SahelX",
      address: "Lagos, Nigeria",
      logo: "/images/sahelx-logo.png",
    },
    updatedAt: serverTimestamp(),
    updatedBy: "system",
  }
}
