"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MapPin, Truck, Package } from "lucide-react"

export function DeliveryMap() {
  const [mapView, setMapView] = useState<"all" | "riders" | "deliveries">("all")

  // Mock data for preview - replace with Google Maps integration later
  const mockLocations = [
    { id: "rider_001", type: "rider", name: "John Rider", lat: 6.5244, lng: 3.3792, status: "available" },
    { id: "rider_002", type: "rider", name: "Jane Rider", lat: 6.5344, lng: 3.3892, status: "on_delivery" },
    { id: "delivery_001", type: "delivery", name: "Delivery #001", lat: 6.5144, lng: 3.3692, status: "in_transit" },
    { id: "delivery_002", type: "delivery", name: "Delivery #002", lat: 6.5444, lng: 3.3992, status: "accepted" },
  ]

  const filteredLocations = mockLocations.filter((location) => {
    if (mapView === "all") return true
    return location.type === mapView.slice(0, -1) // remove 's' from 'riders' or 'deliveries'
  })

  return (
    <Card className="col-span-full border-gray-200 bg-white shadow-sm">
      <CardHeader>
        <CardTitle className="text-gray-900">Live Delivery Map</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs
          defaultValue="all"
          className="mb-4"
          onValueChange={(value) => setMapView(value as "all" | "riders" | "deliveries")}
        >
          <TabsList className="grid w-full grid-cols-3 md:w-auto md:grid-cols-none">
            <TabsTrigger value="all" className="text-xs md:text-sm">
              All
            </TabsTrigger>
            <TabsTrigger value="riders" className="text-xs md:text-sm">
              Riders
            </TabsTrigger>
            <TabsTrigger value="deliveries" className="text-xs md:text-sm">
              Deliveries
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Mock map placeholder - replace with Google Maps component later */}
        <div className="relative h-[300px] md:h-[500px] w-full rounded-lg border bg-gradient-to-br from-blue-50 to-green-50 dark:from-blue-950 dark:to-green-950 overflow-hidden">
          {/* Mock map grid */}
          <div className="absolute inset-0 opacity-10">
            <div className="grid h-full w-full grid-cols-10 grid-rows-10 gap-1">
              {Array.from({ length: 100 }).map((_, i) => (
                <div key={i} className="border border-gray-300" />
              ))}
            </div>
          </div>

          {/* Mock location markers */}
          {filteredLocations.map((location, index) => (
            <div
              key={location.id}
              className="absolute flex items-center justify-center"
              style={{
                left: `${20 + (index % 4) * 20}%`,
                top: `${20 + Math.floor(index / 4) * 20}%`,
              }}
            >
              <div className="relative">
                <div
                  className={`flex h-6 w-6 md:h-8 md:w-8 items-center justify-center rounded-full border-2 border-white shadow-lg ${
                    location.type === "rider"
                      ? location.status === "available"
                        ? "bg-green-500"
                        : "bg-blue-500"
                      : "bg-purple-500"
                  }`}
                >
                  {location.type === "rider" ? (
                    <Truck className="h-3 w-3 md:h-4 md:w-4 text-white" />
                  ) : (
                    <Package className="h-3 w-3 md:h-4 md:w-4 text-white" />
                  )}
                </div>
                <div className="absolute -bottom-6 md:-bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-black/80 px-2 py-1 text-xs text-white hidden md:block">
                  {location.name}
                </div>
              </div>
            </div>
          ))}

          {/* Map center indicator */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <MapPin className="h-4 w-4 md:h-6 md:w-6 text-red-500" />
            <div className="absolute -bottom-4 md:-bottom-6 left-1/2 -translate-x-1/2 text-xs font-medium">
              Lagos, Nigeria
            </div>
          </div>

          {/* Map overlay info */}
          <div className="absolute bottom-2 md:bottom-4 left-2 md:left-4 rounded-lg bg-white/90 p-2 md:p-3 shadow-lg dark:bg-black/90">
            <div className="text-xs md:text-sm font-medium">Live Tracking</div>
            <div className="text-xs text-muted-foreground">
              Showing {filteredLocations.length} {mapView === "all" ? "locations" : mapView}
            </div>
          </div>

          {/* Legend */}
          <div className="absolute bottom-2 md:bottom-4 right-2 md:right-4 rounded-lg bg-white/90 p-2 md:p-3 shadow-lg dark:bg-black/90">
            <div className="text-xs md:text-sm font-medium mb-2">Legend</div>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 md:h-3 md:w-3 rounded-full bg-green-500"></div>
                <span className="hidden md:inline">Available Riders</span>
                <span className="md:hidden">Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 md:h-3 md:w-3 rounded-full bg-blue-500"></div>
                <span className="hidden md:inline">Busy Riders</span>
                <span className="md:hidden">Busy</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 md:h-3 md:w-3 rounded-full bg-purple-500"></div>
                <span className="hidden md:inline">Active Deliveries</span>
                <span className="md:hidden">Deliveries</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 text-center text-xs md:text-sm text-muted-foreground">
          {/* Firebase integration comment */}
          {/* Google Maps integration will be added here with real-time location updates */}
          Mock map view - Google Maps integration will replace this placeholder
        </div>
      </CardContent>
    </Card>
  )
}
