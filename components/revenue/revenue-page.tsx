"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TrendingUp, Calendar, Download, Filter } from "lucide-react";
import { getAllPayments, type Payment } from "@/lib/firebase/payments";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  CartesianGrid,
} from "recharts";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export function RevenuePage() {
  const [isClient, setIsClient] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: "all",
    gateway: "all",
    startDate: "",
    endDate: "",
  });

  useEffect(() => {
    setIsClient(true);
    const fetchData = async () => {
      try {
        const data = await getAllPayments();
        setPayments(
          data.map((p) => ({
            ...p,
            paidAt: p.paidAt ? new Date(p.paidAt) : new Date(p.createdAt),
          })),
        );
      } catch (err) {
        // handled
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (!isClient || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">
            Loading revenue data...
          </p>
        </div>
      </div>
    );
  }

  // Filtered payments based on UI filters
  const filteredPayments = payments.filter((p) => {
    const matchesStatus =
      filters.status === "all" || p.status === filters.status;
    const matchesGateway =
      filters.gateway === "all" || p.gateway === filters.gateway;
    const date = new Date(p.paidAt);
    const matchesStart =
      !filters.startDate || date >= new Date(filters.startDate);
    const matchesEnd = !filters.endDate || date <= new Date(filters.endDate);
    return matchesStatus && matchesGateway && matchesStart && matchesEnd;
  });

  const filteredPaidPayments = filteredPayments.filter(
    (p) => p.status === "paid",
  );

  // Aggregate stats
  const totalRevenue = filteredPaidPayments.reduce(
    (sum, p) => sum + Number(p.amount),
    0,
  );
  const totalDeliveries = filteredPaidPayments.length;
  const avgOrderValue =
    totalDeliveries > 0 ? totalRevenue / totalDeliveries : 0;

  // Monthly, weekly, yearly computations
  const monthlyMap: Record<string, number> = {};
  filteredPaidPayments.forEach((p) => {
    const d = new Date(p.paidAt);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    monthlyMap[key] = (monthlyMap[key] || 0) + Number(p.amount);
  });
  const monthlyRevenueData = Object.entries(monthlyMap)
    .map(([key, revenue]) => {
      const [year, m] = key.split("-").map(Number);
      return {
        month: new Date(year, m).toLocaleString("default", { month: "short" }),
        revenue,
      };
    })
    .sort(
      (a, b) =>
        new Date(`01 ${a.month}`).getMonth() -
        new Date(`01 ${b.month}`).getMonth(),
    );

  const currentMonthRevenue = (() => {
    const now = new Date();
    const key = `${now.getFullYear()}-${now.getMonth()}`;
    return monthlyMap[key] || 0;
  })();

  const today = new Date();
  const thisWeekStart = new Date(today);
  thisWeekStart.setDate(today.getDate() - today.getDay());
  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(thisWeekStart.getDate() - 7);

  let thisWeekTotal = 0;
  let lastWeekTotal = 0;

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    return { date: d, total: 0 };
  });

  filteredPaidPayments.forEach((p) => {
    const d = new Date(p.paidAt);
    if (d >= thisWeekStart && d <= today) thisWeekTotal += Number(p.amount);
    if (d >= lastWeekStart && d < thisWeekStart)
      lastWeekTotal += Number(p.amount);

    last7Days.forEach((day) => {
      if (
        d.getDate() === day.date.getDate() &&
        d.getMonth() === day.date.getMonth() &&
        d.getFullYear() === day.date.getFullYear()
      ) {
        day.total += Number(p.amount);
      }
    });
  });

  const weeklyGrowth =
    lastWeekTotal > 0
      ? ((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100
      : thisWeekTotal > 0
        ? 100
        : 0;

  const weeklyRevenueData = last7Days.map((d) => ({
    day: d.date.toLocaleDateString("en-US", { weekday: "short" }),
    revenue: d.total,
  }));

  const yearlyMap: Record<string, number> = {};
  filteredPaidPayments.forEach((p) => {
    const d = new Date(p.paidAt);
    const m = d.toLocaleString("default", { month: "short" });
    yearlyMap[m] = (yearlyMap[m] || 0) + Number(p.amount);
  });
  const yearlyRevenueData = Object.entries(yearlyMap).map(
    ([month, revenue]) => ({ month, revenue }),
  );

  const recentTransactions = filteredPaidPayments.slice(0, 10);

  const formatCurrency = (amt: number) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(amt);

  // ============== EXPORT with styled summary ================
  const handleExport = () => {
    const companyName = "SahelX Delivery System";
    const generatedAt = new Date();

    // Build summary values object
    const summaryValues: Record<string, number> = {
      "Total Revenue (₦)": totalRevenue,
      "Filtered Transactions": filteredPayments.length,
      "Paid Transactions": filteredPaidPayments.length,
      "Pending Transactions": filteredPayments.filter(
        (p) => p.status === "pending",
      ).length,
      "Failed Transactions": filteredPayments.filter(
        (p) => p.status === "failed",
      ).length,
      "Average Order Value (₦)": avgOrderValue,
      "This Week Revenue (₦)": thisWeekTotal,
      "Current Month Revenue (₦)": currentMonthRevenue,
    };

    // Build transaction rows
    const transactionRows = filteredPayments.map((p) => {
      const d = new Date(p.paidAt);
      return {
        Reference: p.reference,
        Date: d.toLocaleString(),
        Amount: Number(p.amount),
        Status: p.status,
        Gateway: p.gateway,
        // Add any extra fields you have:
        Description: (p as any).description || "",
      };
    });

    // Create workbook and sheets
    const wb = XLSX.utils.book_new();

    // 1. Summary sheet (AOA) with styling
    const summaryAoA: Array<Array<string | number>> = [];

    // Title rows
    summaryAoA.push([companyName]);
    summaryAoA.push(["Revenue Report"]);
    summaryAoA.push(["Generated At:", generatedAt.toLocaleString()]);
    summaryAoA.push([]);

    // Summary header label
    summaryAoA.push(["Metric", "Value"]);

    // Summary data rows
    for (const [label, value] of Object.entries(summaryValues)) {
      summaryAoA.push([label, value]);
    }

    const wsSummary = XLSX.utils.aoa_to_sheet(summaryAoA);

    // Styling on wsSummary
    // Choose a brand accent color (approx): #1E90FF (dodger blue) as placeholder (you can refine)
    const headerFill = { fgColor: { rgb: "1E90FF" } }; // brand blue
    const headerFont = { bold: true, color: { rgb: "FFFFFF" } };
    // Apply styling to header "Metric / Value" row
    const headerRowIndex = 4; // zero-based, the 5th row (Metric, Value)
    const range = XLSX.utils.decode_range(wsSummary["!ref"] || "A1");
    for (let c = range.s.c; c <= range.e.c; c++) {
      const cellRef = XLSX.utils.encode_cell({ r: headerRowIndex, c });
      const cell = wsSummary[cellRef];
      if (cell) {
        cell.s = {
          fill: headerFill,
          font: headerFont,
          alignment: { horizontal: "center", vertical: "center" },
        };
      }
    }
    // Bold the labels (Metric column) in the rows below
    for (let r = headerRowIndex + 1; r <= range.e.r; r++) {
      const cellRef = XLSX.utils.encode_cell({ r, c: range.s.c });
      const cell = wsSummary[cellRef];
      if (cell) {
        cell.s = { font: { bold: true } };
      }
    }

    // Set column widths
    wsSummary["!cols"] = [{ wch: 25 }, { wch: 20 }];

    XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");

    // 2. Transaction sheet
    const wsTrans = XLSX.utils.json_to_sheet(transactionRows);
    // Column widths
    const keys =
      transactionRows.length > 0
        ? Object.keys(transactionRows[0])
        : ["Reference", "Date", "Amount", "Status", "Gateway"];
    wsTrans["!cols"] = keys.map((k) => ({ wch: Math.max(k.length + 2, 15) }));

    // Bold header row in transactions
    const transRange = XLSX.utils.decode_range(wsTrans["!ref"] || "A1");
    for (let c = transRange.s.c; c <= transRange.e.c; c++) {
      const cellRef = XLSX.utils.encode_cell({ r: transRange.s.r, c });
      const cell = wsTrans[cellRef];
      if (cell) {
        cell.s = { font: { bold: true } };
      }
    }

    XLSX.utils.book_append_sheet(wb, wsTrans, "Transactions");

    // Write and save file
    const fileName = `${companyName.replace(/\s+/g, "_")}_Revenue_Report_${generatedAt.toISOString().split("T")[0]}.xlsx`;
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });

    try {
      saveAs(new Blob([wbout], { type: "application/octet-stream" }), fileName);
    } catch (err) {
      // fallback
      (window as any).location.href = URL.createObjectURL(new Blob([wbout]));
    }
  };

  return (
    <div className="space-y-6">
      {/* Revenue Cards */}
      <div className="grid gap-4 md:gap-6 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <span className="text-lg">₦</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">All-time (filtered)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Monthly Revenue
            </CardTitle>
            <Calendar className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(currentMonthRevenue)}
            </div>
            <p className="text-xs text-green-600 flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              Current month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(thisWeekTotal)}
            </div>
            <p
              className={`text-xs ${weeklyGrowth >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              {weeklyGrowth.toFixed(1)}% from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Avg Order Value
            </CardTitle>
            <span className="text-lg">₦</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(avgOrderValue)}
            </div>
            <p className="text-xs text-muted-foreground">Per delivery</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="mr-2 h-4 w-4" />
                  Filter
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64">
                <div className="space-y-3">
                  <div>
                    <Label>Status</Label>
                    <Select
                      value={filters.status}
                      onValueChange={(v) =>
                        setFilters((prev) => ({ ...prev, status: v }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Gateway</Label>
                    <Select
                      value={filters.gateway}
                      onValueChange={(v) =>
                        setFilters((prev) => ({ ...prev, gateway: v }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        {Array.from(
                          new Set(payments.map((p) => p.gateway)),
                        ).map((g) => (
                          <SelectItem key={g} value={g}>
                            {g}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Date Range</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="date"
                        value={filters.startDate}
                        onChange={(e) =>
                          setFilters((prev) => ({
                            ...prev,
                            startDate: e.target.value,
                          }))
                        }
                      />
                      <span className="text-sm">to</span>
                      <Input
                        type="date"
                        value={filters.endDate}
                        onChange={(e) =>
                          setFilters((prev) => ({
                            ...prev,
                            endDate: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>

                  <Button
                    variant="default"
                    className="w-full"
                    onClick={() =>
                      setFilters({
                        status: "all",
                        gateway: "all",
                        startDate: "",
                        endDate: "",
                      })
                    }
                  >
                    Clear Filters
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Revenue Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyRevenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(v: number) => formatCurrency(v)} />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#2563EB"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue by Payment Gateway</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={Object.entries(
                      filteredPaidPayments.reduce(
                        (acc, p) => {
                          acc[p.gateway] =
                            (acc[p.gateway] || 0) + Number(p.amount);
                          return acc;
                        },
                        {} as Record<string, number>,
                      ),
                    ).map(([gateway, revenue]) => ({ gateway, revenue }))}
                  >
                    <XAxis dataKey="gateway" />
                    <YAxis />
                    <Tooltip formatter={(v: number) => formatCurrency(v)} />
                    <Bar
                      dataKey="revenue"
                      fill="#10B981"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Weekly Revenue (Last 7 Days)</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyRevenueData}>
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Bar dataKey="revenue" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Yearly Revenue (Jan – Dec)</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={yearlyRevenueData}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Bar dataKey="revenue" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Reference</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Gateway</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentTransactions.map((txn) => (
                      <TableRow key={txn.id || txn.reference}>
                        <TableCell className="font-medium">
                          {txn.reference}
                        </TableCell>
                        <TableCell>
                          {new Date(txn.paidAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(txn.amount)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              txn.status === "paid"
                                ? "bg-green-500"
                                : txn.status === "pending"
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                            }
                          >
                            {txn.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{txn.gateway}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
