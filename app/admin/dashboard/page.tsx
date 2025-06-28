import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { OverviewStats } from "@/components/dashboard/overview-stats"
import { RecentDeliveries } from "@/components/dashboard/recent-deliveries"
import { RiderStatusChart } from "@/components/dashboard/rider-status-chart"
import { DeliveryMap } from "@/components/dashboard/delivery-map"
import { FirebaseDebug } from "@/components/debug/firebase-debug"

export default function AdminDashboard() {
  return (
    <DashboardLayout>
      <div className="flex flex-col space-y-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <OverviewStats />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <RecentDeliveries />
          <RiderStatusChart />
        </div>
        <DeliveryMap />
      </div>
      <FirebaseDebug />
    </DashboardLayout>
  )
}
