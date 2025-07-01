import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { RevenuePage } from "@/components/revenue/revenue-page"

export default function AdminRevenue() {
  return (
    <DashboardLayout>
      <div className="flex flex-col space-y-6">
        <h1 className="text-3xl font-bold">Revenue Dashboard</h1>
        <RevenuePage />
      </div>
    </DashboardLayout>
  )
}
