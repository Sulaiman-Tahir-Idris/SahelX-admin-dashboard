"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { getCustomers, type Customer } from "@/lib/firebase/customers";
import { useRouter } from "next/navigation";

export function CustomersTable() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

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
      console.error("Error loading customers:", error);
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

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone?.includes(searchQuery) ||
      customer.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          (r) =>
            `<tr>${r.map((cell) => `<td>${cell ?? ""}</td>`).join("")}</tr>`
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
          .filter((email): email is string => !!email)
      )
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Input
          placeholder="Search customers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
        <div className="flex items-center gap-2">
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
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Total Orders</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Actions</TableHead>
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
                <TableRow key={customer.id}>
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
            <label>Rows:</label>
            <select
              className="input h-8"
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
            <Button
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Prev
            </Button>
            <div className="px-2">
              {page} / {totalPages}
            </div>
            <Button
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
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
