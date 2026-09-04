"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { getCompanyContacts, saveCompanyContacts, type CompanyContacts } from "@/lib/firebase/companyContacts"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useRole } from "@/lib/hooks/use-role"

const contactsSchema = z.object({
  ceoName: z.string().min(2, "Name is required"),
  ceoPhone: z.string().min(5, "Phone is required"),
  ceoEmail: z.string().email("Invalid email"),
  cfoName: z.string().min(2, "Name is required"),
  cfoPhone: z.string().min(5, "Phone is required"),
  cfoEmail: z.string().email("Invalid email"),
})

export default function InvestorSettingsPage() {
  const role = useRole()
  const isAdmin = role === 'ceo' || role === 'cfo' || role === 'cto' || role === 'admin'
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const form = useForm<z.infer<typeof contactsSchema>>({
    resolver: zodResolver(contactsSchema),
    defaultValues: {
      ceoName: "", ceoPhone: "", ceoEmail: "",
      cfoName: "", cfoPhone: "", cfoEmail: "",
    },
  })

  useEffect(() => {
    async function load() {
      try {
        const data = await getCompanyContacts()
        if (data) {
          form.reset(data)
        }
      } catch (err) {
        toast.error("Failed to load contacts")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [form])

  const onSubmit = async (values: z.infer<typeof contactsSchema>) => {
    if (!isAdmin) {
      toast.error("Unauthorized")
      return
    }
    setSaving(true)
    try {
      await saveCompanyContacts(values)
      toast.success("Contacts saved successfully")
    } catch (error) {
      toast.error("Failed to save contacts")
    } finally {
      setSaving(false)
    }
  }

  if (!isAdmin) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center text-muted-foreground">Unauthorized access</div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">Investor Portal Settings</h1>
          <p className="text-sm text-muted-foreground">Manage contact details visible to investors in their dashboard.</p>
        </div>

        {loading ? (
          <div className="flex h-40 items-center justify-center text-muted-foreground">Loading...</div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>CEO Contact</CardTitle>
                  <CardDescription>Visible to investors for high-level inquiries.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField control={form.control} name="ceoName" render={({ field }) => (
                    <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="ceoPhone" render={({ field }) => (
                    <FormItem><FormLabel>Phone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="ceoEmail" render={({ field }) => (
                    <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>CFO Contact</CardTitle>
                  <CardDescription>Visible to investors for financial and payout inquiries.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField control={form.control} name="cfoName" render={({ field }) => (
                    <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="cfoPhone" render={({ field }) => (
                    <FormItem><FormLabel>Phone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="cfoEmail" render={({ field }) => (
                    <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving..." : "Save Contacts"}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </div>
    </DashboardLayout>
  )
}
