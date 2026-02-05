import { SecretaryDashboardLayout } from "@/components/dashboard/secretary-dashboard-layout";
import { OverviewStats } from "@/components/dashboard/overview-stats";
import { RecentDeliveries } from "@/components/dashboard/recent-deliveries";
import { RiderStatusChart } from "@/components/dashboard/rider-status-chart";
import { DeliveryMap } from "@/components/dashboard/delivery-map";
import { Calendar } from "lucide-react";

export default function SecretaryDashboard() {
  return (
    <SecretaryDashboardLayout>
      <div className="flex flex-col space-y-8 p-0 md:p-2 bg-grid-pattern min-h-screen">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">
              Welcome Back
            </h1>
            <p className="text-lg text-muted-foreground font-medium">
              Daily operation overview for SahelX logistics.
            </p>
          </div>
          <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-2xl shadow-sm border border-gray-100">
            <Calendar className="h-5 w-5 text-sahelx-600" />
            <span className="text-sm font-semibold text-gray-700">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
        </div>

        <OverviewStats />

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-sahelx-600" />
              Recent Operations
            </h2>
            <RecentDeliveries />
          </div>
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-sahelx-600" />
              Logistics Network Status
            </h2>
            <RiderStatusChart />
          </div>
        </div>

        <div className="space-y-4 pt-4">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-sahelx-600" />
            Live Logistics Intelligence
          </h2>
          <div className="rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
            <DeliveryMap />
          </div>
        </div>
      </div>
    </SecretaryDashboardLayout>
  );
}
