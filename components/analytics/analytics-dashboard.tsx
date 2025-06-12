"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts"

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

export function AnalyticsDashboard() {
  // Mock data for charts
  const deliveryData = [
    { name: "Mon", deliveries: 45, revenue: 112500 },
    { name: "Tue", deliveries: 52, revenue: 130000 },
    { name: "Wed", deliveries: 38, revenue: 95000 },
    { name: "Thu", deliveries: 61, revenue: 152500 },
    { name: "Fri", deliveries: 73, revenue: 182500 },
    { name: "Sat", deliveries: 89, revenue: 222500 },
    { name: "Sun", deliveries: 67, revenue: 167500 },
  ]

  const riderPerformance = [
    { name: "John Rider", deliveries: 45, rating: 4.8 },
    { name: "Jane Smith", deliveries: 38, rating: 4.9 },
    { name: "Mike Johnson", deliveries: 42, rating: 4.7 },
    { name: "Sarah Wilson", deliveries: 35, rating: 4.6 },
    { name: "David Brown", deliveries: 40, rating: 4.8 },
  ]

  const statusDistribution = [
    { name: "Completed", value: 245, color: "#00C49F" },
    { name: "In Transit", value: 23, color: "#0088FE" },
    { name: "Pending", value: 12, color: "#FFBB28" },
    { name: "Cancelled", value: 8, color: "#FF8042" },
  ]

  return (
    <Tabs defaultValue="deliveries" className="space-y-6">
      <TabsList>
        <TabsTrigger value="deliveries">Delivery Analytics</TabsTrigger>
        <TabsTrigger value="riders">Rider Performance</TabsTrigger>
        <TabsTrigger value="revenue">Revenue Insights</TabsTrigger>
        <TabsTrigger value="customers">Customer Analytics</TabsTrigger>
      </TabsList>

      <TabsContent value="deliveries" className="space-y-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Delivery Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={deliveryData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="deliveries" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Delivery Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="riders" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Riders</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={riderPerformance} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="deliveries" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="revenue" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={deliveryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => [`₦${Number(value).toLocaleString()}`, "Revenue"]} />
                <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="customers" className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Total Customers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">1,247</div>
              <p className="text-sm text-muted-foreground">+12% from last month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Active Customers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">892</div>
              <p className="text-sm text-muted-foreground">71.5% of total</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Avg. Orders per Customer</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">3.2</div>
              <p className="text-sm text-muted-foreground">+0.3 from last month</p>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </Tabs>
  )
}
