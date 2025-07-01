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
import {
  Eye,
  MoreHorizontal,
  MapPin,
  Phone,
  Shield,
  ShieldOff,
  UserCheck,
  UserX,
  Loader2,
  AlertCircle,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "@/components/ui/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  getRiders,
  getAllRiders,
  updateRiderVerification,
  updateRiderActiveStatus,
  type Rider,
} from "@/lib/firebase/riders"

export function RidersTable() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [riders, setRiders] = useState<Rider[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [updatingRider, setUpdatingRider] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadRiders()
  }, [])

  const loadRiders = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Try the optimized query first, fallback to getAllRiders if it fails
      let ridersData: Rider[]
      try {
        ridersData = await getRiders()
      } catch (indexError) {
        console.log("Index query failed, falling back to client-side filtering...")
        ridersData = await getAllRiders()
      }

      setRiders(ridersData)
    } catch (error: any) {
      console.error("Error loading riders:", error)
      setError(error.message)
      toast({
        title: "Failed to load riders",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerificationToggle = async (riderId: string, currentStatus: boolean) => {
    try {
      setUpdatingRider(riderId)
      await updateRiderVerification(riderId, !currentStatus)

      // Update local state
      setRiders(
        riders.map((rider) =>
          rider.id === riderId
            ? { ...rider, verified: !currentStatus, vehicleInfo: { ...rider.vehicleInfo, verified: !currentStatus } }
            : rider,
        ),
      )

      toast({
        title: "Verification status updated",
        description: `Rider has been ${!currentStatus ? "verified" : "unverified"}.`,
      })
    } catch (error: any) {
      toast({
        title: "Failed to update verification",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setUpdatingRider(null)
    }
  }

  const handleActiveStatusToggle = async (riderId: string, currentStatus: boolean) => {
    try {
      setUpdatingRider(riderId)
      await updateRiderActiveStatus(riderId, !currentStatus)

      // Update local state
      setRiders(riders.map((rider) => (rider.id === riderId ? { ...rider, isActive: !currentStatus } : rider)))

      toast({
        title: "Active status updated",
        description: `Rider has been ${!currentStatus ? "activated" : "deactivated"}.`,
      })
    } catch (error: any) {
      toast({
        title: "Failed to update active status",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setUpdatingRider(null)
    }
  }

  const filteredRiders = riders.filter(
    (rider) =>
      rider.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rider.phone?.includes(searchQuery) ||
      rider.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rider.vehicleInfo?.plateNumber?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "available":
        return "bg-green-500"
      case "on_delivery":
        return "bg-blue-500"
      case "offline":
        return "bg-gray-500"
      default:
        return "bg-gray-400"
    }
  }

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A"

    let date: Date
    if (timestamp.toDate) {
      date = timestamp.toDate()
    } else if (timestamp.seconds) {
      date = new Date(timestamp.seconds * 1000)
    } else {
      date = new Date(timestamp)
    }

    return date.toLocaleDateString()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="mt-2 text-sm text-muted-foreground">Loading riders...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Failed to load riders: {error}</AlertDescription>
        </Alert>
        <Button onClick={loadRiders} variant="outline">
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Input
          placeholder="Search riders..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
        <Button onClick={loadRiders} variant="outline" size="sm">
          Refresh
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rider</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Verification</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRiders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  {riders.length === 0
                    ? "No riders found. Register some riders to get started."
                    : "No riders match your search."}
                </TableCell>
              </TableRow>
            ) : (
              filteredRiders.map((rider) => (
                <TableRow key={rider.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={rider.profilePhoto || "/placeholder.svg"} alt={rider.displayName} />
                        <AvatarFallback>{rider.displayName?.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="grid gap-0.5">
                        <div className="font-medium">{rider.displayName}</div>
                        <div className="text-xs text-muted-foreground">{rider.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Badge className={getStatusColor(rider.status)} variant="secondary">
                        {rider.status?.replace("_", " ") || "offline"}
                      </Badge>
                      {!rider.isActive && (
                        <Badge variant="outline" className="text-xs">
                          Inactive
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="font-medium capitalize">{rider.vehicleInfo?.type}</div>
                      <div className="text-xs text-muted-foreground">{rider.vehicleInfo?.plateNumber}</div>
                    </div>
                  </TableCell>
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
                        <Button variant="ghost" size="icon" disabled={updatingRider === rider.id}>
                          {updatingRider === rider.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <MoreHorizontal className="h-4 w-4" />
                          )}
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => router.push(`/admin/riders/${rider.id}`)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <MapPin className="mr-2 h-4 w-4" />
                          Track Location
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleVerificationToggle(rider.id!, rider.verified)}>
                          {rider.verified ? (
                            <>
                              <ShieldOff className="mr-2 h-4 w-4" />
                              Unverify Rider
                            </>
                          ) : (
                            <>
                              <Shield className="mr-2 h-4 w-4" />
                              Verify Rider
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleActiveStatusToggle(rider.id!, rider.isActive)}>
                          {rider.isActive ? (
                            <>
                              <UserX className="mr-2 h-4 w-4" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <UserCheck className="mr-2 h-4 w-4" />
                              Activate
                            </>
                          )}
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

      {riders.length > 0 && (
        <div className="text-sm text-muted-foreground">
          Showing {filteredRiders.length} of {riders.length} riders
        </div>
      )}
    </div>
  )
}
