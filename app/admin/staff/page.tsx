import { StaffPage } from "@/components/staff/staff-page";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";

export const metadata = {
  title: "Staff Management | Admin Dashboard",
  description: "Manage your staff members.",
};

export default function StaffManagementRoute() {
  return (
    <DashboardLayout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <StaffPage />
      </div>
    </DashboardLayout>
  );
}
