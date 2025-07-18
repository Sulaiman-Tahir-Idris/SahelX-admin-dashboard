import { initializeApp, getApps, getApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyAbvJX4T18HBcxr1BpD-WFhYDUyMthaFR0",
  authDomain: "sahelx-backend.firebaseapp.com",
  projectId: "sahelx-backend",
  storageBucket: "sahelx-backend.firebasestorage.app",
  messagingSenderId: "838199821074",
  appId: "1:838199821074:web:7eb6bcd1b973d616a129cb",
}

// Initialize Firebase only if it hasn't been initialized already
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app)

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app)

export default app
