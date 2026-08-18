"use client";

import { useEffect, useState } from "react";
import { getDeliveries, type Delivery } from "@/lib/firebase/deliveries";
import { getRiders, type Rider } from "@/lib/firebase/riders";
import { db } from "@/lib/firebase/config";
import {
  collection,
  getDocs,
  doc,
  writeBatch,
  serverTimestamp,
  arrayUnion,
  Timestamp,
  query,
  where,
} from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type User = {
  id: string;
  displayName?: string;
  role?: string;
};

const DeliveriesByTag = () => {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [groupedDeliveries, setGroupedDeliveries] = useState<
    Record<string, Delivery[]>
  >({});
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const [couriers, setCouriers] = useState<Rider[]>([]);
  const [courierMap, setCourierMap] = useState<Record<string, string>>({});
  const [customersMap, setCustomersMap] = useState<Record<string, string>>({});
  const [selectedCourierId, setSelectedCourierId] = useState("");
  const [showAssign, setShowAssign] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);

  const DELIVERY_STATUSES = [
    "pending",
    "assigned",
    "picked_up",
    "at_station",
    "out_for_delivery",
    "delivered",
    "received",
    "cancelled",
  ];

  const PAYMENT_STATUSES = ["pending", "paid", "unpaid", "partially_paid"];

  useEffect(() => {}, []);

  // Fetch couriers and build lookup
  const fetchCouriers = async () => {
    try {
      const riders = await getRiders();
      setCouriers(riders);

      const map: Record<string, string> = {};
      riders.forEach((c) => {
        const id = c.userId ?? c.id;
        map[id] = c.displayName ?? id;
      });
      setCourierMap(map);
    } catch (err) {
      setCouriers([]);
      setCourierMap({});
    }
  };

  // Fetch customers from User collection
  const fetchCustomers = async () => {
    try {
      const q = query(collection(db, "User"), where("role", "==", "customer"));
      const snapshot = await getDocs(q);
      const map: Record<string, string> = {};
      snapshot.forEach((doc) => {
        const data = doc.data() as User;
        map[doc.id] = data.displayName ?? doc.id;
      });
      setCustomersMap(map);
    } catch (err) {
      setCustomersMap({});
    }
  };

  // Fetch deliveries and group by tag
  const fetchDeliveries = async () => {
    try {
      const data = await getDeliveries();
      const tagged = data.filter((d) => d.tag);
      const grouped: Record<string, Delivery[]> = {};
      tagged.forEach((d) => {
        const tag = d.tag || "untagged";
        if (!grouped[tag]) grouped[tag] = [];
        grouped[tag].push(d);
      });
      setDeliveries(data);
      setGroupedDeliveries(grouped);
    } catch (err) {
      // handled
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBatchStatus = async (status: string) => {
    if (!selectedTag || !groupedDeliveries[selectedTag]) return;
    setUpdateLoading(true);
    try {
      const batchWrite = writeBatch(db);
      const batchDeliveries = groupedDeliveries[selectedTag];

      batchDeliveries.forEach((delivery) => {
        if (!delivery?.id) return;
        const docRef = doc(db, "deliveries", delivery.id);
        
        const historyEntry: any = {
          timestamp: Timestamp.now(),
          status: status,
        };

        batchWrite.update(docRef, {
          status,
          updatedAt: serverTimestamp(),
          history: arrayUnion(historyEntry),
        });
      });

      await batchWrite.commit();
      toast({
        title: "Batch Status Updated",
        description: `All deliveries in batch ${selectedTag} updated to ${status}`,
      });
      await fetchDeliveries(); // Refresh data
    } catch (err) {
      toast({
        title: "Update Failed",
        description: "Failed to update batch status",
        variant: "destructive",
      });
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleUpdateBatchPayment = async (paymentStatus: string) => {
    if (!selectedTag || !groupedDeliveries[selectedTag]) return;
    setUpdateLoading(true);
    try {
      const batchWrite = writeBatch(db);
      const batchDeliveries = groupedDeliveries[selectedTag];

      batchDeliveries.forEach((delivery) => {
        if (!delivery?.id) return;
        const docRef = doc(db, "deliveries", delivery.id);
        
        const historyEntry: any = {
          timestamp: Timestamp.now(),
          status: delivery.status || "updated",
          paymentStatus: paymentStatus,
        };

        batchWrite.update(docRef, {
          paymentStatus,
          updatedAt: serverTimestamp(),
          history: arrayUnion(historyEntry),
        });
      });

      await batchWrite.commit();
      toast({
        title: "Batch Payment Updated",
        description: `Payment status for batch ${selectedTag} updated to ${paymentStatus}`,
      });
      await fetchDeliveries(); // Refresh data
    } catch (err) {
      toast({
        title: "Update Failed",
        description: "Failed to update batch payment status",
        variant: "destructive",
      });
    } finally {
      setUpdateLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveries();
    fetchCustomers();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="animate-spin w-6 h-6 mr-2" />
        <span>Loading deliveries...</span>
      </div>
    );
  }

  const tags = Object.keys(groupedDeliveries);
  if (tags.length === 0)
    return <p className="p-4">No tagged deliveries found.</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Deliveries by Tag</h1>

      {/* Grid of tag cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {tags.map((tag) => (
          <Card
            key={tag}
            onClick={async () => {
              setSelectedTag(tag);
              setShowDialog(true);
              setShowAssign(false);
              setSelectedCourierId("");
              await fetchCouriers();
            }}
            className="cursor-pointer hover:shadow-lg transition-shadow border border-border"
          >
            <CardHeader>
              <CardTitle className="capitalize">{tag}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {groupedDeliveries[tag].length} drop-offs
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tag Details Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="capitalize">
              Delivery Batch: {selectedTag}
            </DialogTitle>
          </DialogHeader>

          {selectedTag &&
            (() => {
              const batch = groupedDeliveries[selectedTag];
              const first = batch?.[0];
              if (!first)
                return <p className="p-4">No deliveries in this batch.</p>;

              const allAssigned = batch.every((d) => !!d.courierId);
              const assignedCourierId = first?.courierId;
              const customerName =
                customersMap[first.customerId] ?? first.customerId;

              return (
                <div className="space-y-4 text-sm">
                  <div className="bg-muted/50 p-3 rounded-md border space-y-1">
                    <p>
                      <strong>Customer:</strong> {customerName}
                    </p>
                    <p>
                      <strong>Status:</strong> {first.status}
                    </p>
                    <p>
                      <strong>Pickup Address:</strong>{" "}
                      {first.pickupLocation?.address || "N/A"}
                    </p>
                    <p>
                      <strong>Courier:</strong>{" "}
                      {assignedCourierId && courierMap[assignedCourierId]
                        ? courierMap[assignedCourierId]
                        : "Unassigned"}
                    </p>
                    <p>
                      <strong>Tracking ID:</strong> {first.trackingId || "N/A"}
                    </p>
                  </div>

                  <div className="border-t pt-3">
                    <p className="font-semibold mb-2">Drop-off Addresses</p>
                    <div className="max-h-[50vh] overflow-y-auto space-y-2">
                      {batch.map((delivery, index) => (
                        <Card
                          key={delivery.id || `idx-${index}`}
                          className="border border-border"
                        >
                          <CardContent className="py-2 px-3">
                            <p className="text-foreground">
                              <strong>#{index + 1}:</strong>{" "}
                              {delivery.dropoffLocation?.address || "N/A"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Fee: ₦{(delivery.cost || 0).toLocaleString()}
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-muted-foreground">
                        Update Batch Delivery Status
                      </label>
                      <Select
                        value={first.status || ""}
                        onValueChange={handleUpdateBatchStatus}
                        disabled={updateLoading}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          {DELIVERY_STATUSES.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s.replace(/_/g, " ").toUpperCase()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-muted-foreground">
                        Update Batch Payment Status
                      </label>
                      <Select
                        value={first.paymentStatus || "pending"}
                        onValueChange={handleUpdateBatchPayment}
                        disabled={updateLoading}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select payment status" />
                        </SelectTrigger>
                        <SelectContent>
                          {PAYMENT_STATUSES.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s.replace(/_/g, " ").toUpperCase()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Assign Courier Section */}
                  {!allAssigned && (
                    <div className="pt-3">
                      {!showAssign ? (
                        <Button
                          variant="default"
                          onClick={() => setShowAssign(true)}
                        >
                          Assign Courier
                        </Button>
                      ) : (
                        <div>
                          <label className="block mb-2">Select Courier:</label>
                          <select
                            className="w-full border rounded px-2 py-1 mb-2"
                            value={selectedCourierId}
                            onChange={(e) =>
                              setSelectedCourierId(e.target.value)
                            }
                          >
                            <option value="" disabled>
                              Select a courier
                            </option>
                            {couriers.map((c) => (
                              <option
                                key={c.id ?? c.userId}
                                value={c.userId ?? c.id}
                              >
                                {c.displayName ?? c.userId ?? c.id}
                              </option>
                            ))}
                          </select>

                          <Button
                            variant="default"
                            disabled={assignLoading || !selectedCourierId}
                            onClick={async () => {
                              if (!selectedCourierId || !selectedTag) return;
                              setAssignLoading(true);
                              try {
                                const batchDeliveries =
                                  groupedDeliveries[selectedTag] ?? [];
                                const batchWrite = writeBatch(db);

                                batchDeliveries.forEach((delivery) => {
                                  if (!delivery?.id) return;
                                  const docRef = doc(
                                    db,
                                    "deliveries",
                                    delivery.id,
                                  );
                                  batchWrite.update(docRef, {
                                    courierId: selectedCourierId,
                                    status: "assigned",
                                    assignedAt: serverTimestamp(),
                                    history: arrayUnion({
                                      timestamp: Timestamp.now(),
                                      status: "assigned",
                                    }),
                                  });
                                });

                                await batchWrite.commit();
                                await fetchDeliveries();
                                setShowAssign(false);
                                setSelectedCourierId("");
                              } catch (err) {
                                // handled
                              } finally {
                                setAssignLoading(false);
                              }
                            }}
                          >
                            {assignLoading ? "Assigning..." : "Assign"}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}

          <div className="mt-4 flex justify-end">
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DeliveriesByTag;
