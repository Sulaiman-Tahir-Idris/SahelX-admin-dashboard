import type { Metadata } from "next"
import { CustomerProfile } from "@/components/customers/customer-profile"
import { CustomerOrderHistory } from "@/components/customers/customer-order-history"
import { CustomerAnalytics } from "@/components/customers/customer-analytics"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getCustomer } from "@/lib/firebase/customers"

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const customer = await getCustomer(params.id)
  return {
    title: `${customer?.fullName || "Customer Profile"} - Sahel X Logistics`,
    description: `Customer profile for ${customer?.fullName}`,
  }
}

export default async function CustomerDetailPage({ params }: { params: { id: string } }) {
  const customer = await getCustomer(params.id)

  if (!customer) {
    return <div>Customer not found</div>
  }

  return (
    <div className="flex flex-col space-y-6">
      <h1 className="text-3xl font-bold">Customer Profile</h1>
      <CustomerProfile customer={customer} />
      <Tabs defaultValue="orders">
        <TabsList>
          <TabsTrigger value="orders">Order History</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        <TabsContent value="orders" className="mt-4">
          <CustomerOrderHistory customerId={params.id} />
        </TabsContent>
        <TabsContent value="analytics" className="mt-4">
          <CustomerAnalytics customerId={params.id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
