"use client"

import { useAuth } from "@/hooks/use-auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function FirebaseDebug() {
  const { user, loading } = useAuth()

  if (process.env.NODE_ENV !== "development") {
    return null
  }

  return (
    <Card className="fixed bottom-4 right-4 w-80 z-50 bg-black/90 text-white">
      <CardHeader>
        <CardTitle className="text-sm">Firebase Debug</CardTitle>
      </CardHeader>
      <CardContent className="text-xs">
        <div>Loading: {loading ? "Yes" : "No"}</div>
        <div>User: {user ? "Logged In" : "Not Logged In"}</div>
        {user && (
          <div className="mt-2">
            <div>UID: {user.uid}</div>
            <div>Email: {user.email}</div>
            <div>Role: {user.role}</div>
            <div>Name: {user.displayName}</div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
