"use client";

import { useState, useEffect, useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Eye,
  MoreHorizontal,
  Phone,
  Mail,
  Loader2,
  AlertCircle,
  Users,
  UserCheck,
  UserX,
  TrendingUp,
  RotateCcw,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { getCustomers, type Customer } from "@/lib/firebase/customers";
import { useRouter } from "next/navigation";
import { StatsCard } from "../dashboard/stats-card";

export function CustomersTable() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [filterStatus, setFilterStatus] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [sortKey, setSortKey] = useState<"none" | "orders">("none");

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const customersData = await getCustomers();
      setCustomers(customersData);
    } catch (error: any) {
      setError(error.message);
      toast({
        title: "Failed to load customers",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCustomers = useMemo(() => {
    let result = customers.filter(
      (customer: Customer) =>
        customer.displayName
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        customer.phone?.includes(searchQuery) ||
        customer.email?.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    if (filterStatus === "active") {
      result = result.filter((c: Customer) => c.isActive);
    } else if (filterStatus === "inactive") {
      result = result.filter((c: Customer) => !c.isActive);
    }

    if (sortKey === "orders") {
      result = [...result].sort(
        (a: Customer, b: Customer) =>
          (b.totalOrders || 0) - (a.totalOrders || 0),
      );
    }

    return result;
  }, [customers, searchQuery, filterStatus, sortKey]);

  // pagination
  const total = filteredCustomers.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (page > totalPages) setPage(1);
  const startIndex = (page - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, total);
  const pageItems = filteredCustomers.slice(startIndex, endIndex);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A";

    let date: Date;
    if (timestamp.toDate) {
      date = timestamp.toDate();
    } else if (timestamp.seconds) {
      date = new Date(timestamp.seconds * 1000);
    } else {
      date = new Date(timestamp);
    }

    return date.toLocaleDateString();
  };

  const exportToPdf = async () => {
    const rows = filteredCustomers.map((c) => [
      c.displayName || c.fullName || c.email || "",
      c.email,
      String(c.totalOrders || 0),
      c.phone || "",
      formatDate(c.createdAt ?? c.lastOrder),
    ]);

    // Try to use jsPDF + autotable if available (optional dependency). Fallback to printable window.
    try {
      // dynamic import so this only runs when clicked and only if package is installed
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { jsPDF } = await import("jspdf");
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const autoTable = (await import("jspdf-autotable")).default;

      const doc = new jsPDF({ unit: "pt" });
      // @ts-ignore
      doc.autoTable({
        head: [["Customer", "Status", "Total Orders", "Phone", "Joined"]],
        body: rows,
        startY: 40,
        styles: { fontSize: 10 },
      });
      doc.save("customers.pdf");
      return;
    } catch (err) {
      // fallback: open printable HTML and let user save as PDF via browser
      const style = `
        <style>
          table{width:100%;border-collapse:collapse;font-family:Arial,Helvetica,sans-serif}
          th,td{border:1px solid #ddd;padding:8px;text-align:left}
          th{background:#f2f2f2}
        </style>`;
      const header = `<h2>Customers (${rows.length})</h2>`;
      const tableHeader = `<tr><th>Customer</th><th>Status</th><th>Total Orders</th><th>Phone</th><th>Joined</th></tr>`;
      const tableRows = rows
        .map(
          (r: any[]) =>
            `<tr>${r.map((cell: any) => `<td>${cell ?? ""}</td>`).join("")}</tr>`,
        )
        .join("");
      const html = `<!doctype html><html><head><meta charset="utf-8">${style}</head><body>${header}<table>${tableHeader}${tableRows}</table></body></html>`;

      const w = window.open("", "_blank");
      if (!w) {
        toast({
          title: "Unable to open window",
          description: "Popup blocked. Allow popups to export.",
          variant: "destructive",
        });
        return;
      }
      w.document.write(html);
      w.document.close();
      // give the new window a moment to render then trigger print
      setTimeout(() => w.print(), 500);
    }
  };
  const exportEmails = async () => {
    const emails = Array.from(
      new Set(
        filteredCustomers
          .map((c) => c.email)
          .filter((email): email is string => !!email),
      ),
    );

    if (emails.length === 0) {
      toast({
        title: "No emails found",
        description: "There are no customer emails to export.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { jsPDF } = await import("jspdf");

      const doc = new jsPDF({ unit: "pt" });
      doc.setFontSize(12);
      doc.text("Customer Emails", 40, 40);

      emails.forEach((email, index) => {
        doc.text(email, 40, 70 + index * 14);
      });

      doc.save("customer-emails.pdf");
    } catch (error) {
      // fallback: simple text file
      const content = emails.join("\n");
      const blob = new Blob([content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "customer-emails.txt";
      a.click();

      URL.revokeObjectURL(url);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="mt-2 text-sm text-muted-foreground">
            Loading customers...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Failed to load customers: {error}</AlertDescription>
        </Alert>
        <Button onClick={loadCustomers} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  const activeCount = customers.filter((c: Customer) => c.isActive).length;
  const inactiveCount = customers.filter((c: Customer) => !c.isActive).length;
  const topOrdersCount = customers.filter(
    (c: Customer) => (c.totalOrders || 0) > 0,
  ).length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Customers"
          value={customers.length}
          icon={Users}
          color="blue"
          isActive={filterStatus === "all" && sortKey === "none"}
          onClick={() => {
            setFilterStatus("all");
            setSortKey("none");
          }}
        />
        <StatsCard
          title="Active Customers"
          value={activeCount}
          icon={UserCheck}
          color="green"
          isActive={filterStatus === "active"}
          onClick={() => {
            setFilterStatus("active");
            setSortKey("none");
          }}
        />
        <StatsCard
          title="Inactive Customers"
          value={inactiveCount}
          icon={UserX}
          color="gray"
          isActive={filterStatus === "inactive"}
          onClick={() => {
            setFilterStatus("inactive");
            setSortKey("none");
          }}
        />
        <StatsCard
          title="Top Orders"
          value={topOrdersCount}
          icon={TrendingUp}
          color="purple"
          isActive={sortKey === "orders"}
          onClick={() => {
            setSortKey("orders");
            setFilterStatus("all");
          }}
        />
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <Input
          placeholder="Search customers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          {(filterStatus !== "all" ||
            sortKey !== "none" ||
            searchQuery !== "") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFilterStatus("all");
                setSortKey("none");
                setSearchQuery("");
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset
            </Button>
          )}
          <Button onClick={exportEmails} variant="secondary" size="sm">
            Export Emails
          </Button>
          <Button onClick={exportToPdf} variant="secondary" size="sm">
            Export PDF
          </Button>
          <Button onClick={loadCustomers} variant="outline" size="sm">
            Refresh
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader className="bg-gray-50/50">
            <TableRow>
              <TableHead className="font-bold text-gray-900">
                Customer
              </TableHead>
              <TableHead className="font-bold text-gray-900">Status</TableHead>
              <TableHead className="font-bold text-gray-900">
                Total Orders
              </TableHead>
              <TableHead className="font-bold text-gray-900">Phone</TableHead>
              <TableHead className="font-bold text-gray-900">Joined</TableHead>
              <TableHead className="text-right font-bold text-gray-900">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  {customers.length === 0
                    ? "No customers found. Customers will appear here when they register."
                    : "No customers match your search."}
                </TableCell>
              </TableRow>
            ) : (
              pageItems.map((customer) => (
                <TableRow
                  key={customer.id}
                  className="group hover:bg-gray-50/50 transition-colors"
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage
                          src={customer.profileImage || "/placeholder.svg"}
                          alt={customer.displayName}
                        />
                        <AvatarFallback>
                          {customer.displayName?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="grid gap-0.5">
                        <div className="font-medium">
                          {customer.displayName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {customer.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        customer.isActive ? "bg-green-500" : "bg-gray-500"
                      }
                      variant="secondary"
                    >
                      {customer.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>{customer.totalOrders || 0}</TableCell>
                  <TableCell>{customer.phone}</TableCell>
                  <TableCell>
                    {formatDate(customer.createdAt ?? customer.lastOrder)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() =>
                            router.push(`/admin/customers/${customer.id}`)
                          }
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Profile
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => window.open(`tel:${customer.phone}`)}
                        >
                          <Phone className="mr-2 h-4 w-4" />
                          Call Customer
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            window.open(`mailto:${customer.email}`)
                          }
                        >
                          <Mail className="mr-2 h-4 w-4" />
                          Send Email
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

      {total > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div>
            Showing {startIndex + 1}-{endIndex} of {total} customers
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium">Rows:</label>
            <select
              className="bg-white border rounded px-1 py-1 text-xs outline-none focus:ring-1 focus:ring-primary"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
            >
              {[10, 25, 50, 100].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <div className="h-4 w-px bg-gray-200 mx-1"></div>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-chevron-left"
              >
                <path d="m15 18-6-6 6-6" />
              </svg>
            </Button>
            <div className="px-2 text-xs font-medium min-w-[40px] text-center">
              {page} / {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-chevron-right"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            </Button>
          </div>
        </div>
      )}

      {/* {customers.length > 0 && (
        <div className="text-sm text-muted-foreground">
          Showing {filteredCustomers.length} of {customers.length} customers
        </div>
      )} */}
    </div>
  );
}
