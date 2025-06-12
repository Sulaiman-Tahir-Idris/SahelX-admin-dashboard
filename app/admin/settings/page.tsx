import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { SettingsPage } from "@/components/settings/settings-page"

export default function AdminSettings() {
  return (
    <DashboardLayout>
      <div className="flex flex-col space-y-6">
        <h1 className="text-3xl font-bold">Settings</h1>
        <SettingsPage />
      </div>
    </DashboardLayout>
  )
}
