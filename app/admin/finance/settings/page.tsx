import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { FinanceSettingsPage } from "@/components/finance/finance-settings-page"

export default function AdminFinanceSettings() {
  return (
    <DashboardLayout>
      <FinanceSettingsPage />
    </DashboardLayout>
  )
}
