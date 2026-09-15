import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";

export async function POST(req: Request) {
  try {
    const data = await req.json();

    // 1. Create Auth user
    const user = await adminAuth.createUser({
      email: data.email,
      password: data.password,
      displayName: data.displayName,
    });

    // 2. Save investor profile in Investors collection
    await adminDb.collection("Investors").doc(user.uid).set({
      userId: user.uid,
      email: data.email,
      phone: data.phone || "",
      displayName: data.displayName,
      role: "investor",
      numberOfBikes: data.numberOfBikes || 0,
      totalInvested: data.totalInvested || 0,
      notes: data.notes || "",
      bikePurchase: false,
      documentsReady: false,
      riderReadiness: false,
      bikeReadiness: false,
      createdAt: new Date(),
    });

    return NextResponse.json({ investorId: user.uid });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Failed to create investor" },
      { status: 400 }
    );
  }
}
