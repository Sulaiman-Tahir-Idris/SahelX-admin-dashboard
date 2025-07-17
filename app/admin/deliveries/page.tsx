import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import DeliveriesTable from "@/components/deliveries/deliveries-table"

export default function AdminDeliveries() {
  return (
    <DashboardLayout>
      <div className="flex flex-col space-y-6">
        <h1 className="text-3xl font-bold">Deliveries Management</h1>
        <DeliveriesTable />
      </div>
    </DashboardLayout>
  )
}
