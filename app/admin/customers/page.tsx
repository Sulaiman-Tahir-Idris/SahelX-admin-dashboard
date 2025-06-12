import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { CustomersTable } from "@/components/customers/customers-table"

export default function AdminCustomers() {
  return (
    <DashboardLayout>
      <div className="flex flex-col space-y-6">
        <h1 className="text-3xl font-bold">Customers Management</h1>
        <CustomersTable />
      </div>
    </DashboardLayout>
  )
}
