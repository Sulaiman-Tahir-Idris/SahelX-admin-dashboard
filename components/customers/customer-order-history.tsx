"use client"

import { useEffect, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, Loader2 } from 'lucide-react'
import Link from "next/link"

const statusColors: Record<string, string> = {
  requested: "bg-yellow-500",
  accepted: "bg-blue-500",
  in_transit: "bg-purple-500",
  completed: "bg-green-500",
  cancelled: "bg-red-500",
}

interface Order {
  id: string
  status: string
  pickupAddress: string
  dropoffAddress: string
  deliveryFee: number
  createdAt: any
  riderId?: string
}

export function CustomerOrderHistory({ customerId }: { customerId: string }) {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState("all")

  useEffect(() => {
    const loadOrders = async () => {
      try {
        // Mock data for now - replace with Firebase query later
        const mockOrders: Order[] = [
          {
            id: "ord_001",
            status: "completed",
            pickupAddress: "123 Lagos Street",
            dropoffAddress: "456 Victoria Island",
            deliveryFee: 2500,
            createdAt: { seconds: Date.now() / 1000 - 86400 },
            riderId: "rider_001",
          },
          {
            id: "ord_002",
            status: "in_transit",
            pickupAddress: "789 Ikeja Road",
            dropoffAddress: "321 Lekki Phase 1",
            deliveryFee: 3000,
            createdAt: { seconds: Date.now() / 1000 - 172800 },
            riderId: "rider_002",
          },
          {
            id: "ord_003",
            status: "completed",
            pickupAddress: "555 Surulere Street",
            dropoffAddress: "777 Ajah",
            deliveryFee: 3500,
            createdAt: { seconds: Date.now() / 1000 - 259200 },
            riderId: "rider_003",
          },
        ]

        setOrders(mockOrders)
      } catch (error) {
        console.error("Failed to load order history:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadOrders()
  }, [customerId])

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A"

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp.seconds * 1000)

    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    }).format(date)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const filteredOrders = filter === "all" ? orders : orders.filter((order) => order.status === filter)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center">
        <CardTitle>Order History</CardTitle>
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
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto" />
              <p className="mt-2 text-sm text-muted-foreground">Loading order history...</p>
            </div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="h-60 flex items-center justify-center">
            <p>No order history found</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.id}</TableCell>
                    <TableCell>{formatDate(order.createdAt)}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[order.status]} variant="secondary">
                        {order.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{formatCurrency(order.deliveryFee)}</TableCell>
                    <TableCell>
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/admin/deliveries/${order.id}`}>
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