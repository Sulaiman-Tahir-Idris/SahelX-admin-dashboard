"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { getAllStaff, updateStaffPayrollInfo } from "@/lib/firebase/staff";
import { getDepartments } from "@/lib/firebase/finance";
import { StaffProfile, FinanceDepartment } from "@/lib/finance/types";

export default function StaffDetailPage({ id }: { id: string }) {
  const router = useRouter();
  const { toast } = useToast();
  
  const [staff, setStaff] = useState<StaffProfile | null>(null);
  const [departments, setDepartments] = useState<FinanceDepartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    baseSalary: "0",
    commissionRate: "0",
    departmentId: "none",
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [allStaff, deptsData] = await Promise.all([
          getAllStaff(),
          getDepartments(),
        ]);
        
        const foundStaff = allStaff.find((s) => s.id === id);
        if (foundStaff) {
          setStaff(foundStaff as StaffProfile);
          setFormData({
            baseSalary: foundStaff.baseSalary?.toString() || "0",
            commissionRate: foundStaff.commissionRate?.toString() || "0",
            departmentId: foundStaff.departmentId || "none",
          });
        }
        
        setDepartments(deptsData as FinanceDepartment[]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleSave = async () => {
    if (!staff) return;
    setSaving(true);
    try {
      await updateStaffPayrollInfo(
        staff.collection,
        staff.id,
        Number(formData.baseSalary),
        Number(formData.commissionRate),
        formData.departmentId === "none" ? "" : formData.departmentId
      );
      toast({ title: "Success", description: "Payroll info updated successfully" });
      setStaff({
        ...staff,
        baseSalary: Number(formData.baseSalary),
        commissionRate: Number(formData.commissionRate),
        departmentId: formData.departmentId === "none" ? undefined : formData.departmentId,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading staff details...</div>;
  }

  if (!staff) {
    return <div className="p-8 text-center">Staff member not found.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Staff Details</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Basic details about the staff member.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-muted-foreground">Name</Label>
              <div className="font-medium text-lg">{staff.name}</div>
            </div>
            <div>
              <Label className="text-muted-foreground">Role</Label>
              <div className="font-medium capitalize">{staff.role}</div>
            </div>
            <div>
              <Label className="text-muted-foreground">Email</Label>
              <div>{staff.email || "-"}</div>
            </div>
            <div>
              <Label className="text-muted-foreground">Phone</Label>
              <div>{staff.phone || "-"}</div>
            </div>
            <div>
              <Label className="text-muted-foreground">Status</Label>
              <div>{staff.isActive ? "Active" : "Inactive"}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payroll & Department</CardTitle>
            <CardDescription>Update compensation and assignments.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Department</Label>
              <Select
                value={formData.departmentId}
                onValueChange={(v) => setFormData({ ...formData, departmentId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="baseSalary">Base Salary (₦)</Label>
              <Input
                id="baseSalary"
                type="number"
                min="0"
                value={formData.baseSalary}
                onChange={(e) => setFormData({ ...formData, baseSalary: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="commissionRate">Commission Rate (%)</Label>
              <Input
                id="commissionRate"
                type="number"
                min="0"
                max="100"
                value={formData.commissionRate}
                onChange={(e) => setFormData({ ...formData, commissionRate: e.target.value })}
              />
            </div>
            <Button className="w-full mt-4" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export { StaffDetailPage };
