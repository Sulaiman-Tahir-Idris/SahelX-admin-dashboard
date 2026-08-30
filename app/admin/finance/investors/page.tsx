"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { TrendingUp } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, MoreHorizontal, Eye, Trash2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import {
  getInvestors,
  deleteInvestorUser,
  createInvestor,
} from "@/lib/firebase/investors";
import type { InvestorUser } from "@/lib/firebase/investorAuth";

export default function AdminInvestorsPage() {
  const router = useRouter();
  const [investors, setInvestors] = useState<InvestorUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Form state
  const [newInvestor, setNewInvestor] = useState({
    email: "",
    password: "",
    displayName: "",
    phone: "",
    numberOfBikes: 0,
    totalInvested: 0,
    notes: "",
  });

  useEffect(() => {
    loadInvestors();
  }, []);

  const loadInvestors = async () => {
    try {
      setIsLoading(true);
      const data = await getInvestors();
      setInvestors(data);
    } catch (error: any) {
      toast({
        title: "Failed to load investors",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateInvestor = async () => {
    if (
      !newInvestor.email ||
      !newInvestor.password ||
      !newInvestor.displayName
    ) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsCreating(true);
      
      await createInvestor(newInvestor);

      toast({
        title: "Investor created",
        description: `${newInvestor.displayName} has been successfully created.`,
      });

      setNewInvestor({
        email: "",
        password: "",
        displayName: "",
        phone: "",
        numberOfBikes: 0,
        weeklyPayout: 0,
        paymentStatus: "pending",
        notes: "",
      });
      setShowCreateDialog(false);
      await loadInvestors();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteInvestor = async (id: string, name: string) => {
    if (
      !confirm(
        `Are you sure you want to delete investor "${name}"? This action cannot be undone.`
      )
    )
      return;

    try {
      setIsDeleting(id);
      await deleteInvestorUser(id);

      toast({
        title: "Investor deleted",
        description: `${name} has been successfully deleted.`,
      });

      await loadInvestors();
    } catch (error: any) {
      toast({
        title: "Failed to delete investor",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(null);
    }
  };

  const filteredInvestors = investors.filter(
    (inv) =>
      inv.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );



  return (
    <DashboardLayout>
      <motion.div
        className="flex flex-col gap-6"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
      >
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-500/10">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">Investors</h1>
              <p className="text-sm text-muted-foreground">Manage investor accounts, bike allocations, and payouts.</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4">
          <Input
            placeholder="Search investors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />

          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="bg-sahelx-600 hover:bg-sahelx-700">
                <Plus className="mr-2 h-4 w-4" />
                Add Investor
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Investor</DialogTitle>
                <DialogDescription>
                  Create an investor profile. They will use the email and password to log into their dashboard.
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="displayName">Full Name *</Label>
                  <Input
                    id="displayName"
                    value={newInvestor.displayName}
                    onChange={(e) =>
                      setNewInvestor({ ...newInvestor, displayName: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newInvestor.email}
                    onChange={(e) =>
                      setNewInvestor({ ...newInvestor, email: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="text"
                    value={newInvestor.password}
                    onChange={(e) =>
                      setNewInvestor({ ...newInvestor, password: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone (Optional)</Label>
                  <Input
                    id="phone"
                    value={newInvestor.phone}
                    onChange={(e) =>
                      setNewInvestor({ ...newInvestor, phone: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="numberOfBikes">Number of Bikes</Label>
                  <Input
                    id="numberOfBikes"
                    type="number"
                    value={newInvestor.numberOfBikes}
                    onChange={(e) =>
                      setNewInvestor({ ...newInvestor, numberOfBikes: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="totalInvested">Total Amount Invested (₦)</Label>
                  <Input
                    id="totalInvested"
                    type="number"
                    value={newInvestor.totalInvested}
                    onChange={(e) =>
                      setNewInvestor({ ...newInvestor, totalInvested: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="notes">Notes (Visible to Investor)</Label>
                  <Input
                    id="notes"
                    value={newInvestor.notes}
                    onChange={(e) =>
                      setNewInvestor({ ...newInvestor, notes: e.target.value })
                    }
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateInvestor} disabled={isCreating} className="bg-sahelx-600 hover:bg-sahelx-700">
                  {isCreating ? "Creating..." : "Create Investor"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Bikes</TableHead>
                <TableHead>Total Invested</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    Loading investors...
                  </TableCell>
                </TableRow>
              ) : filteredInvestors.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No investors found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredInvestors.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-medium">{inv.displayName}</TableCell>
                    <TableCell>{inv.email}</TableCell>
                    <TableCell>{inv.numberOfBikes}</TableCell>
                    <TableCell>₦{inv.totalInvested?.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => router.push(`/admin/finance/investors/${inv.id}`)}
                          >
                            <Eye className="mr-2 h-4 w-4" /> View / Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleDeleteInvestor(inv.id, inv.displayName)}
                            disabled={isDeleting === inv.id}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
