"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { InvestorAppSidebar } from "@/components/investor-app-sidebar";
import { InvestorSiteHeader } from "@/components/investor-site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import {
  getCurrentInvestor,
  type InvestorUser,
} from "@/lib/firebase/investorAuth";

export function InvestorDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<InvestorUser | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const investor = await getCurrentInvestor();
      if (!investor) {
        router.push("/investor/login");
        return;
      }
      setUser(investor);
      localStorage.setItem("isInvestorLoggedIn", "true");
      localStorage.setItem("investorUser", JSON.stringify(investor));
      setIsLoading(false);
    };

    fetchUser();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-background">
        <div className="hidden md:flex w-[240px] border-r flex-col gap-3 p-4">
          <div className="w-full h-10 rounded-lg skeleton" />
          {[1,2].map(i => (
            <div key={i} className="w-full h-10 rounded-lg skeleton" style={{ opacity: 1 - i * 0.15 }} />
          ))}
        </div>
        <div className="flex-1 flex flex-col">
          <div className="h-14 border-b flex items-center px-6">
            <div className="w-32 h-5 rounded-lg skeleton" />
          </div>
          <div className="p-6 space-y-6">
            <div className="w-48 h-8 rounded-lg skeleton" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1,2,3,4].map(i => <div key={i} className="h-32 rounded-xl skeleton" />)}
            </div>
            <div className="h-64 rounded-xl skeleton" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <InvestorAppSidebar />
      <SidebarInset className="min-w-0">
        <InvestorSiteHeader user={user || undefined} />
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-muted/20 min-w-0">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
