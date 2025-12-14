import { SecretaryDashboardLayout } from "@/components/dashboard/secretary-dashboard-layout";
import DeliveriesTable from "@/components/deliveries/deliveries-table";

export default function AdminDeliveries() {
  return (
    <SecretaryDashboardLayout>
      <div className="flex flex-col space-y-6">
        <h1 className="text-3xl font-bold">Deliveries Management</h1>
        <DeliveriesTable />
      </div>
    </SecretaryDashboardLayout>
  );
}
