"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/use-toast";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase/config";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

export function SettingsPage() {
  const [settings, setSettings] = useState({
    flatFee: 1000,
    feePerKm: 150,
    companyName: "Swift Logistics",
    contactPhone: "+2348011112222",
    emailNotifications: true,
    smsNotifications: false,
    autoAssignDeliveries: true,
  });

  
  const [notiTitle, setNotiTitle] = useState("");
  const [notiBody, setNotiBody] = useState("");
  const [notiTarget, setNotiTarget] = useState("all");
  const [isSending, setIsSending] = useState(false);

  const handleSendNotification = async () => {
    if (!notiTitle || !notiBody) {
      return toast({ title: "Error", description: "Title and body are required.", variant: "destructive" });
    }
    setIsSending(true);
    try {
      const sendAdminNotification = httpsCallable(functions, "sendAdminNotification");
      const result = await sendAdminNotification({ title: notiTitle, body: notiBody, target: notiTarget });
      const data = result.data as any;
      toast({ title: "Sent!", description: `Successfully sent to ${data.count} devices.` });
      setNotiTitle("");
      setNotiBody("");
    } catch (error: any) {
      toast({ title: "Failed", description: error.message, variant: "destructive" });
    } finally {
      setIsSending(false);
    }
  };

  const handleSave = () => {
    // Firebase update would go here
  };

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
                  value={settings.companyName}
                  onChange={(e) =>
                    setSettings({ ...settings, companyName: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactPhone">Contact Phone</Label>
                <Input
                  id="contactPhone"
                  value={settings.contactPhone}
                  onChange={(e) =>
                    setSettings({ ...settings, contactPhone: e.target.value })
                  }
                />
              </div>
            </div>
            <Button onClick={handleSave}>Save Changes</Button>
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
                <Label htmlFor="flatFee">Flat Fee (₦)</Label>
                <Input
                  id="flatFee"
                  type="number"
                  value={settings.flatFee}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      flatFee: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="feePerKm">Fee per KM (₦)</Label>
                <Input
                  id="feePerKm"
                  type="number"
                  value={settings.feePerKm}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      feePerKm: Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>
            <Button onClick={handleSave}>Update Pricing</Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="notifications" className="space-y-6">

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Send Push Notification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Target Audience</Label>
              <Select value={notiTarget} onValueChange={setNotiTarget}>
                <SelectTrigger>
                  <SelectValue placeholder="Select target" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users & Riders</SelectItem>
                  <SelectItem value="customers">Customers Only</SelectItem>
                  <SelectItem value="riders">Riders Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notification Title</Label>
              <Input placeholder="E.g. Holiday Promo!" value={notiTitle} onChange={(e) => setNotiTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Message Body</Label>
              <Input placeholder="Type your message here..." value={notiBody} onChange={(e) => setNotiBody(e.target.value)} />
            </div>
            <Button onClick={handleSendNotification} disabled={isSending}>
              {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Send Notification
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notification Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications via email
                </p>
              </div>
              <Switch
                checked={settings.emailNotifications}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, emailNotifications: checked })
                }
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>SMS Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications via SMS
                </p>
              </div>
              <Switch
                checked={settings.smsNotifications}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, smsNotifications: checked })
                }
              />
            </div>
            <Button onClick={handleSave}>Save Preferences</Button>
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
                <p className="text-sm text-muted-foreground">
                  Automatically assign deliveries to available riders
                </p>
              </div>
              <Switch
                checked={settings.autoAssignDeliveries}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, autoAssignDeliveries: checked })
                }
              />
            </div>
            <Button onClick={handleSave}>Update System Settings</Button>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
