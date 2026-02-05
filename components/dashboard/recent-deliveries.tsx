"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getDeliveries, type Delivery } from "@/lib/firebase/deliveries";
import { getCustomer } from "@/lib/firebase/customers";
import { Loader2 } from "lucide-react";

const statusColors: Record<string, string> = {
  requested: "bg-yellow-500",
  accepted: "bg-blue-500",
  in_transit: "bg-purple-500",
  completed: "bg-green-500",
  cancelled: "bg-red-500",
};

export function RecentDeliveries() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [customerNames, setCustomerNames] = useState<Record<string, string>>(
    {},
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDeliveries = async () => {
      setIsLoading(true);
      try {
        const fetchedDeliveries = await getDeliveries();
        // Sort by createdAt (newest first) and take the first 5
        const sortedDeliveries = fetchedDeliveries
          .sort((a, b) => {
            const aTime = a.createdAt?.toDate
              ? a.createdAt.toDate().getTime()
              : 0;
            const bTime = b.createdAt?.toDate
              ? b.createdAt.toDate().getTime()
              : 0;
            return bTime - aTime;
          })
          .slice(0, 5);
        setDeliveries(sortedDeliveries);

        // Fetch display names for each customerId
        const names: Record<string, string> = {};
        await Promise.all(
          sortedDeliveries.map(async (delivery) => {
            if (delivery.customerId && !names[delivery.customerId]) {
              try {
                const customer = await getCustomer(delivery.customerId);
                names[delivery.customerId] =
                  customer?.displayName || delivery.customerId;
              } catch {
                names[delivery.customerId] = delivery.customerId;
              }
            }
          }),
        );
        setCustomerNames(names);
      } catch (error) {
        setDeliveries([]); // Clear deliveries on error
        setCustomerNames({});
      } finally {
        setIsLoading(false);
      }
    };
    fetchDeliveries();
  }, []);

  function formatDate(date: Date) {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    }).format(date);
  }

  return (
    <Card className="border-gray-200 bg-white shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        {/* <CardTitle className="text-gray-900">Recent Deliveries</CardTitle> */}
        {/* <Button
          variant="outline"
          size="sm"
          className="hidden md:flex bg-transparent"
        >
          View All
        </Button> */}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : deliveries.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No recent deliveries found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50/50">
                <TableRow>
                  <TableHead className="text-xs md:text-sm font-bold text-gray-900">
                    ID
                  </TableHead>
                  <TableHead className="text-xs md:text-sm font-bold text-gray-900">
                    Customer
                  </TableHead>
                  <TableHead className="text-xs md:text-sm font-bold text-gray-900">
                    Status
                  </TableHead>
                  <TableHead className="text-xs md:text-sm hidden md:table-cell font-bold text-gray-900">
                    Date
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deliveries.map((delivery) => (
                  <TableRow
                    key={delivery.id}
                    className="group hover:bg-gray-50/50 transition-colors"
                  >
                    <TableCell className="font-medium text-xs md:text-sm">
                      <span className="hover:underline cursor-pointer">
                        {delivery.id?.substring(0, 8)}...
                      </span>
                    </TableCell>
                    <TableCell className="text-xs md:text-sm">
                      {customerNames[delivery.customerId] ||
                        delivery.customerId}
                    </TableCell>
                    {/* Show displayName if available */}
                    <TableCell>
                      <Badge
                        className={`${statusColors[delivery.status]} text-xs`}
                        variant="secondary"
                      >
                        {delivery.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs md:text-sm hidden md:table-cell">
                      {formatDate(
                        delivery.createdAt?.toDate
                          ? delivery.createdAt.toDate()
                          : new Date(),
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
