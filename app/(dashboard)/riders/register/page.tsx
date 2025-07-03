import type { Metadata } from "next"
import { RiderRegistrationForm } from "@/components/riders/rider-registration-form"

export const metadata: Metadata = {
  title: "Register Rider - Swift Logistics",
  description: "Register a new delivery rider for Swift Logistics",
}

export default function RegisterRiderPage() {
  return (
    <div className="flex flex-col space-y-6">
      <h1 className="text-3xl font-bold">Register New Rider</h1>
      <RiderRegistrationForm />
    </div>
  )
}
