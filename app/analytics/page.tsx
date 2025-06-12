import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { AnalyticsDashboard } from "@/components/analytics/analytics-dashboard"

export default function Analytics() {
  return (
    <DashboardLayout>
      <div className="flex flex-col space-y-6">
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <AnalyticsDashboard />
      </div>
    </DashboardLayout>
  )
}
