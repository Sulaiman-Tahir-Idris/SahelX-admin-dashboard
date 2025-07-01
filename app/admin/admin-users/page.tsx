import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { AdminUsersPage } from "@/components/admin/admin-users-page"

export default function AdminUsers() {
  return (
    <DashboardLayout>
      <div className="flex flex-col space-y-6">
        <h1 className="text-3xl font-bold">Admin Users Management</h1>
        <AdminUsersPage />
      </div>
    </DashboardLayout>
  )
}
