import { NextResponse } from "next/server";
import axios from "axios";
import admin from "@/lib/firebaseAdmin"; // your Admin SDK setup

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE_URL = "https://api.paystack.co";

export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const reference = searchParams.get("reference");

    if (!reference) {
        return NextResponse.redirect(new URL("/payment-error?reason=missing_reference", req.url));
    }

    try {
        // Verify payment with Paystack
        const verifyRes = await axios.get(
            `${PAYSTACK_BASE_URL}/transaction/verify/${reference}`,
            {
                headers: {
                    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                },
            }
        );

        const data = verifyRes.data;
        if (!data.status || data.data.status !== "success") {
            return NextResponse.redirect(new URL("/payment-error?reason=not_successful", req.url));
        }

        const paymentInfo = data.data;
        const metadata = paymentInfo.metadata || {};
        const deliveryId = metadata.deliveryId;
        const customerId = metadata.customerId;

        // Update Firestore
        const paymentRef = admin
            .firestore()
            .collection("payments")
            .doc(reference);
        const deliveryRef = admin
            .firestore()
            .collection("deliveries")
            .doc(deliveryId);

        await paymentRef.update({
            status: "paid",
            paidAt: admin.firestore.FieldValue.serverTimestamp(),
            gateway: "paystack",
            gatewayResponse: paymentInfo.gateway_response,
        });

        await deliveryRef.update({
            paymentStatus: "paid",
            status: "active",
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Redirect to success page
        return NextResponse.redirect(new URL("/payment-success", req.url));
    } catch (error) {
        console.error("Paystack verification error:", error.message);
        return NextResponse.redirect(new URL("/payment-error?reason=server_error", req.url));
    }
}
