import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { FirebaseSettingsPage } from "@/components/settings/firebase-settings-page"

export default function AdminSettings() {
  return (
    <DashboardLayout>
      <div className="flex flex-col space-y-6">
        <h1 className="text-3xl font-bold">Settings</h1>
        <FirebaseSettingsPage />
      </div>
    </DashboardLayout>
  )
}
