"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { MobileNav } from "./secretary-dashboard-nav";
import Image from "next/image";
import { signOutSecretary } from "@/lib/firebase/secretaryAuth";

export function SecretaryDashboardHeader({ user }: { user?: any }) {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    if (!user) {
      const storedUser = localStorage.getItem("secretaryUser");
      if (storedUser) {
        setCurrentUser(JSON.parse(storedUser));
      }
    } else {
      setCurrentUser(user);
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      await signOutSecretary();
      localStorage.removeItem("isSecretaryLoggedIn");
      localStorage.removeItem("secretaryUser");

      toast({
        title: "Logged out successfully",
        description: "You have been logged out of the secretary dashboard.",
      });

      router.push("/secretary/login");
    } catch (error: any) {
      toast({
        title: "Logout failed",
        description: error.message || "Failed to logout",
        variant: "destructive",
      });
    }
  };

  const handleProfileClick = () => {
    router.push("/secretary/profile");
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex h-16 w-full items-center justify-between border-b border-gray-200 bg-white/95 backdrop-blur-sm px-4 md:px-6 shadow-sm">
      <div className="flex items-center space-x-3 md:space-x-4">
        <MobileNav />
        <Image
          src="/images/black1.png"
          alt="SahelX Logo"
          width={120}
          height={40}
          className="h-6 w-auto md:h-8"
        />
        <div className="h-4 w-px bg-gray-300 md:h-6"></div>
        <h1 className="text-sm font-medium text-gray-900 md:text-lg">
          Secretary Portal
        </h1>
      </div>

      <div className="flex items-center space-x-2 md:space-x-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-7 w-7 md:h-8 md:w-8 border-2 border-gray-200">
                <AvatarFallback className="bg-desertred text-desertred font-semibold text-xs md:text-sm">
                  {(currentUser?.displayName || "S").charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="border-gray-200 w-64">
            <div className="flex items-center gap-3 p-4">
              <Avatar className="h-12 w-12 border-2 border-gray-200 rounded-full">
                <AvatarFallback className="bg-desertred text-desertred font-bold text-lg">
                  {(currentUser?.displayName || "S").charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <p className="font-semibold text-gray-900 text-sm md:text-base">
                  {currentUser?.displayName || "Secretary User"}
                </p>
                <p className="text-xs text-gray-600 md:text-sm">
                  {currentUser?.email || "secretary@sahelx.com"}
                </p>
              </div>
            </div>
            <DropdownMenuSeparator className="bg-gray-200" />
            <DropdownMenuItem
              onClick={handleProfileClick}
              className="text-gray-700 hover:bg-gray-50 cursor-pointer"
            >
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-gray-200" />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-gray-700 hover:bg-gray-50 cursor-pointer"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
