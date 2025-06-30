"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import { Badge } from "@/components/ui/badge"
import { Eye, MoreHorizontal, MapPin, Phone } from "lucide-react"

export function RidersTable() {
  const [searchQuery, setSearchQuery] = useState("")

  // Mock data for preview - replace with Firebase calls later
  const riders = [
    {
      id: "rider_001",
      fullName: "John Rider",
      email: "john@sahelx.com",
      phone: "+2348012345678",
      status: "available",
      vehicleType: "bike",
      profileImage: "/placeholder.svg?height=40&width=40",
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    },
    {
      id: "rider_002",
      fullName: "Jane Smith",
      email: "jane@sahelx.com",
      phone: "+2348087654321",
      status: "on_delivery",
      vehicleType: "car",
      profileImage: "/placeholder.svg?height=40&width=40",
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
    },
    {
      id: "rider_003",
      fullName: "Mike Johnson",
      email: "mike@sahelx.com",
      phone: "+2348098765432",
      status: "available",
      vehicleType: "bike",
      profileImage: "/placeholder.svg?height=40&width=40",
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    },
    {
      id: "rider_004",
      fullName: "Sarah Wilson",
      email: "sarah@sahelx.com",
      phone: "+2348076543210",
      status: "offline",
      vehicleType: "car",
      profileImage: "/placeholder.svg?height=40&width=40",
      createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), // 45 days ago
    },
  ]

  const filteredRiders = riders.filter(
    (rider) =>
      rider.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rider.phone?.includes(searchQuery) ||
      rider.email?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-500"
      case "on_delivery":
        return "bg-blue-500"
      case "offline":
        return "bg-gray-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center">
        <Input
          placeholder="Search riders..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rider</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Vehicle Type</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRiders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No riders found.
                </TableCell>
              </TableRow>
            ) : (
              filteredRiders.map((rider) => (
                <TableRow key={rider.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={rider.profileImage || "/placeholder.svg"} alt={rider.fullName} />
                        <AvatarFallback>{rider.fullName.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="grid gap-0.5">
                        <div className="font-medium">{rider.fullName}</div>
                        <div className="text-xs text-muted-foreground">{rider.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(rider.status)} variant="secondary">
                      {rider.status?.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="capitalize">{rider.vehicleType}</TableCell>
                  <TableCell>{rider.phone}</TableCell>
                  <TableCell>{rider.createdAt.toLocaleDateString()}</TableCell>
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
                          View Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <MapPin className="mr-2 h-4 w-4" />
                          Track Location
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => window.open(`tel:${rider.phone}`)}>
                          <Phone className="mr-2 h-4 w-4" />
                          Call Rider
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
