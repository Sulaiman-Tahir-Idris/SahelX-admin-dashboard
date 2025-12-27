"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  Edit,
  Shield,
  Car,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getRider } from "@/lib/firebase/riders";
import {
  getAverageRatingForCourier,
  getDeliveryCountForCourier,
} from "@/lib/firebase/deliveries";
import type { Rider } from "@/lib/firebase/riders";

interface RiderProfileProps {
  riderId: string;
}

export function RiderProfile({ riderId }: RiderProfileProps) {
  const [rider, setRider] = useState<Rider | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const r = await getRider(riderId);
        if (!mounted) return;
        if (r) {
          // enrich stats
          const [avg, count] = await Promise.all([
            getAverageRatingForCourier(r.userId || r.id || ""),
            getDeliveryCountForCourier(r.userId || r.id || ""),
          ]);
          r.stats = {
            totalDeliveries: count,
            completionRate: r.stats?.completionRate ?? 0,
            avgRating: avg ?? 0,
          };
        }
        setRider(r);
      } catch (e) {
        console.error(e);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [riderId]);

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

    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "available":
        return "bg-green-500";
      case "on_delivery":
        return "bg-blue-500";
      case "offline":
        return "bg-gray-500";
      default:
        return "bg-gray-400";
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!rider) return <div>Rider not found</div>;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col gap-6 md:flex-row">
          <div className="flex flex-col items-center gap-4 md:w-1/3">
            <Avatar className="h-32 w-32">
              <AvatarImage
                src={rider.profilePhoto || "/placeholder.svg"}
                alt={rider.displayName}
              />
              <AvatarFallback className="text-4xl">
                {rider.displayName?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="text-center">
              <h2 className="text-2xl font-bold">{rider.displayName}</h2>
              <div className="mt-2 flex flex-col gap-2 items-center">
                <Badge
                  className={getStatusColor(rider.status)}
                  variant="secondary"
                >
                  {rider.status?.replace("_", " ") || "offline"}
                </Badge>
                {rider.verified && (
                  <Badge className="bg-green-600" variant="secondary">
                    <Shield className="mr-1 h-3 w-3" />
                    Verified
                  </Badge>
                )}
                {!rider.isActive && (
                  <Badge
                    variant="outline"
                    className="text-red-600 border-red-600"
                  >
                    Inactive
                  </Badge>
                )}
              </div>
            </div>

            <div className="mt-2 flex w-full justify-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="flex-1 bg-transparent"
                onClick={() => window.open(`tel:${rider.phone}`)}
              >
                <Phone className="mr-2 h-4 w-4" />
                Call
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1 bg-transparent"
                onClick={() => window.open(`mailto:${rider.email}`)}
              >
                <Mail className="mr-2 h-4 w-4" />
                Email
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1 bg-transparent"
                asChild
              >
                <Link href={`/admin/riders/${rider.id}/edit`}>
                  <>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </>
                </Link>
              </Button>
            </div>
          </div>

          <div className="flex flex-col space-y-4 md:w-2/3">
            <h3 className="text-xl font-semibold">Rider Information</h3>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Email:</span>
                <span className="text-sm">{rider.email}</span>
              </div>

              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Phone:</span>
                <span className="text-sm">{rider.phone}</span>
              </div>

              <div className="flex items-center gap-2">
                <Car className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Vehicle:</span>
                <span className="text-sm capitalize">
                  {rider.vehicleInfo?.type} - {rider.vehicleInfo?.plateNumber}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Vehicle Model:</span>
                <span className="text-sm">{rider.vehicleInfo?.model}</span>
              </div>

              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Address:</span>
                <span className="text-sm">
                  {rider.address?.city}, {rider.address?.state}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Joined:</span>
                <span className="text-sm">{formatDate(rider.createdAt)}</span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Full Address</h4>
              <p className="text-sm text-muted-foreground">
                {rider.address?.street}, {rider.address?.city},{" "}
                {rider.address?.state}, {rider.address?.country}
              </p>
            </div>

            <h3 className="text-xl font-semibold pt-4">Stats</h3>
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-3xl font-bold">
                    {rider.stats?.totalDeliveries || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Total Deliveries
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-3xl font-bold">
                    {rider.stats?.completionRate || 0}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Completion Rate
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-3xl font-bold">
                    {typeof (rider.stats?.avgRating || 0) === "number"
                      ? (rider.stats?.avgRating || 0).toFixed(1)
                      : rider.stats?.avgRating || 0}
                    /5
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Average Rating
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
