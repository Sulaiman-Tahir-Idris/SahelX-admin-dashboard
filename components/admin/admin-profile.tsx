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
import { getCurrentAdmin, type AdminUser } from "@/lib/firebase/auth"
import { doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase/config"

export function AdminProfile() {
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [editForm, setEditForm] = useState({
    displayName: "",
    email: "",
    phone: "",
    location: "",
  })

  useEffect(() => {
    const loadAdminData = async () => {
      try {
        const admin = await getCurrentAdmin()
        if (admin) {
          setCurrentUser(admin)
          setEditForm({
            displayName: admin.displayName || "",
            email: admin.email || "",
            phone: admin.phone || "",
            location: admin.location || "",
          })
        }
      } catch (error) {
        console.error("Error loading admin data:", error)
        toast({
          title: "Error",
          description: "Failed to load profile data",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadAdminData()
  }, [])

  const handleSaveProfile = async () => {
    if (!currentUser) return

    try {
      // Update admin data in Firestore
      const adminRef = doc(db, "Admin", currentUser.userId)
      await updateDoc(adminRef, {
        displayName: editForm.displayName,
        phone: editForm.phone,
        location: editForm.location,
        updatedAt: new Date(),
      })

      // Update local state
      const updatedUser = {
        ...currentUser,
        displayName: editForm.displayName,
        phone: editForm.phone,
        location: editForm.location,
      }
      setCurrentUser(updatedUser)
      setIsEditing(false)

      toast({
        title: "Profile updated",
        description: "Your profile information has been successfully updated.",
      })
    } catch (error) {
      console.error("Error updating profile:", error)
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      })
    }
  }

  const handleCancelEdit = () => {
    if (currentUser) {
      setEditForm({
        displayName: currentUser.displayName || "",
        email: currentUser.email || "",
        phone: currentUser.phone || "",
        location: currentUser.location || "",
      })
    }
    setIsEditing(false)
  }

  // Mock activity data (you can replace this with real data from Firebase)
  const recentActivity = [
    { action: "Logged in", timestamp: "2 hours ago", icon: Activity },
    { action: "Registered new rider", timestamp: "4 hours ago", icon: User },
    { action: "Updated delivery settings", timestamp: "1 day ago", icon: Edit },
    { action: "Viewed analytics dashboard", timestamp: "2 days ago", icon: Activity },
  ]

  // Mock stats (you can replace this with real data from Firebase)
  const adminStats = {
    totalLogins: 247,
    ridersRegistered: 23,
    lastLogin: "2 hours ago",
    accountCreated: currentUser?.createdAt
      ? new Date(currentUser.createdAt.seconds * 1000).toLocaleDateString()
      : "N/A",
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-600 border-t-transparent mx-auto"></div>
          <p className="mt-2 text-sm text-red-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600">No admin user found. Please log in again.</p>
        </div>
      </div>
    )
  }

  const displayName = currentUser.displayName || currentUser.email?.split("@")[0] || "Admin User"
  const userInitial = displayName.charAt(0).toUpperCase()

  return (
    <div className="space-y-6">
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="border-gray-200 bg-gray-50">
          <TabsTrigger value="profile" className="data-[state=active]:bg-red-100 data-[state=active]:text-red-700">
            Profile Information
          </TabsTrigger>
          <TabsTrigger value="activity" className="data-[state=active]:bg-red-100 data-[state=active]:text-red-700">
            Recent Activity
          </TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-red-100 data-[state=active]:text-red-700">
            Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card className="border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-gray-900">Profile Information</CardTitle>
              {!isEditing ? (
                <Button
                  onClick={() => setIsEditing(true)}
                  variant="outline"
                  size="sm"
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Profile
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button onClick={handleSaveProfile} size="sm" className="bg-red-600 hover:bg-red-700">
                    <Save className="mr-2 h-4 w-4" />
                    Save
                  </Button>
                  <Button
                    onClick={handleCancelEdit}
                    variant="outline"
                    size="sm"
                    className="border-gray-300 text-gray-700 hover:bg-gray-50 bg-transparent"
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
                  <Avatar className="h-32 w-32 border-4 border-gray-200">
                    <AvatarImage src="/placeholder.svg?height=128&width=128" alt={displayName} />
                    <AvatarFallback className="text-4xl bg-gray-100 text-gray-700">{userInitial}</AvatarFallback>
                  </Avatar>

                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900">{displayName}</h2>
                    <Badge className="mt-2 bg-red-600 hover:bg-red-700">
                      <Shield className="mr-1 h-3 w-3" />
                      {currentUser.role === "superadmin" ? "Super Admin" : "Admin"}
                    </Badge>
                  </div>
                </div>

                <div className="flex flex-col space-y-4 md:w-2/3">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="displayName" className="text-gray-700">
                        Display Name
                      </Label>
                      {isEditing ? (
                        <Input
                          id="displayName"
                          value={editForm.displayName}
                          onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
                          className="border-gray-300 focus:border-gray-500 focus:ring-gray-500"
                        />
                      ) : (
                        <div className="flex items-center gap-2 p-2 rounded border border-gray-200 bg-gray-50">
                          <User className="h-4 w-4 text-gray-600" />
                          <span className="text-gray-900">{displayName}</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-gray-700">
                        Email
                      </Label>
                      <div className="flex items-center gap-2 p-2 rounded border border-gray-200 bg-gray-50">
                        <Mail className="h-4 w-4 text-gray-600" />
                        <span className="text-gray-900">{currentUser.email || "N/A"}</span>
                      </div>
                      <p className="text-xs text-gray-500">Email cannot be changed</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-gray-700">
                        Phone
                      </Label>
                      {isEditing ? (
                        <Input
                          id="phone"
                          value={editForm.phone}
                          onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                          className="border-gray-300 focus:border-gray-500 focus:ring-gray-500"
                          placeholder="Enter phone number"
                        />
                      ) : (
                        <div className="flex items-center gap-2 p-2 rounded border border-gray-200 bg-gray-50">
                          <span className="text-gray-900">{editForm.phone || "Not provided"}</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="location" className="text-gray-700">
                        Location
                      </Label>
                      {isEditing ? (
                        <Input
                          id="location"
                          value={editForm.location}
                          onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                          className="border-gray-300 focus:border-gray-500 focus:ring-gray-500"
                          placeholder="Enter location"
                        />
                      ) : (
                        <div className="flex items-center gap-2 p-2 rounded border border-gray-200 bg-gray-50">
                          <MapPin className="h-4 w-4 text-gray-600" />
                          <span className="text-gray-900">{editForm.location || "Not provided"}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator className="bg-gray-200" />

                  <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    <Card className="border-gray-200 bg-gray-50">
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-gray-900">{adminStats.totalLogins}</div>
                        <p className="text-xs text-gray-600">Total Logins</p>
                      </CardContent>
                    </Card>
                    <Card className="border-gray-200 bg-gray-50">
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-gray-900">{adminStats.ridersRegistered}</div>
                        <p className="text-xs text-gray-600">Riders Registered</p>
                      </CardContent>
                    </Card>
                    <Card className="border-gray-200 bg-gray-50">
                      <CardContent className="p-4 text-center">
                        <div className="text-sm font-bold text-gray-900">{adminStats.lastLogin}</div>
                        <p className="text-xs text-gray-600">Last Login</p>
                      </CardContent>
                    </Card>
                    <Card className="border-gray-200 bg-gray-50">
                      <CardContent className="p-4 text-center">
                        <div className="text-sm font-bold text-gray-900">{adminStats.accountCreated}</div>
                        <p className="text-xs text-gray-600">Member Since</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-900">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 rounded-lg border border-gray-200 bg-gray-50">
                    <div className="rounded-full bg-gray-100 p-2">
                      <activity.icon className="h-4 w-4 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{activity.action}</p>
                      <p className="text-sm text-gray-600">{activity.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-900">Security Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="border-blue-200 bg-blue-50">
                <Key className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-700">
                  For security reasons, password changes must be done through the system administrator.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 bg-gray-50">
                  <div>
                    <h4 className="font-medium text-gray-900">Two-Factor Authentication</h4>
                    <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
                  </div>
                  <Badge variant="outline" className="border-gray-300 text-gray-700">
                    Not Enabled
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 bg-gray-50">
                  <div>
                    <h4 className="font-medium text-gray-900">Login Notifications</h4>
                    <p className="text-sm text-gray-600">Get notified when someone logs into your account</p>
                  </div>
                  <Badge className="bg-green-600 hover:bg-green-700">Enabled</Badge>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 bg-gray-50">
                  <div>
                    <h4 className="font-medium text-gray-900">Account Status</h4>
                    <p className="text-sm text-gray-600">Your account status and permissions</p>
                  </div>
                  <Badge className="bg-green-600 hover:bg-green-700">Active</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
