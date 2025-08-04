"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { GoogleMap, MarkerF, useLoadScript, InfoWindowF } from "@react-google-maps/api"
import { getDeliveries, type Delivery } from "@/lib/firebase/deliveries"
import { Loader2 } from "lucide-react"
// Removed import of 'googlemaps' as it's not needed for browser usage

// Define the Libraries type for useLoadScript
type Libraries = ("places" | "drawing" | "geometry" | "visualization")[]

interface LocationCoords {
  lat: number
  lng: number
}

interface MapMarker {
  id: string
  type: "pickup" | "dropoff"
  name: string
  lat: number
  lng: number
  deliveryId: string
  status: string
}

const containerStyle = {
  width: "100%",
  height: "500px",
  borderRadius: "0.5rem",
}

// Center on Kano, Nigeria
const KANO_CENTER = {
  lat: 11.9967,
  lng: 8.5185,
}

// Memoize the libraries array to prevent reloads
const libraries: Libraries = ["places"]

export function DeliveryMap() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null)

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries,
  })

  useEffect(() => {
    const fetchDeliveriesData = async () => {
      setIsLoading(true)
      try {
        const fetchedDeliveries = await getDeliveries()
        setDeliveries(fetchedDeliveries)
      } catch (error) {
        console.error("Error fetching deliveries for map:", error)
        setDeliveries([])
      } finally {
        setIsLoading(false)
      }
    }
    fetchDeliveriesData()
  }, [])

  const allMarkers: MapMarker[] = useMemo(() => {
    const markers: MapMarker[] = []
    deliveries.forEach((delivery) => {
      // Ensure lat/lng exist before adding marker
      if (
        delivery.pickupLocation &&
        typeof delivery.pickupLocation === "object" &&
        "lat" in delivery.pickupLocation &&
        "lng" in delivery.pickupLocation 
      ) {
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
      if (
        delivery.dropoffLocation &&
        typeof delivery.dropoffLocation === "object" &&
        "lat" in delivery.dropoffLocation &&
        "lng" in delivery.dropoffLocation
      ) {
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
    return markers
  }, [deliveries])

  const mapOptions = useMemo(
    () => ({
      disableDefaultUI: true,
      clickableIcons: false,
      zoomControl: true,
      streetViewControl: false,
      mapTypeControl: false,
      fullscreenControl: false,
      styles: [
        {
          featureType: "poi",
          elementType: "labels",
          stylers: [{ visibility: "off" }],
        },
      ],
    }),
    [],
  )

  const onLoad = useCallback(function callback(map: google.maps.Map) {
    // This is called once the map instance is available
  }, [])

  const onUnmount = useCallback(function callback(map: google.maps.Map) {
    // This is called when the map component unmounts
  }, [])
  // If you get a type error for google.maps.Map, you can use 'any' or import types from @react-google-maps/api

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
            No delivery locations to display.
          </div>
        ) : (
          <div className="relative h-[300px] md:h-[500px] w-full rounded-lg border overflow-hidden">
            <GoogleMap
              mapContainerStyle={containerStyle}
              center={KANO_CENTER} // Centered on Kano
              zoom={12}
              options={mapOptions}
              onLoad={onLoad}
              onUnmount={onUnmount}
            >
              {allMarkers.map((marker) => (
                <MarkerF
                  key={marker.id}
                  position={{ lat: marker.lat, lng: marker.lng }}
                  icon={{
                    path: (window.google?.maps?.SymbolPath?.CIRCLE) ?? 0, // Use window.google.maps.SymbolPath.CIRCLE
                    scale: 10,
                    fillColor: marker.type === "pickup" ? "#F59E0B" : "#8B5CF6", // Amber for pickup, Purple for dropoff
                    fillOpacity: 1,
                    strokeWeight: 0,
                  }}
                />
              ))}

              {selectedMarker && (
                <InfoWindowF
                  position={{ lat: selectedMarker.lat, lng: selectedMarker.lng }}
                  onCloseClick={() => setSelectedMarker(null)}
                >
                  <div className="p-2">
                    <h3 className="font-bold text-sm">{selectedMarker.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {selectedMarker.type === "pickup" ? "Pickup" : "Dropoff"} -{" "}
                      {selectedMarker.status.replace(/_/g, " ")}
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
                  <div className="h-2 w-2 md:h-3 md:w-3 rounded-full bg-amber-500"></div>
                  <span className="hidden md:inline">Pickup Locations</span>
                  <span className="md:hidden">Pickup</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 md:h-3 md:w-3 rounded-full bg-purple-500"></div>
                  <span className="hidden md:inline">Dropoff Locations</span>
                  <span className="md:hidden">Dropoff</span>
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
