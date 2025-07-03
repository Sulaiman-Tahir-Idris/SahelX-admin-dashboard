import type { Metadata } from "next"
import { RidersTable } from "@/components/riders/riders-table"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Riders - Sahel X",
  description: "Manage delivery riders for Sahel X",
}

export default function RidersPage() {
  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Riders Management</h1>
        <Link href="/riders/register">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Register New Rider
          </Button>
        </Link>
      </div>
      <RidersTable />
    </div>
  )
}
