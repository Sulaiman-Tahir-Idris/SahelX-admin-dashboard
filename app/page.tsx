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
    setIsLoading(true)
    // Add a small delay for better UX
    setTimeout(() => {
      router.push("/admin/login")
    }, 500)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-100 dark:from-red-950 dark:via-gray-900 dark:to-red-900">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>

      {/* Main Content */}
      <div className="relative flex min-h-screen flex-col items-center justify-center px-4">
        {/* Logo Section */}
        <div className="mb-12 text-center">
          <div className="mb-8 flex justify-center">
            <div className="relative">
              <Image
                src="/images/sahelx-logo.png"
                alt="SahelX Logo"
                width={300}
                height={120}
                className="h-auto w-auto max-w-[300px]"
                priority
              />
            </div>
          </div>

          <h1 className="mb-4 text-4xl font-bold text-red-900 dark:text-red-100 md:text-5xl">SahelX Admin Portal</h1>
          <p className="text-xl text-red-700 dark:text-red-300 md:text-2xl">Fast Moves, Northern Routes</p>
          <p className="mt-2 text-lg text-red-600 dark:text-red-400">Admin-Only Delivery Management System</p>
        </div>

        {/* Features Grid */}
        <div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-red-200 bg-white/80 backdrop-blur-sm dark:border-red-800 dark:bg-red-950/30">
            <CardContent className="flex flex-col items-center p-6 text-center">
              <div className="mb-4 rounded-full bg-red-100 p-3 dark:bg-red-900/50">
                <Truck className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="mb-2 font-semibold text-red-900 dark:text-red-100">Fleet Management</h3>
              <p className="text-sm text-red-700 dark:text-red-300">Manage riders and vehicles efficiently</p>
            </CardContent>
          </Card>

          <Card className="border-red-200 bg-white/80 backdrop-blur-sm dark:border-red-800 dark:bg-red-950/30">
            <CardContent className="flex flex-col items-center p-6 text-center">
              <div className="mb-4 rounded-full bg-red-100 p-3 dark:bg-red-900/50">
                <MapPin className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="mb-2 font-semibold text-red-900 dark:text-red-100">Live Tracking</h3>
              <p className="text-sm text-red-700 dark:text-red-300">Real-time location monitoring</p>
            </CardContent>
          </Card>

          <Card className="border-red-200 bg-white/80 backdrop-blur-sm dark:border-red-800 dark:bg-red-950/30">
            <CardContent className="flex flex-col items-center p-6 text-center">
              <div className="mb-4 rounded-full bg-red-100 p-3 dark:bg-red-900/50">
                <Clock className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="mb-2 font-semibold text-red-900 dark:text-red-100">Fast Delivery</h3>
              <p className="text-sm text-red-700 dark:text-red-300">Optimized routes for quick delivery</p>
            </CardContent>
          </Card>

          <Card className="border-red-200 bg-white/80 backdrop-blur-sm dark:border-red-800 dark:bg-red-950/30">
            <CardContent className="flex flex-col items-center p-6 text-center">
              <div className="mb-4 rounded-full bg-red-100 p-3 dark:bg-red-900/50">
                <Shield className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="mb-2 font-semibold text-red-900 dark:text-red-100">Secure Platform</h3>
              <p className="text-sm text-red-700 dark:text-red-300">Enterprise-grade security</p>
            </CardContent>
          </Card>
        </div>

        {/* Login Buttons - Only Admin Login */}
        <div className="flex justify-center">
          <Button
            onClick={handleAdminLogin}
            disabled={isLoading}
            size="lg"
            className="bg-red-600 px-8 py-3 text-lg font-semibold text-white hover:bg-red-700 focus:ring-red-500 dark:bg-red-700 dark:hover:bg-red-800"
          >
            {isLoading ? "Loading..." : "Admin Login"}
          </Button>
        </div>

        {/* Footer */}
        <div className="mt-16 text-center">
          <p className="text-sm text-red-600 dark:text-red-400">© 2024 SahelX. All rights reserved.</p>
          <p className="mt-1 text-xs text-red-500 dark:text-red-500">Powering logistics across Northern Nigeria</p>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-red-200/30 blur-3xl dark:bg-red-800/30"></div>
      <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-red-300/20 blur-3xl dark:bg-red-700/20"></div>
    </div>
  )
}
