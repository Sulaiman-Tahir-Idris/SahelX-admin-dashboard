"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { GoogleMap, LoadScript, Marker, InfoWindow } from "@react-google-maps/api"
import { subscribeToRiderLocation } from "@/lib/firebase/riders"
import { google } from "googlemaps"

const mapContainerStyle = {
  width: "100%",
  height: "400px",
}

export function RiderLocationMap({ riderId }: { riderId: string }) {
  const [location, setLocation] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showInfo, setShowInfo] = useState(false)

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
          <LoadScript googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""}>
            <GoogleMap mapContainerStyle={mapContainerStyle} center={location} zoom={15}>
              <Marker
                position={location}
                icon={{
                  url: "/icons/bike-marker.svg",
                  scaledSize: new google.maps.Size(40, 40),
                }}
                onClick={() => setShowInfo(!showInfo)}
              >
                {showInfo && (
                  <InfoWindow onCloseClick={() => setShowInfo(false)}>
                    <div>
                      <p className="font-medium">Current Location</p>
                      <p className="text-sm">
                        Lat: {location.lat.toFixed(5)}, Lng: {location.lng.toFixed(5)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Last updated: {new Date().toLocaleTimeString()}
                      </p>
                    </div>
                  </InfoWindow>
                )}
              </Marker>
            </GoogleMap>
          </LoadScript>
        )}
      </CardContent>
    </Card>
  )
}
