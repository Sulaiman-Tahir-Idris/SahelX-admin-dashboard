import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { FinanceDashboardPage } from "@/components/finance/finance-dashboard-page"

export default function AdminFinanceDashboard() {
  return (
    <DashboardLayout>
      <FinanceDashboardPage />
    </DashboardLayout>
  )
}
