import React from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { RiderDeliveryHistory } from "@/components/riders/rider-delivery-history";

interface PageProps {
  params: any;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  if (!id || typeof id !== "string") {
    return (
      <DashboardLayout>
        <div className="p-6">Invalid rider ID</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <RiderDeliveryHistory riderId={id} />
      </div>
    </DashboardLayout>
  );
}
