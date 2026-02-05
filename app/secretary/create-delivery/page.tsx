"use client";

import { useState } from "react";
import { SecretaryDashboardLayout } from "@/components/dashboard/secretary-dashboard-layout";
import { toast } from "@/components/ui/use-toast";
import { db } from "@/lib/firebase/config";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  User,
  MapPin,
  Phone,
  Package,
  Scale,
  CreditCard,
  Plus,
  Trash2,
  Truck,
  Building2,
} from "lucide-react";

/* ---------------- CONSTANTS ---------------- */

const OFFICE_PICKUP = {
  address: "Company Office",
  phone: "+234 800 SAHELX",
};

const sizeOptions = ["Small", "Medium", "Large"];
const packageTypeOptions = ["Documents", "Electronics", "Clothing", "Others"];

/* ---------------- PAGE ---------------- */

export default function CreateDeliveryPage() {
  const [loading, setLoading] = useState(false);

  /* ---------- SINGLE ---------- */
  const [singleCustomer, setSingleCustomer] = useState("");
  const [singlePickupAddress, setSinglePickupAddress] = useState(
    OFFICE_PICKUP.address,
  );
  const [singlePickupPhone, setSinglePickupPhone] = useState(
    OFFICE_PICKUP.phone,
  );
  const [singleDropoffAddress, setSingleDropoffAddress] = useState("");
  const [singleReceiverPhone, setSingleReceiverPhone] = useState("");
  const [singlePackageType, setSinglePackageType] = useState("");
  const [singleSize, setSingleSize] = useState("");
  const [singleFee, setSingleFee] = useState("");

  /* ---------- BULK ---------- */
  const [bulkCustomer, setBulkCustomer] = useState("");
  const [bulkPickupAddress, setBulkPickupAddress] = useState(
    OFFICE_PICKUP.address,
  );
  const [bulkPickupPhone, setBulkPickupPhone] = useState(OFFICE_PICKUP.phone);
  const [bulkDropoffs, setBulkDropoffs] = useState<string[]>([""]);
  const [bulkReceiverPhones, setBulkReceiverPhones] = useState<string[]>([""]);
  const [bulkPackageType, setBulkPackageType] = useState("");
  const [bulkSize, setBulkSize] = useState("");
  const [bulkFee, setBulkFee] = useState("");

  /* ---------------- HELPERS ---------------- */

  const addBulkDropoff = () => {
    setBulkDropoffs([...bulkDropoffs, ""]);
    setBulkReceiverPhones([...bulkReceiverPhones, ""]);
  };

  const removeBulkDropoff = (index: number) => {
    if (bulkDropoffs.length <= 1) return;
    setBulkDropoffs(bulkDropoffs.filter((_, i) => i !== index));
    setBulkReceiverPhones(bulkReceiverPhones.filter((_, i) => i !== index));
  };

  /* ---------------- SAVE SINGLE ---------------- */

  const saveSingle = async () => {
    if (
      !singleCustomer ||
      !singleDropoffAddress ||
      !singleReceiverPhone ||
      !singlePackageType ||
      !singleSize ||
      !singleFee
    ) {
      toast({
        title: "Missing Fields",
        description: "Please complete all mandatory fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const delivery = {
        trackingId: null,
        customerId: singleCustomer,
        courierId: null,
        pickupLocation: {
          address: singlePickupAddress,
          phone: singlePickupPhone,
          lat: null,
          lng: null,
        },
        pickupPhoneNumber: singlePickupPhone,
        dropoffLocation: {
          address: singleDropoffAddress,
          lat: null,
          lng: null,
        },
        receiverPhoneNumber: singleReceiverPhone,
        goodsType: singlePackageType,
        goodsSize: singleSize,
        cost: Number(singleFee),
        status: "pending",
        type: "traditional",
        timestamp: Timestamp.now(),
        createdAt: Timestamp.now(),
        assignedAt: null,
        tag: null,
        deliveryEvidence: null,
        eta: null,
        distance: null,
        rating: null,
        paymentLink: null,
        paymentReference: null,
        paymentStatus: "paid",
        history: [{ status: "pending", timestamp: Timestamp.now() }],
        updatedAt: null,
      };

      await addDoc(collection(db, "deliveries"), delivery);
      toast({
        title: "Success",
        description: "Delivery created successfully",
      });

      // reset form
      setSingleCustomer("");
      setSinglePickupAddress(OFFICE_PICKUP.address);
      setSinglePickupPhone(OFFICE_PICKUP.phone);
      setSingleDropoffAddress("");
      setSingleReceiverPhone("");
      setSinglePackageType("");
      setSingleSize("");
      setSingleFee("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save delivery",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- SAVE BULK ---------------- */

  const saveBulk = async () => {
    if (
      !bulkCustomer ||
      bulkDropoffs.some((d) => !d) ||
      bulkReceiverPhones.some((p) => !p) ||
      !bulkPackageType ||
      !bulkSize ||
      !bulkFee
    ) {
      toast({
        title: "Missing Fields",
        description: "Please complete all mandatory fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const tag = `BULK_sul_${Date.now()}`;

      for (let i = 0; i < bulkDropoffs.length; i++) {
        const delivery = {
          trackingId: null,
          customerId: bulkCustomer,
          courierId: null,
          pickupLocation: {
            address: bulkPickupAddress,
            phone: bulkPickupPhone,
            lat: null,
            lng: null,
          },
          pickupPhoneNumber: bulkPickupPhone,
          dropoffLocation: { address: bulkDropoffs[i], lat: null, lng: null },
          receiverPhoneNumber: bulkReceiverPhones[i],
          goodsType: bulkPackageType,
          goodsSize: bulkSize,
          cost: Number(bulkFee),
          status: "pending",
          type: "traditional",
          timestamp: Timestamp.now(),
          createdAt: Timestamp.now(),
          assignedAt: null,
          tag,
          deliveryEvidence: null,
          eta: null,
          distance: null,
          rating: null,
          paymentLink: null,
          paymentReference: null,
          paymentStatus: "paid",
          history: [{ status: "pending", timestamp: Timestamp.now() }],
          updatedAt: null,
        };

        await addDoc(collection(db, "deliveries"), delivery);
      }

      toast({
        title: "Success",
        description: `${bulkDropoffs.length} bulk deliveries created`,
      });

      setBulkCustomer("");
      setBulkPickupAddress(OFFICE_PICKUP.address);
      setBulkPickupPhone(OFFICE_PICKUP.phone);
      setBulkDropoffs([""]);
      setBulkReceiverPhones([""]);
      setBulkPackageType("");
      setBulkSize("");
      setBulkFee("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save bulk deliveries",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- UI ---------------- */

  return (
    <SecretaryDashboardLayout>
      <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-8 bg-grid-pattern min-h-screen">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">
            Create Delivery
          </h1>
          <p className="text-muted-foreground text-lg">
            Enter delivery details to initiate traditional order processing.
          </p>
        </div>

        <Tabs defaultValue="single" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md h-12 mb-8 bg-gray-100 p-1 rounded-xl">
            <TabsTrigger
              value="single"
              className="rounded-lg font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all h-full"
            >
              Single Delivery
            </TabsTrigger>
            <TabsTrigger
              value="bulk"
              className="rounded-lg font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all h-full"
            >
              Bulk Delivery
            </TabsTrigger>
          </TabsList>

          <TabsContent value="single" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Form */}
              <div className="lg:col-span-2 space-y-6">
                {/* Customer Section */}
                <Card className="border shadow-none rounded-2xl overflow-hidden hover:border-gray-300 transition-all">
                  <CardHeader className="bg-gray-50/50 border-b pb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                        <User className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          Customer Information
                        </CardTitle>
                        <CardDescription>
                          Details of the account sending the package
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="single-customer">Customer Name</Label>
                      <Input
                        id="single-customer"
                        placeholder="Enter full name"
                        value={singleCustomer}
                        onChange={(e) => setSingleCustomer(e.target.value)}
                        className="h-11 rounded-xl"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Pickup Section */}
                <Card className="border shadow-none rounded-2xl overflow-hidden hover:border-gray-300 transition-all">
                  <CardHeader className="bg-gray-50/50 border-b pb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">Pickup Point</CardTitle>
                        <CardDescription>
                          Where should our rider pick up the items?
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="single-pickup-address">
                          Pickup Address
                        </Label>
                        <Input
                          id="single-pickup-address"
                          placeholder="e.g., 123 Business Way"
                          value={singlePickupAddress}
                          onChange={(e) =>
                            setSinglePickupAddress(e.target.value)
                          }
                          className="h-11 rounded-xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="single-pickup-phone">
                          Pickup Phone Number
                        </Label>
                        <Input
                          id="single-pickup-phone"
                          placeholder="+234 ..."
                          value={singlePickupPhone}
                          onChange={(e) => setSinglePickupPhone(e.target.value)}
                          className="h-11 rounded-xl"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Dropoff Section */}
                <Card className="border shadow-none rounded-2xl overflow-hidden hover:border-gray-300 transition-all">
                  <CardHeader className="bg-gray-50/50 border-b pb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                        <MapPin className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          Recipient Details
                        </CardTitle>
                        <CardDescription>
                          Destination and contact for the receiver
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="single-dropoff">Drop-off Address</Label>
                        <Input
                          id="single-dropoff"
                          placeholder="Recipient's location"
                          value={singleDropoffAddress}
                          onChange={(e) =>
                            setSingleDropoffAddress(e.target.value)
                          }
                          className="h-11 rounded-xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="single-receiver-phone">
                          Receiver Phone
                        </Label>
                        <Input
                          id="single-receiver-phone"
                          placeholder="+234 ..."
                          value={singleReceiverPhone}
                          onChange={(e) =>
                            setSingleReceiverPhone(e.target.value)
                          }
                          className="h-11 rounded-xl"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Package Section */}
                <Card className="border shadow-none rounded-2xl overflow-hidden hover:border-gray-300 transition-all">
                  <CardHeader className="bg-gray-50/50 border-b pb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                        <Package className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          Package & Pricing
                        </CardTitle>
                        <CardDescription>
                          Size, category and delivery cost
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Size</Label>
                        <Select
                          value={singleSize}
                          onValueChange={setSingleSize}
                        >
                          <SelectTrigger className="h-11 rounded-xl">
                            <SelectValue placeholder="Select size" />
                          </SelectTrigger>
                          <SelectContent>
                            {sizeOptions.map((s) => (
                              <SelectItem key={s} value={s}>
                                {s}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Type</Label>
                        <Select
                          value={singlePackageType}
                          onValueChange={setSinglePackageType}
                        >
                          <SelectTrigger className="h-11 rounded-xl">
                            <SelectValue placeholder="Category" />
                          </SelectTrigger>
                          <SelectContent>
                            {packageTypeOptions.map((p) => (
                              <SelectItem key={p} value={p}>
                                {p}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="single-fee">Delivery Fee (₦)</Label>
                        <Input
                          id="single-fee"
                          type="number"
                          placeholder="0.00"
                          value={singleFee}
                          onChange={(e) => setSingleFee(e.target.value)}
                          className="h-11 rounded-xl"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column: Summary & Actions */}
              <div className="space-y-6">
                <Card className="border-2 border-primary/10 shadow-lg rounded-2xl bg-white sticky top-8">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-primary" />
                      Order Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm py-2 border-b border-dashed">
                        <span className="text-muted-foreground flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5" /> Pickup
                        </span>
                        <span className="font-semibold text-right max-w-[140px] truncate">
                          {singlePickupAddress || "—"}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm py-2 border-b border-dashed">
                        <span className="text-muted-foreground flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5" /> Drop-off
                        </span>
                        <span className="font-semibold text-right max-w-[140px] truncate">
                          {singleDropoffAddress || "—"}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm py-2 border-b border-dashed">
                        <span className="text-muted-foreground flex items-center gap-1.5">
                          <Package className="h-3.5 w-3.5" /> Type
                        </span>
                        <span className="font-semibold">
                          {singlePackageType || "—"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-2">
                        <span className="text-lg font-bold">Total Cost</span>
                        <span className="text-2xl font-black text-primary">
                          ₦{(Number(singleFee) || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <Button
                      disabled={loading}
                      onClick={saveSingle}
                      className="w-full h-14 rounded-2xl text-lg font-bold shadow-md hover:shadow-lg transition-all"
                    >
                      {loading ? "Processing..." : "Submit Delivery"}
                      {!loading && <Truck className="ml-2 h-5 w-5" />}
                    </Button>

                    <p className="text-center text-xs text-muted-foreground px-4">
                      By submitting, you confirm the details above are accurate.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="bulk" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Form */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="border shadow-none rounded-2xl overflow-hidden">
                  <CardHeader className="bg-gray-50/50 border-b pb-4">
                    <CardTitle className="text-lg">
                      Common Information
                    </CardTitle>
                    <CardDescription>
                      Settings that apply to all bulk deliveries
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label>Customer Name</Label>
                        <Input
                          placeholder="Sender's name"
                          value={bulkCustomer}
                          onChange={(e) => setBulkCustomer(e.target.value)}
                          className="h-11 rounded-xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Pickup Address</Label>
                        <Input
                          placeholder="Pickup location"
                          value={bulkPickupAddress}
                          onChange={(e) => setBulkPickupAddress(e.target.value)}
                          className="h-11 rounded-xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Pickup Phone</Label>
                        <Input
                          placeholder="+234 ..."
                          value={bulkPickupPhone}
                          onChange={(e) => setBulkPickupPhone(e.target.value)}
                          className="h-11 rounded-xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Fee per Drop-off (₦)</Label>
                        <Input
                          type="number"
                          placeholder="0.00"
                          value={bulkFee}
                          onChange={(e) => setBulkFee(e.target.value)}
                          className="h-11 rounded-xl"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Destinations List */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-2">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-primary" />
                      Destinations ({bulkDropoffs.length})
                    </h2>
                    <Button
                      onClick={addBulkDropoff}
                      variant="outline"
                      size="sm"
                      className="rounded-xl border-dashed"
                    >
                      <Plus className="mr-2 h-4 w-4" /> Add Another
                    </Button>
                  </div>

                  {bulkDropoffs.map((_, i) => (
                    <Card
                      key={i}
                      className="border shadow-none rounded-2xl relative group bg-white/50 hover:bg-white transition-all"
                    >
                      <CardContent className="pt-6 pb-6">
                        <div className="flex gap-4 items-start">
                          <div className="flex-1 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Drop-off #{i + 1} Address</Label>
                                <Input
                                  value={bulkDropoffs[i]}
                                  onChange={(e) => {
                                    const copy = [...bulkDropoffs];
                                    copy[i] = e.target.value;
                                    setBulkDropoffs(copy);
                                  }}
                                  className="h-11 rounded-xl border-gray-200"
                                  placeholder="Recipient's destination"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Receiver Phone</Label>
                                <Input
                                  value={bulkReceiverPhones[i]}
                                  onChange={(e) => {
                                    const copy = [...bulkReceiverPhones];
                                    copy[i] = e.target.value;
                                    setBulkReceiverPhones(copy);
                                  }}
                                  className="h-11 rounded-xl border-gray-200"
                                  placeholder="+234 ..."
                                />
                              </div>
                            </div>
                          </div>
                          {bulkDropoffs.length > 1 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeBulkDropoff(i)}
                              className="text-red-400 hover:text-red-600 hover:bg-red-50 mt-8"
                            >
                              <Trash2 className="h-5 w-5" />
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="flex justify-center py-4">
                  <Button
                    onClick={addBulkDropoff}
                    variant="ghost"
                    className="rounded-xl font-semibold opacity-70 hover:opacity-100 italic"
                  >
                    + Click to add more destinations
                  </Button>
                </div>
              </div>

              {/* Right Column: Bulk Summary */}
              <div className="space-y-6">
                <Card className="border-2 border-primary/10 shadow-lg rounded-2xl bg-white sticky top-8">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-primary" />
                      Bulk Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex justify-between text-sm py-2 border-b border-dashed">
                        <span className="text-muted-foreground flex items-center gap-1.5">
                          <Truck className="h-3.5 w-3.5" /> Total Orders
                        </span>
                        <span className="font-bold">{bulkDropoffs.length}</span>
                      </div>
                      <div className="flex justify-between text-sm py-2 border-b border-dashed">
                        <span className="text-muted-foreground flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5" /> Pickup
                        </span>
                        <span className="font-semibold text-right max-w-[140px] truncate">
                          {bulkPickupAddress || "—"}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between items-center pt-2">
                          <span className="text-muted-foreground">
                            Unit Price
                          </span>
                          <span className="font-semibold text-gray-900">
                            ₦{(Number(bulkFee) || 0).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center pt-2">
                          <span className="text-lg font-bold">Grand Total</span>
                          <span className="text-2xl font-black text-primary">
                            ₦
                            {(
                              bulkDropoffs.length * Number(bulkFee) || 0
                            ).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <Button
                      disabled={loading || bulkDropoffs.length === 0}
                      onClick={saveBulk}
                      className="w-full h-14 rounded-2xl text-lg font-bold shadow-md hover:shadow-lg transition-all"
                    >
                      {loading
                        ? "Processing..."
                        : `Submit ${bulkDropoffs.length} Orders`}
                      {!loading && <Truck className="ml-2 h-5 w-5" />}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </SecretaryDashboardLayout>
  );
}
