import type { Metadata } from "next"
import { RiderProfile } from "@/components/riders/rider-profile"
import { RiderLocationMap } from "@/components/riders/rider-location-map"
import { RiderDeliveryHistory } from "@/components/riders/rider-delivery-history"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getRider } from "@/lib/firebase/riders"

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const rider = await getRider(params.id)
  return {
    title: `${rider?.fullName || "Rider Profile"} - Sahel X Logistics`,
    description: `Rider profile for ${rider?.fullName}`,
  }
}

export default async function RiderDetailPage({ params }: { params: { id: string } }) {
  const rider = await getRider(params.id)

  if (!rider) {
    return <div>Rider not found</div>
  }

  return (
    <div className="flex flex-col space-y-6">
      <h1 className="text-3xl font-bold">Rider Profile</h1>
      <RiderProfile rider={rider} />
      <Tabs defaultValue="location">
        <TabsList>
          <TabsTrigger value="location">Live Location</TabsTrigger>
          <TabsTrigger value="history">Delivery History</TabsTrigger>
        </TabsList>
        <TabsContent value="location" className="mt-4">
          <RiderLocationMap riderId={params.id} />
        </TabsContent>
        <TabsContent value="history" className="mt-4">
          <RiderDeliveryHistory riderId={params.id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
