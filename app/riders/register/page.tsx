import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { CourierRegistrationForm } from "@/components/riders/courier-registration-form"

export default function RegisterRider() {
  return (
    <DashboardLayout>
      <div className="flex flex-col space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Register New Rider</h1>
        </div>
        <CourierRegistrationForm />
      </div>
    </DashboardLayout>
  )
}
