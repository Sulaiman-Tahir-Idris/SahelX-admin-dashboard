import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import DeliveriesTable from "@/components/deliveries/deliveries-table"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { PlusCircle } from "lucide-react"

export default function AdminDeliveries() {
  return (
    <DashboardLayout>
      <div className="flex flex-col space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Deliveries Management</h1>
          <Button asChild>
            <Link href="/admin/create-delivery">
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Delivery
            </Link>
          </Button>
        </div>
        <DeliveriesTable />
      </div>
    </DashboardLayout>
  )
}
