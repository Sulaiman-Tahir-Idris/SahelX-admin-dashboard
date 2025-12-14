import { RidersPage } from "@/components/riders/riders-page";
import { SecretaryDashboardLayout } from "@/components/dashboard/secretary-dashboard-layout";

export default function AdminRiders() {
  return (
    <SecretaryDashboardLayout>
      <RidersPage />
    </SecretaryDashboardLayout>
  );
}
