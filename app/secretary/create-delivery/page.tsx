"use client";

import { useState } from "react";
import { SecretaryDashboardLayout } from "@/components/dashboard/secretary-dashboard-layout";
import toast from "react-hot-toast";
import { db } from "@/lib/firebase/config";
import { collection, addDoc, Timestamp } from "firebase/firestore";

/* ---------------- CONSTANTS ---------------- */

const OFFICE_PICKUP = {
  address: "Company Office",
};

const sizeOptions = ["Small", "Medium", "Large"];
const packageTypeOptions = ["Documents", "Electronics", "Clothing", "Others"];

/* ---------------- PAGE ---------------- */

export default function CreateDeliveryPage() {
  const [tab, setTab] = useState<"single" | "bulk">("single");
  const [loading, setLoading] = useState(false);

  /* ---------- SINGLE ---------- */
  const [singleCustomer, setSingleCustomer] = useState("");
  const [singleDropoffAddress, setSingleDropoffAddress] = useState("");
  const [singlePhone, setSinglePhone] = useState("");
  const [singlePackageType, setSinglePackageType] = useState("");
  const [singleSize, setSingleSize] = useState("");
  const [singleFee, setSingleFee] = useState("");

  /* ---------- BULK ---------- */
  const [bulkCustomer, setBulkCustomer] = useState("");
  const [bulkDropoffs, setBulkDropoffs] = useState<string[]>([]);
  const [bulkPhones, setBulkPhones] = useState<string[]>([]);
  const [bulkPackageType, setBulkPackageType] = useState("");
  const [bulkSize, setBulkSize] = useState("");
  const [bulkFee, setBulkFee] = useState("");

  /* ---------------- HELPERS ---------------- */

  const addBulkDropoff = () => {
    setBulkDropoffs([...bulkDropoffs, ""]);
    setBulkPhones([...bulkPhones, ""]);
  };

  const removeBulkDropoff = (index: number) => {
    setBulkDropoffs(bulkDropoffs.filter((_, i) => i !== index));
    setBulkPhones(bulkPhones.filter((_, i) => i !== index));
  };

  /* ---------------- SAVE SINGLE ---------------- */

  const saveSingle = async () => {
    if (
      !singleCustomer ||
      !singleDropoffAddress ||
      !singlePhone ||
      !singlePackageType ||
      !singleSize ||
      !singleFee
    ) {
      toast.error("Please complete all fields");
      return;
    }

    setLoading(true);

    try {
      const delivery = {
        trackingId: null,
        customerId: singleCustomer,
        courierId: null,
        pickupLocation: {
          address: OFFICE_PICKUP.address,
          lat: null,
          lng: null,
        },
        dropoffLocation: {
          address: singleDropoffAddress,
          lat: null,
          lng: null,
        },
        receiverPhoneNumber: singlePhone,
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
      toast.success("Delivery created");

      // reset form
      setSingleCustomer("");
      setSingleDropoffAddress("");
      setSinglePhone("");
      setSinglePackageType("");
      setSingleSize("");
      setSingleFee("");
    } catch (error) {
      console.error(error);
      toast.error("Failed to save delivery");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- SAVE BULK ---------------- */

  const saveBulk = async () => {
    if (
      !bulkCustomer ||
      bulkDropoffs.length === 0 ||
      !bulkPackageType ||
      !bulkSize ||
      !bulkFee
    ) {
      toast.error("Please complete all fields");
      return;
    }

    // validate each drop-off
    for (let i = 0; i < bulkDropoffs.length; i++) {
      if (!bulkDropoffs[i] || !bulkPhones[i]) {
        toast.error(`Please fill Drop-off ${i + 1} and phone number`);
        return;
      }
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
            address: OFFICE_PICKUP.address,
            lat: null,
            lng: null,
          },
          dropoffLocation: { address: bulkDropoffs[i], lat: null, lng: null },
          receiverPhoneNumber: bulkPhones[i],
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

      toast.success("Bulk deliveries created");

      setBulkCustomer("");
      setBulkDropoffs([]);
      setBulkPhones([]);
      setBulkPackageType("");
      setBulkSize("");
      setBulkFee("");
    } catch (error) {
      console.error(error);
      toast.error("Failed to save bulk deliveries");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- UI ---------------- */

  return (
    <SecretaryDashboardLayout>
      <div className="max-w-5xl mx-auto p-6 space-y-8">
        <h1 className="text-3xl font-bold mb-4">Create Delivery</h1>

        {/* Tabs */}
        <div className="flex border-b mb-6">
          {["single", "bulk"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t as any)}
              className={`px-6 py-3 font-semibold transition-all ${
                tab === t
                  ? "border-b-4 border-red-500 text-red-500"
                  : "text-gray-600"
              }`}
            >
              {t === "single" ? "Single Delivery" : "Bulk Delivery"}
            </button>
          ))}
        </div>

        {/* SINGLE DELIVERY */}
        {tab === "single" && (
          <div className="space-y-5">
            <input
              className="input w-full p-3 border rounded-md"
              placeholder="Customer Name"
              value={singleCustomer}
              onChange={(e) => setSingleCustomer(e.target.value)}
            />
            <input
              className="input w-full p-3 border rounded-md"
              placeholder="Drop-off Address"
              value={singleDropoffAddress}
              onChange={(e) => setSingleDropoffAddress(e.target.value)}
            />
            <input
              className="input w-full p-3 border rounded-md"
              placeholder="Receiver Phone Number"
              value={singlePhone}
              onChange={(e) => setSinglePhone(e.target.value)}
            />

            <div className="flex gap-4">
              <select
                className="input flex-1 p-3 border rounded-md"
                value={singleSize}
                onChange={(e) => setSingleSize(e.target.value)}
              >
                <option value="">Size</option>
                {sizeOptions.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>

              <select
                className="input flex-1 p-3 border rounded-md"
                value={singlePackageType}
                onChange={(e) => setSinglePackageType(e.target.value)}
              >
                <option value="">Package Type</option>
                {packageTypeOptions.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </div>

            <input
              type="number"
              className="input w-full p-3 border rounded-md"
              placeholder="Delivery Fee"
              value={singleFee}
              onChange={(e) => setSingleFee(e.target.value)}
            />

            {/* SINGLE SUMMARY */}
            <div className="bg-gray-50 p-4 rounded-md text-sm">
              <p>
                <b>Pickup:</b> {OFFICE_PICKUP.address}
              </p>
              <p>
                <b>Drop-off:</b> {singleDropoffAddress || "—"}
              </p>
              <p>
                <b>Fee:</b> ₦{singleFee || "—"}
              </p>
            </div>

            <button
              disabled={loading}
              onClick={saveSingle}
              className="bg-red-500 text-white px-6 py-3 rounded-md w-full disabled:opacity-50"
            >
              {loading ? "Saving..." : "Submit Delivery"}
            </button>
          </div>
        )}

        {/* BULK DELIVERY */}
        {tab === "bulk" && (
          <div className="space-y-5">
            <input
              className="input w-full p-3 border rounded-md"
              placeholder="Customer Name"
              value={bulkCustomer}
              onChange={(e) => setBulkCustomer(e.target.value)}
            />

            {bulkDropoffs.map((address, i) => (
              <div
                key={i}
                className="border p-4 rounded-md space-y-2 bg-gray-50"
              >
                <input
                  className="input w-full p-3 border rounded-md"
                  placeholder={`Drop-off Address ${i + 1}`}
                  value={address}
                  onChange={(e) => {
                    const copy = [...bulkDropoffs];
                    copy[i] = e.target.value;
                    setBulkDropoffs(copy);
                  }}
                />

                <input
                  className="input w-full p-3 border rounded-md"
                  placeholder="Receiver Phone"
                  value={bulkPhones[i]}
                  onChange={(e) => {
                    const copy = [...bulkPhones];
                    copy[i] = e.target.value;
                    setBulkPhones(copy);
                  }}
                />

                <button
                  onClick={() => removeBulkDropoff(i)}
                  className="text-red-500 text-sm"
                >
                  Remove
                </button>
              </div>
            ))}

            <button
              onClick={addBulkDropoff}
              className="bg-gray-200 px-4 py-2 rounded-md"
            >
              + Add Drop-off
            </button>

            <input
              type="number"
              className="input w-full p-3 border rounded-md"
              placeholder="Delivery Fee (per drop-off)"
              value={bulkFee}
              onChange={(e) => setBulkFee(e.target.value)}
            />

            {/* BULK SUMMARY */}
            {bulkDropoffs.length > 0 && (
              <div className="bg-gray-100 p-4 rounded-md text-sm space-y-2">
                <p>
                  <b>Pickup:</b> {OFFICE_PICKUP.address}
                </p>
                {bulkDropoffs.map((address, i) => (
                  <p key={i}>
                    <b>Drop-off {i + 1}:</b> {address || "—"} | <b>Phone:</b>{" "}
                    {bulkPhones[i] || "—"} | <b>Fee:</b> ₦{bulkFee || "—"}
                  </p>
                ))}
                <p className="pt-2 border-t mt-2">
                  <b>Total Cost:</b> ₦
                  {bulkDropoffs.length * Number(bulkFee) || "—"}
                </p>
              </div>
            )}

            <button
              disabled={loading}
              onClick={saveBulk}
              className="bg-red-500 text-white px-6 py-3 rounded-md w-full disabled:opacity-50"
            >
              {loading ? "Saving..." : "Submit Bulk"}
            </button>
          </div>
        )}
      </div>
    </SecretaryDashboardLayout>
  );
}
