"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { useIsMobile } from "@/hooks/use-mobile"
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { getDeliveries } from "@/lib/firebase/deliveries"

const chartConfig = {
  deliveries: {
    label: "Deliveries",
    color: "hsl(var(--primary))",   // SahelX red
  },
} satisfies ChartConfig

type DayData = { date: string; deliveries: number }

function buildChartData(deliveries: any[]): DayData[] {
  const counts: Record<string, number> = {}
  const today = new Date()
  // Pre-fill last 90 days with 0
  for (let i = 89; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    counts[d.toISOString().slice(0, 10)] = 0
  }
  deliveries.forEach((del) => {
    const date = del.createdAt?.toDate
      ? del.createdAt.toDate()
      : del.createdAt
      ? new Date(del.createdAt)
      : null
    if (!date) return
    const key = date.toISOString().slice(0, 10)
    if (key in counts) counts[key] = (counts[key] || 0) + 1
  })
  return Object.entries(counts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, deliveries]) => ({ date, deliveries }))
}

export function ChartAreaInteractive() {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState("30d")
  const [chartData, setChartData] = React.useState<DayData[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    if (isMobile) setTimeRange("7d")
  }, [isMobile])

  React.useEffect(() => {
    getDeliveries()
      .then((d) => setChartData(buildChartData(d)))
      .catch(() => setChartData([]))
      .finally(() => setLoading(false))
  }, [])

  const filteredData = chartData.filter((item) => {
    const date      = new Date(item.date)
    const now       = new Date()
    const days      = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90
    const startDate = new Date(now)
    startDate.setDate(startDate.getDate() - days)
    return date >= startDate
  })

  const total = filteredData.reduce((s, d) => s + d.deliveries, 0)

  return (
    <Card className="@container/card">
      <CardHeader className="relative">
        <CardTitle className="font-heading text-base font-semibold">
          Delivery Volume
        </CardTitle>
        <CardDescription>
          <span className="@[540px]/card:block hidden">
            Total deliveries over time — {total.toLocaleString()} in selected period
          </span>
          <span className="@[540px]/card:hidden">{total.toLocaleString()} deliveries</span>
        </CardDescription>
        <div className="absolute right-4 top-4">
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={(v) => v && setTimeRange(v)}
            variant="outline"
            className="@[767px]/card:flex hidden"
          >
            <ToggleGroupItem value="90d" className="h-8 px-2.5 text-xs">90 days</ToggleGroupItem>
            <ToggleGroupItem value="30d" className="h-8 px-2.5 text-xs">30 days</ToggleGroupItem>
            <ToggleGroupItem value="7d"  className="h-8 px-2.5 text-xs">7 days</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="@[767px]/card:hidden flex w-32 h-8 text-xs" aria-label="Select range">
              <SelectValue placeholder="30 days" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">90 days</SelectItem>
              <SelectItem value="30d" className="rounded-lg">30 days</SelectItem>
              <SelectItem value="7d"  className="rounded-lg">7 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {loading ? (
          <div className="h-[220px] rounded-xl skeleton" />
        ) : (
          <ChartContainer config={chartConfig} className="aspect-auto h-[220px] w-full">
            <AreaChart data={filteredData}>
              <defs>
                <linearGradient id="fillDeliveries" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="var(--color-deliveries)" stopOpacity={0.7} />
                  <stop offset="95%" stopColor="var(--color-deliveries)" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/50" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={28}
                className="text-xs"
                tickFormatter={(v) =>
                  new Date(v).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                }
              />
              <YAxis tickLine={false} axisLine={false} tickMargin={4} width={30} className="text-xs" />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(v) =>
                      new Date(v).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
                    }
                    indicator="dot"
                  />
                }
              />
              <Area
                dataKey="deliveries"
                type="natural"
                fill="url(#fillDeliveries)"
                stroke="var(--color-deliveries)"
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
