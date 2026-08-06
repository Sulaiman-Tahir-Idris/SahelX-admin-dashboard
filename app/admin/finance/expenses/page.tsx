import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { ExpensesPage } from "@/components/finance/expenses-page"

export default function AdminExpenses() {
  return (
    <DashboardLayout>
      <ExpensesPage />
    </DashboardLayout>
  )
}
