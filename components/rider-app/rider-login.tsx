"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, AlertCircle, Bike } from "lucide-react"

export function RiderLogin() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [loginSuccess, setLoginSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      // Simulate login process
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // In a real app, this would validate against Firebase Auth
      // For demo purposes, we'll accept any email/password combination
      if (email && password) {
        setLoginSuccess(true)
      } else {
        throw new Error("Please enter both email and password")
      }
    } catch (err: any) {
      setError(err.message || "Failed to login")
    } finally {
      setIsLoading(false)
    }
  }

  if (loginSuccess) {
    return (
      <div className="flex h-screen items-center justify-center bg-muted/40">
        <Card className="w-[400px]">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <Bike className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-600">Welcome to Sahel X Logistics</CardTitle>
            <CardDescription>You have successfully logged into the Rider App</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Login Successful</AlertTitle>
              <AlertDescription>
                You are now logged into the Sahel X Logistics Rider App. You can start accepting delivery requests.
              </AlertDescription>
            </Alert>

            <div className="space-y-2 text-sm">
              <p>
                <strong>Next Steps:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Update your profile and change your password</li>
                <li>Enable location services for delivery tracking</li>
                <li>Set your availability status</li>
                <li>Start accepting delivery requests</li>
              </ul>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full">Continue to Rider Dashboard</Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex h-screen items-center justify-center bg-muted/40">
      <Card className="w-[400px]">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <Bike className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Rider Login</CardTitle>
          <CardDescription>Sign in to access the Sahel X Logistics Rider App</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Demo Credentials</AlertTitle>
            <AlertDescription>
              Use the credentials provided by your admin when you were registered to the system.
            </AlertDescription>
          </Alert>

          <form onSubmit={handleSubmit}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your registered email"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
              </div>
              <Button disabled={isLoading} className="w-full" type="submit">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  "Login to Rider App"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">Sahel X Logistics Rider Portal</p>
        </CardFooter>
      </Card>
    </div>
  )
}
