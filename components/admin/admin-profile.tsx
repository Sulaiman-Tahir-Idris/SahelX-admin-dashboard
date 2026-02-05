"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Edit, Save, X, Shield, User, Mail, MapPin } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { getCurrentAdmin, type AdminUser } from "@/lib/firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

export function AdminProfile() {
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editForm, setEditForm] = useState({
    displayName: "",
    email: "",
    phone: "",
    location: "",
  });

  useEffect(() => {
    const loadAdminData = async () => {
      try {
        const admin = await getCurrentAdmin();
        if (admin) {
          setCurrentUser(admin);
          setEditForm({
            displayName: admin.displayName || "",
            email: admin.email || "",
            phone: admin.phone || "",
            location: admin.location || "",
          });
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load profile data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadAdminData();
  }, []);

  const handleSaveProfile = async () => {
    if (!currentUser) return;

    try {
      const adminRef = doc(db, "Admin", currentUser.userId);
      await updateDoc(adminRef, {
        displayName: editForm.displayName,
        phone: editForm.phone,
        location: editForm.location,
        updatedAt: new Date(),
      });

      const updatedUser = {
        ...currentUser,
        displayName: editForm.displayName,
        phone: editForm.phone,
        location: editForm.location,
      };
      setCurrentUser(updatedUser);
      setIsEditing(false);

      toast({
        title: "Profile updated",
        description: "Your profile information has been successfully updated.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    }
  };

  const handleCancelEdit = () => {
    if (currentUser) {
      setEditForm({
        displayName: currentUser.displayName || "",
        email: currentUser.email || "",
        phone: currentUser.phone || "",
        location: currentUser.location || "",
      });
    }
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-600 border-t-transparent mx-auto"></div>
          <p className="mt-2 text-sm text-red-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600">
            No admin user found. Please log in again.
          </p>
        </div>
      </div>
    );
  }

  const displayName =
    currentUser.displayName || currentUser.email?.split("@")[0] || "Admin User";
  const userInitial = displayName.charAt(0).toUpperCase();

  return (
    <div className="space-y-6">
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
              <Button
                onClick={handleSaveProfile}
                size="sm"
                className="bg-red-600 hover:bg-red-700"
              >
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
              <Avatar className="h-32 w-32 border-4 border-gray-200 rounded-full">
                <AvatarFallback className="flex items-center justify-center bg-desertred text-desertred font-bold text-5xl">
                  {(displayName || "A").charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900">
                  {displayName}
                </h2>
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
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          displayName: e.target.value,
                        })
                      }
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
                    <span className="text-gray-900">
                      {currentUser.email || "N/A"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Email cannot be changed
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-gray-700">
                    Phone
                  </Label>
                  {isEditing ? (
                    <Input
                      id="phone"
                      value={editForm.phone}
                      onChange={(e) =>
                        setEditForm({ ...editForm, phone: e.target.value })
                      }
                      className="border-gray-300 focus:border-gray-500 focus:ring-gray-500"
                      placeholder="Enter phone number"
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-2 rounded border border-gray-200 bg-gray-50">
                      <span className="text-gray-900">
                        {editForm.phone || "Not provided"}
                      </span>
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
                      onChange={(e) =>
                        setEditForm({ ...editForm, location: e.target.value })
                      }
                      className="border-gray-300 focus:border-gray-500 focus:ring-gray-500"
                      placeholder="Enter location"
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-2 rounded border border-gray-200 bg-gray-50">
                      <MapPin className="h-4 w-4 text-gray-600" />
                      <span className="text-gray-900">
                        {editForm.location || "Not provided"}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <Separator className="bg-gray-200" />

              <p className="text-sm text-gray-500">
                Member Since:{" "}
                {currentUser?.createdAt
                  ? new Date(
                      currentUser.createdAt.seconds * 1000,
                    ).toLocaleDateString()
                  : "N/A"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
