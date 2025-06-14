"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { User, Mail, Shield, Edit, Save, X, Key, Activity, MapPin } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

export function AdminProfile() {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    location: "",
  })

  useEffect(() => {
    // Get user from localStorage
    const storedUser = localStorage.getItem("adminUser")
    if (storedUser) {
      const user = JSON.parse(storedUser)
      setCurrentUser(user)
      setEditForm({
        fullName: user.fullName || "Mr. X",
        email: user.email || "MrX@sahelX.com",
        phone: user.phone || "+234 801 234 5678",
        location: user.location || "Lagos, Nigeria",
      })
    }
  }, [])

  const handleSaveProfile = () => {
    // Update user in localStorage
    const updatedUser = {
      ...currentUser,
      ...editForm,
    }

    localStorage.setItem("adminUser", JSON.stringify(updatedUser))
    setCurrentUser(updatedUser)
    setIsEditing(false)

    toast({
      title: "Profile updated",
      description: "Your profile information has been successfully updated.",
    })
  }

  const handleCancelEdit = () => {
    // Reset form to current user data
    setEditForm({
      fullName: currentUser?.fullName || "Mr. X",
      email: currentUser?.email || "MrX@sahelX.com",
      phone: currentUser?.phone || "+234 801 234 5678",
      location: currentUser?.location || "Lagos, Nigeria",
    })
    setIsEditing(false)
  }

  // Mock activity data
  const recentActivity = [
    { action: "Logged in", timestamp: "2 hours ago", icon: Activity },
    { action: "Registered new rider", timestamp: "4 hours ago", icon: User },
    { action: "Updated delivery settings", timestamp: "1 day ago", icon: Edit },
    { action: "Viewed analytics dashboard", timestamp: "2 days ago", icon: Activity },
  ]

  // Mock stats
  const adminStats = {
    totalLogins: 247,
    ridersRegistered: 23,
    lastLogin: "2 hours ago",
    accountCreated: "January 15, 2024",
  }

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-600 border-t-transparent mx-auto"></div>
          <p className="mt-2 text-sm text-red-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
          <TabsTrigger
            value="profile"
            className="data-[state=active]:bg-sahelx-100 data-[state=active]:text-sahelx-700 dark:data-[state=active]:bg-sahelx-800 dark:data-[state=active]:text-sahelx-100"
          >
            Profile Information
          </TabsTrigger>
          <TabsTrigger
            value="activity"
            className="data-[state=active]:bg-sahelx-100 data-[state=active]:text-sahelx-700 dark:data-[state=active]:bg-sahelx-800 dark:data-[state=active]:text-sahelx-100"
          >
            Recent Activity
          </TabsTrigger>
          <TabsTrigger
            value="security"
            className="data-[state=active]:bg-sahelx-100 data-[state=active]:text-sahelx-700 dark:data-[state=active]:bg-sahelx-800 dark:data-[state=active]:text-sahelx-100"
          >
            Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card className="border-gray-200 dark:border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-gray-900 dark:text-gray-100">Profile Information</CardTitle>
              {!isEditing ? (
                <Button
                  onClick={() => setIsEditing(true)}
                  variant="outline"
                  size="sm"
                  className="border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-900"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Profile
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button onClick={handleSaveProfile} size="sm" className="bg-sahelx-600 hover:bg-sahelx-700">
                    <Save className="mr-2 h-4 w-4" />
                    Save
                  </Button>
                  <Button
                    onClick={handleCancelEdit}
                    variant="outline"
                    size="sm"
                    className="border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-900"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-6 md:flex-row">
                <div className="flex flex-col items-center gap-4 md:w-1/3">
                  <Avatar className="h-32 w-32 border-4 border-gray-200 dark:border-gray-800">
                    <AvatarImage src="/placeholder.svg?height=128&width=128" alt={currentUser.fullName} />
                    <AvatarFallback className="text-4xl bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300">
                      {currentUser.fullName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{currentUser.fullName}</h2>
                    <Badge className="mt-2 bg-sahelx-600 hover:bg-sahelx-700">
                      <Shield className="mr-1 h-3 w-3" />
                      Super Admin
                    </Badge>
                  </div>
                </div>

                <div className="flex flex-col space-y-4 md:w-2/3">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="fullName" className="text-gray-700 dark:text-gray-300">
                        Full Name
                      </Label>
                      {isEditing ? (
                        <Input
                          id="fullName"
                          value={editForm.fullName}
                          onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                          className="border-gray-300 focus:border-gray-500 focus:ring-gray-500 dark:border-gray-700"
                        />
                      ) : (
                        <div className="flex items-center gap-2 p-2 rounded border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
                          <User className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                          <span className="text-gray-900 dark:text-gray-100">{currentUser.fullName}</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">
                        Email
                      </Label>
                      {isEditing ? (
                        <Input
                          id="email"
                          type="email"
                          value={editForm.email}
                          onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                          className="border-gray-300 focus:border-gray-500 focus:ring-gray-500 dark:border-gray-700"
                        />
                      ) : (
                        <div className="flex items-center gap-2 p-2 rounded border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
                          <Mail className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                          <span className="text-gray-900 dark:text-gray-100">{currentUser.email}</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-gray-700 dark:text-gray-300">
                        Phone
                      </Label>
                      {isEditing ? (
                        <Input
                          id="phone"
                          value={editForm.phone}
                          onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                          className="border-gray-300 focus:border-gray-500 focus:ring-gray-500 dark:border-gray-700"
                        />
                      ) : (
                        <div className="flex items-center gap-2 p-2 rounded border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
                          <span className="text-gray-900 dark:text-gray-100">{editForm.phone}</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="location" className="text-gray-700 dark:text-gray-300">
                        Location
                      </Label>
                      {isEditing ? (
                        <Input
                          id="location"
                          value={editForm.location}
                          onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                          className="border-gray-300 focus:border-gray-500 focus:ring-gray-500 dark:border-gray-700"
                        />
                      ) : (
                        <div className="flex items-center gap-2 p-2 rounded border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
                          <MapPin className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                          <span className="text-gray-900 dark:text-gray-100">{editForm.location}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator className="bg-gray-200 dark:bg-gray-800" />

                  <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    <Card className="border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          {adminStats.totalLogins}
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Total Logins</p>
                      </CardContent>
                    </Card>
                    <Card className="border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          {adminStats.ridersRegistered}
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Riders Registered</p>
                      </CardContent>
                    </Card>
                    <Card className="border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
                      <CardContent className="p-4 text-center">
                        <div className="text-sm font-bold text-gray-900 dark:text-gray-100">{adminStats.lastLogin}</div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Last Login</p>
                      </CardContent>
                    </Card>
                    <Card className="border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
                      <CardContent className="p-4 text-center">
                        <div className="text-sm font-bold text-gray-900 dark:text-gray-100">Jan 2024</div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Member Since</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card className="border-gray-200 dark:border-gray-800">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-gray-100">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-3 rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900"
                  >
                    <div className="rounded-full bg-gray-100 p-2 dark:bg-gray-900">
                      <activity.icon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-gray-100">{activity.action}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{activity.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card className="border-gray-200 dark:border-gray-800">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-gray-100">Security Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
                <Key className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <AlertDescription className="text-blue-700 dark:text-blue-300">
                  For security reasons, password changes must be done through the system administrator.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">Two-Factor Authentication</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Add an extra layer of security to your account
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="border-gray-300 text-gray-700 dark:border-gray-700 dark:text-gray-300"
                  >
                    Not Enabled
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">Login Notifications</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Get notified when someone logs into your account
                    </p>
                  </div>
                  <Badge className="bg-green-600 hover:bg-green-700">Enabled</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
