import { SecretaryDashboardLayout } from "@/components/dashboard/secretary-dashboard-layout";
import DeliveriesByTag from "@/components/multiple-deliveries/multiple-deliveries-table";

export default function AdminDeliveries() {
  return (
    <SecretaryDashboardLayout>
      <div className="flex flex-col space-y-6">
        <h1 className="text-3xl font-bold">Multiple Deliveries Management</h1>
        <DeliveriesByTag />
      </div>
    </SecretaryDashboardLayout>
  );
}
