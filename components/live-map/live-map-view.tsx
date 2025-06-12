"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Truck, Package, Navigation } from "lucide-react"

export function LiveMapView() {
  const [mapView, setMapView] = useState<"all" | "riders" | "deliveries">("all")

  // Mock data for preview
  const mockLocations = [
    { id: "rider_001", type: "rider", name: "John Rider", lat: 6.5244, lng: 3.3792, status: "available" },
    { id: "rider_002", type: "rider", name: "Jane Rider", lat: 6.5344, lng: 3.3892, status: "on_delivery" },
    { id: "rider_003", type: "rider", name: "Mike Johnson", lat: 6.5144, lng: 3.3692, status: "available" },
    { id: "delivery_001", type: "delivery", name: "Delivery #001", lat: 6.5444, lng: 3.3992, status: "in_transit" },
    { id: "delivery_002", type: "delivery", name: "Delivery #002", lat: 6.5044, lng: 3.3592, status: "accepted" },
  ]

  const filteredLocations = mockLocations.filter((location) => {
    if (mapView === "all") return true
    return location.type === mapView.slice(0, -1)
  })

  return (
    <div className="space-y-6">
      <Tabs defaultValue="all" onValueChange={(value) => setMapView(value as "all" | "riders" | "deliveries")}>
        <TabsList>
          <TabsTrigger value="all">All Locations</TabsTrigger>
          <TabsTrigger value="riders">Riders Only</TabsTrigger>
          <TabsTrigger value="deliveries">Deliveries Only</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Live Map</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Enhanced mock map placeholder */}
              <div className="relative h-[600px] w-full rounded-lg border bg-gradient-to-br from-blue-50 to-green-50 dark:from-blue-950 dark:to-green-950 overflow-hidden">
                {/* Mock map grid */}
                <div className="absolute inset-0 opacity-10">
                  <div className="grid h-full w-full grid-cols-12 grid-rows-12 gap-1">
                    {Array.from({ length: 144 }).map((_, i) => (
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
                      left: `${15 + (index % 5) * 15}%`,
                      top: `${15 + Math.floor(index / 5) * 15}%`,
                    }}
                  >
                    <div className="relative group">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full border-2 border-white shadow-lg cursor-pointer transition-transform hover:scale-110 ${
                          location.type === "rider"
                            ? location.status === "available"
                              ? "bg-green-500"
                              : "bg-blue-500"
                            : "bg-purple-500"
                        }`}
                      >
                        {location.type === "rider" ? (
                          <Truck className="h-5 w-5 text-white" />
                        ) : (
                          <Package className="h-5 w-5 text-white" />
                        )}
                      </div>

                      {/* Tooltip on hover */}
                      <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 text-white px-2 py-1 rounded text-xs whitespace-nowrap z-10">
                        <div className="font-medium">{location.name}</div>
                        <div className="text-xs">{location.status}</div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Map center indicator */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                  <Navigation className="h-6 w-6 text-red-500" />
                  <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs font-medium">Lagos, Nigeria</div>
                </div>

                {/* Map controls */}
                <div className="absolute top-4 right-4 flex flex-col gap-2">
                  <div className="bg-white/90 dark:bg-black/90 rounded-lg p-2 shadow-lg">
                    <div className="text-xs font-medium">Zoom Controls</div>
                    <div className="flex flex-col gap-1 mt-1">
                      <button className="w-8 h-8 bg-white dark:bg-gray-800 border rounded text-sm hover:bg-gray-50">
                        +
                      </button>
                      <button className="w-8 h-8 bg-white dark:bg-gray-800 border rounded text-sm hover:bg-gray-50">
                        -
                      </button>
                    </div>
                  </div>
                </div>

                {/* Map info overlay */}
                <div className="absolute bottom-4 left-4 rounded-lg bg-white/90 dark:bg-black/90 p-3 shadow-lg">
                  <div className="text-sm font-medium">Live Tracking</div>
                  <div className="text-xs text-muted-foreground">
                    Showing {filteredLocations.length} {mapView === "all" ? "locations" : mapView}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Last updated: {new Date().toLocaleTimeString()}
                  </div>
                </div>

                {/* Legend */}
                <div className="absolute bottom-4 right-4 rounded-lg bg-white/90 dark:bg-black/90 p-3 shadow-lg">
                  <div className="text-sm font-medium mb-2">Legend</div>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-green-500"></div>
                      <span>Available Riders</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                      <span>Busy Riders</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-purple-500"></div>
                      <span>Active Deliveries</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Active Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredLocations.map((location) => (
                  <div key={location.id} className="flex items-center justify-between p-2 rounded-lg border">
                    <div className="flex items-center gap-2">
                      {location.type === "rider" ? (
                        <Truck className="h-4 w-4 text-blue-500" />
                      ) : (
                        <Package className="h-4 w-4 text-purple-500" />
                      )}
                      <div>
                        <div className="text-sm font-medium">{location.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                        </div>
                      </div>
                    </div>
                    <Badge
                      className={
                        location.status === "available"
                          ? "bg-green-500"
                          : location.status === "on_delivery"
                            ? "bg-blue-500"
                            : "bg-purple-500"
                      }
                      variant="secondary"
                    >
                      {location.status.replace("_", " ")}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
