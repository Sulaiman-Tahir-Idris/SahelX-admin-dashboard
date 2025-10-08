"use client"

import { useEffect, useState } from "react"
import { getDeliveries, Delivery } from "@/lib/firebase/deliveries"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

const DeliveriesByTag = () => {
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [loading, setLoading] = useState(true)
  const [groupedDeliveries, setGroupedDeliveries] = useState<Record<string, Delivery[]>>({})
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [showDialog, setShowDialog] = useState(false)

  useEffect(() => {
    const fetchDeliveries = async () => {
      try {
        const data = await getDeliveries()

        // Filter only deliveries with a tag field
        const tagged = data.filter((d) => d.tag)

        // Group them by tag
        const grouped: Record<string, Delivery[]> = {}
        tagged.forEach((delivery) => {
          const tag = delivery.tag || "untagged"
          if (!grouped[tag]) grouped[tag] = []
          grouped[tag].push(delivery)
        })

        setGroupedDeliveries(grouped)
      } catch (error) {
        console.error("Failed to fetch deliveries:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchDeliveries()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="animate-spin w-6 h-6 mr-2" />
        <span>Loading deliveries...</span>
      </div>
    )
  }

  const tags = Object.keys(groupedDeliveries)

  if (tags.length === 0) {
    return <p className="p-4">No tagged deliveries found.</p>
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Deliveries by Tag</h1>

      {/* Grid of Tag Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {tags.map((tag) => (
          <Card
            key={tag}
            onClick={() => {
              setSelectedTag(tag)
              setShowDialog(true)
            }}
            className="cursor-pointer hover:shadow-lg transition-shadow border border-gray-200"
          >
            <CardHeader>
              <CardTitle className="capitalize">{tag}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">{groupedDeliveries[tag].length} drop-offs</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Popup showing deliveries under selected tag */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="capitalize">
              Delivery Batch: {selectedTag}
            </DialogTitle>
          </DialogHeader>

          {selectedTag && (
            <div className="space-y-4 text-sm">
              {(() => {
                const batch = groupedDeliveries[selectedTag]
                const first = batch[0] // all share same pickup, customer, status

                return (
                  <>
                    <div className="bg-gray-50 p-3 rounded-md border space-y-1">
                      <p><strong>Customer:</strong> {first.customerId}</p>
                      <p><strong>Status:</strong> {first.status}</p>
                      <p><strong>Pickup Address:</strong> {first.pickupLocation?.address || "N/A"}</p>
                    </div>

                    <div className="border-t pt-3">
                      <p className="font-semibold mb-2">Drop-off Addresses</p>
                      <div className="max-h-[50vh] overflow-y-auto space-y-2">
                        {batch.map((delivery, index) => (
                          <Card key={delivery.id} className="border border-gray-200">
                            <CardContent className="py-2 px-3">
                              <p className="text-gray-800">
                                <strong>#{index + 1}:</strong> {delivery.dropoffLocation?.address || "N/A"}
                              </p>
                              <p className="text-xs text-gray-500">
                                Fee: ₦{(delivery.cost || 0).toLocaleString()}
                              </p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </>
                )
              })()}
            </div>
          )}

          <div className="mt-4 flex justify-end">
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default DeliveriesByTag
