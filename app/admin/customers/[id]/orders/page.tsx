import React from "react";
import { CustomerOrderHistory } from "@/components/customers/customer-order-history";
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
        <CustomerOrderHistory customerId={id} />
      </div>
    </DashboardLayout>
  );
}
