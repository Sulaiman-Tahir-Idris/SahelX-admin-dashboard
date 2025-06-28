// Run this script once to create a test admin user
// Usage: node scripts/create-test-admin.js

const { initializeApp } = require("firebase/app")
const { getAuth, createUserWithEmailAndPassword } = require("firebase/auth")
const { getFirestore, doc, setDoc, serverTimestamp } = require("firebase/firestore")

const firebaseConfig = {
  apiKey: "AIzaSyAbvJX4T18HBcxr1BpD-WFhYDUyMthaFR0",
  authDomain: "sahelx-backend.firebaseapp.com",
  projectId: "sahelx-backend",
  storageBucket: "sahelx-backend.firebasestorage.app",
  messagingSenderId: "838199821074",
  appId: "1:838199821074:web:7eb6bcd1b973d616a129cb",
}

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)

async function createTestAdmin() {
  try {
    console.log("Creating test admin user...")

    // Create auth user
    const userCredential = await createUserWithEmailAndPassword(auth, "admin@sahelx.com", "admin123")

    const user = userCredential.user
    console.log("Auth user created:", user.uid)

    // Create user document
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      email: "admin@sahelx.com",
      phone: "+234 801 234 5678",
      displayName: "Test Admin",
      role: "admin",
      verified: true,
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    // Create admin document
    await setDoc(doc(db, "admins", user.uid), {
      userId: user.uid,
      role: "superadmin",
      permissions: ["all"],
      isActive: true,
      createdAt: serverTimestamp(),
    })

    console.log("✅ Test admin created successfully!")
    console.log("Email: admin@sahelx.com")
    console.log("Password: admin123")
  } catch (error) {
    console.error("❌ Error creating test admin:", error)
  }
}

createTestAdmin()
