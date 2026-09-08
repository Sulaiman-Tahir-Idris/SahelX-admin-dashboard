export type CanonicalStatus = "pending" | "picked_up" | "in_transit" | "delivered" | "cancelled";

export function generateTrackingId(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "SHX";
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function normalizeStatus(raw: string | null | undefined): CanonicalStatus {
  const lower = (raw || "").toLowerCase();
  if (["pending", "assigned"].includes(lower)) return "pending";
  if (["picked_up", "picked"].includes(lower)) return "picked_up";
  if (["in_transit", "active", "at_station", "out_for_delivery", "enroutetodestination", "enroutetopickup"].includes(lower)) return "in_transit";
  if (["delivered", "received"].includes(lower)) return "delivered";
  if (["cancelled", "canceled", "returned"].includes(lower)) return "cancelled";
  return "pending"; // Default
}

export function getStatusDisplay(status: CanonicalStatus) {
  switch (status) {
    case "pending": return { label: "Pending", emoji: "🟡", color: "text-amber-600", bg: "bg-amber-100" };
    case "picked_up": return { label: "Picked Up", emoji: "🔵", color: "text-blue-600", bg: "bg-blue-100" };
    case "in_transit": return { label: "In Transit", emoji: "🔵", color: "text-blue-600", bg: "bg-blue-100" };
    case "delivered": return { label: "Delivered", emoji: "🟢", color: "text-green-600", bg: "bg-green-100" };
    case "cancelled": return { label: "Cancelled", emoji: "🔴", color: "text-red-600", bg: "bg-red-100" };
    default: return { label: "Pending", emoji: "🟡", color: "text-amber-600", bg: "bg-amber-100" };
  }
}
