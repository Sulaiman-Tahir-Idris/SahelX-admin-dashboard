"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  MapPin,
  Phone,
  Mail,
  Calendar,
  Star,
  ShoppingBag,
  Clock,
  TrendingUp,
} from "lucide-react";
import { getCustomer } from "@/lib/firebase/customers";
import { getDeliveriesByCustomer } from "@/lib/firebase/deliveries";

interface CustomerProfileProps {
  customerId: string;
}

const formatDate = (ts: any) => {
  if (!ts) return "-";
  if (typeof ts?.toDate === "function") return ts.toDate().toLocaleDateString();
  if (ts?.seconds) return new Date(ts.seconds * 1000).toLocaleDateString();
  return new Date(ts).toLocaleDateString();
};

export function CustomerProfile({ customerId }: CustomerProfileProps) {
  const router = useRouter();
  const [customer, setCustomer] = useState<any | null>(null);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      try {
        const c = await getCustomer(customerId);
        const delivs = await getDeliveriesByCustomer(customerId);
        if (!mounted) return;

        setCustomer(c);
        setDeliveries(delivs);
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [customerId]);

  if (loading) return <div>Loading...</div>;
  if (!customer) return <div>Customer not found</div>;

  const totalOrders = deliveries.length;
  const totalSpent = deliveries.reduce((s, d) => s + (d.cost || 0), 0);
  const avgOrderValue = totalOrders ? totalSpent / totalOrders : 0;
  const avgRating =
    deliveries
      .filter((d) => d.rating > 0)
      .reduce((s, d) => s + (d.rating || 0), 0) /
    (deliveries.filter((d) => d.rating > 0).length || 1);
  const lastOrder = deliveries[0]?.createdAt || customer.lastOrder || null;

  const avatar = customer.profileImage || "/placeholder.svg";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <Avatar className="h-20 w-20">
                <AvatarImage
                  src={avatar}
                  alt={
                    customer.displayName || customer.fullName || customer.email
                  }
                />
                <AvatarFallback className="text-lg">
                  {(customer.displayName || customer.fullName || "")
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-2xl font-bold">
                    {customer.displayName ||
                      customer.fullName ||
                      customer.email}
                  </h2>
                  <Badge variant={customer.isActive ? "default" : "secondary"}>
                    {customer.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <p className="text-muted-foreground">{customer.email}</p>
                <div className="flex items-center space-x-4 mt-2">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Joined {formatDate(customer.createdAt || lastOrder)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm font-medium">
                      {(avgRating || 0).toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`tel:${customer.phone || ""}`)}
              >
                <Phone className="h-4 w-4 mr-2" />
                Call
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  (window.location.href = `mailto:${customer.email}`)
                }
              >
                <Mail className="h-4 w-4 mr-2" />
                Email
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <div className="text-center p-4 border rounded-lg">
                  <ShoppingBag className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-2xl font-bold">{totalOrders}</p>
                  <p className="text-sm text-muted-foreground">Total Orders</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <TrendingUp className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <p className="text-2xl font-bold">${totalSpent.toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">Total Spent</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <Clock className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <p className="text-2xl font-bold">
                    ${avgOrderValue.toFixed(2)}
                  </p>
                  <p className="text-sm text-muted-foreground">Avg Order</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <Star className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                  <p className="text-2xl font-bold">
                    {(avgRating || 0).toFixed(1)}
                  </p>
                  <p className="text-sm text-muted-foreground">Avg Rating</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest customer interactions and orders
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {deliveries.slice(0, 6).map((d, i) => (
                  <div
                    key={d.id || i}
                    className="flex items-center space-x-4 p-3 border rounded-lg"
                  >
                    <div
                      className={`w-2 h-2 rounded-full ${
                        d.status === "delivered"
                          ? "bg-green-500"
                          : d.status === "cancelled"
                          ? "bg-red-500"
                          : "bg-gray-500"
                      }`}
                    />
                    <div className="flex-1">
                      <p className="font-medium">
                        Order {d.trackingId || d.id}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {d.goodsType || d.type || "Order"} — $
                        {d.cost?.toFixed?.(2) ?? "-"}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(d.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{customer.email}</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{customer.phone || "-"}</span>
              </div>
              <div className="flex items-start space-x-3">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="text-sm">
                  <p>{customer.address?.street || "-"}</p>
                  <p>
                    {customer.address?.city || ""}
                    {customer.address?.city ? ", " : ""}
                    {customer.address?.state || ""}{" "}
                    {customer.address?.country || ""}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-2">
                <Button
                  onClick={() =>
                    router.push(`/admin/customers/${customerId}/orders`)
                  }
                >
                  View Order History
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
