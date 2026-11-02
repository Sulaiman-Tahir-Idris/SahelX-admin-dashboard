import { collection, doc, getDocs, query, where, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "./config";
import { StaffProfile } from "../finance/types";

export const getAllStaff = async (): Promise<StaffProfile[]> => {
  const staff: StaffProfile[] = [];

  try {
    const adminSnapshot = await getDocs(collection(db, "Admin"));
    adminSnapshot.forEach((doc) => {
      const data = doc.data();
      staff.push({
        id: doc.id,
        collection: "Admin",
        name: data.displayName || data.name || "Unknown",
        email: data.email,
        phone: data.phone,
        role: "admin",
        departmentId: data.departmentId,
        baseSalary: data.baseSalary || 0,
        commissionRate: data.commissionRate || 0,
        hasAuth: true,
        isActive: data.isActive !== false,
        createdAt: data.createdAt?.toDate?.() || new Date(),
      });
    });
  } catch (error) { console.error("Error fetching Admin:", error); }

  try {
    const secSnapshot = await getDocs(collection(db, "Secretary"));
    secSnapshot.forEach((doc) => {
      const data = doc.data();
      staff.push({
        id: doc.id,
        collection: "Secretary",
        name: data.displayName || data.name || "Unknown",
        email: data.email,
        phone: data.phone,
        role: "secretary",
        departmentId: data.departmentId,
        baseSalary: data.baseSalary || 0,
        commissionRate: data.commissionRate || 0,
        hasAuth: true,
        isActive: data.isActive !== false,
        createdAt: data.createdAt?.toDate?.() || new Date(),
      });
    });
  } catch (error) { console.error("Error fetching Secretary:", error); }

  try {
    const riderQuery = query(collection(db, "User"), where("role", "==", "courier"));
    const riderSnapshot = await getDocs(riderQuery);
    riderSnapshot.forEach((doc) => {
      const data = doc.data();
      staff.push({
        id: doc.id,
        collection: "User",
        name: data.displayName || data.name || "Unknown",
        email: data.email,
        phone: data.phone,
        role: "rider",
        departmentId: data.departmentId,
        baseSalary: data.baseSalary || 0,
        commissionRate: data.commissionRate || 0,
        hasAuth: true,
        isActive: data.isActive !== false,
        createdAt: data.createdAt?.toDate?.() || new Date(),
      });
    });
  } catch (error) { console.error("Error fetching User/courier:", error); }

  try {
    const offlineSnapshot = await getDocs(collection(db, "offlineStaff"));
    offlineSnapshot.forEach((doc) => {
      const data = doc.data();
      staff.push({
        id: doc.id,
        collection: "offlineStaff",
        name: data.displayName || data.name || "Unknown",
        email: data.email,
        phone: data.phone,
        role: "offline",
        departmentId: data.departmentId,
        baseSalary: data.baseSalary || 0,
        commissionRate: data.commissionRate || 0,
        hasAuth: false,
        isActive: data.isActive !== false,
        createdAt: data.createdAt?.toDate?.() || new Date(),
      });
    });
  } catch (error) { console.error("Error fetching offlineStaff:", error); }

  return staff;
};

export const updateStaffPayrollInfo = async (
  collectionName: string,
  id: string,
  baseSalary: number,
  commissionRate: number,
  departmentId: string
) => {
  try {
    const docRef = doc(db, collectionName, id);
    await updateDoc(docRef, {
      baseSalary,
      commissionRate,
      departmentId,
    });
  } catch (error) {
    console.error("Error updating staff payroll info:", error);
    throw error;
  }
};

export const deleteStaff = async (
  id: string,
  collectionName: string,
  hasAuth: boolean = false
): Promise<void> => {
  try {
    // 1. Delete from Firestore client SDK directly (same as deleteAdminUser / deleteSecretaryUser)
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);

    // 2. Call backend endpoint to clean up Firebase Auth user if configured
    if (hasAuth) {
      try {
        await fetch("/api/admin/delete-staff", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, collection: collectionName, hasAuth: true }),
        });
      } catch (err) {
        console.warn("Auth deletion background call error:", err);
      }
    }
  } catch (error: any) {
    console.error("Failed to delete staff:", error);
    throw new Error(error.message || "Failed to delete staff");
  }
};
