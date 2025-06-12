import type { Metadata } from "next"
import { DeliveriesTable } from "@/components/deliveries/deliveries-table"

export const metadata: Metadata = {
  title: "Deliveries - Sahel X Logistics",
  description: "View and manage deliveries for Sahel X Logistics",
}

export default function DeliveriesPage() {
  return (
    <div className="flex flex-col space-y-6">
      <h1 className="text-3xl font-bold">Deliveries Management</h1>
      <DeliveriesTable />
    </div>
  )
}
