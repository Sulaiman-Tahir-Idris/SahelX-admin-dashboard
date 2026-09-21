"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  GoogleMap,
  MarkerF,
  useLoadScript,
  PolylineF,
} from "@react-google-maps/api";
import { getDeliveries, type Delivery } from "@/lib/firebase/deliveries";
import { subscribeToRiders, type Rider } from "@/lib/firebase/riders";
import { db } from "@/lib/firebase/config";
import { collection, query, where, getDocs } from "firebase/firestore";
import { Loader2, X } from "lucide-react";

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

const libraries: Libraries = ["places", "marker"];

export function DeliveryMap() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [riders, setRiders] = useState<Rider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);
  const [activeLine, setActiveLine] = useState<string | null>(null);
  const [animatedRiders, setAnimatedRiders] = useState<
    Record<string, { lat: number; lng: number }>
  >({});
  const [customerNames, setCustomerNames] = useState<Record<string, string>>({});

  const mapKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: mapKey,
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

        // Fetch customer display names
        try {
          const q = query(collection(db, "User"), where("role", "==", "customer"));
          const snap = await getDocs(q);
          const names: Record<string, string> = {};
          snap.forEach((d) => {
            const data = d.data() as { displayName?: string };
            names[d.id] = data.displayName ?? d.id;
          });
          setCustomerNames(names);
        } catch {
          // non-critical, silently ignore
        }

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
      const customerName = customerNames[delivery.customerId] ?? delivery.customerId?.substring(0, 8) ?? "Unknown";

      if (
        delivery.pickupLocation &&
        typeof delivery.pickupLocation.lat === "number" &&
        typeof delivery.pickupLocation.lng === "number"
      ) {
        markers.push({
          id: `pickup_${delivery.id}`,
          type: "pickup",
          name: `Pickup for ${customerName}`,
          lat: delivery.pickupLocation.lat,
          lng: delivery.pickupLocation.lng,
          deliveryId: delivery.id || "",
          status: delivery.status,
        });
      }

      if (
        delivery.dropoffLocation &&
        typeof delivery.dropoffLocation.lat === "number" &&
        typeof delivery.dropoffLocation.lng === "number"
      ) {
        markers.push({
          id: `dropoff_${delivery.id}`,
          type: "dropoff",
          name: `Dropoff for ${customerName}`,
          lat: delivery.dropoffLocation.lat,
          lng: delivery.dropoffLocation.lng,
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
  }, [deliveries, assignedRiders, customerNames]);

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
    <Card className="col-span-full border-border bg-background shadow-sm">
      <CardHeader>
        {/* <CardTitle className="text-foreground">Live Delivery Map</CardTitle> */}
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
                    const pLat = Number((delivery.pickupLocation as any)?.lat);
                    const pLng = Number((delivery.pickupLocation as any)?.lng);
                    const dLat = Number((delivery.dropoffLocation as any)?.lat);
                    const dLng = Number((delivery.dropoffLocation as any)?.lng);
                    
                    if (!isNaN(pLat) && !isNaN(pLng) && !isNaN(dLat) && !isNaN(dLng)) {
                      return (
                        <PolylineF
                          key={`line_pickup_${delivery.id}`}
                          path={[
                            { lat: pLat, lng: pLng },
                            { lat: dLat, lng: dLng },
                          ]}
                          options={{ strokeColor: "#2563EB", strokeWeight: 2 }}
                        />
                      );
                    }
                  }
                  if (activeLine === `dropoff_${delivery.id}`) {
                    const pLat = Number((delivery.pickupLocation as any)?.lat);
                    const pLng = Number((delivery.pickupLocation as any)?.lng);
                    const dLat = Number((delivery.dropoffLocation as any)?.lat);
                    const dLng = Number((delivery.dropoffLocation as any)?.lng);
                    
                    if (!isNaN(pLat) && !isNaN(pLng) && !isNaN(dLat) && !isNaN(dLng)) {
                      return (
                        <PolylineF
                          key={`line_dropoff_${delivery.id}`}
                          path={[
                            { lat: dLat, lng: dLng },
                            { lat: pLat, lng: pLng },
                          ]}
                          options={{ strokeColor: "#F97316", strokeWeight: 2 }}
                        />
                      );
                    }
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
                  const rLat = Number(rider.currentLocation.lat);
                  const rLng = Number(rider.currentLocation.lng);
                  const pLat = Number(delivery.pickupLocation.lat);
                  const pLng = Number(delivery.pickupLocation.lng);

                  if (
                    !isNaN(rLat) &&
                    !isNaN(rLng) &&
                    !isNaN(pLat) &&
                    !isNaN(pLng)
                  ) {
                    return (
                      <PolylineF
                        key={`rider_line_${rider.userId || rider.id}`}
                        path={[
                          {
                            lat: rLat,
                            lng: rLng,
                          },
                          {
                            lat: pLat,
                            lng: pLng,
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
                }
                return null;
              })}
            </GoogleMap>


            {/* Custom info overlay panel – floats over the map, fully themed */}
            {selectedMarker && (
              <div
                className="absolute top-3 left-3 z-10 w-[260px] rounded-xl border border-border bg-card text-card-foreground shadow-xl overflow-hidden"
                style={{
                  borderLeft: selectedMarker.type === "pickup"
                    ? "4px solid #2563EB"
                    : selectedMarker.type === "dropoff"
                    ? "4px solid #F97316"
                    : selectedMarker.type === "rider"
                    ? "4px solid #22c55e"
                    : "4px solid #6b7280",
                }}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2 px-4 pt-3 pb-2 border-b border-border">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {selectedMarker.id === "sahelx_office"
                        ? "Office / Depot"
                        : selectedMarker.type === "rider"
                        ? "Rider"
                        : `${selectedMarker.type} point`}
                    </p>
                    <h3 className="font-bold text-sm text-card-foreground leading-tight mt-0.5">
                      {selectedMarker.name}
                    </h3>
                  </div>
                  <button
                    onClick={() => { setSelectedMarker(null); setActiveLine(null); }}
                    className="mt-0.5 shrink-0 rounded-md p-1 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Body */}
                <div className="px-4 py-3 space-y-2 text-sm max-h-[340px] overflow-y-auto">

                  {/* Status badge */}
                  {selectedMarker.status && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Status</span>
                      <span className={[
                        "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize",
                        /available|active|completed|delivered|received/i.test(selectedMarker.status ?? "")
                          ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
                          : /in.transit|assigned|picked.up/i.test(selectedMarker.status ?? "")
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400"
                          : /pending|requested/i.test(selectedMarker.status ?? "")
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
                          : /cancel|offline/i.test(selectedMarker.status ?? "")
                          ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400"
                          : "bg-muted text-muted-foreground"
                      ].join(" ")}>
                        {selectedMarker.status}
                      </span>
                    </div>
                  )}

                  {/* Rider-specific: assigned deliveries */}
                  {selectedMarker.type === "rider" && (() => {
                    const riderId = selectedMarker.id.replace("rider_", "");
                    const riderDeliveries = deliveries.filter(
                      (d) => d.courierId === riderId &&
                        d.status?.toLowerCase() !== "received" &&
                        d.status?.toLowerCase() !== "recieved",
                    );
                    return (
                      <div className="pt-1 border-t border-border">
                        <p className="text-xs font-semibold text-muted-foreground mb-1.5">
                          Assigned Deliveries
                        </p>
                        {riderDeliveries.length === 0 ? (
                          <p className="text-xs text-muted-foreground italic">No active deliveries.</p>
                        ) : (
                          <div className="space-y-1.5">
                            {riderDeliveries.map((d) => (
                              <div key={d.id} className="rounded-md bg-muted/60 px-2.5 py-1.5">
                                <p className="text-xs font-mono font-semibold text-card-foreground leading-tight truncate">
                                  {d.trackingId || d.id?.substring(0, 10) + "..."}
                                </p>
                                <p className="text-[10px] text-muted-foreground capitalize mt-0.5">
                                  {d.status?.replace(/_/g, " ")}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Pickup / Dropoff specific */}
                  {(selectedMarker.type === "pickup" || selectedMarker.type === "dropoff") &&
                    selectedMarker.id !== "sahelx_office" && (() => {
                      const delivery = deliveries.find(d => d.id === selectedMarker.deliveryId);
                      return (
                        <div className="pt-1 border-t border-border space-y-1.5">
                          {delivery?.trackingId && (
                            <div className="flex items-start gap-2">
                              <span className="text-xs text-muted-foreground shrink-0">Tracking</span>
                              <code className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded text-card-foreground break-all">
                                {delivery.trackingId}
                              </code>
                            </div>
                          )}
                          <div className="flex items-start gap-2">
                            <span className="text-xs text-muted-foreground shrink-0">Delivery ID</span>
                            <code className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded text-card-foreground break-all">
                              {selectedMarker.deliveryId}
                            </code>
                          </div>
                          {delivery?.pickupLocation?.address && (
                            <div>
                              <p className="text-xs text-muted-foreground">Pickup</p>
                              <p className="text-xs text-card-foreground">{delivery.pickupLocation.address}</p>
                            </div>
                          )}
                          {delivery?.dropoffLocation?.address && (
                            <div>
                              <p className="text-xs text-muted-foreground">Dropoff</p>
                              <p className="text-xs text-card-foreground">{delivery.dropoffLocation.address}</p>
                            </div>
                          )}
                          {delivery?.cost != null && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">Fee</span>
                              <span className="text-xs font-bold text-card-foreground">
                                ₦{(delivery.cost).toLocaleString()}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                  })()}

                  {/* Office / Depot */}
                  {selectedMarker.id === "sahelx_office" && (
                    <p className="text-xs text-muted-foreground">
                      Main headquarters and dispatch center.
                    </p>
                  )}

                  {/* Coordinates */}
                  <div className="pt-1.5 border-t border-border">
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {selectedMarker.lat.toFixed(5)}, {selectedMarker.lng.toFixed(5)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Legend */}
            <div className="absolute bottom-2 md:bottom-4 right-2 md:right-4 rounded-lg bg-background/90 p-2 md:p-3 shadow-lg">
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
                <div className="flex items-center gap-2">
                  <img
                    src="/icons/office.png"
                    className="h-4 w-4"
                    alt="depot"
                  />
                  <span className="hidden md:inline">Depot (Office)</span>
                  <span className="md:hidden">Depot</span>
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
