import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import DeliveriesByTag from "@/components/multiple-deliveries/multiple-deliveries-table"

export default function AdminDeliveries() {
  return (
    <DashboardLayout>
      <div className="flex flex-col space-y-6">
        <h1 className="text-3xl font-bold">Multiple Deliveries Management</h1>
        <DeliveriesByTag />
      </div>
    </DashboardLayout>
  )
}
