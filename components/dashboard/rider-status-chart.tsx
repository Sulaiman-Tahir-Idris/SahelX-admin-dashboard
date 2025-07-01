"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function RiderStatusChart() {
  // Mock data for preview - replace with Firebase calls later
  const data = [
    { name: "Available", value: 15, color: "#22c55e" },
    { name: "On Delivery", value: 8, color: "#3b82f6" },
    { name: "Offline", value: 5, color: "#ef4444" },
    { name: "On Break", value: 3, color: "#a855f7" },
  ]

  const total = data.reduce((sum, item) => sum + item.value, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rider Status</CardTitle>
      </CardHeader>
      <CardContent className="h-[300px]">
        <div className="flex h-full items-center justify-center">
          <div className="space-y-4 w-full">
            {data.map((item, index) => {
              const percentage = ((item.value / total) * 100).toFixed(0)
              return (
                <div key={item.name} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                      {item.name}
                    </span>
                    <span>
                      {item.value} riders ({percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all duration-300"
                      style={{
                        backgroundColor: item.color,
                        width: `${percentage}%`,
                      }}
                    ></div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
