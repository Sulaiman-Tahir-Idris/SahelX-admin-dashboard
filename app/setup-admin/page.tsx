"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle } from "lucide-react";
import { createAdminUser } from "@/lib/firebase/setup-admin";

export default function SetupAdminPage() {
  const [email, setEmail] = useState("admin@sahelx.com");
  const [password, setPassword] = useState("admin123");
  const [displayName, setDisplayName] = useState("Admin User");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<
    "admin" | "superadmin" | "ceo" | "cto" | "cfo" | "coo"
  >("ceo");

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await createAdminUser(email, password, displayName, role);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
            <CardTitle className="text-green-700">
              Admin User Created!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-green-200 bg-green-50">
              <AlertDescription className="text-green-700">
                Admin user has been successfully created. You can now log in
                with:
                <br />
                <strong>Email:</strong> {email}
                <br />
                <strong>Password:</strong> {password}
              </AlertDescription>
            </Alert>
            <Button
              onClick={() => (window.location.href = "/admin/login")}
              className="w-full"
            >
              Go to Login Page
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Setup Admin User</CardTitle>
          <p className="text-sm text-muted-foreground">
            Create the first admin user for SahelX dashboard
          </p>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleCreateAdmin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <select
                id="role"
                className="input"
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
              >
                <option value="ceo">CEO</option>
                <option value="cto">CTO</option>
                <option value="cfo">CFO</option>
                <option value="coo">COO</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Admin...
                </>
              ) : (
                "Create Admin User"
              )}
            </Button>
          </form>

          <Alert className="mt-4">
            <AlertDescription className="text-xs">
              <strong>Note:</strong> This page should only be used once to
              create the initial admin user. Remove this page after setup is
              complete.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
