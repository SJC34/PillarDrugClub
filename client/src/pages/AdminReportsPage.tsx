import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft,
  Download,
  TrendingUp,
  Users,
  DollarSign,
  FileText
} from "lucide-react";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Mock data for charts
const userGrowthData = [
  { month: 'Jan', users: 45 },
  { month: 'Feb', users: 62 },
  { month: 'Mar', users: 78 },
  { month: 'Apr', users: 95 },
  { month: 'May', users: 112 },
  { month: 'Jun', users: 138 },
];

const revenueData = [
  { month: 'Jan', revenue: 4500 },
  { month: 'Feb', revenue: 6200 },
  { month: 'Mar', revenue: 7800 },
  { month: 'Apr', revenue: 9500 },
  { month: 'May', revenue: 11200 },
  { month: 'Jun', revenue: 13800 },
];

const subscriptionData = [
  { name: 'Active', value: 138, color: '#10b981' },
  { name: 'Cancelled', value: 22, color: '#ef4444' },
  { name: 'Past Due', value: 8, color: '#f59e0b' },
];

const prescriptionStatusData = [
  { status: 'Active', count: 245 },
  { status: 'Pending', count: 42 },
  { status: 'Expired', count: 18 },
  { status: 'Transferred', count: 12 },
];

export default function AdminReportsPage() {
  const [timeRange, setTimeRange] = useState("6months");

  return (
    <div className="p-8 space-y-6" data-testid="page-admin-reports">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/dashboard">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Reports & Analytics</h1>
            <p className="text-muted-foreground">Comprehensive platform insights and data export</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]" data-testid="select-time-range">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 Days</SelectItem>
              <SelectItem value="30days">Last 30 Days</SelectItem>
              <SelectItem value="3months">Last 3 Months</SelectItem>
              <SelectItem value="6months">Last 6 Months</SelectItem>
              <SelectItem value="1year">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button data-testid="button-export-report">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold" data-testid="metric-report-revenue">
                  $53,200
                </p>
                <p className="text-xs text-green-600">+18.2% from last period</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                <p className="text-2xl font-bold" data-testid="metric-report-users">
                  138
                </p>
                <p className="text-xs text-green-600">+23.1% from last period</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Prescriptions</p>
                <p className="text-2xl font-bold" data-testid="metric-report-prescriptions">
                  317
                </p>
                <p className="text-xs text-green-600">+12.4% from last period</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <FileText className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Growth Rate</p>
                <p className="text-2xl font-bold" data-testid="metric-report-growth">
                  23.1%
                </p>
                <p className="text-xs text-green-600">Monthly average</p>
              </div>
              <div className="p-3 bg-teal-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-teal-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <Card>
          <CardHeader>
            <CardTitle>User Growth Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={userGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value: any) => `$${value}`} />
                  <Legend />
                  <Bar dataKey="revenue" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Subscription Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Subscription Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={subscriptionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {subscriptionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Prescription Status */}
        <Card>
          <CardHeader>
            <CardTitle>Prescription Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={prescriptionStatusData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="status" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle>Export Options</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-auto py-4" data-testid="button-export-users">
              <div className="flex flex-col items-center gap-2">
                <Users className="h-6 w-6" />
                <div className="text-center">
                  <p className="font-semibold">User Report</p>
                  <p className="text-xs text-muted-foreground">Export user data (CSV)</p>
                </div>
              </div>
            </Button>

            <Button variant="outline" className="h-auto py-4" data-testid="button-export-financial">
              <div className="flex flex-col items-center gap-2">
                <DollarSign className="h-6 w-6" />
                <div className="text-center">
                  <p className="font-semibold">Financial Report</p>
                  <p className="text-xs text-muted-foreground">Export revenue data (CSV)</p>
                </div>
              </div>
            </Button>

            <Button variant="outline" className="h-auto py-4" data-testid="button-export-prescriptions">
              <div className="flex flex-col items-center gap-2">
                <FileText className="h-6 w-6" />
                <div className="text-center">
                  <p className="font-semibold">Prescription Report</p>
                  <p className="text-xs text-muted-foreground">Export prescription data (CSV)</p>
                </div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
