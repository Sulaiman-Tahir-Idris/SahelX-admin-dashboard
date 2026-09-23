import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { email, password, displayName, phone, role, departmentId, baseSalary, hasAuth } = data;

    if (hasAuth === true) {
      if (!email || !password) {
        return NextResponse.json(
          { message: "Email and password are required for auth users" },
          { status: 400 }
        );
      }

      // 1. Create Auth user
      const userRecord = await adminAuth.createUser({
        email,
        password,
        displayName,
      });

      const uid = userRecord.uid;
      const collectionName = role === "admin" ? "Admin" : "Secretary";

      // 2. Write to Firestore
      await adminDb.collection(collectionName).doc(uid).set({
        email,
        displayName,
        phone: phone || "",
        role,
        departmentId: departmentId || "",
        baseSalary: baseSalary || 0,
        commissionRate: 0,
        isActive: true,
        createdAt: FieldValue.serverTimestamp(),
      });

      return NextResponse.json({ staffId: uid });
    } else {
      // Bypass auth creation, add directly to offlineStaff
      const docRef = adminDb.collection("offlineStaff").doc();
      await docRef.set({
        email: email || "",
        displayName,
        phone: phone || "",
        role: "offline",
        departmentId: departmentId || "",
        baseSalary: baseSalary || 0,
        commissionRate: 0,
        isActive: true,
        createdAt: FieldValue.serverTimestamp(),
      });

      return NextResponse.json({ staffId: docRef.id });
    }
  } catch (error: any) {
    console.error("create-staff error:", error);
    return NextResponse.json(
      { message: error.message || "Failed to create staff" },
      { status: 400 }
    );
  }
}
