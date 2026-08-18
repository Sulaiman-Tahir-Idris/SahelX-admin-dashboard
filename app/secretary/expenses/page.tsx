import { SecretaryDashboardLayout } from "@/components/dashboard/secretary-dashboard-layout"
import { ExpensesPage } from "@/components/finance/expenses-page"

export default function SecretaryExpenses() {
  return (
    <SecretaryDashboardLayout>
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        <ExpensesPage />
      </div>
    </SecretaryDashboardLayout>
  )
}
