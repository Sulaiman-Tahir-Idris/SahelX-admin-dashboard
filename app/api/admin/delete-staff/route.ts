import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";

const FIREBASE_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAbvJX4T18HBcxr1BpD-WFhYDUyMthaFR0";
const FIREBASE_PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "sahelx-backend";

export async function POST(req: Request) {
  try {
    const { id, collection, hasAuth } = await req.json();

    if (!id || !collection) {
      return NextResponse.json(
        { message: "Staff ID and collection are required" },
        { status: 400 }
      );
    }

    const validCollections = ["Admin", "Secretary", "User", "offlineStaff"];
    if (!validCollections.includes(collection)) {
      return NextResponse.json(
        { message: "Invalid collection specified" },
        { status: 400 }
      );
    }

    // 1. Delete from Firestore
    let firestoreDeleted = false;
    try {
      if (adminDb) {
        await adminDb.collection(collection).doc(id).delete();
        firestoreDeleted = true;
      }
    } catch (e) {
      // Fallback to Firestore REST API if Admin SDK credentials are not configured in local environment
      firestoreDeleted = false;
    }

    if (!firestoreDeleted) {
      const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/${collection}/${id}?key=${FIREBASE_API_KEY}`;
      const fsRes = await fetch(firestoreUrl, { method: "DELETE" });
      if (!fsRes.ok && fsRes.status !== 404) {
        const errorText = await fsRes.text();
        console.error("Firestore REST delete error:", errorText);
      }
    }

    // 2. If staff has auth, attempt to delete Firebase Auth user via adminAuth
    if (hasAuth) {
      try {
        if (adminAuth) {
          await adminAuth.deleteUser(id);
        }
      } catch (authError: any) {
        console.warn("Could not delete Firebase Auth user:", authError?.message || authError);
      }
    }

    return NextResponse.json({ success: true, message: "Staff deleted successfully" });
  } catch (error: any) {
    console.error("delete-staff error:", error);
    return NextResponse.json(
      { message: error.message || "Failed to delete staff" },
      { status: 500 }
    );
  }
}
