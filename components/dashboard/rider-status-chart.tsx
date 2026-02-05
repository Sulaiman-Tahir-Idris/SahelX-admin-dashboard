"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { getRiders } from "@/lib/firebase/riders";
import { getDeliveries } from "@/lib/firebase/deliveries";

export function RiderStatusChart() {
  const [data, setData] = useState([
    { name: "Available", value: 0, color: "#22c55e" }, // green-500
    { name: "On Delivery", value: 0, color: "#3b82f6" }, // blue-500
    { name: "Offline", value: 0, color: "#ef4444" }, // red-500
  ]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRiderStatus = async () => {
      setIsLoading(true);
      try {
        const [riders, deliveries] = await Promise.all([
          getRiders(),
          getDeliveries(),
        ]);

        let availableCount = 0;
        let onDeliveryCount = 0;
        let offlineCount = 0;

        const activeDeliveryRiderIds = new Set(
          deliveries
            .filter(
              (d) =>
                d.courierId &&
                d.status?.toLowerCase() !== "completed" &&
                d.status?.toLowerCase() !== "cancelled" &&
                d.status?.toLowerCase() !== "received" &&
                d.status?.toLowerCase() !== "recieved",
            )
            .map((d) => d.courierId),
        );

        riders.forEach((rider) => {
          if (!rider.isActive) {
            offlineCount++;
          } else if (activeDeliveryRiderIds.has(rider.userId)) {
            onDeliveryCount++;
          } else {
            availableCount++;
          }
        });

        setData([
          { name: "Available", value: availableCount, color: "#22c55e" },
          { name: "On Delivery", value: onDeliveryCount, color: "#3b82f6" },
          { name: "Offline", value: offlineCount, color: "#ef4444" },
        ]);
      } catch (error) {
        // Reset data on error
        setData([
          { name: "Available", value: 0, color: "#22c55e" },
          { name: "On Delivery", value: 0, color: "#3b82f6" },
          { name: "Offline", value: 0, color: "#ef4444" },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRiderStatus();
  }, []);

  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card>
      <CardHeader>{/* <CardTitle>Rider Status</CardTitle> */}</CardHeader>
      <CardContent className="h-[300px]">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : total === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            No rider data available.
          </div>
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="space-y-4 w-full">
              {data.map((item) => {
                const percentage =
                  total > 0 ? ((item.value / total) * 100).toFixed(0) : "0";
                return (
                  <div key={item.name} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: item.color }}
                        ></div>
                        {item.name}
                      </span>
                      <span>
                        {item.value} riders ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all duration-300"
                        style={{
                          backgroundColor: item.color,
                          width: `${percentage}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
