"use client"

import { RidersTable } from "./riders-table"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import { useRouter } from "next/navigation"

export function RidersPage() {
  const router = useRouter()

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Riders Management</h1>
        <Button onClick={() => router.push("/admin/riders/register")}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Register New Rider
        </Button>
      </div>
      <RidersTable />
    </div>
  )
}
