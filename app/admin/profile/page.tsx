import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { AdminProfile } from "@/components/admin/admin-profile"

export default function AdminProfilePage() {
  return (
    <DashboardLayout>
      <div className="flex flex-col space-y-6">
        <h1 className="text-3xl font-bold text-red-900 dark:text-red-100">Admin Profile</h1>
        <AdminProfile />
      </div>
    </DashboardLayout>
  )
}
