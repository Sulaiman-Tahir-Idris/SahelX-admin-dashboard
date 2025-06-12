"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Loader2, ArrowLeft } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      // Simulate login process
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Check for correct credentials
      if (email === "MrX@sahelX.com" && password === "sahelx") {
        // Store login state in localStorage for demo purposes
        localStorage.setItem("isAdminLoggedIn", "true")
        localStorage.setItem(
          "adminUser",
          JSON.stringify({
            email: "MrX@sahelX.com",
            fullName: "Mr. X",
            role: "superadmin",
          }),
        )
        router.push("/admin/dashboard")
      } else {
        throw new Error("Invalid email or password. Please use the correct credentials.")
      }
    } catch (err: any) {
      setError(err.message || "Failed to login")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-red-50 via-white to-red-100 dark:from-red-950 dark:via-gray-900 dark:to-red-900 px-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>

      <div className="relative w-full max-w-md">
        {/* Back Button */}
        <div className="mb-6">
          <Link href="/">
            <Button
              variant="ghost"
              size="sm"
              className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>

        <Card className="border-red-200 bg-white/90 backdrop-blur-sm shadow-xl dark:border-red-800 dark:bg-red-950/50">
          <CardHeader className="text-center">
            <div className="mb-4 flex justify-center">
              <Image
                src="/images/sahelx-logo.png"
                alt="SahelX Logo"
                width={200}
                height={80}
                className="h-auto w-auto max-w-[200px]"
              />
            </div>
            <CardTitle className="text-2xl font-bold text-red-900 dark:text-red-100">Admin Login</CardTitle>
            <CardDescription className="text-red-700 dark:text-red-300">
              Admin portal for managing SahelX delivery operations
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Alert className="mb-4 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
              <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
              <AlertTitle className="text-red-800 dark:text-red-200">Demo Credentials</AlertTitle>
              <AlertDescription className="text-red-700 dark:text-red-300">
                <strong>Email:</strong> MrX@sahelX.com
                <br />
                <strong>Password:</strong> sahelx
              </AlertDescription>
            </Alert>

            <form onSubmit={handleSubmit}>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email" className="text-red-800 dark:text-red-200">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="MrX@sahelX.com"
                    className="border-red-300 focus:border-red-500 focus:ring-red-500 dark:border-red-700"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password" className="text-red-800 dark:text-red-200">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="sahelx"
                    className="border-red-300 focus:border-red-500 focus:ring-red-500 dark:border-red-700"
                    required
                  />
                </div>
                <Button
                  disabled={isLoading}
                  className="w-full bg-red-600 hover:bg-red-700 focus:ring-red-500 dark:bg-red-700 dark:hover:bg-red-800"
                  type="submit"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Logging in...
                    </>
                  ) : (
                    "Login to Dashboard"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-red-600 dark:text-red-400">SahelX Administration Portal</p>
          </CardFooter>
        </Card>
      </div>

      {/* Decorative Elements */}
      <div className="absolute bottom-0 left-0 h-32 w-32 rounded-full bg-red-200/30 blur-2xl dark:bg-red-800/30"></div>
      <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-red-300/20 blur-2xl dark:bg-red-700/20"></div>
    </div>
  )
}
