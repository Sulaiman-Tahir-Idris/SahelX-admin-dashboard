"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/components/ui/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Copy, CheckCircle, ArrowLeft } from "lucide-react"
import Link from "next/link"

const formSchema = z.object({
  fullName: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  phone: z.string().min(10, { message: "Please enter a valid phone number." }),
  vehicleType: z.enum(["bike", "car"], {
    required_error: "Please select a vehicle type.",
  }),
  isVerified: z.boolean().default(false),
})

type FormValues = z.infer<typeof formSchema>

export function RiderRegistrationForm() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [registrationSuccess, setRegistrationSuccess] = useState(false)
  const [riderCredentials, setRiderCredentials] = useState<{
    email: string
    password: string
    riderId: string
  } | null>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      vehicleType: "bike",
      isVerified: false,
    },
  })

  // Generate a random password for the rider
  const generatePassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    let password = ""
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return password
  }

  // Generate rider ID
  const generateRiderId = () => {
    return `RIDER_${Date.now().toString().slice(-6)}`
  }

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true)
    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Generate credentials for the rider
      const password = generatePassword()
      const riderId = generateRiderId()

      // In a real app, this would be a Firebase Auth creation + Firestore document
      const newRider = {
        uid: riderId,
        fullName: values.fullName,
        email: values.email,
        phone: values.phone,
        vehicleType: values.vehicleType,
        isVerified: values.isVerified,
        status: "available",
        currentLocation: null,
        assignedDeliveries: [],
        history: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        // Authentication credentials
        password: password, // In real app, this would be hashed
      }

      // Store credentials to show to admin
      setRiderCredentials({
        email: values.email,
        password: password,
        riderId: riderId,
      })

      console.log("New rider registered:", newRider)

      setRegistrationSuccess(true)

      toast({
        title: "Rider registered successfully",
        description: `${values.fullName} has been registered. Please share the login credentials with them.`,
      })
    } catch (error: any) {
      toast({
        title: "Failed to register rider",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied to clipboard",
      description: "The credentials have been copied to your clipboard.",
    })
  }

  if (registrationSuccess && riderCredentials) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/riders">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Riders
            </Button>
          </Link>
        </div>

        <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-200">
              <CheckCircle className="h-5 w-5" />
              Rider Mobile App Credentials Generated
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>
                The rider has been successfully registered. Share these credentials with the rider so they can log into
                their SahelX Rider Mobile App.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Rider ID</label>
                  <div className="flex items-center gap-2">
                    <Input value={riderCredentials.riderId} readOnly />
                    <Button size="sm" variant="outline" onClick={() => copyToClipboard(riderCredentials.riderId)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <div className="flex items-center gap-2">
                    <Input value={riderCredentials.email} readOnly />
                    <Button size="sm" variant="outline" onClick={() => copyToClipboard(riderCredentials.email)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Temporary Password</label>
                  <div className="flex items-center gap-2">
                    <Input value={riderCredentials.password} readOnly />
                    <Button size="sm" variant="outline" onClick={() => copyToClipboard(riderCredentials.password)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Complete Credentials (Copy All)</label>
                <div className="flex items-center gap-2">
                  <Input
                    value={`Email: ${riderCredentials.email} | Password: ${riderCredentials.password} | Rider ID: ${riderCredentials.riderId}`}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      copyToClipboard(
                        `Email: ${riderCredentials.email}\nPassword: ${riderCredentials.password}\nRider ID: ${riderCredentials.riderId}`,
                      )
                    }
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="rounded-lg border bg-blue-50 p-4 dark:bg-blue-950">
              <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Mobile App Access</h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                The rider will use these credentials to log into the SahelX Rider Mobile App. Make sure they have the
                app installed on their mobile device before sharing these credentials.
              </p>
            </div>

            <Alert>
              <AlertDescription>
                <strong>Important:</strong> These credentials are for the SahelX Rider Mobile App only. The rider should
                download the mobile app and use these credentials to log in. They should change their password after
                first login for security.
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setRegistrationSuccess(false)
                  setRiderCredentials(null)
                  form.reset()
                }}
              >
                Register Another Rider
              </Button>
              <Button variant="outline" onClick={() => router.push("/admin/riders")}>
                View All Riders
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/riders">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Riders
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Rider Registration</CardTitle>
          <p className="text-sm text-muted-foreground">
            Register a new rider to the SahelX platform. Login credentials will be automatically generated.
          </p>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="john@example.com" type="email" {...field} />
                      </FormControl>
                      <FormDescription>This will be used as the rider's login email</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="+2348012345678" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="vehicleType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vehicle Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select vehicle type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="bike">Motorcycle/Bike</SelectItem>
                          <SelectItem value="car">Car</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="isVerified"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Verified Rider</FormLabel>
                      <FormDescription>
                        Mark this rider as verified. Verified riders can start accepting deliveries immediately.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <Alert>
                <AlertDescription>
                  After registration, login credentials (email and temporary password) will be generated automatically.
                  Please share these credentials with the rider so they can access the Rider App.
                </AlertDescription>
              </Alert>

              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Registering Rider...
                  </>
                ) : (
                  "Register Rider"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
