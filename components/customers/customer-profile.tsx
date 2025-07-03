"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Mail, Phone, MapPin, Calendar, Package, Edit } from 'lucide-react'
import type { Customer } from "@/lib/firebase/customers"

interface CustomerProfileProps {
  customer: Customer
}

export function CustomerProfile({ customer }: CustomerProfileProps) {
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

    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date)
  }

  const getStatusColor = (isActive: boolean) => {
    return isActive ? "bg-green-500" : "bg-gray-500"
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col gap-6 md:flex-row">
          <div className="flex flex-col items-center gap-4 md:w-1/3">
            <Avatar className="h-32 w-32">
              <AvatarImage src={customer.profileImage || "/placeholder.svg"} alt={customer.fullName} />
              <AvatarFallback className="text-4xl">{customer.fullName?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>

            <div className="text-center">
              <h2 className="text-2xl font-bold">{customer.fullName}</h2>
              <div className="mt-2 flex flex-col gap-2 items-center">
                <Badge className={getStatusColor(customer.isActive)} variant="secondary">
                  {customer.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>

            <div className="mt-2 flex w-full justify-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="flex-1 bg-transparent"
                onClick={() => window.open(`tel:${customer.phone}`)}
              >
                <Phone className="mr-2 h-4 w-4" />
                Call
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1 bg-transparent"
                onClick={() => window.open(`mailto:${customer.email}`)}
              >
                <Mail className="mr-2 h-4 w-4" />
                Email
              </Button>
            </div>
          </div>

          <div className="flex flex-col space-y-4 md:w-2/3">
            <h3 className="text-xl font-semibold">Customer Information</h3>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Email:</span>
                <span className="text-sm">{customer.email}</span>
              </div>

              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Phone:</span>
                <span className="text-sm">{customer.phone}</span>
              </div>

              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Total Orders:</span>
                <span className="text-sm">{customer.totalOrders || 0}</span>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Joined:</span>
                <span className="text-sm">{formatDate(customer.createdAt)}</span>
              </div>
            </div>

            {customer.address && (
              <div className="space-y-2">
                <h4 className="font-medium">Address</h4>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {customer.address.street && `${customer.address.street}, `}
                    {customer.address.city && `${customer.address.city}, `}
                    {customer.address.state && `${customer.address.state}, `}
                    {customer.address.country || "Nigeria"}
                  </p>
                </div>
              </div>
            )}

            <h3 className="text-xl font-semibold pt-4">Customer Stats</h3>
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-3xl font-bold">{customer.totalOrders || 0}</div>
                  <p className="text-xs text-muted-foreground">Total Orders</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-3xl font-bold">
                    {customer.lastOrder ? formatDate(customer.lastOrder) : "Never"}
                  </div>
                  <p className="text-xs text-muted-foreground">Last Order</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-3xl font-bold">{customer.isActive ? "Yes" : "No"}</div>
                  <p className="text-xs text-muted-foreground">Active Status</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}