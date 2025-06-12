"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const statusColors: Record<string, string> = {
  requested: "bg-yellow-500",
  accepted: "bg-blue-500",
  in_transit: "bg-purple-500",
  completed: "bg-green-500",
  cancelled: "bg-red-500",
}

export function RecentDeliveries() {
  // Mock data for preview - replace with Firebase calls later
  const deliveries = [
    {
      id: "del_001",
      userName: "Jane Doe",
      status: "in_transit",
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    },
    {
      id: "del_002",
      userName: "John Smith",
      status: "completed",
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    },
    {
      id: "del_003",
      userName: "Alice Johnson",
      status: "accepted",
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
    },
    {
      id: "del_004",
      userName: "Bob Wilson",
      status: "requested",
      createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
    },
    {
      id: "del_005",
      userName: "Carol Brown",
      status: "completed",
      createdAt: new Date(Date.now() - 10 * 60 * 60 * 1000), // 10 hours ago
    },
  ]

  function formatDate(date: Date) {
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {deliveries.map((delivery) => (
              <TableRow key={delivery.id}>
                <TableCell className="font-medium">
                  <span className="hover:underline cursor-pointer">{delivery.id.substring(0, 8)}...</span>
                </TableCell>
                <TableCell>{delivery.userName}</TableCell>
                <TableCell>
                  <Badge className={statusColors[delivery.status]} variant="secondary">
                    {delivery.status.replace("_", " ")}
                  </Badge>
                </TableCell>
                <TableCell>{formatDate(delivery.createdAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
