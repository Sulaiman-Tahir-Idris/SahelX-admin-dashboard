"use client";

import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Truck, Package, Activity, MapPin, Navigation, Route, Map as MapIcon, Award } from "lucide-react";
import {
  GoogleMap,
  MarkerF,
  useLoadScript,
  InfoWindowF,
} from "@react-google-maps/api";
import { getRiders, type Rider } from "@/lib/firebase/riders";
import { getDeliveries, type Delivery } from "@/lib/firebase/deliveries";
import { useTheme } from "next-themes";
import { getNigerianStartOfDay, getNigerianStartOfMonth } from "@/lib/utils/timezone";

interface MapMarker {
  id: string;
  type: "rider" | "pickup" | "dropoff" | "office";
  name: string;
  lat: number;
  lng: number;
  status?: string;
  deliveryId?: string;
  Address?: string;
}

const kanoCenter = { lat: 12.0, lng: 8.5167 };
const OFFICE_LOCATION = { lat: 11.990528, lng: 8.481111, address: "SahelX Office, Kano" };
const MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || "9009e1003c69980469a79a63";

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const d = R * c;
  return d * 1.3; // Road routing estimation factor
}

export function LiveMapView() {
  const [mapView, setMapView] = useState<"all" | "pickup" | "dropoff">("all");
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);
  const [riders, setRiders] = useState<Rider[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();
  
  const [deliveriesRange, setDeliveriesRange] = useState<"total" | "active" | "today" | "month">("total");
  const [mileageRange, setMileageRange] = useState<"today" | "month" | "total">("today");
  const [destRange, setDestRange] = useState<"today" | "month" | "total">("today");
  const [riderRange, setRiderRange] = useState<"today" | "month" | "total">("today");

  const libraries = useMemo<("places" | "marker")[]>(() => ["places", "marker"], []);
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [fetchedRiders, fetchedDeliveries] = await Promise.all([
          getRiders(),
          getDeliveries()
        ]);
        setRiders(fetchedRiders);
        setDeliveries(fetchedDeliveries);
      } catch (err) {
        console.error("Failed to load map data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 15000); // Auto refresh every 15s
    return () => clearInterval(interval);
  }, []);

  const stats = useMemo(() => {
    const startOfToday = getNigerianStartOfDay();
    const startOfMonth = getNigerianStartOfMonth();

    const filterByDate = (d: Delivery, start: Date) => {
      if (!d.createdAt) return false;
      const dDate = d.createdAt.toDate ? d.createdAt.toDate() : new Date(d.createdAt);
      return dDate >= start;
    };

    const getMetrics = (filteredDeliveries: Delivery[]) => {
      let totalKm = 0;
      const locationCounts: Record<string, number> = {};
      const riderCounts: Record<string, number> = {};

      filteredDeliveries.forEach(d => {
        if (d.distance) {
          if (typeof d.distance === 'string') {
            totalKm += parseFloat(d.distance.replace(/[^0-9.]/g, '')) || 0;
          } else if (typeof d.distance === 'number') {
            totalKm += d.distance > 1000 ? d.distance / 1000 : d.distance;
          }
        } else if (d.pickupLocation?.lat && d.pickupLocation?.lng && d.dropoffLocation?.lat && d.dropoffLocation?.lng) {
          totalKm += calculateDistance(d.pickupLocation.lat, d.pickupLocation.lng, d.dropoffLocation.lat, d.dropoffLocation.lng);
        }

        if (d.dropoffLocation?.address) {
          const addr = d.dropoffLocation.address;
          locationCounts[addr] = (locationCounts[addr] || 0) + 1;
        }

        if (d.courierId && d.courierId !== "none") {
          const rName = riders.find(r => r.id === d.courierId || r.userId === d.courierId)?.displayName || d.courierName || d.courierId;
          riderCounts[rName] = (riderCounts[rName] || 0) + 1;
        }
      });

      let topLoc = { address: "None", count: 0 };
      Object.entries(locationCounts).forEach(([addr, count]) => {
        if (count > topLoc.count) topLoc = { address: addr, count };
      });
      
      let shortAddr = topLoc.address;
      if (shortAddr !== "None") {
        const parts = shortAddr.split(",");
        shortAddr = parts[0] + (parts.length > 1 ? ", " + parts[1].trim() : "");
        if (shortAddr.length > 22) shortAddr = shortAddr.substring(0, 20) + "...";
      }

      let topRiderData = { name: "None", count: 0 };
      Object.entries(riderCounts).forEach(([name, count]) => {
        if (count > topRiderData.count) topRiderData = { name, count };
      });
      if (topRiderData.name.length > 15) {
         topRiderData.name = topRiderData.name.substring(0, 15) + "...";
      }

      return {
        mileage: totalKm.toFixed(1),
        topLocation: { address: shortAddr, count: topLoc.count },
        topRider: topRiderData,
        count: filteredDeliveries.length
      };
    };

    return {
      today: getMetrics(deliveries.filter(d => filterByDate(d, startOfToday))),
      month: getMetrics(deliveries.filter(d => filterByDate(d, startOfMonth))),
      total: getMetrics(deliveries),
      activeCount: deliveries.filter(d => !["received", "recieved", "completed", "cancelled"].includes(d.status?.toLowerCase() || "")).length
    };
  }, [deliveries, riders]);

  const allMarkers: MapMarker[] = useMemo(() => {
    const markers: MapMarker[] = [];

    markers.push({
      id: "sahelx_office",
      type: "office",
      name: "Depot / HQ",
      lat: OFFICE_LOCATION.lat,
      lng: OFFICE_LOCATION.lng,
      status: "Operational",
      Address: OFFICE_LOCATION.address
    });

    riders.forEach((rider) => {
      if (rider.currentLocation?.lat && rider.currentLocation?.lng) {
        markers.push({
          id: rider.id || `rider_${rider.userId}`,
          type: "rider",
          name: rider.displayName || "Unknown Rider",
          lat: rider.currentLocation.lat,
          lng: rider.currentLocation.lng,
          status: rider.status,
        });
      }
    });

    deliveries.forEach((delivery) => {
      if (delivery.pickupLocation && typeof delivery.pickupLocation.lat === "number" && typeof delivery.pickupLocation.lng === "number") {
        markers.push({
          id: `pickup_${delivery.id}`,
          type: "pickup",
          name: `Pickup: ${delivery.id?.substring(0, 8)}`,
          lat: delivery.pickupLocation.lat,
          lng: delivery.pickupLocation.lng,
          status: delivery.status,
          deliveryId: delivery.id,
          Address: delivery.pickupLocation.address || "Not available",
        });
      }
      
      if (delivery.dropoffLocation && typeof delivery.dropoffLocation.lat === "number" && typeof delivery.dropoffLocation.lng === "number") {
        markers.push({
          id: `dropoff_${delivery.id}`,
          type: "dropoff",
          name: `Dropoff: ${delivery.id?.substring(0, 8)}`,
          lat: delivery.dropoffLocation.lat,
          lng: delivery.dropoffLocation.lng,
          status: delivery.status,
          deliveryId: delivery.id,
          Address: delivery.dropoffLocation.address || "Not available",
        });
      }
    });

    return markers;
  }, [riders, deliveries]);

  const filteredMarkers = useMemo(() => {
    if (mapView === "all") return allMarkers;
    return allMarkers.filter((marker) => marker.type === mapView || marker.type === "office");
  }, [allMarkers, mapView]);

  const markerIcon = (type: MapMarker["type"]) => {
    if (type === "office") return { url: "/icons/office.png", scaledSize: { width: 40, height: 40 } as any };
    if (type === "pickup") return { url: "/icons/pickup.png", scaledSize: { width: 32, height: 32 } as any };
    if (type === "dropoff") return { url: "/icons/dropoff.png", scaledSize: { width: 32, height: 32 } as any };
    return { url: "/icons/rider.png", scaledSize: { width: 40, height: 40 } as any };
  };

  const activeRiders = riders.filter(r => r.status === "available" || r.status === "in_transit" || r.isAvailable).length;

  const cycleDeliveries = () => {
    const cycle = { total: "active", active: "today", today: "month", month: "total" };
    setDeliveriesRange(cycle[deliveriesRange] as any);
  };
  const cycleMileage = () => {
    const cycle = { today: "month", month: "total", total: "today" };
    setMileageRange(cycle[mileageRange] as any);
  };
  const cycleDest = () => {
    const cycle = { total: "today", today: "month", month: "total" };
    setDestRange(cycle[destRange] as any);
  };
  const cycleRider = () => {
    const cycle = { total: "today", today: "month", month: "total" };
    setRiderRange(cycle[riderRange] as any);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] space-y-4 animate-in fade-in duration-700">
      {/* Telemetry Header */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 flex-shrink-0">
        <Card className="bg-background/60 backdrop-blur-md border-primary/20 shadow-sm">
          <CardContent className="p-4 flex flex-col justify-center">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Active Riders</p>
              <Truck className="h-4 w-4 text-blue-500" />
            </div>
            <h3 className="text-2xl font-bold text-blue-500">{activeRiders}</h3>
          </CardContent>
        </Card>
        
        <Card className="bg-background/60 backdrop-blur-md border-primary/20 shadow-sm cursor-pointer hover:bg-muted/30 transition-colors" onClick={cycleDeliveries}>
          <CardContent className="p-4 flex flex-col justify-center">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Deliveries <span className="text-[9px] bg-primary/10 text-primary px-1 py-0.5 rounded ml-1">{deliveriesRange}</span>
              </p>
              <Package className="h-4 w-4 text-purple-500" />
            </div>
            <h3 className="text-2xl font-bold text-purple-500">
              {deliveriesRange === "total" ? stats.total.count : deliveriesRange === "active" ? stats.activeCount : deliveriesRange === "today" ? stats.today.count : stats.month.count}
            </h3>
          </CardContent>
        </Card>

        <Card className="bg-background/60 backdrop-blur-md border-primary/20 shadow-sm cursor-pointer hover:bg-muted/30 transition-colors" onClick={cycleMileage}>
          <CardContent className="p-4 flex flex-col justify-center">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Mileage <span className="text-[9px] bg-primary/10 text-primary px-1 py-0.5 rounded ml-1">{mileageRange}</span>
              </p>
              <Route className="h-4 w-4 text-orange-500" />
            </div>
            <h3 className="text-2xl font-bold text-orange-500">{stats[mileageRange].mileage} <span className="text-sm font-normal text-muted-foreground">km</span></h3>
          </CardContent>
        </Card>

        <Card className="bg-background/60 backdrop-blur-md border-primary/20 shadow-sm cursor-pointer hover:bg-muted/30 transition-colors" onClick={cycleDest}>
          <CardContent className="p-4 flex flex-col justify-center">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Top Dest. <span className="text-[9px] bg-primary/10 text-primary px-1 py-0.5 rounded ml-1">{destRange}</span>
              </p>
              <MapIcon className="h-4 w-4 text-pink-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-xl font-bold text-foreground truncate max-w-[120px]">{stats[destRange].topLocation.address}</h3>
              {stats[destRange].topLocation.count > 0 && <span className="text-xs text-muted-foreground font-medium">{stats[destRange].topLocation.count} </span>}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-background/60 backdrop-blur-md border-primary/20 shadow-sm cursor-pointer hover:bg-muted/30 transition-colors" onClick={cycleRider}>
          <CardContent className="p-4 flex flex-col justify-center">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Top Rider <span className="text-[9px] bg-primary/10 text-primary px-1 py-0.5 rounded ml-1">{riderRange}</span>
              </p>
              <Award className="h-4 w-4 text-yellow-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-xl font-bold text-foreground truncate max-w-[120px]">{stats[riderRange].topRider.name}</h3>
              {stats[riderRange].topRider.count > 0 && <span className="text-xs text-muted-foreground font-medium">{stats[riderRange].topRider.count} </span>}
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-background/60 backdrop-blur-md border-primary/20 shadow-sm">
          <CardContent className="p-4 flex flex-col justify-center">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</p>
              <Activity className="h-4 w-4 text-green-500" />
            </div>
            <h3 className="text-xl font-bold text-green-500 flex items-center gap-2 mt-1">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
              LIVE
            </h3>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-end">
        <Tabs value={mapView} onValueChange={(v: any) => setMapView(v)} className="w-[400px]">
          <TabsList className="grid w-full grid-cols-3 h-10 bg-muted/50">
            <TabsTrigger value="all" className="font-bold">Global</TabsTrigger>
            <TabsTrigger value="pickup" className="font-bold">Pickups</TabsTrigger>
            <TabsTrigger value="dropoff" className="font-bold">Dropoffs</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Main Map Area */}
      <div className="flex-1 flex gap-4 min-h-0">
        <Card className="flex-1 overflow-hidden relative shadow-lg border-primary/20 rounded-2xl">
          {isLoaded ? (
            <GoogleMap
              mapContainerStyle={{ width: "100%", height: "100%" }}
              center={kanoCenter}
              zoom={13}
              options={{
                mapId: MAP_ID,
                disableDefaultUI: true,
                zoomControl: false,
                colorScheme: theme === "dark" ? "DARK" : "LIGHT"
              }}
            >
              {filteredMarkers.map((marker) => (
                <MarkerF
                  key={marker.id}
                  position={{ lat: marker.lat, lng: marker.lng }}
                  onClick={() => setSelectedMarker(marker)}
                  icon={markerIcon(marker.type)}
                />
              ))}

              {selectedMarker && (
                <InfoWindowF
                  position={{ lat: selectedMarker.lat, lng: selectedMarker.lng }}
                  onCloseClick={() => setSelectedMarker(null)}
                >
                  <div className="p-3 max-w-[220px]">
                    <h3 className="font-bold text-sm text-foreground mb-1 flex items-center gap-1.5">
                      {selectedMarker.type === 'rider' ? <Truck className="h-3.5 w-3.5 text-blue-500"/> : selectedMarker.type === 'office' ? <MapPin className="h-3.5 w-3.5 text-green-500"/> : <Package className="h-3.5 w-3.5 text-purple-500"/>}
                      {selectedMarker.name}
                    </h3>
                    {selectedMarker.status && (
                      <Badge variant="secondary" className="mb-2 text-[10px] font-bold uppercase">
                        {selectedMarker.status.replace(/_/g, " ")}
                      </Badge>
                    )}
                    <p className="text-xs text-muted-foreground mb-1.5 leading-tight font-medium">
                      {selectedMarker.Address || "Location tracking active"}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-mono bg-muted/50 p-1 rounded">
                      {selectedMarker.lat.toFixed(5)}, {selectedMarker.lng.toFixed(5)}
                    </p>
                  </div>
                </InfoWindowF>
              )}
            </GoogleMap>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted/10">
              <div className="flex flex-col items-center gap-3">
                <Navigation className="h-10 w-10 animate-spin text-primary/40" />
                <p className="text-muted-foreground font-semibold tracking-widest uppercase text-sm">Initializing Telemetry...</p>
              </div>
            </div>
          )}
        </Card>

        {/* Live Feed Sidebar */}
        <Card className="w-80 flex flex-col shadow-lg border-primary/20 bg-background/60 backdrop-blur-xl hidden xl:flex rounded-2xl">
          <CardHeader className="py-4 border-b border-border/50 bg-muted/20">
            <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Live Feed
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-0 scrollbar-none">
            <div className="divide-y divide-border/30">
              {filteredMarkers.filter(m => m.type !== 'office').slice(0, 50).map((marker) => (
                <div
                  key={marker.id}
                  className="p-3 hover:bg-muted/50 transition-all duration-300 cursor-pointer group border-l-2 border-transparent hover:border-primary"
                  onClick={() => setSelectedMarker(marker)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <div className={`mt-1 h-2 w-2 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)] ${marker.type === 'rider' ? 'bg-blue-500 shadow-blue-500/50' : marker.type === 'pickup' ? 'bg-orange-500 shadow-orange-500/50' : 'bg-purple-500 shadow-purple-500/50'}`} />
                      <div>
                        <p className="text-sm font-bold leading-none group-hover:text-primary transition-colors">
                          {marker.name}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1.5 truncate max-w-[170px] font-medium">
                          {marker.Address || (marker.type === 'rider' ? 'In transit' : 'Pending route')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {filteredMarkers.length === 1 && <div className="p-8 text-center text-sm font-medium text-muted-foreground uppercase tracking-widest">No active signals</div>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
