import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { LiveMapView } from "@/components/live-map/live-map-view"

export default function AdminLiveMap() {
  return (
    <DashboardLayout>
      <div className="flex flex-col space-y-6">
        <h1 className="text-3xl font-bold">Live Tracking Map</h1>
        <LiveMapView />
      </div>
    </DashboardLayout>
  )
}
