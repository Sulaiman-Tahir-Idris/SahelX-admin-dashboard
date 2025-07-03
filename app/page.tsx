"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Truck, MapPin, Clock, Shield } from "lucide-react"
import Image from "next/image"

export default function SplashScreen() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleAdminLogin = () => {
    console.log("Admin login button clicked") // Debug log
    setIsLoading(true)

    try {
      router.push("/admin/login")
      console.log("Navigation to /admin/login initiated") // Debug log
    } catch (error) {
      console.error("Navigation error:", error) // Debug log
      setIsLoading(false)
    }

    // Reset loading state after a short delay in case navigation is slow
    setTimeout(() => {
      setIsLoading(false)
    }, 2000)
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]"></div>

      {/* Main Content */}
      <div className="relative flex min-h-screen flex-col items-center justify-center px-4">
        {/* Logo Section */}
        <div className="mb-16 text-center">
          <div className="mb-8 flex justify-center">
            <div className="relative">
              <Image
                src="/images/black1.png"
                alt="SahelX Logo"
                width={300}
                height={120}
                className="h-auto w-auto max-w-[300px]"
                priority
              />
            </div>
          </div>

          <h1 className="mb-4 text-4xl font-light text-gray-900 md:text-5xl">Admin Portal</h1>
          <p className="text-xl text-gray-600 md:text-2xl font-light">Fast Moves, Northern Routes</p>
          <p className="mt-2 text-lg text-gray-500">Delivery Management System</p>
        </div>

        {/* Features Grid */}
        <div className="mb-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4 max-w-4xl">
          <Card className="border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="flex flex-col items-center p-8 text-center">
              <div className="mb-4 rounded-full bg-gray-50 p-4">
                <Truck className="h-6 w-6 text-gray-700" />
              </div>
              <h3 className="mb-2 font-medium text-gray-900">Fleet Management</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Manage riders and vehicles efficiently</p>
            </CardContent>
          </Card>

          <Card className="border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="flex flex-col items-center p-8 text-center">
              <div className="mb-4 rounded-full bg-gray-50 p-4">
                <MapPin className="h-6 w-6 text-gray-700" />
              </div>
              <h3 className="mb-2 font-medium text-gray-900">Live Tracking</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Real-time location monitoring</p>
            </CardContent>
          </Card>

          <Card className="border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="flex flex-col items-center p-8 text-center">
              <div className="mb-4 rounded-full bg-gray-50 p-4">
                <Clock className="h-6 w-6 text-gray-700" />
              </div>
              <h3 className="mb-2 font-medium text-gray-900">Fast Delivery</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Optimized routes for quick delivery</p>
            </CardContent>
          </Card>

          <Card className="border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="flex flex-col items-center p-8 text-center">
              <div className="mb-4 rounded-full bg-gray-50 p-4">
                <Shield className="h-6 w-6 text-gray-700" />
              </div>
              <h3 className="mb-2 font-medium text-gray-900">Secure Platform</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Enterprise-grade security</p>
            </CardContent>
          </Card>
        </div>

        {/* Login Button */}
        <div className="flex justify-center">
          <Button
            onClick={handleAdminLogin}
            disabled={isLoading}
            size="lg"
            className="bg-sahelx-600 hover:bg-sahelx-700 text-white px-8 py-3 text-lg font-medium rounded-lg shadow-sm hover:shadow-md transition-all"
          >
            {isLoading ? "Loading..." : "Admin Login"}
          </Button>
        </div>
        {/* Footer */}
        <div className="mt-20 text-center">
          <p className="text-sm text-gray-500">© 2025 SahelX. All rights reserved.</p>
          <p className="mt-1 text-xs text-gray-400">Powering logistics across Northern Nigeria</p>
        </div>
      </div>
    </div>
  )
}
