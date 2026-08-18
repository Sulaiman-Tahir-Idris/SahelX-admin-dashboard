import React from "react";
import { SecretaryDashboardLayout } from "@/components/dashboard/secretary-dashboard-layout";
import { RiderProfile } from "@/components/riders/rider-profile";

interface PageProps {
  params: any;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  if (!id || typeof id !== "string") {
    return (
      <SecretaryDashboardLayout>
        <div className="p-6">Invalid rider ID</div>
      </SecretaryDashboardLayout>
    );
  }

  return (
    <SecretaryDashboardLayout>
      <div className="p-6">
        <RiderProfile riderId={id} />
      </div>
    </SecretaryDashboardLayout>
  );
}
