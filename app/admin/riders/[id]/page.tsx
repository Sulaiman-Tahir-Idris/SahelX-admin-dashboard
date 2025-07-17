import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import RiderDetailPage from "@/app/admin/riders/[id]/page"

export default function AdminRiderDetail() {
  return (
    <DashboardLayout>
      <RiderDetailPage />
    </DashboardLayout>
  )
}
