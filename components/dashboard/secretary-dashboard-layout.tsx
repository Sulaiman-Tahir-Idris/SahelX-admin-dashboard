"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SecretaryDashboardHeader } from "./secretary-dashboard-header";
import { SecretaryDashboardNav } from "./secretary-dashboard-nav";
import {
  getCurrentSecretary,
  type SecretaryUser,
} from "@/lib/firebase/secretaryAuth";

export function SecretaryDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<SecretaryUser | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const secretary = await getCurrentSecretary();
      if (!secretary) {
        router.push("/secretary/login");
        return;
      }
      setUser(secretary);
      localStorage.setItem("isSecretaryLoggedIn", "true");
      localStorage.setItem("secretaryUser", JSON.stringify(secretary));
      setIsLoading(false);
    };

    fetchUser();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <SecretaryDashboardHeader user={user} />
      <div className="flex">
        <SecretaryDashboardNav />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pt-20 md:pt-24 md:ml-[240px]">
          {children}
        </main>
      </div>
    </div>
  );
}
