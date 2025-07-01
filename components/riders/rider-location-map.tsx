"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { subscribeToRiderLocation } from "@/lib/firebase/riders"

export function RiderLocationMap({ riderId }: { riderId: string }) {
  const [location, setLocation] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = subscribeToRiderLocation(riderId, (riderData) => {
      if (riderData?.currentLocation) {
        setLocation(riderData.currentLocation)
      }
      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [riderId])

  return (
    <Card>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="flex h-[400px] items-center justify-center">
            <p>Loading rider location...</p>
          </div>
        ) : !location ? (
          <div className="flex h-[400px] items-center justify-center">
            <p>Location data not available for this rider</p>
          </div>
        ) : (
          <div className="relative h-[400px] w-full rounded-lg border bg-gradient-to-br from-blue-50 to-green-50 overflow-hidden">
            {/* Mock map grid */}
            <div className="absolute inset-0 opacity-10">
              <div className="grid h-full w-full grid-cols-12 grid-rows-12 gap-1">
                {Array.from({ length: 144 }).map((_, i) => (
                  <div key={i} className="border border-gray-300" />
                ))}
              </div>
            </div>

            {/* Mock location marker */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white shadow-lg bg-blue-500">
                <div className="h-4 w-4 rounded-full bg-white"></div>
              </div>
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-black/80 px-2 py-1 text-xs text-white">
                Current Location
              </div>
            </div>

            {/* Map info overlay */}
            <div className="absolute bottom-4 left-4 rounded-lg bg-white/90 p-3 shadow-lg">
              <div className="text-sm font-medium">Live Location</div>
              <div className="text-xs text-muted-foreground">
                Lat: {location.lat?.toFixed(5) || "N/A"}, Lng: {location.lng?.toFixed(5) || "N/A"}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Last updated: {new Date().toLocaleTimeString()}</div>
            </div>

            <div className="absolute bottom-4 right-4 text-xs text-muted-foreground bg-white/80 p-2 rounded">
              Google Maps integration will be added here
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
