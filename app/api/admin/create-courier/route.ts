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

    // 2. Save courier profile
    await adminDb.collection("User").add({
      userId: user.uid,
      email: data.email,
      phone: data.phone,
      displayName: data.displayName,
      role: "courier",
      verified: data.isVerified,
      isActive: data.isActive,
      address: data.address,
      vehicleInfo: data.vehicleInfo,
      createdAt: new Date(),
    });

    return NextResponse.json({ courierId: user.uid });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Failed to create courier" },
      { status: 400 }
    );
  }
}
