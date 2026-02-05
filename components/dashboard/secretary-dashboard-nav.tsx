"use client";

import { useState } from "react";
import { Home, Truck, Users, Box, Map, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import { usePathname, useRouter } from "next/navigation";

const navItems = [
  { title: "Dashboard", href: "/secretary/dashboard", icon: Home },
  { title: "Riders", href: "/secretary/riders", icon: Truck },
  { title: "Customers", href: "/secretary/customers", icon: Users },
  { title: "Deliveries", href: "/secretary/deliveries", icon: Box },
  {
    title: "Create Delivery",
    href: "/secretary/create-delivery",
    icon: Box, // You can replace with a "+" icon if you want
  },
  {
    title: "Multiple Deliveries",
    href: "/secretary/multiple-deliveries",
    icon: Box,
  },
  { title: "Live Map", href: "/secretary/live-map", icon: Map },
];

// Mobile Navigation
export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const handleNavigation = (href: string) => {
    router.push(href);
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden text-gray-600 hover:text-gray-900"
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] sm:w-[300px] p-0">
        <SheetHeader className="p-4 border-b border-gray-200">
          <SheetTitle className="text-lg font-semibold text-gray-900">
            Navigation Menu
          </SheetTitle>
          <SheetDescription className="text-sm text-gray-600">
            Access all secretary dashboard sections
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col space-y-1 p-4">
          {navItems.map((item) => (
            <Button
              key={item.href}
              variant="ghost"
              className={cn(
                "h-12 w-full justify-start text-gray-700 hover:bg-gray-100 hover:text-gray-900 font-medium",
                pathname === item.href &&
                  "bg-sahelx-50 text-sahelx-700 border-r-2 border-sahelx-600",
              )}
              onClick={() => handleNavigation(item.href)}
            >
              <item.icon className="h-5 w-5" />
              <span className="ml-3">{item.title}</span>
            </Button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// Desktop Navigation
export function SecretaryDashboardNav() {
  const pathname = usePathname();
  const router = useRouter();

  const handleNavigation = (href: string) => {
    router.push(href);
  };

  return (
    <div className="hidden md:flex fixed left-0 top-16 bottom-0 z-40 flex-col border-r border-gray-200 bg-white px-3 py-6 w-[240px]">
      <div className="flex flex-col space-y-1">
        {navItems.map((item) => (
          <Button
            key={item.href}
            variant="ghost"
            className={cn(
              "h-10 w-full justify-start text-gray-700 hover:bg-gray-100 hover:text-gray-900 font-medium transition-all duration-200 group active:scale-[0.98]",
              pathname === item.href &&
                "bg-sahelx-50 text-sahelx-700 border-r-2 border-sahelx-600 shadow-sm shadow-sahelx-100/50",
            )}
            onClick={() => handleNavigation(item.href)}
          >
            <item.icon
              className={cn(
                "h-5 w-5 transition-transform duration-200",
                pathname === item.href
                  ? "text-sahelx-600"
                  : "text-gray-500 group-hover:scale-110",
              )}
            />
            <span className="ml-3">{item.title}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}
