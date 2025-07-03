"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Loader2, Plus, Trash2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import {
  getAppSettings,
  updatePricing,
  updateServiceAreas,
  type Pricing,
  type GeoBoundary,
} from "@/lib/firebase/settings"

export function FirebaseSettingsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [pricing, setPricing] = useState<Pricing>({
    baseFee: 1000,
    perKm: 150,
    perKg: 50,
  })
  const [serviceAreas, setServiceAreas] = useState<GeoBoundary[]>([
    { lat: 6.5244, lng: 3.3792, radius: 10 }, // Lagos default
  ])

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setIsLoading(true)
      const settings = await getAppSettings()

      if (settings) {
        setPricing(settings.pricing)
        setServiceAreas(settings.serviceAreas)
      }
    } catch (error: any) {
      toast({
        title: "Failed to load settings",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSavePricing = async () => {
    try {
      setIsSaving(true)
      await updatePricing(pricing)
      toast({
        title: "Pricing updated",
        description: "Pricing settings have been successfully updated.",
      })
    } catch (error: any) {
      toast({
        title: "Failed to update pricing",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveServiceAreas = async () => {
    try {
      setIsSaving(true)
      await updateServiceAreas(serviceAreas)
      toast({
        title: "Service areas updated",
        description: "Service area settings have been successfully updated.",
      })
    } catch (error: any) {
      toast({
        title: "Failed to update service areas",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const addServiceArea = () => {
    setServiceAreas([...serviceAreas, { lat: 0, lng: 0, radius: 5 }])
  }

  const removeServiceArea = (index: number) => {
    setServiceAreas(serviceAreas.filter((_, i) => i !== index))
  }

  const updateServiceArea = (index: number, field: keyof GeoBoundary, value: number) => {
    const updated = [...serviceAreas]
    updated[index] = { ...updated[index], [field]: value }
    setServiceAreas(updated)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="mt-2 text-sm text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <Tabs defaultValue="pricing" className="space-y-6">
      <TabsList>
        <TabsTrigger value="pricing">Pricing</TabsTrigger>
        <TabsTrigger value="service-areas">Service Areas</TabsTrigger>
        <TabsTrigger value="notifications">Notifications</TabsTrigger>
      </TabsList>

      <TabsContent value="pricing" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Delivery Pricing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="baseFee">Base Fee (₦)</Label>
                <Input
                  id="baseFee"
                  type="number"
                  value={pricing.baseFee}
                  onChange={(e) => setPricing({ ...pricing, baseFee: Number(e.target.value) })}
                />
                <p className="text-xs text-muted-foreground">Fixed fee for all deliveries</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="perKm">Fee per KM (₦)</Label>
                <Input
                  id="perKm"
                  type="number"
                  value={pricing.perKm}
                  onChange={(e) => setPricing({ ...pricing, perKm: Number(e.target.value) })}
                />
                <p className="text-xs text-muted-foreground">Additional fee per kilometer</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="perKg">Fee per KG (₦)</Label>
                <Input
                  id="perKg"
                  type="number"
                  value={pricing.perKg}
                  onChange={(e) => setPricing({ ...pricing, perKg: Number(e.target.value) })}
                />
                <p className="text-xs text-muted-foreground">Additional fee per kilogram</p>
              </div>
            </div>

            <Separator />

            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-medium mb-2">Pricing Preview</h4>
              <p className="text-sm text-muted-foreground">
                Example: 5km delivery with 2kg package = ₦{pricing.baseFee + 5 * pricing.perKm + 2 * pricing.perKg}
                <br />
                (Base: ₦{pricing.baseFee} + Distance: ₦{5 * pricing.perKm} + Weight: ₦{2 * pricing.perKg})
              </p>
            </div>

            <Button onClick={handleSavePricing} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Pricing"
              )}
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="service-areas" className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Service Areas</CardTitle>
            <Button onClick={addServiceArea} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Area
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {serviceAreas.map((area, index) => (
              <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                <div className="grid grid-cols-1 gap-2 md:grid-cols-3 flex-1">
                  <div className="space-y-1">
                    <Label>Latitude</Label>
                    <Input
                      type="number"
                      step="any"
                      value={area.lat}
                      onChange={(e) => updateServiceArea(index, "lat", Number(e.target.value))}
                      placeholder="6.5244"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Longitude</Label>
                    <Input
                      type="number"
                      step="any"
                      value={area.lng}
                      onChange={(e) => updateServiceArea(index, "lng", Number(e.target.value))}
                      placeholder="3.3792"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Radius (km)</Label>
                    <Input
                      type="number"
                      value={area.radius}
                      onChange={(e) => updateServiceArea(index, "radius", Number(e.target.value))}
                      placeholder="10"
                    />
                  </div>
                </div>
                {serviceAreas.length > 1 && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => removeServiceArea(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}

            <Button onClick={handleSaveServiceAreas} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Service Areas"
              )}
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="notifications" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Notification Templates</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Notification template management will be implemented in the next phase.
            </p>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
