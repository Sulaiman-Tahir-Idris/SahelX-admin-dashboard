"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MoreHorizontal, Search } from "lucide-react";
import { getAllStaff } from "@/lib/firebase/staff";
import { getDepartments } from "@/lib/firebase/finance";
import { StaffProfile, FinanceDepartment } from "@/lib/finance/types";

export default function StaffTable() {
  const router = useRouter();
  const [staff, setStaff] = useState<StaffProfile[]>([]);
  const [departments, setDepartments] = useState<FinanceDepartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [deptFilter, setDeptFilter] = useState("all");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [staffData, deptsData] = await Promise.all([
          getAllStaff(),
          getDepartments(),
        ]);
        setStaff(staffData as StaffProfile[]);
        setDepartments(deptsData as FinanceDepartment[]);
      } catch (err) {
        console.error("Error fetching staff data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getDepartmentName = (id?: string) => {
    if (!id || id === "none") return "-";
    const dept = departments.find((d) => d.id === id);
    return dept ? dept.name : "Unknown";
  };

  const filteredStaff = staff.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.email && s.email.toLowerCase().includes(search.toLowerCase())) ||
      (s.phone && s.phone.includes(search));
    const matchesRole = roleFilter === "all" || s.role === roleFilter;
    const matchesDept = deptFilter === "all" || s.departmentId === deptFilter;
    return matchesSearch && matchesRole && matchesDept;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="secretary">Secretary</SelectItem>
            <SelectItem value="rider">Rider</SelectItem>
            <SelectItem value="offline">Offline</SelectItem>
          </SelectContent>
        </Select>
        <Select value={deptFilter} onValueChange={setDeptFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Departments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            <SelectItem value="none">None</SelectItem>
            {departments.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Base Salary</TableHead>
              <TableHead>Comm. Rate</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center h-24">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredStaff.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center h-24">
                  No staff found.
                </TableCell>
              </TableRow>
            ) : (
              filteredStaff.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell className="capitalize">{s.role}</TableCell>
                  <TableCell>{getDepartmentName(s.departmentId)}</TableCell>
                  <TableCell>
                    <div className="text-sm">{s.email || "-"}</div>
                    <div className="text-sm text-muted-foreground">{s.phone || "-"}</div>
                  </TableCell>
                  <TableCell>₦{s.baseSalary.toLocaleString()}</TableCell>
                  <TableCell>{s.commissionRate}%</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => router.push(`/admin/staff/${s.id}`)}
                        >
                          View Details
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
    </div>
  );
}

export { StaffTable };
