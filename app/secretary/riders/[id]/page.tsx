import RiderDetailPage from "@/app/admin/riders/[id]/page";
import { SecretaryDashboardLayout } from "@/components/dashboard/secretary-dashboard-layout";

export default function AdminRiderDetail() {
  return (
    <SecretaryDashboardLayout>
      <RiderDetailPage />
    </SecretaryDashboardLayout>
  );
}
