import { SecretaryDashboardLayout } from "@/components/dashboard/secretary-dashboard-layout";
import { CustomersTable } from "@/components/customers/customers-table";

export default function AdminCustomers() {
  return (
    <SecretaryDashboardLayout>
      <div className="flex flex-col space-y-6">
        <h1 className="text-3xl font-bold">Customers Management</h1>
        <CustomersTable />
      </div>
    </SecretaryDashboardLayout>
  );
}
