import { NextResponse } from "next/server";

const FIREBASE_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAbvJX4T18HBcxr1BpD-WFhYDUyMthaFR0";
const FIREBASE_PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "sahelx-backend";

async function createAuthUser(email: string, password: string, displayName: string) {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FIREBASE_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, displayName, returnSecureToken: true }),
    }
  );
  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(data.error?.message || "Failed to create Auth user");
  }
  return { uid: data.localId, idToken: data.idToken };
}

export async function POST(req: Request) {
  try {
    const data = await req.json();

    // 1. Create Auth user & get their ID token
    const { uid, idToken } = await createAuthUser(data.email, data.password, data.displayName);

    // 2. Write courier profile to Firestore using REST API
    // Must include key= param so Firestore knows which project
    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/User/${uid}?key=${FIREBASE_API_KEY}`;

    const fields: Record<string, any> = {
      userId: { stringValue: uid },
      email: { stringValue: data.email },
      phone: { stringValue: data.phone || "" },
      displayName: { stringValue: data.displayName },
      role: { stringValue: "courier" },
      verified: { booleanValue: data.isVerified || false },
      isActive: { booleanValue: data.isActive !== false },
      isAvailable: { booleanValue: false },
      status: { stringValue: "offline" },
      profilePhoto: { stringValue: "" },
      address: {
        mapValue: {
          fields: {
            street: { stringValue: data.address?.street || "" },
            city: { stringValue: data.address?.city || "" },
            state: { stringValue: data.address?.state || "" },
            country: { stringValue: data.address?.country || "Nigeria" },
          },
        },
      },
      vehicleInfo: {
        mapValue: {
          fields: {
            type: { stringValue: data.vehicleInfo?.type || "" },
            plateNumber: { stringValue: data.vehicleInfo?.plateNumber || "" },
            model: { stringValue: data.vehicleInfo?.model || "" },
            color: { stringValue: data.vehicleInfo?.color || "" },
            verified: { booleanValue: data.isVerified || false },
          },
        },
      },
      createdAt: { timestampValue: new Date().toISOString() },
    };

    const fsRes = await fetch(firestoreUrl, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${idToken}`,
      },
      body: JSON.stringify({ fields }),
    });

    const fsData = await fsRes.json();

    if (!fsRes.ok) {
      throw new Error(fsData.error?.message || "Failed to write courier to Firestore");
    }

    return NextResponse.json({ courierId: uid });
  } catch (error: any) {
    console.error("create-courier error:", error.message);
    return NextResponse.json(
      { message: error.message || "Failed to create courier" },
      { status: 400 }
    );
  }
}
