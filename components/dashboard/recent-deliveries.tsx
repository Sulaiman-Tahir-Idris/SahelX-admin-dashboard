"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2 } from "lucide-react"
import { getRecentDeliveries, type Delivery } from "@/lib/firebase/deliveries"
import { toast } from "@/components/ui/use-toast"

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500",
  assigned: "bg-blue-500",
  accepted: "bg-blue-600",
  picked_up: "bg-purple-500",
  delivered: "bg-green-500",
  canceled: "bg-red-500",
  returned: "bg-orange-500",
}

export function RecentDeliveries() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRecentDeliveries()
  }, [])

  const loadRecentDeliveries = async () => {
    try {
      setLoading(true)
      const recentDeliveries = await getRecentDeliveries(5)
      setDeliveries(recentDeliveries)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load recent deliveries",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  function formatDate(timestamp: any) {
    if (!timestamp) return "N/A"
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    }).format(date)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Deliveries</CardTitle>
        <Button variant="outline" size="sm">
          View All
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin text-red-600" />
          </div>
        ) : deliveries.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No recent deliveries found</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deliveries.map((delivery) => (
                <TableRow key={delivery.deliveryId}>
                  <TableCell className="font-medium">
                    <span className="hover:underline cursor-pointer">{delivery.deliveryId.substring(0, 8)}...</span>
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[delivery.status]} variant="secondary">
                      {delivery.status.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>₦{delivery.cost.toLocaleString()}</TableCell>
                  <TableCell>{formatDate(delivery.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
