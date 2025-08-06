"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Truck, Package } from "lucide-react"
import { GoogleMap, MarkerF, useLoadScript, InfoWindowF } from "@react-google-maps/api"
import { getRiders, type Rider } from "@/lib/firebase/riders"
import { getDeliveries, type Delivery } from "@/lib/firebase/deliveries"
// Removed import of 'googlemaps' as it's not needed with @react-google-maps/api

// Define the Libraries type for useLoadScript
type Libraries = ("places" | "drawing" | "geometry" | "visualization")[]

interface LocationCoords {
  lat: number
  lng: number
}

interface MapMarker {
  id: string
  type: "rider" | "pickup" | "dropoff"
  name: string
  lat: number
  lng: number
  status?: string // For riders and deliveries
  deliveryId?: string // Link to delivery for pickup/dropoff
  Address?: string // Optional address for display
}

const containerStyle = {
  width: "100%",
  height: "600px",
  borderRadius: "0.5rem",
}

const kanoCenter = {
  lat: 12.0, // Latitude for Kano, Nigeria
  lng: 8.5167, // Longitude for Kano, Nigeria
}

export function LiveMapView() {
  const [mapView, setMapView] = useState<"all" | "pickup" | "dropoff">("all")
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null)
  const [riders, setRiders] = useState<Rider[]>([])
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const libraries = useMemo<Libraries>(() => ["places"], []) // Memoize libraries array
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries,
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const fetchedRiders = await getRiders()
        const fetchedDeliveries = await getDeliveries()
        setRiders(fetchedRiders)
        setDeliveries(fetchedDeliveries)
      } catch (err) {
        console.error("Failed to fetch data:", err)
        setError("Failed to load data. Please try again.")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const allMarkers: MapMarker[] = useMemo(() => {
    const markers: MapMarker[] = []

    riders.forEach((rider) => {
      if (rider.currentLocation?.lat && rider.currentLocation?.lng) {
        markers.push({
          id: rider.id || `rider_${rider.userId}`,
          type: "rider",
          name: rider.displayName,
          lat: rider.currentLocation.lat,
          lng: rider.currentLocation.lng,
          status: rider.status,
        })
      }
    })

    deliveries.forEach((delivery) => {
      if (delivery.pickupLocation && delivery.dropoffLocation) {
        markers.push({
          id: `pickup_${delivery.id}`,
          type: "pickup",
          name: `Delivery ${delivery.id} (Pickup)`,
          lat: delivery.pickupLocation.lat || 0,
          lng: delivery.pickupLocation.lng || 0,
          status: delivery.status,
          deliveryId: delivery.id,
          Address: delivery.pickupLocation.address || "Not available", // <-- Pass real address here
        })
        markers.push({
          id: `dropoff_${delivery.id}`,
          type: "dropoff",
          name: `Delivery ${delivery.id} (Dropoff)`,
          lat: delivery.dropoffLocation.lat || 0,
          lng: delivery.dropoffLocation.lng || 0,
          status: delivery.status,
          deliveryId: delivery.id,
          Address: delivery.dropoffLocation.address || "Not available", // <-- Pass real address here
        })
      }
    })
    return markers
  }, [riders, deliveries])

  const filteredMarkers = useMemo(() => {
    if (mapView === "all") return allMarkers
    return allMarkers.filter((marker) => marker.type === mapView)
  }, [mapView, allMarkers])

  const onLoad = useCallback(function callback(map: google.maps.Map) {
    // This is called once the map instance is available
    // You can store the map instance in a ref if needed for other operations
  }, [])

  const onUnmount = useCallback(function callback(map: google.maps.Map) {
    // This is called when the map component unmounts
  }, [])

  if (loadError) return <div>Error loading maps: {loadError.message}</div>
  if (!isLoaded) return <div>Loading Map...</div>
  if (loading) return <div>Loading data for map...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div className="space-y-6">
      <Tabs defaultValue="all" onValueChange={(value) => setMapView(value as "all" | "pickup" | "dropoff")}>
        <TabsList>
          <TabsTrigger value="all">All Locations</TabsTrigger>
          <TabsTrigger value="pickup">Pickup Locations</TabsTrigger>
          <TabsTrigger value="dropoff">Dropoff Locations</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Live Map</CardTitle>
            </CardHeader>
            <CardContent>
              <GoogleMap
                mapContainerStyle={containerStyle}
                center={kanoCenter}
                zoom={12}
                onLoad={onLoad}
                onUnmount={onUnmount}
              >
                {filteredMarkers.map((marker) => (
                  <MarkerF
                    key={marker.id}
                    position={{ lat: marker.lat, lng: marker.lng }}
                    onClick={() => setSelectedMarker(marker)}
                    icon={{
                      path: google.maps.SymbolPath.CIRCLE, // Access google from window
                      scale: 10,
                      fillColor:
                        marker.type === "rider"
                          ? marker.status === "available"
                            ? "#10B981" // Green
                            : "#3B82F6" // Blue
                          : marker.type === "pickup"
                            ? "#F59E0B" // Amber
                            : "#8B5CF6", // Purple
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
                        {selectedMarker.type === "rider"
                          ? "Rider"
                          : selectedMarker.type === "pickup"
                            ? "Pickup"
                            : "Dropoff"}
                        {selectedMarker.status && ` - ${selectedMarker.status.replace(/_/g, " ")}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Lat: {selectedMarker.lat.toFixed(4)}, Lng: {selectedMarker.lng.toFixed(4)}
                      </p>
                      <p>
                        Address: {selectedMarker.Address || " Not available"}
                      </p>
                    </div>
                  </InfoWindowF>
                )}
              </GoogleMap>
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
                {filteredMarkers.map((marker) => (
                  <div key={marker.id} className="flex items-center justify-between p-2 rounded-lg border">
                    <div className="flex items-center gap-2">
                      {marker.type === "rider" ? (
                        <Truck className="h-4 w-4 text-blue-500" />
                      ) : (
                        <Package className="h-4 w-4 text-purple-500" />
                      )}
                      <div>
                        <div className="text-sm font-medium">{marker.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {marker.lat.toFixed(4)}, {marker.lng.toFixed(4)}
                        </div>
                      </div>
                    </div>
                    <Badge
                      className={
                        marker.type === "rider"
                          ? marker.status === "available"
                            ? "bg-green-500"
                            : "bg-blue-500"
                          : marker.status === "in_transit"
                            ? "bg-purple-500"
                            : "bg-gray-500" // Default for other delivery statuses
                      }
                      variant="secondary"
                    >
                      {marker.status ? marker.status.replace("_", " ") : marker.type}
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
