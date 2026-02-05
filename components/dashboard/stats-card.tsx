"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  isActive?: boolean;
  onClick?: () => void;
  className?: string;
  color?: "red" | "blue" | "green" | "purple" | "amber" | "gray";
}

const colorMaps = {
  red: "text-red-600 bg-red-50 border-red-100",
  blue: "text-blue-600 bg-blue-50 border-blue-100",
  green: "text-green-600 bg-green-50 border-green-100",
  purple: "text-purple-600 bg-purple-50 border-purple-100",
  amber: "text-amber-600 bg-amber-50 border-amber-100",
  gray: "text-gray-600 bg-gray-50 border-gray-100",
};

const activeMaps = {
  red: "ring-2 ring-red-500 bg-red-50/50",
  blue: "ring-2 ring-blue-500 bg-blue-50/50",
  green: "ring-2 ring-green-500 bg-green-50/50",
  purple: "ring-2 ring-purple-500 bg-purple-50/50",
  amber: "ring-2 ring-amber-500 bg-amber-50/50",
  gray: "ring-2 ring-gray-500 bg-gray-50/50",
};

export function StatsCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  isActive,
  onClick,
  className,
  color = "gray",
}: StatsCardProps) {
  return (
    <Card
      className={cn(
        "transition-all duration-200 cursor-pointer overflow-hidden group",
        onClick
          ? "hover:translate-y-[-2px] hover:shadow-md active:translate-y-0"
          : "",
        isActive ? activeMaps[color] : "hover:border-gray-300",
        className,
      )}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
              {title}
            </p>
            <div className="flex items-baseline gap-2">
              <h2 className="text-3xl font-bold tracking-tight">{value}</h2>
              {trend && (
                <span
                  className={cn(
                    "text-xs font-medium",
                    trend.isPositive ? "text-green-600" : "text-red-600",
                  )}
                >
                  {trend.isPositive ? "+" : "-"}
                  {Math.abs(trend.value)}%
                </span>
              )}
            </div>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">
                {description}
              </p>
            )}
          </div>
          <div
            className={cn(
              "p-3 rounded-2xl border transition-transform group-hover:scale-110 duration-300",
              colorMaps[color],
            )}
          >
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
