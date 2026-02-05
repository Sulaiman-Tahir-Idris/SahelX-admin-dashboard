"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bike, Calendar, Package, Users, Loader2 } from "lucide-react";
import { getRiders } from "@/lib/firebase/riders";
import { getCustomers } from "@/lib/firebase/users";
import { getDeliveries } from "@/lib/firebase/deliveries";

export function OverviewStats() {
  const [stats, setStats] = useState({
    totalDeliveries: 0,
    totalRiders: 0,
    totalCustomers: 0,
    todayDeliveries: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setIsLoading(true);

      const [riders, customers, deliveries] = await Promise.all([
        getRiders(),
        getCustomers(),
        getDeliveries(),
      ]);

      const today = new Date();
      today.setHours(0, 0, 0, 0); // Start of today

      const todayDeliveriesCount = deliveries.filter((delivery) => {
        const deliveryDate = delivery.createdAt?.toDate
          ? delivery.createdAt.toDate()
          : new Date(0); // Handle Firebase Timestamp
        return deliveryDate >= today;
      }).length;

      setStats({
        totalDeliveries: deliveries.length,
        totalRiders: riders.length,
        totalCustomers: customers.length,
        todayDeliveries: todayDeliveriesCount,
      });
    } catch (error) {
      // Keep default values on error or set to 0
      setStats({
        totalDeliveries: 0,
        totalRiders: 0,
        totalCustomers: 0,
        todayDeliveries: 0,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 md:gap-6 grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border-gray-200 bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-center h-16">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      <Card className="relative overflow-hidden border-none shadow-sm hover:shadow-md transition-all duration-300 group bg-white">
        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs md:text-sm font-semibold text-gray-600 uppercase tracking-wider">
            Total Deliveries
          </CardTitle>
          <div className="rounded-xl bg-blue-50 p-2 group-hover:bg-blue-100 transition-colors">
            <Package className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
            {stats.totalDeliveries.toLocaleString()}
          </div>
          <div className="flex items-center mt-1 text-[10px] md:text-xs">
            <span className="text-gray-400 font-medium">
              All-time processed orders
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className="relative overflow-hidden border-none shadow-sm hover:shadow-md transition-all duration-300 group bg-white">
        <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs md:text-sm font-semibold text-gray-600 uppercase tracking-wider">
            Active Riders
          </CardTitle>
          <div className="rounded-xl bg-emerald-50 p-2 group-hover:bg-emerald-100 transition-colors">
            <Bike className="h-4 w-4 md:h-5 md:w-5 text-emerald-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
            {stats.totalRiders}
          </div>
          <div className="flex items-center mt-1 text-[10px] md:text-xs text-emerald-600 font-semibold">
            <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
            Verified delivery partners
          </div>
        </CardContent>
      </Card>

      <Card className="relative overflow-hidden border-none shadow-sm hover:shadow-md transition-all duration-300 group bg-white">
        <div className="absolute top-0 left-0 w-1 h-full bg-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs md:text-sm font-semibold text-gray-600 uppercase tracking-wider">
            Total Customers
          </CardTitle>
          <div className="rounded-xl bg-purple-50 p-2 group-hover:bg-purple-100 transition-colors">
            <Users className="h-4 w-4 md:h-5 md:w-5 text-purple-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
            {stats.totalCustomers.toLocaleString()}
          </div>
          <p className="text-[10px] md:text-xs text-gray-400 mt-1 font-medium">
            Standard & corporate users
          </p>
        </CardContent>
      </Card>

      <Card className="relative overflow-hidden border-none shadow-sm hover:shadow-md transition-all duration-300 group bg-white">
        <div className="absolute top-0 left-0 w-1 h-full bg-sahelx-600 opacity-0 group-hover:opacity-100 transition-opacity" />
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs md:text-sm font-semibold text-gray-600 uppercase tracking-wider">
            Daily Volume
          </CardTitle>
          <div className="rounded-xl bg-sahelx-50 p-2 group-hover:bg-sahelx-100 transition-colors">
            <Calendar className="h-4 w-4 md:h-5 md:w-5 text-sahelx-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
            {stats.todayDeliveries}
          </div>
          <div className="flex items-center mt-1 text-[10px] md:text-xs font-semibold text-sahelx-600">
            Orders processed today
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
