"use client"

import { useEffect, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye } from "lucide-react"
import Link from "next/link"
import { fetchRiderDeliveryHistory } from "@/lib/firebase/deliveries"

const statusColors: Record<string, string> = {
  requested: "bg-yellow-500",
  accepted: "bg-blue-500",
  in_transit: "bg-purple-500",
  completed: "bg-green-500",
  cancelled: "bg-red-500",
}

export function RiderDeliveryHistory({ riderId }: { riderId: string }) {
  const [deliveries, setDeliveries] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState("all")

  useEffect(() => {
    const loadDeliveries = async () => {
      try {
        const data = await fetchRiderDeliveryHistory(riderId)
        setDeliveries(data)
      } catch (error) {
        console.error("Failed to load delivery history:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadDeliveries()
  }, [riderId])

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A"

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)

    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    }).format(date)
  }

  const filteredDeliveries = filter === "all" ? deliveries : deliveries.filter((delivery) => delivery.status === filter)

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
                  <TableHead>ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDeliveries.map((delivery) => (
                  <TableRow key={delivery.id}>
                    <TableCell>{delivery.id}</TableCell>
                    <TableCell>{formatDate(delivery.date)}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[delivery.status]}>{delivery.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button asChild variant="ghost">
                        <Link href={`/deliveries/${delivery.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
