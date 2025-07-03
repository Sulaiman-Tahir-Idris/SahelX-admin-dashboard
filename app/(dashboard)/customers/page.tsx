import type { Metadata } from "next"
import { CustomersTable } from "@/components/customers/customers-table"

export const metadata: Metadata = {
  title: "Customers - Sahel X",
  description: "View and manage customers for Sahel X",
}

export default function CustomersPage() {
  return (
    <div className="flex flex-col space-y-6">
      <h1 className="text-3xl font-bold">Customers Management</h1>
      <CustomersTable />
    </div>
  )
}
