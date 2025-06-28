"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Loader2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { useAuth } from "@/hooks/use-auth"
import { getSettings, updateSettings, updatePricingSettings, type SystemSettings } from "@/lib/firebase/settings"

export function SettingsPage() {
  const { user } = useAuth()
  const [settings, setSettings] = useState<SystemSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setLoading(true)
      const settingsData = await getSettings()
      setSettings(settingsData)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load settings",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveGeneral = async () => {
    if (!settings || !user) return

    try {
      setSaving(true)
      await updateSettings(
        {
          companyInfo: settings.companyInfo,
          supportContact: settings.supportContact,
          operatingHours: settings.operatingHours,
        },
        user.uid,
      )

      toast({
        title: "Settings saved",
        description: "General settings have been updated successfully.",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save settings",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleSavePricing = async () => {
    if (!settings || !user) return

    try {
      setSaving(true)
      await updatePricingSettings(settings.pricing, user.uid)

      toast({
        title: "Pricing updated",
        description: "Pricing settings have been updated successfully.",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update pricing",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleSaveSystem = async () => {
    if (!settings || !user) return

    try {
      setSaving(true)
      await updateSettings(
        {
          autoAssignDeliveries: settings.autoAssignDeliveries,
          maxDeliveryRadius: settings.maxDeliveryRadius,
        },
        user.uid,
      )

      toast({
        title: "System settings saved",
        description: "System settings have been updated successfully.",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save system settings",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-red-600" />
          <p className="mt-2 text-sm text-red-600">Loading settings...</p>
        </div>
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Failed to load settings</p>
        <Button onClick={loadSettings} className="mt-4">
          Retry
        </Button>
      </div>
    )
  }

  return (
    <Tabs defaultValue="general" className="space-y-6">
      <TabsList>
        <TabsTrigger value="general">General</TabsTrigger>
        <TabsTrigger value="pricing">Pricing</TabsTrigger>
        <TabsTrigger value="notifications">Notifications</TabsTrigger>
        <TabsTrigger value="system">System</TabsTrigger>
      </TabsList>

      <TabsContent value="general" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  value={settings.companyInfo.name}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      companyInfo: { ...settings.companyInfo, name: e.target.value },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyAddress">Company Address</Label>
                <Input
                  id="companyAddress"
                  value={settings.companyInfo.address}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      companyInfo: { ...settings.companyInfo, address: e.target.value },
                    })
                  }
                />
              </div>
            </div>

            <Separator />

            <h3 className="text-lg font-semibold">Support Contact</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="supportPhone">Support Phone</Label>
                <Input
                  id="supportPhone"
                  value={settings.supportContact.phone}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      supportContact: { ...settings.supportContact, phone: e.target.value },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supportEmail">Support Email</Label>
                <Input
                  id="supportEmail"
                  type="email"
                  value={settings.supportContact.email}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      supportContact: { ...settings.supportContact, email: e.target.value },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supportWhatsapp">WhatsApp</Label>
                <Input
                  id="supportWhatsapp"
                  value={settings.supportContact.whatsapp}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      supportContact: { ...settings.supportContact, whatsapp: e.target.value },
                    })
                  }
                />
              </div>
            </div>

            <Separator />

            <h3 className="text-lg font-semibold">Operating Hours</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="operatingStart">Start Time</Label>
                <Input
                  id="operatingStart"
                  type="time"
                  value={settings.operatingHours.start}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      operatingHours: { ...settings.operatingHours, start: e.target.value },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="operatingEnd">End Time</Label>
                <Input
                  id="operatingEnd"
                  type="time"
                  value={settings.operatingHours.end}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      operatingHours: { ...settings.operatingHours, end: e.target.value },
                    })
                  }
                />
              </div>
            </div>

            <Button onClick={handleSaveGeneral} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="pricing" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Delivery Pricing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="baseFee">Base Fee (₦)</Label>
                <Input
                  id="baseFee"
                  type="number"
                  value={settings.pricing.baseFee}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      pricing: { ...settings.pricing, baseFee: Number(e.target.value) },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="perKm">Fee per KM (₦)</Label>
                <Input
                  id="perKm"
                  type="number"
                  value={settings.pricing.perKm}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      pricing: { ...settings.pricing, perKm: Number(e.target.value) },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="perKg">Fee per KG (₦)</Label>
                <Input
                  id="perKg"
                  type="number"
                  value={settings.pricing.perKg}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      pricing: { ...settings.pricing, perKg: Number(e.target.value) },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minimumFare">Minimum Fare (₦)</Label>
                <Input
                  id="minimumFare"
                  type="number"
                  value={settings.pricing.minimumFare}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      pricing: { ...settings.pricing, minimumFare: Number(e.target.value) },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maximumFare">Maximum Fare (₦)</Label>
                <Input
                  id="maximumFare"
                  type="number"
                  value={settings.pricing.maximumFare}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      pricing: { ...settings.pricing, maximumFare: Number(e.target.value) },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="surgeMultiplier">Surge Multiplier</Label>
                <Input
                  id="surgeMultiplier"
                  type="number"
                  step="0.1"
                  value={settings.pricing.surgeMultiplier}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      pricing: { ...settings.pricing, surgeMultiplier: Number(e.target.value) },
                    })
                  }
                />
              </div>
            </div>
            <Button onClick={handleSavePricing} disabled={saving}>
              {saving ? (
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

      <TabsContent value="notifications" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Notification Templates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Notification templates are currently managed through the system configuration. Advanced template editing
              will be available in a future update.
            </p>

            <div className="space-y-3">
              {settings.notificationTemplates.map((template, index) => (
                <div key={template.id} className="p-3 border rounded-lg">
                  <h4 className="font-medium">{template.title}</h4>
                  <p className="text-sm text-muted-foreground">{template.body}</p>
                  <span className="text-xs bg-muted px-2 py-1 rounded mt-2 inline-block">{template.type}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="system" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>System Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto-assign Deliveries</Label>
                <p className="text-sm text-muted-foreground">Automatically assign deliveries to available riders</p>
              </div>
              <Switch
                checked={settings.autoAssignDeliveries}
                onCheckedChange={(checked) =>
                  setSettings({
                    ...settings,
                    autoAssignDeliveries: checked,
                  })
                }
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="maxRadius">Maximum Delivery Radius (KM)</Label>
              <Input
                id="maxRadius"
                type="number"
                value={settings.maxDeliveryRadius}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    maxDeliveryRadius: Number(e.target.value),
                  })
                }
              />
              <p className="text-sm text-muted-foreground">Maximum distance for delivery assignments</p>
            </div>

            <Button onClick={handleSaveSystem} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Update System Settings"
              )}
            </Button>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
