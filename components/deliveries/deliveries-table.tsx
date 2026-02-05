"use client";

import { useEffect, useState, useMemo } from "react";
import { getDeliveries, type Delivery } from "@/lib/firebase/deliveries";
import { getRiders, type Rider } from "@/lib/firebase/riders";
import { db } from "@/lib/firebase/config";
import {
  doc,
  updateDoc,
  serverTimestamp,
  arrayUnion,
  Timestamp,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { updateDelivery, deleteDelivery } from "@/lib/firebase/deliveries";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Package,
  UserPlus,
  Clock,
  Activity,
  CheckCircle,
  Truck,
  RotateCcw,
  Search,
  Trash2,
  Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { StatsCard } from "../dashboard/stats-card";

type User = {
  id: string;
  displayName?: string;
  role?: string;
};

type FilterType =
  | "all"
  | "unassigned"
  | "traditional"
  | "pending"
  | "active"
  | "completed";

const DeliveriesTable = () => {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(
    null,
  );
  const [customerNames, setCustomerNames] = useState<Record<string, string>>(
    {},
  );
  const [courierNames, setCourierNames] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [showAssign, setShowAssign] = useState<boolean>(false);
  const [couriers, setCouriers] = useState<Rider[]>([]);
  const [assignLoading, setAssignLoading] = useState(false);
  const [selectedCourierId, setSelectedCourierId] = useState<string>("");
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

  const handleUpdateStatus = async (status: string) => {
    if (!selectedDelivery?.id) return;
    setUpdateLoading(true);
    try {
      await updateDelivery(selectedDelivery.id, { status });
      toast({
        title: "Status Updated",
        description: `Delivery status changed to ${status}`,
      });
      await fetchAllDeliveries();
      setSelectedDelivery((prev) => (prev ? { ...prev, status } : null));
    } catch (err) {
      toast({
        title: "Update Failed",
        description: "Failed to update delivery status",
        variant: "destructive",
      });
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleUpdatePayment = async (paymentStatus: string) => {
    if (!selectedDelivery?.id) return;
    setUpdateLoading(true);
    try {
      await updateDelivery(selectedDelivery.id, { paymentStatus });
      toast({
        title: "Payment Updated",
        description: `Payment status changed to ${paymentStatus}`,
      });
      await fetchAllDeliveries();
      setSelectedDelivery((prev) => (prev ? { ...prev, paymentStatus } : null));
    } catch (err) {
      toast({
        title: "Update Failed",
        description: "Failed to update payment status",
        variant: "destructive",
      });
    } finally {
      setUpdateLoading(false);
    }
  };

  const fetchCouriers = async () => {
    try {
      const riders = await getRiders();
      setCouriers(riders);
      const map: Record<string, string> = {};
      riders.forEach((r) => {
        const id = r.userId ?? r.id;
        map[id] = r.displayName ?? id;
      });
      setCourierNames(map);
    } catch (err) {
      setCouriers([]);
      setCourierNames({});
    }
  };

  const fetchCustomers = async () => {
    try {
      const q = query(collection(db, "User"), where("role", "==", "customer"));
      const snapshot = await getDocs(q);
      const map: Record<string, string> = {};
      snapshot.forEach((d) => {
        const data = d.data() as User;
        map[d.id] = data.displayName ?? d.id;
      });
      setCustomerNames(map);
    } catch (err) {
      setCustomerNames({});
    }
  };

  const fetchAllDeliveries = async () => {
    try {
      const data = await getDeliveries();
      const untagged = data.filter((d) => !d.tag);
      setDeliveries(untagged);
    } catch (err) {
      setDeliveries([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDelivery = async (id: string | undefined) => {
    if (!id) return;
    if (!window.confirm("Are you sure you want to delete this delivery?"))
      return;

    try {
      await deleteDelivery(id);
      toast({
        title: "Deleted",
        description: "Delivery has been deleted successfully.",
      });
      await fetchAllDeliveries(); // Refresh list
    } catch (error: any) {
      toast({
        title: "Delete failed",
        description: error.message || "Failed to delete delivery",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchAllDeliveries();
    fetchCustomers();
    fetchCouriers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A";
    if (timestamp.toDate) return timestamp.toDate().toLocaleString();
    if (timestamp.seconds)
      return new Date(timestamp.seconds * 1000).toLocaleString();
    return new Date(timestamp).toLocaleString();
  };

  const copyTrackingId = async (id: string | undefined) => {
    if (!id) return;
    try {
      await navigator.clipboard.writeText(id);
      toast({
        title: "Copied",
        description: "Tracking ID copied to clipboard.",
      });
    } catch (err) {
      try {
        const input = document.createElement("input");
        input.value = id;
        document.body.appendChild(input);
        input.select();
        document.execCommand("copy");
        document.body.removeChild(input);
        toast({
          title: "Copied",
          description: "Tracking ID copied to clipboard.",
        });
      } catch (e) {
        toast({
          title: "Copy failed",
          description: "Could not copy tracking ID.",
          variant: "destructive",
        });
      }
    }
  };

  const filteredDeliveries = useMemo(() => {
    let result = deliveries.filter((d: Delivery) => {
      const customerName = (
        customerNames[d.customerId] ?? d.customerId
      ).toLowerCase();
      const courierName = (
        d.courierId ? (courierNames[d.courierId] ?? d.courierId) : "unassigned"
      ).toLowerCase();
      const trackingId = (d.trackingId ?? "").toLowerCase();
      const s = searchQuery.toLowerCase();

      return (
        customerName.includes(s) ||
        courierName.includes(s) ||
        trackingId.includes(s)
      );
    });

    if (filter === "unassigned") {
      result = result.filter((d: Delivery) => !d.courierId);
    } else if (filter === "traditional") {
      result = result.filter((d: Delivery) => d.type === "traditional");
    } else if (filter === "pending") {
      result = result.filter((d: Delivery) => d.status === "pending");
    } else if (filter === "active") {
      const activeStatuses = [
        "assigned",
        "picked_up",
        "at_station",
        "out_for_delivery",
      ];
      result = result.filter((d: Delivery) =>
        activeStatuses.includes(d.status || ""),
      );
    } else if (filter === "completed") {
      const completedStatuses = ["delivered", "received"];
      result = result.filter((d: Delivery) =>
        completedStatuses.includes(d.status || ""),
      );
    }

    return result;
  }, [deliveries, filter, searchQuery, customerNames, courierNames]);

  // Pagination
  const total = filteredDeliveries.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  useEffect(() => {
    if (page > totalPages) {
      setPage(1);
    }
  }, [page, totalPages]);

  const unassignedCount = deliveries.filter(
    (d: Delivery) => !d.courierId,
  ).length;
  const pendingCount = deliveries.filter(
    (d: Delivery) => d.status === "pending",
  ).length;
  const activeCount = deliveries.filter((d: Delivery) =>
    ["assigned", "picked_up", "at_station", "out_for_delivery"].includes(
      d.status || "",
    ),
  ).length;
  const completedCount = deliveries.filter((d: Delivery) =>
    ["delivered", "received"].includes(d.status || ""),
  ).length;

  if (loading) return <p className="p-4">Loading deliveries...</p>;

  // Avoid state update during render if possible, but the page reset is usually done in useEffect.
  // I noticed 'if (page > totalPages) setPage(1);' at line 277. I'll wrap that in useEffect if it causes issues.
  // For now I'll just move it above the loading check too.

  const startIndex = (page - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, total);
  const pageItems = filteredDeliveries.slice(startIndex, endIndex);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <StatsCard
          title="All"
          value={deliveries.length}
          icon={Package}
          color="gray"
          isActive={filter === "all"}
          onClick={() => setFilter("all")}
          className="p-4"
        />
        <StatsCard
          title="Unassigned"
          value={unassignedCount}
          icon={UserPlus}
          color="red"
          isActive={filter === "unassigned"}
          onClick={() => setFilter("unassigned")}
          className="p-4"
        />
        <StatsCard
          title="Pending"
          value={pendingCount}
          icon={Clock}
          color="amber"
          isActive={filter === "pending"}
          onClick={() => setFilter("pending")}
          className="p-4"
        />
        <StatsCard
          title="Active"
          value={activeCount}
          icon={Activity}
          color="blue"
          isActive={filter === "active"}
          onClick={() => setFilter("active")}
          className="p-4"
        />
        <StatsCard
          title="Completed"
          value={completedCount}
          icon={CheckCircle}
          color="green"
          isActive={filter === "completed"}
          onClick={() => setFilter("completed")}
          className="p-4"
        />
        <StatsCard
          title="Traditional"
          value={deliveries.filter((d) => d.type === "traditional").length}
          icon={Truck}
          color="purple"
          isActive={filter === "traditional"}
          onClick={() => setFilter("traditional")}
          className="p-4"
        />
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search customer, courier, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          {(filter !== "all" || searchQuery !== "") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFilter("all");
                setSearchQuery("");
              }}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset
            </Button>
          )}
          <Button onClick={fetchAllDeliveries} variant="outline" size="sm">
            Refresh
          </Button>
        </div>
      </div>

      <div className="mb-2 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {startIndex + 1}-{endIndex} of {total}
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm">Rows:</label>
          <select
            className="input h-8"
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
          >
            {[10, 25, 50, 100].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <Button
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Prev
          </Button>
          <div className="px-2 text-sm">
            {page} / {totalPages}
          </div>
          <Button
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      </div>

      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50/50">
            <TableRow>
              <TableHead className="font-bold text-gray-900">
                Customer
              </TableHead>
              <TableHead className="font-bold text-gray-900">Courier</TableHead>
              <TableHead className="font-bold text-gray-900">Status</TableHead>
              <TableHead className="font-bold text-gray-900">Fee</TableHead>
              <TableHead className="font-bold text-gray-900">Created</TableHead>
              <TableHead className="font-bold text-gray-900">
                Tracking ID
              </TableHead>
              <TableHead className="text-right font-bold text-gray-900">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageItems.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-32 text-center text-muted-foreground"
                >
                  No deliveries found matching your criteria.
                </TableCell>
              </TableRow>
            ) : (
              pageItems.map((d, index) => (
                <TableRow
                  key={d.id || `delivery-${index}`}
                  className="group hover:bg-gray-50/50 transition-colors"
                >
                  <TableCell className="font-medium max-w-[220px] truncate">
                    {customerNames[d.customerId] ?? d.customerId}
                  </TableCell>
                  <TableCell className="max-w-[180px] truncate">
                    {d.courierId ? (
                      (courierNames[d.courierId] ?? d.courierId)
                    ) : (
                      <span className="text-muted-foreground italic text-xs">
                        Unassigned
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize",
                        d.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : d.status === "pending"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-blue-100 text-blue-800",
                      )}
                    >
                      {d.status.replace(/_/g, " ")}
                    </span>
                  </TableCell>
                  <TableCell className="font-semibold">
                    ₦{(d.cost || 0).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-muted-foreground whitespace-nowrap">
                    {formatDate(d.createdAt)}
                  </TableCell>
                  <TableCell className="max-w-[200px]">
                    {d.trackingId ? (
                      <div className="flex items-center gap-2 group/tracking">
                        <code className="bg-gray-100 px-1.5 py-0.5 rounded text-[10px] font-mono text-gray-600 truncate max-w-[120px]">
                          {d.trackingId}
                        </code>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 opacity-0 group-hover/tracking:opacity-100 transition-opacity"
                          onClick={() => copyTrackingId(d.trackingId)}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="lucide lucide-copy"
                          >
                            <rect
                              width="14"
                              height="14"
                              x="8"
                              y="8"
                              rx="2"
                              ry="2"
                            />
                            <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                          </svg>
                        </Button>
                      </div>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 rounded-lg font-medium"
                        onClick={() => {
                          setSelectedDelivery(d);
                          setSelectedCourierId("");
                          setShowAssign(false);
                        }}
                      >
                        Details
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        onClick={() => handleDeleteDelivery(d.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {selectedDelivery && (
        <Dialog
          open={!!selectedDelivery}
          onOpenChange={() => {
            setSelectedDelivery(null);
            setShowAssign(false);
            setSelectedCourierId("");
          }}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Delivery Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-2 text-sm">
              <p>
                <strong>Customer:</strong>{" "}
                {selectedDelivery?.customerId
                  ? (customerNames[selectedDelivery.customerId] ??
                    selectedDelivery.customerId)
                  : "N/A"}
              </p>
              <p>
                <strong>Courier:</strong>{" "}
                {selectedDelivery?.courierId
                  ? (courierNames[selectedDelivery.courierId] ??
                    selectedDelivery.courierId)
                  : "Unassigned"}
              </p>
              <p>
                <strong>Status:</strong> {selectedDelivery?.status}
              </p>
              <p>
                <strong>Pickup:</strong>{" "}
                {selectedDelivery?.pickupLocation?.address || "N/A"}
              </p>
              <p>
                <strong>Dropoff:</strong>{" "}
                {selectedDelivery?.dropoffLocation?.address || "N/A"}
              </p>
              <p>
                <strong>Goods:</strong> {selectedDelivery?.goodsSize}{" "}
                {selectedDelivery?.goodsType}
              </p>
              <p>
                <strong>Fee:</strong> ₦
                {(selectedDelivery?.cost || 0).toLocaleString()}
              </p>
              <p>
                <strong>Created:</strong>{" "}
                {formatDate(selectedDelivery?.createdAt)}
              </p>
              <div className="pt-4 border-t space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground">
                    Update Delivery Status
                  </label>
                  <Select
                    value={selectedDelivery?.status || ""}
                    onValueChange={handleUpdateStatus}
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
                    Update Payment Status
                  </label>
                  <Select
                    value={selectedDelivery?.paymentStatus || "pending"}
                    onValueChange={handleUpdatePayment}
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

              {selectedDelivery && !selectedDelivery.courierId && (
                <div className="pt-2">
                  <Button
                    variant="default"
                    onClick={() => {
                      fetchCouriers();
                      setShowAssign(true);
                    }}
                  >
                    Assign Courier
                  </Button>
                </div>
              )}
              {showAssign && !selectedDelivery.courierId && (
                <div className="pt-2">
                  <label className="block mb-2">Select Courier:</label>
                  <select
                    className="w-full border rounded px-2 py-1 mb-2"
                    value={selectedCourierId}
                    onChange={(e) => setSelectedCourierId(e.target.value)}
                  >
                    <option value="" disabled>
                      Select a courier
                    </option>
                    {couriers.map((c) => (
                      <option key={c.id ?? c.userId} value={c.userId ?? c.id}>
                        {c.displayName ?? c.userId ?? c.id}
                      </option>
                    ))}
                  </select>
                  <Button
                    variant="default"
                    disabled={assignLoading || !selectedCourierId}
                    onClick={async () => {
                      if (!selectedDelivery?.id || !selectedCourierId) return;
                      setAssignLoading(true);
                      try {
                        await updateDoc(
                          doc(db, "deliveries", selectedDelivery.id),
                          {
                            courierId: selectedCourierId,
                            status: "assigned",
                            assignedAt: serverTimestamp(),
                            history: arrayUnion({
                              timestamp: Timestamp.now(),
                              status: "assigned",
                            }),
                          },
                        );
                        setShowAssign(false);
                        setSelectedDelivery(null);
                        setSelectedCourierId("");
                        await fetchAllDeliveries();
                        await fetchCouriers();
                      } catch (err) {
                        // handled
                      } finally {
                        setAssignLoading(false);
                      }
                    }}
                  >
                    Assign
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default DeliveriesTable;
