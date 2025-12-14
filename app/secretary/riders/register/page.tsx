import { SecretaryDashboardLayout } from "@/components/dashboard/secretary-dashboard-layout";
import { CourierRegistrationForm } from "@/components/riders/courier-registration-form";

export default function AdminRegisterRider() {
  return (
    <SecretaryDashboardLayout>
      <div className="flex flex-col space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Register New Courier</h1>
        </div>
        <CourierRegistrationForm />
      </div>
    </SecretaryDashboardLayout>
  );
}
