"use client"

import { useEffect, useState } from "react"
import { getDeliveries, Delivery } from "@/lib/firebase/deliveries"
import { getCustomer } from "@/lib/firebase/customers"
import { getRider, getRiders } from "@/lib/firebase/riders"
import { doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase/config"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

const DeliveriesTable = () => {
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null)
  const [customerNames, setCustomerNames] = useState<Record<string, string>>({})
  const [courierNames, setCourierNames] = useState<Record<string, string>>({})
  const [filter, setFilter] = useState<'all' | 'unassigned'>('all')
  const [showAssign, setShowAssign] = useState<string | boolean>(false)
  const [couriers, setCouriers] = useState<any[]>([])
  const [assignLoading, setAssignLoading] = useState(false)
  const [selectedCourierId, setSelectedCourierId] = useState<string>("")

  // Fetch available couriers for assignment
  const fetchCouriers = async () => {
    try {
      const riders = await getRiders()
      setCouriers(riders)
    } catch (error) {
      setCouriers([])
    }
  }

  useEffect(() => {
    const fetchDeliveries = async () => {
      try {
        const data = await getDeliveries()
        setDeliveries(data)

        // Fetch displayNames for customers and couriers
        const customerPromises = data.map(async (d) => {
          if (d.customerId && !customerNames[d.customerId]) {
            try {
              const customer = await getCustomer(d.customerId)
              return { id: d.customerId, name: customer?.displayName || d.customerId }
            } catch {
              return { id: d.customerId, name: d.customerId }
            }
          }
          return null
        })
        const courierPromises = data.map(async (d) => {
          if (d.courierId && !courierNames[d.courierId]) {
            try {
              const courier = await getRider(d.courierId)
              return { id: d.courierId, name: courier?.displayName || d.courierId }
            } catch {
              return { id: d.courierId, name: d.courierId }
            }
          }
          return null
        })
        const customerResults = await Promise.all(customerPromises)
        const courierResults = await Promise.all(courierPromises)
        setCustomerNames((prev) => ({
          ...prev,
          ...Object.fromEntries(
            customerResults
              .filter((result): result is { id: string; name: string } => result !== null)
              .map((result) => [result.id, result.name])
          ),
        }))
        setCourierNames((prev) => ({
          ...prev,
          ...Object.fromEntries(
            courierResults
              .filter((result): result is { id: string; name: string } => result !== null)
              .map((result) => [result.id, result.name])
          ),
        }))
      } catch (error) {
        console.error("Failed to fetch deliveries:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchDeliveries()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A"
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp.seconds * 1000)
    return date.toLocaleString()
  }

  if (loading) return <p className="p-4">Loading deliveries...</p>
  if (deliveries.length === 0) return <p className="p-4">No deliveries found.</p>

  // Filter deliveries
  const filteredDeliveries = filter === 'unassigned'
    ? deliveries.filter((d) => !d.courierId)
    : deliveries

  return (
    <div className="p-4 overflow-x-auto">
      <h1 className="text-2xl font-bold mb-4">All Deliveries</h1>
      <div className="mb-4 flex gap-2">
        <Button variant={filter === 'all' ? 'default' : 'outline'} onClick={() => setFilter('all')}>All</Button>
        <Button variant={filter === 'unassigned' ? 'default' : 'outline'} onClick={() => setFilter('unassigned')}>Unassigned</Button>
      </div>
      <table className="min-w-full bg-white shadow-md rounded-md overflow-hidden">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-medium">Customer</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Courier</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Fee</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Created</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {filteredDeliveries.map((d) => (
            <tr key={d.id} className="border-t">
              <td className="px-4 py-2">{customerNames[d.customerId] || d.customerId}</td>
              <td className="px-4 py-2">{d.courierId ? (courierNames[d.courierId] || d.courierId) : "Unassigned"}</td>
              <td className="px-4 py-2">{d.status}</td>
              <td className="px-4 py-2">₦{(d.cost || 0).toLocaleString()}</td>
              <td className="px-4 py-2">{formatDate(d.createdAt)}</td>
              <td className="px-4 py-2 text-right">
                <Button variant="outline" onClick={() => { setSelectedDelivery(d); setSelectedCourierId(""); setShowAssign(false); }}>View</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedDelivery && (
        <Dialog open={!!selectedDelivery} onOpenChange={() => { setSelectedDelivery(null); setShowAssign(false); setSelectedCourierId(""); }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Delivery Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-2 text-sm">
              <p><strong>Customer:</strong> {customerNames[selectedDelivery.customerId] || selectedDelivery.customerId}</p>
              <p><strong>Courier:</strong> {selectedDelivery.courierId ? (courierNames[selectedDelivery.courierId] || selectedDelivery.courierId) : "Unassigned"}</p>
              <p><strong>Status:</strong> {selectedDelivery.status}</p>
              <p><strong>Pickup:</strong> {selectedDelivery.pickupLocation?.address || "N/A"}</p>
              <p><strong>Dropoff:</strong> {selectedDelivery.dropoffLocation?.address || "N/A"}</p>
              <p><strong>Goods:</strong> {selectedDelivery.goodsSize} {selectedDelivery.goodsType}</p>
              <p><strong>Fee:</strong> ₦{(selectedDelivery.cost || 0).toLocaleString()}</p>
              <p><strong>Created:</strong> {formatDate(selectedDelivery.createdAt)}</p>
              {/* Assign courier button if unassigned */}
              {!selectedDelivery.courierId && (
                <div className="pt-2">
                  <Button variant="default" onClick={async () => {
                    await fetchCouriers();
                    setShowAssign(true);
                  }}>Assign Courier</Button>
                </div>
              )}
              {/* Assign courier UI */}
              {showAssign && !selectedDelivery.courierId && (
                <div className="pt-2">
                  <label className="block mb-2">Select Courier:</label>
                  <select
                    className="w-full border rounded px-2 py-1 mb-2"
                    value={selectedCourierId}
                    onChange={e => setSelectedCourierId(e.target.value)}
                  >
                    <option value="" disabled>Select a courier</option>
                    {couriers.map(courier => (
                      <option key={courier.id} value={courier.userId}>{courier.displayName || courier.id}</option>
                    ))}
                  </select>
                  <Button
                    variant="default"
                    disabled={assignLoading || !selectedCourierId}
                    onClick={async () => {
                      if (!selectedDelivery.id || !selectedCourierId) return
                      setAssignLoading(true)
                      try {
                        await updateDoc(doc(db, "deliveries", selectedDelivery.id), { courierId: selectedCourierId })
                        setShowAssign(false)
                        setSelectedDelivery(null)
                        setSelectedCourierId("")
                        // Refresh deliveries and courier names
                        const data = await getDeliveries()
                        setDeliveries(data)
                        // Optionally, update courierNames mapping
                        const courier = await getRider(selectedCourierId)
                        setCourierNames((prev) => ({
                          ...prev,
                          [selectedCourierId]: courier?.displayName || selectedCourierId,
                        }))
                      } catch (err) {
                        // handle error
                      } finally {
                        setAssignLoading(false)
                      }
                    }}
                  >Assign</Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

export default DeliveriesTable