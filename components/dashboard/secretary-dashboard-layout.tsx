"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SecretaryAppSidebar } from "@/components/secretary-app-sidebar";
import { SecretarySiteHeader } from "@/components/secretary-site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
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
      <div className="flex min-h-screen flex-col bg-background">
        <div className="fixed top-0 left-0 right-0 h-16 border-b border-border/50 bg-background/90 backdrop-blur-xl flex items-center px-6 gap-4 z-50">
          <div className="w-24 h-5 rounded-lg skeleton" />
          <div className="w-px h-4 bg-border" />
          <div className="w-28 h-5 rounded-full skeleton" />
          <div className="ml-auto flex gap-2">
            <div className="w-8 h-8 rounded-lg skeleton" />
            <div className="w-32 h-8 rounded-xl skeleton" />
          </div>
        </div>
        <div className="hidden md:flex fixed left-0 top-16 bottom-0 w-[240px] border-r border-border/50 bg-sidebar flex-col gap-3 p-4">
          <div className="w-full h-12 rounded-xl skeleton" />
          <div className="w-3/4 h-4 rounded-lg skeleton mt-2" />
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="w-full h-10 rounded-xl skeleton" style={{ opacity: 1 - i * 0.1 }} />
          ))}
        </div>
        <main className="md:ml-[240px] pt-20 p-6 space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="h-28 rounded-2xl skeleton" />)}
          </div>
          <div className="h-64 rounded-2xl skeleton" />
        </main>
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/50 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-full border-2 border-amber-500/20 border-t-amber-500 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-amber-500 animate-pulse" />
              </div>
            </div>
            <p className="text-sm font-medium text-muted-foreground">Loading portal…</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <SecretaryAppSidebar />
      <SidebarInset className="min-w-0">
        <SecretarySiteHeader user={user || undefined} />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0 min-w-0">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
