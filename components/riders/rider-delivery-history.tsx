"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Eye } from "lucide-react";
import { fetchRiderDeliveryHistory } from "@/lib/firebase/deliveries";
import { formatDate } from "@/lib/utils/format-date";

const statusColors: Record<string, string> = {
  requested: "bg-yellow-500",
  accepted: "bg-blue-500",
  in_transit: "bg-purple-500",
  completed: "bg-green-500",
  cancelled: "bg-red-500",
};

export function RiderDeliveryHistory({ riderId }: { riderId: string }) {
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [selectedDelivery, setSelectedDelivery] = useState<any | null>(null);

  useEffect(() => {
    const loadDeliveries = async () => {
      try {
        const data = await fetchRiderDeliveryHistory(riderId);
        setDeliveries(data);
      } catch (error) {
        // handled
      } finally {
        setIsLoading(false);
      }
    };

    loadDeliveries();
  }, [riderId]);

  const filteredDeliveries =
    filter === "all"
      ? deliveries
      : deliveries.filter((delivery) => delivery.status === filter);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center">
        <CardTitle>Delivery History</CardTitle>
        <div className="ml-auto flex items-center space-x-2">
          <Select defaultValue="all" onValueChange={setFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="in_transit">In Transit</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-60 flex items-center justify-center">
            <p>Loading delivery history...</p>
          </div>
        ) : filteredDeliveries.length === 0 ? (
          <div className="h-60 flex items-center justify-center">
            <p>No delivery history found</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tracking ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Price (₦)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDeliveries.map((delivery) => (
                  <TableRow key={delivery.id}>
                    <TableCell>
                      {delivery.trackingId ? (
                        <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono text-muted-foreground">
                          {delivery.trackingId}
                        </code>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {formatDate(delivery.createdAt ?? delivery.date)}
                    </TableCell>
                    <TableCell className="font-semibold">
                      ₦{(delivery.cost || 0).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[delivery.status]}>
                        {delivery.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedDelivery(delivery)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {selectedDelivery && (
        <Dialog
          open={!!selectedDelivery}
          onOpenChange={() => setSelectedDelivery(null)}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Delivery Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-2 text-sm">
              <p>
                <strong>Tracking ID:</strong> {selectedDelivery.trackingId || "N/A"}
              </p>
              <p>
                <strong>Status:</strong> {selectedDelivery.status}
              </p>
              <p>
                <strong>Pickup:</strong>{" "}
                {selectedDelivery.pickupLocation?.address || "N/A"}
              </p>
              <p>
                <strong>Dropoff:</strong>{" "}
                {selectedDelivery.dropoffLocation?.address || "N/A"}
              </p>
              <p>
                <strong>Goods:</strong> {selectedDelivery.goodsSize}{" "}
                {selectedDelivery.goodsType}
              </p>
              <p>
                <strong>Fee:</strong> ₦
                {(selectedDelivery.cost || 0).toLocaleString()}
              </p>
              <p>
                <strong>Payment Status:</strong>{" "}
                {selectedDelivery.paymentStatus || "pending"}
              </p>
              <p>
                <strong>Created:</strong>{" "}
                {formatDate(selectedDelivery.createdAt ?? selectedDelivery.date)}
              </p>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
}
