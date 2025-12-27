import React from "react";
import { CustomerProfile } from "@/components/customers/customer-profile";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";

interface PageProps {
  params: any;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  if (!id || typeof id !== "string") {
    return (
      <DashboardLayout>
        <div className="p-6">Invalid customer ID</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <CustomerProfile customerId={id} />
      </div>
    </DashboardLayout>
  );
}
