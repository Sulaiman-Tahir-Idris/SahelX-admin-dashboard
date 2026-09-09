import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { LiveMapView } from "@/components/live-map/live-map-view"

export default function AdminLiveMap() {
  return (
    <DashboardLayout>
      <div className="h-full w-full">
        <LiveMapView />
      </div>
    </DashboardLayout>
  )
}
