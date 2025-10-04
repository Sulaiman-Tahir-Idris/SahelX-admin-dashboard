export default function PaymentError({ searchParams }) {
    return (
        <div className="text-center p-8">
            <h1 className="text-2xl font-bold text-red-600">❌ Payment Failed</h1>
            <p className="mt-4">Reason: {searchParams?.reason || "Unknown error"}</p>
        </div>
    );
}
