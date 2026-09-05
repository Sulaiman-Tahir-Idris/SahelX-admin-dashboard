import { SecretaryDashboardLayout } from "@/components/dashboard/secretary-dashboard-layout"
import { ExpensesPage } from "@/components/finance/expenses-page"

export default function SecretaryExpenses() {
  return (
    <SecretaryDashboardLayout>
      <div className="w-full min-w-0">
        <ExpensesPage />
      </div>
    </SecretaryDashboardLayout>
  )
}
