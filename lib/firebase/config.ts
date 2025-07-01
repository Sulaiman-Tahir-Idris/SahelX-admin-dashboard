import { initializeApp } from "firebase/app"
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

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app)

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app)

export default app
