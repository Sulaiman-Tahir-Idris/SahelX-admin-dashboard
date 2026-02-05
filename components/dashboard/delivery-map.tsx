"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  GoogleMap,
  MarkerF,
  useLoadScript,
  InfoWindowF,
  PolylineF,
} from "@react-google-maps/api";
import { getDeliveries, type Delivery } from "@/lib/firebase/deliveries";
import { subscribeToRiders, type Rider } from "@/lib/firebase/riders";
import { Loader2 } from "lucide-react";

type Libraries = ("places" | "drawing" | "geometry" | "visualization")[];

interface LocationCoords {
  lat: number;
  lng: number;
}

interface MapMarker {
  id: string;
  userId?: string;
  type: "pickup" | "dropoff" | "rider";
  name: string;
  lat: number;
  lng: number;
  deliveryId?: string;
  status?: string;
}

const containerStyle = {
  width: "100%",
  height: "500px",
  borderRadius: "0.5rem",
};

const KANO_CENTER = { lat: 11.9967, lng: 8.5185 };

const OFFICE_LOCATION = {
  lat: 11.990528,
  lng: 8.481111,
  address: "SahelX Office, Kano",
};

const libraries: Libraries = ["places"];

export function DeliveryMap() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [riders, setRiders] = useState<Rider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);
  const [activeLine, setActiveLine] = useState<string | null>(null);
  const [animatedRiders, setAnimatedRiders] = useState<
    Record<string, { lat: number; lng: number }>
  >({});

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries,
  });

  function interpolate(
    start: { lat: number; lng: number },
    end: { lat: number; lng: number },
    t: number,
  ) {
    return {
      lat: start.lat + (end.lat - start.lat) * t,
      lng: start.lng + (end.lng - start.lng) * t,
    };
  }

  useEffect(() => {
    let unsubscribeRiders: (() => void) | undefined;

    const init = async () => {
      setIsLoading(true);
      try {
        const fetchedDeliveries = await getDeliveries();
        const activeDeliveries = fetchedDeliveries.filter(
          (d) =>
            d.status?.toLowerCase() !== "received" &&
            d.status?.toLowerCase() !== "recieved",
        );
        setDeliveries(activeDeliveries);

        unsubscribeRiders = subscribeToRiders((liveRiders) => {
          setRiders(liveRiders);
        });
      } catch (error) {
        setDeliveries([]);
        setRiders([]);
      } finally {
        setIsLoading(false);
      }
    };

    init();
    return () => {
      if (unsubscribeRiders) unsubscribeRiders();
    };
  }, []);

  useEffect(() => {
    riders.forEach((rider) => {
      if (!rider.currentLocation) return;

      const id = rider.userId;
      const target = rider.currentLocation;
      const start = animatedRiders[id] ?? target;

      const duration = 1000; // ms
      let startTime: number | null = null;

      function animate(time: number) {
        if (!startTime) startTime = time;
        const progress = Math.min((time - startTime) / duration, 1);

        const position = interpolate(start, target, progress);

        setAnimatedRiders((prev) => ({
          ...prev,
          [id]: position,
        }));

        if (progress < 1) requestAnimationFrame(animate);
      }

      requestAnimationFrame(animate);
    });
  }, [riders]);

  // Only show riders assigned to a delivery
  const assignedRiderIds = useMemo(
    () => deliveries.map((d) => d.courierId).filter(Boolean),
    [deliveries],
  );
  const assignedRiders = useMemo(
    () => riders.filter((r) => assignedRiderIds.includes(r.userId)),
    [riders, assignedRiderIds],
  );

  // Markers: pickups, dropoffs, and only assigned riders
  const allMarkers: MapMarker[] = useMemo(() => {
    const markers: MapMarker[] = [];

    deliveries.forEach((delivery) => {
      if (
        delivery.pickupLocation &&
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
        });
      }

      if (
        delivery.dropoffLocation &&
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
        });
      }
    });

    // Only show assigned riders (animated)
    assignedRiders.forEach((rider) => {
      const rawLat = rider.currentLocation?.lat;
      const rawLng = rider.currentLocation?.lng;

      if (typeof rawLat === "number" && typeof rawLng === "number") {
        const animated = animatedRiders[rider.userId] ?? {
          lat: rawLat,
          lng: rawLng,
        };

        markers.push({
          id: `rider_${rider.userId}`,
          userId: rider.userId,
          type: "rider",
          name: rider.displayName || "Rider",
          lat: animated.lat,
          lng: animated.lng,
          status: rider.status || (rider.isAvailable ? "available" : "offline"),
        });
      }
    });

    markers.push({
      id: "sahelx_office",
      type: "pickup", // Using pickup type for now, but we'll use a special icon
      name: "Depot ",
      lat: OFFICE_LOCATION.lat,
      lng: OFFICE_LOCATION.lng,
      status: "Office",
    });

    return markers;
  }, [deliveries, assignedRiders]);

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
  );

  // 👇 assign custom icons per type
  const markerIcon = (type: MapMarker["type"], id?: string) => {
    if (id === "sahelx_office") {
      return {
        url: "/icons/office.png",
        scaledSize: { width: 32, height: 32 } as any,
      };
    }
    if (type === "pickup") {
      return {
        url: "/icons/pickup.png",
        scaledSize: { width: 16, height: 16 } as any,
      };
    }
    if (type === "dropoff") {
      return {
        url: "/icons/dropoff.png",
        scaledSize: { width: 32, height: 32 } as any,
      };
    }
    return {
      url: "/icons/rider.png",
      scaledSize: { width: 32, height: 32 } as any,
    };
  };

  const handleMarkerClick = (marker: MapMarker) => {
    setSelectedMarker(marker);

    if (marker.type === "pickup" || marker.type === "dropoff") {
      const lineKey = `${marker.type}_${marker.deliveryId}`;
      setActiveLine((prev) => (prev === lineKey ? null : lineKey));
    }
  };

  if (loadError) return <div>Error loading maps: {loadError.message}</div>;
  if (!isLoaded) return <div>Loading Map...</div>;

  return (
    <Card className="col-span-full border-gray-200 bg-white shadow-sm">
      <CardHeader>
        {/* <CardTitle className="text-gray-900">Live Delivery Map</CardTitle> */}
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
            <GoogleMap
              mapContainerStyle={containerStyle}
              center={KANO_CENTER}
              zoom={12}
              options={mapOptions}
            >
              {allMarkers.map((marker) => (
                <MarkerF
                  key={marker.id}
                  position={{
                    lat: Number(marker.lat),
                    lng: Number(marker.lng),
                  }}
                  icon={markerIcon(marker.type, marker.id)}
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
                    );
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
                    );
                  }
                  return null;
                })}

              {/* Connect assigned riders to their delivery pickup */}
              {assignedRiders.map((rider) => {
                const delivery = deliveries.find(
                  (d) => d.courierId === rider.id,
                );
                if (
                  delivery &&
                  rider.currentLocation &&
                  delivery.pickupLocation &&
                  "lat" in delivery.pickupLocation &&
                  "lng" in delivery.pickupLocation
                ) {
                  return (
                    <PolylineF
                      key={`rider_line_${rider.userId}`}
                      path={[
                        {
                          lat: rider.currentLocation.lat,
                          lng: rider.currentLocation.lng,
                        },
                        {
                          lat: delivery.pickupLocation.lat,
                          lng: delivery.pickupLocation.lng,
                        },
                      ]}
                      options={{
                        strokeColor: "#22c55e",
                        strokeWeight: 2,
                        zIndex: 10,
                      }}
                    />
                  );
                }
                return null;
              })}

              {selectedMarker && (
                <InfoWindowF
                  position={{
                    lat: selectedMarker.lat,
                    lng: selectedMarker.lng,
                  }}
                  onCloseClick={() => setSelectedMarker(null)}
                >
                  <div className="p-2 min-w-[200px]">
                    <h3 className="font-bold text-sm text-gray-900">
                      {selectedMarker.name}
                    </h3>

                    {selectedMarker.type === "rider" && (
                      <>
                        <p className="text-xs text-blue-600 font-bold mt-1">
                          Rider Status: {selectedMarker.status}
                        </p>
                        <div className="mt-2 pt-2 border-t">
                          <div className="font-bold text-xs mb-1">
                            Assigned Deliveries:
                          </div>
                          {deliveries.filter(
                            (d) =>
                              d.courierId ===
                              selectedMarker.id.replace("rider_", ""),
                          ).length === 0 ? (
                            <div className="text-xs">No active deliveries.</div>
                          ) : (
                            deliveries
                              .filter(
                                (d) =>
                                  d.courierId ===
                                    selectedMarker.id.replace("rider_", "") &&
                                  d.status?.toLowerCase() !== "received" &&
                                  d.status?.toLowerCase() !== "recieved",
                              )
                              .map((d) => (
                                <div key={d.id} className="mb-2 last:mb-0">
                                  <div className="text-xs font-bold">
                                    ID: {d.id?.substring(0, 8)}...
                                  </div>
                                  <div className="text-[10px] text-gray-600">
                                    Status: {d.status}
                                  </div>
                                </div>
                              ))
                          )}
                        </div>
                      </>
                    )}

                    {(selectedMarker.type === "pickup" ||
                      selectedMarker.type === "dropoff") &&
                      selectedMarker.id !== "sahelx_office" && (
                        <div className="mt-1">
                          <p className="text-xs font-medium text-desertred uppercase">
                            {selectedMarker.type} Point
                          </p>
                          <p className="text-xs text-gray-600">
                            Status: {selectedMarker.status}
                          </p>
                          <p className="text-[10px] text-gray-500 mt-1">
                            Delivery ID: {selectedMarker.deliveryId}
                          </p>
                        </div>
                      )}

                    {selectedMarker.id === "sahelx_office" && (
                      <p className="text-xs text-gray-600 mt-1">
                        Main headquarters and dispatch center.
                      </p>
                    )}

                    <p className="text-[10px] text-muted-foreground mt-2 pt-1 border-t">
                      {selectedMarker.lat.toFixed(6)},{" "}
                      {selectedMarker.lng.toFixed(6)}
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
                  <img
                    src="/icons/pickup.png"
                    className="h-3 w-3"
                    alt="pickup"
                  />
                  <span className="hidden md:inline">Pickup Locations</span>
                  <span className="md:hidden">Pickup</span>
                </div>
                <div className="flex items-center gap-2">
                  <img
                    src="/icons/dropoff.png"
                    className="h-3 w-3"
                    alt="dropoff"
                  />
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
  );
}
