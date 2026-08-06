import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { BankAccountsPage } from "@/components/finance/bank-accounts-page"

export default function AdminBankAccounts() {
  return (
    <DashboardLayout>
      <BankAccountsPage />
    </DashboardLayout>
  )
}
