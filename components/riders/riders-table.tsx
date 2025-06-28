"use client"

import { useState, useEffect } from "react"
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
import { Eye, MoreHorizontal, MapPin, Phone, Loader2 } from "lucide-react"
import { getCouriers, type Courier } from "@/lib/firebase/users"
import { toast } from "@/components/ui/use-toast"

export function RidersTable() {
  const [searchQuery, setSearchQuery] = useState("")
  const [riders, setRiders] = useState<Courier[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRiders()
  }, [])

  const loadRiders = async () => {
    try {
      setLoading(true)
      const ridersData = await getCouriers()
      setRiders(ridersData)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load riders",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredRiders = riders.filter(
    (rider) =>
      rider.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rider.phone?.includes(searchQuery) ||
      rider.email?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-500"
      case "busy":
        return "bg-blue-500"
      case "offline":
        return "bg-gray-500"
      default:
        return "bg-gray-500"
    }
  }

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A"
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-red-600" />
          <p className="mt-2 text-sm text-red-600">Loading riders...</p>
        </div>
      </div>
    )
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
              <TableHead>Verified</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRiders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No riders found.
                </TableCell>
              </TableRow>
            ) : (
              filteredRiders.map((rider) => (
                <TableRow key={rider.uid}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={rider.profilePhoto || "/placeholder.svg"} alt={rider.displayName} />
                        <AvatarFallback>{rider.displayName.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="grid gap-0.5">
                        <div className="font-medium">{rider.displayName}</div>
                        <div className="text-xs text-muted-foreground">{rider.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(rider.status || "offline")} variant="secondary">
                      {(rider.status || "offline").replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="capitalize">{rider.vehicleInfo?.type || "N/A"}</TableCell>
                  <TableCell>{rider.phone}</TableCell>
                  <TableCell>
                    <Badge className={rider.verified ? "bg-green-500" : "bg-yellow-500"} variant="secondary">
                      {rider.verified ? "Verified" : "Pending"}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(rider.createdAt)}</TableCell>
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
