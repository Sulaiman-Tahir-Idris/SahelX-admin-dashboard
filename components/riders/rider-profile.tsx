"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Mail, Phone, MapPin, Calendar, Briefcase, Edit } from "lucide-react"
import Link from "next/link"

export function RiderProfile({ rider }: { rider: any }) {
  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A"
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-500"
      case "on_delivery":
        return "bg-blue-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col gap-6 md:flex-row">
          <div className="flex flex-col items-center gap-4 md:w-1/3">
            <Avatar className="h-32 w-32">
              <AvatarImage src={rider.profileImage || "/placeholder.svg"} alt={rider.fullName} />
              <AvatarFallback className="text-4xl">{rider.fullName.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>

            <div className="text-center">
              <h2 className="text-2xl font-bold">{rider.fullName}</h2>
              <div className="mt-2 flex justify-center">
                <Badge className={getStatusColor(rider.status)} variant="secondary">
                  {rider.status?.replace("_", " ")}
                </Badge>
              </div>
            </div>

            <div className="mt-2 flex w-full justify-center gap-2">
              <Button size="sm" variant="outline" className="flex-1" onClick={() => window.open(`tel:${rider.phone}`)}>
                <Phone className="mr-2 h-4 w-4" />
                Call
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={() => window.open(`mailto:${rider.email}`)}
              >
                <Mail className="mr-2 h-4 w-4" />
                Email
              </Button>
              <Link href={`/riders/${rider.uid}/edit`} passHref legacyBehavior>
                <Button size="sm" variant="outline" className="flex-1" asChild>
                  <a>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </a>
                </Button>
              </Link>
            </div>
          </div>

          <div className="flex flex-col space-y-4 md:w-2/3">
            <h3 className="text-xl font-semibold">Rider Information</h3>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Email:</span>
                <span className="text-sm">{rider.email}</span>
              </div>

              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Phone:</span>
                <span className="text-sm">{rider.phone}</span>
              </div>

              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Vehicle Type:</span>
                <span className="text-sm capitalize">{rider.vehicleType}</span>
              </div>

              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Last Known Location:</span>
                <span className="text-sm">
                  {rider.currentLocation
                    ? `${rider.currentLocation.lat.toFixed(4)}, ${rider.currentLocation.lng.toFixed(4)}`
                    : "N/A"}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Joined:</span>
                <span className="text-sm">{formatDate(rider.createdAt)}</span>
              </div>
            </div>

            <h3 className="text-xl font-semibold pt-4">Stats</h3>
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-3xl font-bold">{rider.stats?.totalDeliveries || 0}</div>
                  <p className="text-xs text-muted-foreground">Total Deliveries</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-3xl font-bold">{rider.stats?.completionRate || 0}%</div>
                  <p className="text-xs text-muted-foreground">Completion Rate</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-3xl font-bold">{rider.stats?.avgRating || 0}/5</div>
                  <p className="text-xs text-muted-foreground">Average Rating</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
