import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { CashBookPage } from "@/components/finance/cash-book-page"

export default function AdminCashBook() {
  return (
    <DashboardLayout>
      <CashBookPage />
    </DashboardLayout>
  )
}
