"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Users, Box, Truck, Plus, History } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { getInvestor, updateInvestor } from "@/lib/firebase/investors";
import { getCustomers, getCouriers } from "@/lib/firebase/users";
import { getDeliveries } from "@/lib/firebase/deliveries";
import { getBankAccounts } from "@/lib/firebase/finance";
import { createInvestorPayout, getInvestorPayouts, type InvestorPayout } from "@/lib/firebase/investorPayouts";
import type { InvestorUser } from "@/lib/firebase/investorAuth";
import type { BankAccount } from "@/lib/finance/types";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function AdminInvestorDetailPage() {
  const router = useRouter();
  const params = useParams();
  const investorId = params.id as string;

  const [investor, setInvestor] = useState<InvestorUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Editable form state
  const [formData, setFormData] = useState({
    numberOfBikes: 0,
    totalInvested: 0,
    notes: "",
  });

  // Read-only system metrics
  const [metrics, setMetrics] = useState({
    customers: 0,
    deliveries: 0,
    activeRiders: 0,
  });

  // Payouts state
  const [payouts, setPayouts] = useState<InvestorPayout[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [showPayoutDialog, setShowPayoutDialog] = useState(false);
  const [isCreatingPayout, setIsCreatingPayout] = useState(false);
  const [newPayout, setNewPayout] = useState({
    amount: 0,
    source: "Cash",
    notes: "",
  });

  useEffect(() => {
    if (investorId) {
      loadData();
    }
  }, [investorId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      const inv = await getInvestor(investorId);
      if (!inv) {
        toast({ title: "Investor not found", variant: "destructive" });
        router.push("/admin/finance/investors");
        return;
      }
      setInvestor(inv);
      setFormData({
        numberOfBikes: inv.numberOfBikes || 0,
        totalInvested: inv.totalInvested || 0,
        notes: inv.notes || "",
      });

      const [customers, couriers, deliveries, fetchedBankAccounts, fetchedPayouts] = await Promise.all([
        getCustomers(),
        getCouriers(),
        getDeliveries(),
        getBankAccounts(),
        getInvestorPayouts(investorId),
      ]);

      const activeRiders = couriers.filter(c => c.isActive).length;

      setMetrics({
        customers: customers.length,
        deliveries: deliveries.length,
        activeRiders: activeRiders,
      });
      setBankAccounts(fetchedBankAccounts);
      setPayouts(fetchedPayouts);

    } catch (error: any) {
      toast({
        title: "Failed to load data",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true);
      await updateInvestor(investorId, formData);
      toast({ title: "Investor updated successfully" });
      await loadData();
    } catch (error: any) {
      toast({
        title: "Failed to update investor",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreatePayout = async () => {
    if (!newPayout.amount || newPayout.amount <= 0) {
      toast({ title: "Amount must be greater than 0", variant: "destructive" });
      return;
    }
    
    try {
      setIsCreatingPayout(true);
      await createInvestorPayout(investorId, newPayout.amount, newPayout.source, newPayout.notes);
      toast({ title: "Payout created and logged in Finance" });
      setShowPayoutDialog(false);
      setNewPayout({ amount: 0, source: "Cash", notes: "" });
      await loadData();
    } catch (error: any) {
      toast({
        title: "Failed to create payout",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsCreatingPayout(false);
    }
  };

  const getSourceName = (sourceId: string) => {
    if (sourceId === "Cash") return "Cash";
    const account = bankAccounts.find(b => b.id === sourceId);
    return account ? `${account.bankName} - ${account.accountName}` : sourceId;
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[50vh]">
          Loading...
        </div>
      </DashboardLayout>
    );
  }

  if (!investor) return null;

  return (
    <DashboardLayout>
      <motion.div
        className="flex flex-col gap-6"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" className="h-10 w-10 p-0 rounded-full" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
                {investor.displayName}
              </h1>
              <p className="text-sm text-muted-foreground">{investor.email}</p>
            </div>
          </div>
          <Dialog open={showPayoutDialog} onOpenChange={setShowPayoutDialog}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="h-4 w-4 mr-2" /> Record Payout
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Record Investor Payout</DialogTitle>
                <DialogDescription>
                  This will log a payout for {investor.displayName} and automatically deduct the amount from your selected Cash or Bank account in the Finance module.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Amount (₦)</Label>
                  <Input 
                    type="number" 
                    value={newPayout.amount}
                    onChange={(e) => setNewPayout({ ...newPayout, amount: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Source Account</Label>
                  <Select
                    value={newPayout.source}
                    onValueChange={(v) => setNewPayout({ ...newPayout, source: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Source" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cash">Cash Account</SelectItem>
                      {bankAccounts.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.bankName} - {b.accountName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Notes (Optional)</Label>
                  <Input 
                    value={newPayout.notes}
                    onChange={(e) => setNewPayout({ ...newPayout, notes: e.target.value })}
                    placeholder="e.g. Week 12 Payout"
                  />
                </div>
                <Button 
                  className="w-full bg-emerald-600 hover:bg-emerald-700" 
                  onClick={handleCreatePayout} 
                  disabled={isCreatingPayout}
                >
                  {isCreatingPayout ? "Recording..." : "Record & Deduct Funds"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Editable Investor Profile */}
          <Card>
            <CardHeader>
              <CardTitle>Profile & Settings</CardTitle>
              <CardDescription>Manage investor stake and configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Name</Label>
                  <p className="font-medium">{investor.displayName}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="font-medium">{investor.email}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="numberOfBikes">Number of Bikes</Label>
                <Input
                  id="numberOfBikes"
                  type="number"
                  value={formData.numberOfBikes}
                  onChange={(e) => setFormData({ ...formData, numberOfBikes: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="totalInvested">Total Amount Invested (₦)</Label>
                <Input
                  id="totalInvested"
                  type="number"
                  value={formData.totalInvested}
                  onChange={(e) => setFormData({ ...formData, totalInvested: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Visible to Investor)</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                />
              </div>

              <Button onClick={handleSaveProfile} disabled={isSaving} className="w-full bg-sahelx-600 hover:bg-sahelx-700">
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-6">
            {/* Payout History */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="space-y-1">
                  <CardTitle>Payout History</CardTitle>
                  <CardDescription>Recent payouts recorded for this investor</CardDescription>
                </div>
                <History className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {payouts.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">No payouts recorded yet.</p>
                ) : (
                  <div className="rounded-md border mt-2">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Source</TableHead>
                          <TableHead>Notes</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payouts.slice(0, 5).map((p) => (
                          <TableRow key={p.id}>
                            <TableCell>{p.date.toLocaleDateString()}</TableCell>
                            <TableCell>{getSourceName(p.source)}</TableCell>
                            <TableCell className="max-w-[120px] truncate">{p.notes || "-"}</TableCell>
                            <TableCell className="text-right font-medium text-emerald-600">
                              ₦{p.amount.toLocaleString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* System Metrics Overview */}
            <Card>
              <CardHeader>
                <CardTitle>System Metrics Overview</CardTitle>
                <CardDescription>Live data shown to investors</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Users className="h-4 w-4"/> Customers</p>
                  <p className="text-2xl font-bold">{metrics.customers}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Box className="h-4 w-4"/> Deliveries</p>
                  <p className="text-2xl font-bold">{metrics.deliveries}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Truck className="h-4 w-4"/> Active Fleet</p>
                  <p className="text-2xl font-bold">{metrics.activeRiders}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
