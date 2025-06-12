import type { Metadata } from "next"
import { DeliveryAnalytics } from "@/components/analytics/delivery-analytics"
import { RiderAnalytics } from "@/components/analytics/rider-analytics"
import { CustomerAnalytics } from "@/components/analytics/customer-analytics"
import { RevenueAnalytics } from "@/components/analytics/revenue-analytics"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export const metadata: Metadata = {
  title: "Analytics - Sahel X Logistics",
  description: "Analytics dashboard for Sahel X Logistics",
}

export default function AnalyticsPage() {
  return (
    <div className="flex flex-col space-y-6">
      <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
      <Tabs defaultValue="deliveries">
        <TabsList>
          <TabsTrigger value="deliveries">Deliveries</TabsTrigger>
          <TabsTrigger value="riders">Riders</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
        </TabsList>
        <TabsContent value="deliveries" className="mt-4">
          <DeliveryAnalytics />
        </TabsContent>
        <TabsContent value="riders" className="mt-4">
          <RiderAnalytics />
        </TabsContent>
        <TabsContent value="customers" className="mt-4">
          <CustomerAnalytics />
        </TabsContent>
        <TabsContent value="revenue" className="mt-4">
          <RevenueAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  )
}
