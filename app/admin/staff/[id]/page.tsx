import { StaffDetailPage } from "@/components/staff/staff-detail";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";

export const metadata = {
  title: "Staff Details | Admin Dashboard",
  description: "View and edit staff details.",
};

export default async function StaffDetailRoute({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return (
    <DashboardLayout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <StaffDetailPage id={resolvedParams.id} />
      </div>
    </DashboardLayout>
  );
}
