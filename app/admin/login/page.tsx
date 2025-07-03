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
import { signInAdmin } from "@/lib/firebase/auth"
import { toast } from "@/components/ui/use-toast"

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
      const adminUser = await signInAdmin(email, password)

      // Store admin data in localStorage
      localStorage.setItem("isAdminLoggedIn", "true")
      localStorage.setItem("adminUser", JSON.stringify(adminUser))

      toast({
        title: "Login successful",
        description: `Welcome back, ${adminUser.displayName || adminUser.email}!`,
      })

      router.push("/admin/dashboard")
    } catch (err: any) {
      setError(err.message || "Failed to login")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]"></div>

      <div className="relative w-full max-w-md">
        {/* Back Button */}
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>

        <Card className="border-gray-200 bg-white shadow-lg">
          <CardHeader className="text-center pb-8">
            <div className="mb-6 flex justify-center">
              <Image
                src="/images/black1.png"
                alt="SahelX Logo"
                width={200}
                height={80}
                className="h-auto w-auto max-w-[200px]"
              />
            </div>
            <CardTitle className="text-2xl font-light text-gray-900">Admin Login</CardTitle>
            <CardDescription className="text-gray-600">Access the SahelX admin dashboard</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive" className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="border-gray-300 focus:border-sahelx-500 focus:ring-sahelx-500"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="border-gray-300 focus:border-sahelx-500 focus:ring-sahelx-500"
                  required
                />
              </div>
              <Button
                disabled={isLoading}
                className="w-full bg-sahelx-600 hover:bg-sahelx-700 text-white py-2.5 font-medium"
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
            </form>
          </CardContent>
          <CardFooter className="flex justify-center pt-6">
            <p className="text-sm text-gray-500">SahelX Administration Portal</p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
