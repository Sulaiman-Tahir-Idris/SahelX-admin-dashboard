"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { RiderProfile } from "@/components/riders/rider-profile"
import { RiderLocationMap } from "@/components/riders/rider-location-map"
import { RiderDeliveryHistory } from "@/components/riders/rider-delivery-history"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { toast } from "@/components/ui/use-toast"
import { getRider, type Rider } from "@/lib/firebase/riders"

export default function RiderDetailPage() {
  const params = useParams()
  const riderId = params.id as string
  const [rider, setRider] = useState<Rider | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (riderId) {
      loadRider()
    }
  }, [riderId])

  const loadRider = async () => {
    try {
      setIsLoading(true)
      const riderData = await getRider(riderId)

      if (!riderData) {
        toast({
          title: "Rider not found",
          description: "The requested rider could not be found.",
          variant: "destructive",
        })
        return
      }

      setRider(riderData)
    } catch (error: any) {
      toast({
        title: "Failed to load rider",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="mt-2 text-sm text-muted-foreground">Loading rider profile...</p>
        </div>
      </div>
    )
  }

  if (!rider) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <h2 className="text-xl font-semibold">Rider Not Found</h2>
        <p className="text-muted-foreground">The requested rider could not be found.</p>
        <Link href="/admin/riders">
          <Button>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Riders
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/riders">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Riders
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Rider Profile</h1>
      </div>

      <RiderProfile rider={rider} />

      <Tabs defaultValue="location">
        <TabsList>
          <TabsTrigger value="location">Live Location</TabsTrigger>
          <TabsTrigger value="history">Delivery History</TabsTrigger>
        </TabsList>
        <TabsContent value="location" className="mt-4">
          <RiderLocationMap riderId={riderId} />
        </TabsContent>
        <TabsContent value="history" className="mt-4">
          <RiderDeliveryHistory riderId={riderId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
