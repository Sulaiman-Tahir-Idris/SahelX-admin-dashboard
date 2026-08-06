import { redirect } from "next/navigation"

// Redirect /admin/finance → /admin/finance/dashboard
// This avoids the isActive conflict where /admin/finance would match
// all /admin/finance/* routes in the sidebar's startsWith check.
export default function FinanceRoot() {
  redirect("/admin/finance/dashboard")
}
