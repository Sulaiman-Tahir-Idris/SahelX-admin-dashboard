"use client" // Error boundaries must be Client Components

import { useEffect } from "react"
import { AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Optionally log the error to an error reporting service
    console.error(error)
  }, [error])

  return (
    <div className="flex h-[400px] w-full flex-col items-center justify-center space-y-4 text-center">
      <div className="rounded-full bg-destructive/10 p-3 text-destructive">
        <AlertCircle className="h-8 w-8" />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-semibold tracking-tight">Something went wrong!</h2>
        <p className="text-sm text-muted-foreground max-w-[500px]">
          We encountered an error loading this page. This could be due to a network issue or missing data.
        </p>
      </div>
      <Button onClick={reset} variant="outline" className="gap-2">
        <RefreshCw className="h-4 w-4" />
        Try again
      </Button>
    </div>
  )
}
