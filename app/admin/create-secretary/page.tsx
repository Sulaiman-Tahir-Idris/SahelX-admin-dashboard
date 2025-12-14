"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  Plus,
  MoreHorizontal,
  Shield,
  Mail,
  Calendar,
  Trash2,
  Eye,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { createSecretaryUser } from "@/lib/firebase/setupSecretary";
import {
  getSecretaryUsers,
  deleteSecretaryUser,
  type SecretaryUser,
} from "@/lib/firebase/secretary-users";

export default function AdminSecretariesPage() {
  const [secretaries, setSecretaries] = useState<SecretaryUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Form state
  const [newSecretary, setNewSecretary] = useState({
    email: "",
    password: "",
    displayName: "",
  });

  useEffect(() => {
    loadSecretaries();
  }, []);

  const loadSecretaries = async () => {
    try {
      setIsLoading(true);
      const users = await getSecretaryUsers();
      setSecretaries(users);
    } catch (error: any) {
      toast({
        title: "Failed to load secretaries",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSecretary = async () => {
    if (
      !newSecretary.email ||
      !newSecretary.password ||
      !newSecretary.displayName
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
      await createSecretaryUser(
        newSecretary.email,
        newSecretary.password,
        newSecretary.displayName
      );

      toast({
        title: "Secretary created",
        description: `${newSecretary.displayName} has been successfully created.`,
      });

      setNewSecretary({ email: "", password: "", displayName: "" });
      setShowCreateDialog(false);
      await loadSecretaries();
    } catch (error: any) {
      toast({
        title: "Failed to create secretary",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteSecretary = async (id: string, name: string) => {
    if (
      !confirm(
        `Are you sure you want to delete secretary "${name}"? This action cannot be undone.`
      )
    )
      return;

    try {
      setIsDeleting(id);
      await deleteSecretaryUser(id);

      toast({
        title: "Secretary deleted",
        description: `${name} has been successfully deleted.`,
      });

      await loadSecretaries();
    } catch (error: any) {
      toast({
        title: "Failed to delete secretary",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(null);
    }
  };

  const filteredSecretaries = secretaries.filter(
    (s) =>
      s.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A";
    let date: Date;
    if (timestamp.toDate) date = timestamp.toDate();
    else if (timestamp.seconds) date = new Date(timestamp.seconds * 1000);
    else date = new Date(timestamp);
    return date.toLocaleDateString();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Input
            placeholder="Search secretaries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />

          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="bg-sahelx-600 hover:bg-sahelx-700">
                <Plus className="mr-2 h-4 w-4" />
                Create Secretary
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Secretary</DialogTitle>
                <DialogDescription>
                  Create a new secretary account with limited access.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="displayName">Full Name</Label>
                  <Input
                    id="displayName"
                    value={newSecretary.displayName}
                    onChange={(e) =>
                      setNewSecretary({
                        ...newSecretary,
                        displayName: e.target.value,
                      })
                    }
                    placeholder="Jane Doe"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newSecretary.email}
                    onChange={(e) =>
                      setNewSecretary({
                        ...newSecretary,
                        email: e.target.value,
                      })
                    }
                    placeholder="secretary@company.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newSecretary.password}
                    onChange={(e) =>
                      setNewSecretary({
                        ...newSecretary,
                        password: e.target.value,
                      })
                    }
                    placeholder="Minimum 6 characters"
                  />
                </div>

                <Alert>
                  <AlertDescription>
                    The new secretary will have limited access and can create
                    requests only.
                  </AlertDescription>
                </Alert>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowCreateDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateSecretary}
                  disabled={isCreating}
                  className="bg-sahelx-600 hover:bg-sahelx-700"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Secretary"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Secretaries</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    Loading secretaries...
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Secretary</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSecretaries.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center">
                          {secretaries.length === 0
                            ? "No secretaries found."
                            : "No secretaries match your search."}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredSecretaries.map((s) => (
                        <TableRow key={s.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarImage
                                  src="/placeholder.svg"
                                  alt={s.displayName}
                                />
                                <AvatarFallback className="bg-gray-100 text-gray-700">
                                  {s.displayName?.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="grid gap-0.5">
                                <div className="font-medium">
                                  {s.displayName}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {s.email}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-sahelx-600 hover:bg-sahelx-700">
                              <Shield className="mr-1 h-3 w-3" />
                              Secretary
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              {formatDate(s.createdAt)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  disabled={isDeleting === s.id}
                                >
                                  {isDeleting === s.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <MoreHorizontal className="h-4 w-4" />
                                  )}
                                  <span className="sr-only">Open menu</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    window.open(`mailto:${s.email}`)
                                  }
                                >
                                  <Mail className="mr-2 h-4 w-4" />
                                  Send Email
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleDeleteSecretary(
                                      s.id!,
                                      s.displayName || "Secretary"
                                    )
                                  }
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete Secretary
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
            )}

            {secretaries.length > 0 && (
              <div className="mt-4 text-sm text-muted-foreground">
                Showing {filteredSecretaries.length} of {secretaries.length}{" "}
                secretaries
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
