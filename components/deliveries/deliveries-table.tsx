"use client"

import { useEffect, useState } from "react"
import { getDeliveries, Delivery } from "@/lib/firebase/deliveries"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export default function DeliveriesTable() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null)

  useEffect(() => {
    const fetchDeliveries = async () => {
      try {
        const data = await getDeliveries()
        setDeliveries(data)
      } catch (error) {
        console.error("Failed to fetch deliveries:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchDeliveries()
  }, [])

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A"
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp.seconds * 1000)
    return date.toLocaleString()
  }

  if (loading) return <p className="p-4">Loading deliveries...</p>
  if (deliveries.length === 0) return <p className="p-4">No deliveries found.</p>

  return (
    <div className="p-4 overflow-x-auto">
      <h1 className="text-2xl font-bold mb-4">All Deliveries</h1>
      <table className="min-w-full bg-white shadow-md rounded-md overflow-hidden">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-medium">Customer ID</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Courier ID</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Fee</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Created</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {deliveries.map((d) => (
            <tr key={d.id} className="border-t">
              <td className="px-4 py-2">{d.customerId}</td>
              <td className="px-4 py-2">{d.courierId || "Unassigned"}</td>
              <td className="px-4 py-2">{d.status}</td>
              <td className="px-4 py-2">₦{(d.cost || 0).toLocaleString()}</td>
              <td className="px-4 py-2">{formatDate(d.createdAt)}</td>
              <td className="px-4 py-2 text-right">
                <Button variant="outline" onClick={() => setSelectedDelivery(d)}>View</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedDelivery && (
        <Dialog open={!!selectedDelivery} onOpenChange={() => setSelectedDelivery(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Delivery Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-2 text-sm">
              <p><strong>Customer ID:</strong> {selectedDelivery.customerId}</p>
              <p><strong>Courier ID:</strong> {selectedDelivery.courierId || "Unassigned"}</p>
              <p><strong>Status:</strong> {selectedDelivery.status}</p>
              <p><strong>Pickup:</strong> {selectedDelivery.pickupLocation?.address || "N/A"}</p>
              <p><strong>Dropoff:</strong> {selectedDelivery.dropoffLocation?.address || "N/A"}</p>
              <p><strong>Goods:</strong> {selectedDelivery.goodsSize} {selectedDelivery.goodsType}</p>
              <p><strong>Fee:</strong> ₦{(selectedDelivery.cost || 0).toLocaleString()}</p>
              <p><strong>Created:</strong> {formatDate(selectedDelivery.createdAt)}</p>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
