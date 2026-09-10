content = """
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
  CreditCard,
  Wifi,
  BadgeCheck,
  ShieldAlert,
  ShieldCheck
} from "lucide-react";
import { getCustomer, updateCustomerVerification } from "@/lib/firebase/customers";
import { getDeliveriesByCustomer } from "@/lib/firebase/deliveries";
import { useRole } from "@/lib/hooks/use-role";
import { useToast } from "@/hooks/use-toast";

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
  const role = useRole();
  const { toast } = useToast();
  
  const [customer, setCustomer] = useState<any | null>(null);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      try {
        const c = await getCustomer(customerId);
        const delivs = await getDeliveriesByCustomer(customerId);
        if (!mounted) return;

        if (c) setCustomer(c);
        if (delivs) setDeliveries(delivs);
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [customerId]);

  const handleVerify = async () => {
    if (role !== "admin") return;
    setVerifying(true);
    try {
      const newStatus = !customer.isVerified;
      await updateCustomerVerification(customerId, newStatus);
      setCustomer({ ...customer, isVerified: newStatus });
      toast({ title: newStatus ? "Customer verified" : "Verification revoked", variant: "default" });
    } catch (err) {
      toast({ title: "Error updating verification", variant: "destructive" });
    } finally {
      setVerifying(false);
    }
  };

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

  const avatar = customer.profilePhoto || "/placeholder.svg";
  const nameToDisplay = customer.displayName || customer.fullName || customer.email;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={avatar} alt={nameToDisplay} />
                <AvatarFallback className="text-lg">
                  {(nameToDisplay || "")
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-2xl font-bold flex items-center">
                    {nameToDisplay}
                    {customer.isVerified && (
                      <BadgeCheck className="ml-2 h-6 w-6 text-red-500" />
                    )}
                  </h2>
                  <Badge variant={customer.isActive ? "default" : "secondary"}>
                    {customer.isActive ? "Active" : "Inactive"}
                  </Badge>
                  <Badge variant="outline" className="uppercase bg-slate-100 dark:bg-slate-800">
                    {customer.role || "Customer"}
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
              {role === "admin" && (
                <Button
                  variant={customer.isVerified ? "outline" : "default"}
                  onClick={handleVerify}
                  disabled={verifying}
                  className={customer.isVerified ? "border-red-500 text-red-500 hover:bg-red-50" : "bg-red-600 hover:bg-red-700"}
                  size="sm"
                >
                  {customer.isVerified ? <ShieldAlert className="mr-2 h-4 w-4" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                  {customer.isVerified ? "Revoke" : "Verify"}
                </Button>
              )}
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
          
          {/* Wallet ATM Card */}
          <Card className="bg-red-600 text-white overflow-hidden relative shadow-lg">
            <div className="absolute top-[-50px] right-[-50px] w-36 h-36 rounded-full bg-white/10" />
            <div className="absolute bottom-[-80px] left-[-20px] w-48 h-48 rounded-full bg-black/10" />
            <CardHeader className="pb-2 relative z-10">
              <div className="flex justify-between items-center">
                <CardTitle className="text-white/90 text-lg font-medium italic tracking-wide">SahelX Virtual</CardTitle>
                <Wifi className="rotate-90 text-white/90 h-6 w-6" />
              </div>
            </CardHeader>
            <CardContent className="pt-4 relative z-10">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <p className="text-xs text-white/80 uppercase tracking-widest mb-1">Available Balance</p>
                  <p className="text-3xl font-bold tracking-wider">
                    &#8358;{(customer.walletBalance || 0).toLocaleString()}
                  </p>
                </div>
                <div className="w-11 h-8 bg-amber-300 rounded-md border border-amber-500 flex items-center justify-center shadow-sm">
                  <div className="w-6 h-4 border border-black/15 rounded-[4px]" />
                </div>
              </div>
              <div>
                <p className="text-[10px] text-white/70 uppercase tracking-widest mb-1">Card Holder</p>
                <p className="text-sm font-medium tracking-widest uppercase">
                  {nameToDisplay}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Order Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <div className="text-center p-4 border rounded-lg">
                  <ShoppingBag className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-lg font-medium">{totalOrders}</p>
                  <p className="text-sm text-muted-foreground">Total Orders</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <TrendingUp className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <p className="text-lg font-medium">&#8358;{totalSpent.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Total Spent</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <Clock className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <p className="text-lg font-medium">
                    &#8358;{avgOrderValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-sm text-muted-foreground">Avg Order</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <Star className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                  <p className="text-lg font-medium">
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
                        {d.goodsType || d.type || "Order"} &mdash; &#8358;
                        {d.cost?.toLocaleString() ?? "-"}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(d.createdAt)}
                    </p>
                  </div>
                ))}
                {deliveries.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
                )}
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Saved Addresses</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(customer.savedAddresses && customer.savedAddresses.length > 0) ? (
                customer.savedAddresses.map((addr: any, idx: number) => (
                  <div key={idx} className="flex items-start space-x-3 border-b last:border-0 pb-3 last:pb-0">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium">{addr.title || "Address"}</p>
                      <p className="text-muted-foreground">{addr.street || ""}</p>
                      <p className="text-muted-foreground">
                        {addr.city || ""}
                        {addr.city ? ", " : ""}
                        {addr.state || ""}{" "}
                        {addr.country || ""}
                      </p>
                      {addr.isDefault && (
                        <Badge variant="secondary" className="mt-1 text-[10px]">Default</Badge>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex items-start space-x-3">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="text-sm text-muted-foreground">
                    <p>{customer.address?.street || "No saved addresses"}</p>
                  </div>
                </div>
              )}
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
"""

with open('components/customers/customer-profile.tsx', 'w', encoding='utf-8') as f:
    f.write(content.strip())
