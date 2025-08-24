"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { GoogleMap, MarkerF, useLoadScript, InfoWindowF, PolylineF } from "@react-google-maps/api"
import { getDeliveries, type Delivery } from "@/lib/firebase/deliveries"
import { subscribeToRiders, type Rider } from "@/lib/firebase/riders"
import { Loader2 } from "lucide-react"

type Libraries = ("places" | "drawing" | "geometry" | "visualization")[]

interface LocationCoords {
  lat: number
  lng: number
}

interface MapMarker {
  id: string
  type: "pickup" | "dropoff" | "rider"
  name: string
  lat: number
  lng: number
  deliveryId?: string
  status?: string
}

const containerStyle = {
  width: "100%",
  height: "500px",
  borderRadius: "0.5rem",
}

const KANO_CENTER = { lat: 11.9967, lng: 8.5185 }

const libraries: Libraries = ["places"]

export function DeliveryMap() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [riders, setRiders] = useState<Rider[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null)
  const [activeLine, setActiveLine] = useState<string | null>(null)

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries,
  })

  useEffect(() => {
    let unsubscribeRiders: (() => void) | undefined

    const init = async () => {
      setIsLoading(true)
      try {
        const fetchedDeliveries = await getDeliveries()
        setDeliveries(fetchedDeliveries)

        unsubscribeRiders = subscribeToRiders((liveRiders) => {
          setRiders(liveRiders)
        })
      } catch (error) {
        console.error("Error setting up map data:", error)
        setDeliveries([])
        setRiders([])
      } finally {
        setIsLoading(false)
      }
    }

    init()
    return () => {
      if (unsubscribeRiders) unsubscribeRiders()
    }
  }, [])

  const allMarkers: MapMarker[] = useMemo(() => {
    const markers: MapMarker[] = []

    deliveries.forEach((delivery) => {
      if (delivery.pickupLocation && "lat" in delivery.pickupLocation && "lng" in delivery.pickupLocation) {
        markers.push({
          id: `pickup_${delivery.id}`,
          type: "pickup",
          name: `Pickup for ${delivery.id?.substring(0, 8)}...`,
          lat: (delivery.pickupLocation as LocationCoords).lat,
          lng: (delivery.pickupLocation as LocationCoords).lng,
          deliveryId: delivery.id || "",
          status: delivery.status,
        })
      }

      if (delivery.dropoffLocation && "lat" in delivery.dropoffLocation && "lng" in delivery.dropoffLocation) {
        markers.push({
          id: `dropoff_${delivery.id}`,
          type: "dropoff",
          name: `Dropoff for ${delivery.id?.substring(0, 8)}...`,
          lat: (delivery.dropoffLocation as LocationCoords).lat,
          lng: (delivery.dropoffLocation as LocationCoords).lng,
          deliveryId: delivery.id || "",
          status: delivery.status,
        })
      }
    })

    riders.forEach((rider) => {
      const lat = rider.currentLocation?.lat
      const lng = rider.currentLocation?.lng
      if (typeof lat === "number" && typeof lng === "number") {
        markers.push({
          id: `rider_${rider.id}`,
          type: "rider",
          name: rider.displayName || "Rider",
          lat,
          lng,
          status: rider.status || (rider.isAvailable ? "available" : "offline"),
        })
      }
    })

    return markers
  }, [deliveries, riders])

  const mapOptions = useMemo(
    () => ({
      disableDefaultUI: true,
      clickableIcons: false,
      zoomControl: true,
      streetViewControl: false,
      mapTypeControl: false,
      fullscreenControl: false,
      styles: [{ featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] }],
    }),
    [],
  )

  // 👇 assign custom icons per type
  const markerIcon = (type: MapMarker["type"]) => {
    if (type === "pickup") {
      return {
        url: "/icons/pickup.png",
        scaledSize: new window.google.maps.Size(16, 16),
      }
    }
    if (type === "dropoff") {
      return {
        url: "/icons/dropoff.png",
        scaledSize: new window.google.maps.Size(32, 32),
      }
    }
    return {
      url: "/icons/rider.png",
      scaledSize: new window.google.maps.Size(32, 32),
    }
  }

  const handleMarkerClick = (marker: MapMarker) => {
    setSelectedMarker(marker)

    if (marker.type === "pickup" || marker.type === "dropoff") {
      const lineKey = `${marker.type}_${marker.deliveryId}`
      setActiveLine((prev) => (prev === lineKey ? null : lineKey))
    }
  }

  if (loadError) return <div>Error loading maps: {loadError.message}</div>
  if (!isLoaded) return <div>Loading Map...</div>

  return (
    <Card className="col-span-full border-gray-200 bg-white shadow-sm">
      <CardHeader>
        <CardTitle className="text-gray-900">Live Delivery Map</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-[500px]">
            <Loader2 className="h-12 w-12 animate-spin text-gray-400" />
          </div>
        ) : allMarkers.length === 0 ? (
          <div className="flex items-center justify-center h-[500px] text-muted-foreground">
            No locations to display.
          </div>
        ) : (
          <div className="relative h-[300px] md:h-[500px] w-full rounded-lg border overflow-hidden">
            <GoogleMap mapContainerStyle={containerStyle} center={KANO_CENTER} zoom={12} options={mapOptions}>
              {allMarkers.map((marker) => (
                <MarkerF
                  key={marker.id}
                  position={{ lat: marker.lat, lng: marker.lng }}
                  icon={markerIcon(marker.type)}
                  onClick={() => handleMarkerClick(marker)}
                />
              ))}

              {/* Draw line when pickup or dropoff selected */}
              {activeLine &&
                deliveries.map((delivery) => {
                  if (activeLine === `pickup_${delivery.id}`) {
                    return (
                      <PolylineF
                        key={`line_pickup_${delivery.id}`}
                        path={[
                          delivery.pickupLocation as LocationCoords,
                          delivery.dropoffLocation as LocationCoords,
                        ]}
                        options={{ strokeColor: "#2563EB", strokeWeight: 2 }}
                      />
                    )
                  }
                  if (activeLine === `dropoff_${delivery.id}`) {
                    return (
                      <PolylineF
                        key={`line_dropoff_${delivery.id}`}
                        path={[
                          delivery.dropoffLocation as LocationCoords,
                          delivery.pickupLocation as LocationCoords,
                        ]}
                        options={{ strokeColor: "#F97316", strokeWeight: 2 }}
                      />
                    )
                  }
                  return null
                })}

              {selectedMarker && (
                <InfoWindowF
                  position={{ lat: selectedMarker.lat, lng: selectedMarker.lng }}
                  onCloseClick={() => setSelectedMarker(null)}
                >
                  <div className="p-2">
                    <h3 className="font-bold text-sm">{selectedMarker.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {selectedMarker.type === "pickup"
                        ? "Pickup"
                        : selectedMarker.type === "dropoff"
                        ? "Dropoff"
                        : "Rider"}{" "}
                      {selectedMarker.status ? `- ${selectedMarker.status.replace(/_/g, " ")}` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Lat: {selectedMarker.lat.toFixed(4)}, Lng: {selectedMarker.lng.toFixed(4)}
                    </p>
                  </div>
                </InfoWindowF>
              )}
            </GoogleMap>

            {/* Legend */}
            <div className="absolute bottom-2 md:bottom-4 right-2 md:right-4 rounded-lg bg-white/90 p-2 md:p-3 shadow-lg">
              <div className="text-xs md:text-sm font-medium mb-2">Legend</div>
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <img src="/icons/pickup.png" className="h-3 w-3" alt="pickup" />
                  <span className="hidden md:inline">Pickup Locations</span>
                  <span className="md:hidden">Pickup</span>
                </div>
                <div className="flex items-center gap-2">
                  <img src="/icons/dropoff.png" className="h-3 w-3" alt="dropoff" />
                  <span className="hidden md:inline">Dropoff Locations</span>
                  <span className="md:hidden">Dropoff</span>
                </div>
                <div className="flex items-center gap-2">
                  <img src="/icons/rider.png" className="h-3 w-3" alt="rider" />
                  <span className="hidden md:inline">Rider Locations</span>
                  <span className="md:hidden">Riders</span>
                </div>
              </div>
            </div>
          </div>
        )}
        <div className="mt-4 text-center text-xs md:text-sm text-muted-foreground">
          Live map view powered by Google Maps.
        </div>
      </CardContent>
    </Card>
  )
}
