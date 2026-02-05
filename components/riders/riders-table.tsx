"use client";

import { useState, useEffect, useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Eye,
  MoreHorizontal,
  MapPin,
  Phone,
  Shield,
  ShieldOff,
  UserCheck,
  UserX,
  Loader2,
  AlertCircle,
  Star,
  Bike,
  TrendingUp,
  RotateCcw,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  getRiders,
  getAllRiders,
  updateRiderVerification,
  updateRiderActiveStatus,
  type Rider,
} from "@/lib/firebase/riders";
import {
  getAverageRatingForCourier,
  getDeliveryCountForCourier,
  getDeliveries,
  type Delivery,
} from "@/lib/firebase/deliveries";
import { StatsCard } from "../dashboard/stats-card";

export function RidersTable() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  type RiderWithRating = Rider & {
    avgRating?: number | null;
    deliveryCount?: number;
  };
  const [riders, setRiders] = useState<RiderWithRating[]>([]);
  const [filterStatus, setFilterStatus] = useState<
    "all" | "available" | "on_delivery" | "offline"
  >("all");
  const [sortKey, setSortKey] = useState<"none" | "rating">("none");

  // Caching settings for courier ratings (localStorage)
  const RATING_CACHE_PREFIX = "courier_rating:v2:";
  const RATING_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  const getCachedRating = (courierId: string): number | null | undefined => {
    try {
      if (!courierId) return null;
      const key = `${RATING_CACHE_PREFIX}${courierId}`;
      const raw = localStorage.getItem(key);
      if (!raw) return undefined;
      const parsed = JSON.parse(raw) as { avg: number | null; ts: number };
      if (!parsed || typeof parsed.ts !== "number") return undefined;
      if (Date.now() - parsed.ts > RATING_CACHE_TTL) {
        localStorage.removeItem(key);
        return null;
      }
      return parsed.avg === undefined ? null : parsed.avg;
    } catch (e) {
      return null;
    }
  };

  const setCachedRating = (courierId: string, avg: number | null) => {
    try {
      if (!courierId) return;
      const key = `${RATING_CACHE_PREFIX}${courierId}`;
      localStorage.setItem(key, JSON.stringify({ avg, ts: Date.now() }));
    } catch (e) {
      // ignore
    }
  };
  const [isLoading, setIsLoading] = useState(true);
  const [updatingRider, setUpdatingRider] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeDeliveryRiderIds, setActiveDeliveryRiderIds] = useState<
    Set<string>
  >(new Set());

  useEffect(() => {
    loadRiders();
  }, []);

  const loadRiders = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch riders and deliveries
      let ridersData: Rider[] = [];
      const [allDeliveries] = await Promise.all([
        getDeliveries(),
        (async () => {
          try {
            const data = await getRiders();
            ridersData = data;
          } catch (indexError) {
            const data = await getAllRiders();
            ridersData = data;
          }
          return ridersData;
        })(),
      ]);

      // Calculate active ones like in dashboard
      const activeIds = new Set<string>(
        allDeliveries
          .filter(
            (d: Delivery) =>
              d.courierId &&
              !["completed", "cancelled", "received", "recieved"].includes(
                d.status?.toLowerCase() || "",
              ),
          )
          .map((d: Delivery) => d.courierId as string),
      );
      setActiveDeliveryRiderIds(activeIds);

      // Fetch average rating for each rider (based on deliveries.courierId)
      const ridersWithRatings = await Promise.all(
        ridersData.map(async (r) => {
          // prefer the `userId` field if present (some user docs store UID in `userId`)
          const courierId = (r.userId as string) || (r.id as string) || "";

          // try cache first
          const cached = courierId ? getCachedRating(courierId) : undefined;
          if (cached !== undefined)
            return { ...r, avgRating: cached } as RiderWithRating;

          if (!courierId) return { ...r, avgRating: null } as RiderWithRating;

          try {
            const [avg, count] = await Promise.all([
              getAverageRatingForCourier(courierId),
              getDeliveryCountForCourier(courierId),
            ]);
            setCachedRating(courierId, avg === null ? null : avg);
            return {
              ...r,
              avgRating: avg,
              deliveryCount: count,
            } as RiderWithRating;
          } catch (e) {
            return {
              ...r,
              avgRating: null,
              deliveryCount: 0,
            } as RiderWithRating;
          }
        }),
      );

      setRiders(ridersWithRatings);
    } catch (error: any) {
      setError(error.message);
      toast({
        title: "Failed to load riders",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerificationToggle = async (
    riderId: string,
    currentStatus: boolean,
  ) => {
    try {
      setUpdatingRider(riderId);
      await updateRiderVerification(riderId, !currentStatus);

      // Update local state
      setRiders(
        riders.map((rider) =>
          rider.id === riderId
            ? {
                ...rider,
                verified: !currentStatus,
                vehicleInfo: { ...rider.vehicleInfo, verified: !currentStatus },
              }
            : rider,
        ),
      );

      toast({
        title: "Verification status updated",
        description: `Rider has been ${
          !currentStatus ? "verified" : "unverified"
        }.`,
      });
    } catch (error: any) {
      toast({
        title: "Failed to update verification",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUpdatingRider(null);
    }
  };

  const handleActiveStatusToggle = async (
    riderId: string,
    currentStatus: boolean,
  ) => {
    try {
      setUpdatingRider(riderId);
      await updateRiderActiveStatus(riderId, !currentStatus);

      // Update local state
      setRiders(
        riders.map((rider) =>
          rider.id === riderId ? { ...rider, isActive: !currentStatus } : rider,
        ),
      );

      toast({
        title: "Active status updated",
        description: `Rider has been ${
          !currentStatus ? "activated" : "deactivated"
        }.`,
      });
    } catch (error: any) {
      toast({
        title: "Failed to update active status",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUpdatingRider(null);
    }
  };

  const filteredRiders = useMemo(() => {
    let result = riders.filter(
      (rider: RiderWithRating) =>
        rider.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rider.phone?.includes(searchQuery) ||
        rider.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rider.vehicleInfo?.plateNumber
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()),
    );

    if (filterStatus !== "all") {
      result = result.filter((rider: RiderWithRating) => {
        const isOffline = !rider.isActive;
        const isOnDelivery =
          rider.isActive &&
          activeDeliveryRiderIds.has(rider.userId || rider.id || "");
        const isAvailable =
          rider.isActive &&
          !activeDeliveryRiderIds.has(rider.userId || rider.id || "");

        if (filterStatus === "offline") return isOffline;
        if (filterStatus === "on_delivery") return isOnDelivery;
        if (filterStatus === "available") return isAvailable;
        return true;
      });
    }

    if (sortKey === "rating") {
      result = [...result].sort(
        (a: RiderWithRating, b: RiderWithRating) =>
          (b.avgRating || 0) - (a.avgRating || 0),
      );
    }

    return result;
  }, [riders, searchQuery, filterStatus, sortKey, activeDeliveryRiderIds]);

  const getActiveColor = (isActive: boolean) => {
    return isActive ? "bg-green-500" : "bg-gray-400";
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A";

    let date: Date;
    if (timestamp.toDate) {
      date = timestamp.toDate();
    } else if (timestamp.seconds) {
      date = new Date(timestamp.seconds * 1000);
    } else {
      date = new Date(timestamp);
    }

    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="mt-2 text-sm text-muted-foreground">
            Loading riders...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Failed to load riders: {error}</AlertDescription>
        </Alert>
        <Button onClick={loadRiders} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  const availableCount = riders.filter(
    (r: RiderWithRating) =>
      r.isActive && !activeDeliveryRiderIds.has(r.userId || r.id || ""),
  ).length;

  const onDeliveryCount = riders.filter(
    (r: RiderWithRating) =>
      r.isActive && activeDeliveryRiderIds.has(r.userId || r.id || ""),
  ).length;

  const offlineCount = riders.filter(
    (r: RiderWithRating) => !r.isActive,
  ).length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Riders"
          value={riders.length}
          icon={Bike}
          color="blue"
          isActive={filterStatus === "all" && sortKey === "none"}
          onClick={() => {
            setFilterStatus("all");
            setSortKey("none");
          }}
        />
        <StatsCard
          title="Available Riders"
          value={availableCount}
          icon={UserCheck}
          color="green"
          isActive={filterStatus === "available"}
          onClick={() => {
            setFilterStatus("available");
            setSortKey("none");
          }}
        />
        <StatsCard
          title="On Delivery"
          value={onDeliveryCount}
          icon={TrendingUp}
          color="amber"
          isActive={filterStatus === "on_delivery"}
          onClick={() => {
            setFilterStatus("on_delivery");
            setSortKey("none");
          }}
        />
        <StatsCard
          title="Offline"
          value={offlineCount}
          icon={UserX}
          color="red"
          isActive={filterStatus === "offline"}
          onClick={() => {
            setFilterStatus("offline");
            setSortKey("none");
          }}
        />
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <Input
          placeholder="Search riders..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
        <div className="flex items-center gap-2">
          {(filterStatus !== "all" ||
            sortKey !== "none" ||
            searchQuery !== "") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFilterStatus("all");
                setSortKey("none");
                setSearchQuery("");
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset
            </Button>
          )}
          <Button onClick={loadRiders} variant="outline" size="sm">
            Refresh
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader className="bg-gray-50/50">
            <TableRow>
              <TableHead className="font-bold text-gray-900">Rider</TableHead>
              <TableHead className="font-bold text-gray-900">Status</TableHead>
              <TableHead className="font-bold text-gray-900">Vehicle</TableHead>
              <TableHead className="font-bold text-gray-900">Phone</TableHead>
              <TableHead className="font-bold text-gray-900">Total</TableHead>
              <TableHead className="font-bold text-gray-900">Rating</TableHead>
              <TableHead className="font-bold text-gray-900">
                Verification
              </TableHead>
              <TableHead className="font-bold text-gray-900">Joined</TableHead>
              <TableHead className="text-right font-bold text-gray-900">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRiders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center">
                  {riders.length === 0
                    ? "No riders found. Register some riders to get started."
                    : "No riders match your search."}
                </TableCell>
              </TableRow>
            ) : (
              filteredRiders.map((rider) => (
                <TableRow
                  key={rider.id}
                  className="group hover:bg-gray-50/50 transition-colors"
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage
                          src={rider.profilePhoto || "/placeholder.svg"}
                          alt={rider.displayName}
                        />
                        <AvatarFallback>
                          {rider.displayName?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="grid gap-0.5">
                        <div className="font-medium">{rider.displayName}</div>
                        <div className="text-xs text-muted-foreground">
                          {rider.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {(() => {
                        const availability =
                          (rider.status && rider.status.toLowerCase()) ||
                          (rider.isAvailable ? "available" : "offline");
                        const colorClass =
                          availability === "available"
                            ? "bg-green-500"
                            : availability === "on_delivery" ||
                                availability === "on-delivery" ||
                                availability === "on delivery"
                              ? "bg-blue-500"
                              : "bg-gray-400";

                        return (
                          <Badge className={colorClass} variant="secondary">
                            {availability.replace(/_/g, " ")}
                          </Badge>
                        );
                      })()}

                      {!rider.isActive && (
                        <Badge variant="outline" className="text-xs">
                          Inactive
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="font-medium capitalize">
                        {rider.vehicleInfo?.type}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {rider.vehicleInfo?.plateNumber}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{rider.phone}</TableCell>
                  <TableCell>{rider.deliveryCount ?? 0}</TableCell>
                  <TableCell>
                    {(() => {
                      const avg = rider.avgRating;
                      if (avg === null || avg === undefined)
                        return <span className="text-muted-foreground">-</span>;
                      const n = Number(avg);
                      if (isNaN(n))
                        return <span className="text-muted-foreground">-</span>;
                      return (
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{n.toFixed(1)}</span>
                          <Star className="h-4 w-4 text-yellow-400" />
                        </div>
                      );
                    })()}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        rider.verified ? "bg-green-500" : "bg-yellow-500"
                      }
                      variant="secondary"
                    >
                      {rider.verified ? "Verified" : "Pending"}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(rider.createdAt)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={updatingRider === rider.id}
                        >
                          {updatingRider === rider.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <MoreHorizontal className="h-4 w-4" />
                          )}
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() =>
                            router.push(`/admin/riders/${rider.id}`)
                          }
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <MapPin className="mr-2 h-4 w-4" />
                          Track Location
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            router.push(`/admin/riders/${rider.id}/history`)
                          }
                        >
                          <Star className="mr-2 h-4 w-4" />
                          Delivery History
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() =>
                            handleVerificationToggle(rider.id!, rider.verified)
                          }
                        >
                          {rider.verified ? (
                            <>
                              <ShieldOff className="mr-2 h-4 w-4" />
                              Unverify Rider
                            </>
                          ) : (
                            <>
                              <Shield className="mr-2 h-4 w-4" />
                              Verify Rider
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            handleActiveStatusToggle(rider.id!, rider.isActive)
                          }
                        >
                          {rider.isActive ? (
                            <>
                              <UserX className="mr-2 h-4 w-4" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <UserCheck className="mr-2 h-4 w-4" />
                              Activate
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => window.open(`tel:${rider.phone}`)}
                        >
                          <Phone className="mr-2 h-4 w-4" />
                          Call Rider
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {riders.length > 0 && (
        <div className="text-sm text-muted-foreground">
          Showing {filteredRiders.length} of {riders.length} riders
        </div>
      )}
    </div>
  );
}
