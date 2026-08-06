"use client"

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { CalendarDays, X } from "lucide-react"
import { cn } from "@/lib/utils"
import type { DateRangeState } from "@/lib/finance/types"

interface DateRangeFilterProps {
  value: DateRangeState
  onChange: (range: DateRangeState) => void
  align?: "start" | "end" | "center"
  className?: string
}

export function DateRangeFilter({
  value,
  onChange,
  align = "end",
  className,
}: DateRangeFilterProps) {
  const hasFilter = value.startDate || value.endDate
  const clear = () => onChange({ startDate: "", endDate: "" })

  const label = hasFilter
    ? [value.startDate || "Start", "→", value.endDate || "End"].join(" ")
    : "Date Range"

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-8 gap-1.5 shadow-sm text-xs font-normal",
            hasFilter && "border-primary/60 text-primary",
            className
          )}
        >
          <CalendarDays className="h-3.5 w-3.5 shrink-0" />
          <span className="hidden sm:inline">{label}</span>
          <span className="sm:hidden">{hasFilter ? "Filtered" : "Dates"}</span>
          {hasFilter && (
            <span
              role="button"
              aria-label="Clear date filter"
              className="ml-0.5 rounded-sm hover:text-destructive"
              onClick={(e) => { e.stopPropagation(); clear() }}
            >
              <X className="h-3 w-3" />
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-64" align={align}>
        <div className="space-y-3">
          <p className="text-xs font-semibold text-foreground">Filter by Date Range</p>

          <div className="space-y-2">
            <div>
              <Label htmlFor="df-start" className="text-xs text-muted-foreground">From</Label>
              <Input
                id="df-start"
                type="date"
                className="h-8 mt-1 text-xs"
                value={value.startDate}
                max={value.endDate || undefined}
                onChange={(e) => onChange({ ...value, startDate: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="df-end" className="text-xs text-muted-foreground">To</Label>
              <Input
                id="df-end"
                type="date"
                className="h-8 mt-1 text-xs"
                value={value.endDate}
                min={value.startDate || undefined}
                onChange={(e) => onChange({ ...value, endDate: e.target.value })}
              />
            </div>
          </div>

          <Button
            variant="secondary"
            size="sm"
            className="w-full"
            onClick={clear}
            disabled={!hasFilter}
          >
            Clear Filter
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
