"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Eye, MoreHorizontal, MapPin, Phone } from "lucide-react"

const statusColors: Record<string, string> = {
  requested: "bg-yellow-500",
  accepted: "bg-blue-500",
  in_transit: "bg-purple-500",
  completed: "bg-green-500",
  cancelled: "bg-red-500",
}

export function DeliveriesTable() {
  const [searchQuery, setSearchQuery] = useState("")

  // Mock data for preview
  const deliveries = [
    {
      id: "del_001",
      customerName: "Alice Johnson",
      riderName: "John Rider",
      status: "in_transit",
      pickupAddress: "123 Lagos Street",
      dropoffAddress: "456 Victoria Island",
      deliveryFee: 2500,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
    {
      id: "del_002",
      customerName: "Bob Smith",
      riderName: "Jane Smith",
      status: "completed",
      pickupAddress: "789 Ikeja Road",
      dropoffAddress: "321 Lekki Phase 1",
      deliveryFee: 3000,
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
    },
    {
      id: "del_003",
      customerName: "Carol Brown",
      riderName: "Mike Johnson",
      status: "accepted",
      pickupAddress: "555 Surulere Street",
      dropoffAddress: "777 Ajah",
      deliveryFee: 3500,
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
    },
    {
      id: "del_004",
      customerName: "David Wilson",
      riderName: null,
      status: "requested",
      pickupAddress: "999 Yaba Road",
      dropoffAddress: "111 Maryland",
      deliveryFee: 2000,
      createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
    },
  ]

  const filteredDeliveries = deliveries.filter(
    (delivery) =>
      delivery.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      delivery.riderName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      delivery.id.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    }).format(date)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center">
        <Input
          placeholder="Search deliveries..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Rider</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Fee</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDeliveries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No deliveries found.
                </TableCell>
              </TableRow>
            ) : (
              filteredDeliveries.map((delivery) => (
                <TableRow key={delivery.id}>
                  <TableCell className="font-medium">{delivery.id}</TableCell>
                  <TableCell>{delivery.customerName}</TableCell>
                  <TableCell>{delivery.riderName || "Unassigned"}</TableCell>
                  <TableCell>
                    <Badge className={statusColors[delivery.status]} variant="secondary">
                      {delivery.status.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>₦{delivery.deliveryFee.toLocaleString()}</TableCell>
                  <TableCell>{formatDate(delivery.createdAt)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <MapPin className="mr-2 h-4 w-4" />
                          Track Delivery
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <Phone className="mr-2 h-4 w-4" />
                          Contact Customer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
