import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  DollarSign, 
  TrendingUp, 
  Users,
  ArrowLeft,
  Download,
  Flame,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const MEMBERSHIP_PRICE = 99;
const BURN_LS_KEY = "admin_burn_tracker_v1";

interface VendorBurn {
  name: string;
  fixed: number | null;
  amount: string;
}

const DEFAULT_VENDORS: VendorBurn[] = [
  { name: "Aptible", fixed: 499, amount: "499" },
  { name: "HushMail", fixed: 15, amount: "15" },
  { name: "LegitScript", fixed: 179, amount: "179" },
  { name: "Klaviyo", fixed: null, amount: "" },
  { name: "Twilio", fixed: null, amount: "" },
  { name: "HealthWarehouse", fixed: null, amount: "" },
  { name: "Azure", fixed: null, amount: "" },
  { name: "Retell AI", fixed: null, amount: "" },
  { name: "Dev Contractor", fixed: null, amount: "" },
];

function loadVendors(): VendorBurn[] {
  try {
    const raw = localStorage.getItem(BURN_LS_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_VENDORS;
  } catch {
    return DEFAULT_VENDORS;
  }
}

interface FinancialMetrics {
  revenueMetrics: {
    totalRevenue: string;
    monthlyRevenue: string;
    monthlyRecurringRevenue: string;
    averageOrderValue: string;
  };
  subscriptionMetrics: {
    activeSubscriptions: number;
    canceledSubscriptions: number;
    pastDueSubscriptions: number;
    totalSubscriptions: number;
    churnRate: string;
  };
  recentTransactions: Array<{
    id: string;
    orderNumber: string;
    userName: string;
    userEmail: string;
    amount: string;
    status: string;
    createdAt: string;
  }>;
  dailyRevenue: Array<{
    date: string;
    revenue: number;
  }>;
}

export default function AdminFinancialPage() {
  const { data: metrics, isLoading } = useQuery<FinancialMetrics>({
    queryKey: ["/api/admin/financial-metrics"],
  });

  const [vendors, setVendors] = useState<VendorBurn[]>(loadVendors);

  const updateVendorAmount = (idx: number, val: string) => {
    const updated = vendors.map((v, i) => (i === idx ? { ...v, amount: val } : v));
    setVendors(updated);
    localStorage.setItem(BURN_LS_KEY, JSON.stringify(updated));
  };

  const activeMembers = metrics?.subscriptionMetrics.activeSubscriptions || 0;
  const arr = activeMembers * MEMBERSHIP_PRICE;
  const monthlyRevenue = parseFloat(metrics?.revenueMetrics.monthlyRevenue || "0");

  const totalBurn = vendors.reduce((acc, v) => acc + (parseFloat(v.amount) || 0), 0);
  const runwayMonths = totalBurn > 0 ? (monthlyRevenue / totalBurn) : null;

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      delivered: "bg-green-100 text-green-800",
      shipped: "bg-blue-100 text-blue-800",
      processing: "bg-yellow-100 text-yellow-800",
      pending: "bg-gray-100 text-gray-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="flex items-center gap-4">
          <Link href="/admin/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Financial Overview</h1>
            <p className="text-muted-foreground">Loading financial data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto" data-testid="page-admin-financial">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <Link href="/admin/dashboard">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Financial Overview</h1>
            <p className="text-muted-foreground">Revenue, ARR, subscriptions, and monthly burn</p>
          </div>
        </div>
        <Button variant="outline" data-testid="button-export-report">
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Revenue Metrics — ARR replaces MRR */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold" data-testid="metric-total-revenue">
                  ${metrics?.revenueMetrics.totalRevenue || "0.00"}
                </p>
                <p className="text-xs text-muted-foreground">All time</p>
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
                <p className="text-sm font-medium text-muted-foreground">Cash Collected (Month)</p>
                <p className="text-2xl font-bold" data-testid="metric-monthly-revenue">
                  ${metrics?.revenueMetrics.monthlyRevenue || "0.00"}
                </p>
                <p className="text-xs text-muted-foreground">Actual payments this month</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">ARR</p>
                <p className="text-2xl font-bold" data-testid="metric-arr">
                  ${arr.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">
                  {activeMembers} members × ${MEMBERSHIP_PRICE}/yr
                </p>
              </div>
              <div className="p-3 bg-teal-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-teal-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Avg Order Value</p>
                <p className="text-2xl font-bold" data-testid="metric-aov">
                  ${metrics?.revenueMetrics.averageOrderValue || "0.00"}
                </p>
                <p className="text-xs text-muted-foreground">Per transaction</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subscription Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Subscription Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="text-center p-4 border rounded-md">
              <Users className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <p className="text-2xl font-bold" data-testid="metric-active-subs">
                {metrics?.subscriptionMetrics.activeSubscriptions || 0}
              </p>
              <p className="text-sm text-muted-foreground">Active</p>
            </div>
            <div className="text-center p-4 border rounded-md">
              <Users className="h-8 w-8 mx-auto mb-2 text-gray-600" />
              <p className="text-2xl font-bold" data-testid="metric-total-subs">
                {metrics?.subscriptionMetrics.totalSubscriptions || 0}
              </p>
              <p className="text-sm text-muted-foreground">Total</p>
            </div>
            <div className="text-center p-4 border rounded-md">
              <Users className="h-8 w-8 mx-auto mb-2 text-red-600" />
              <p className="text-2xl font-bold" data-testid="metric-canceled-subs">
                {metrics?.subscriptionMetrics.canceledSubscriptions || 0}
              </p>
              <p className="text-sm text-muted-foreground">Cancelled</p>
            </div>
            <div className="text-center p-4 border rounded-md">
              <Users className="h-8 w-8 mx-auto mb-2 text-orange-600" />
              <p className="text-2xl font-bold" data-testid="metric-pastdue-subs">
                {metrics?.subscriptionMetrics.pastDueSubscriptions || 0}
              </p>
              <p className="text-sm text-muted-foreground">Past Due</p>
            </div>
            <div className="text-center p-4 border rounded-md">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 text-purple-600" />
              <p className="text-2xl font-bold" data-testid="metric-churn-rate">
                {metrics?.subscriptionMetrics.churnRate || "0.0"}%
              </p>
              <p className="text-sm text-muted-foreground">Churn Rate</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Revenue Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Trend (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            {metrics?.dailyRevenue && metrics.dailyRevenue.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metrics.dailyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return `${date.getMonth() + 1}/${date.getDate()}`;
                    }}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: any) => `$${parseFloat(value).toFixed(2)}`}
                    labelFormatter={(label) => new Date(label).toLocaleDateString()}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#2bb8b0" 
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No revenue data available
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Monthly Burn Tracker */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500" />
            Monthly Burn Tracker
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendor</TableHead>
                <TableHead>Monthly Cost ($)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vendors.map((vendor, idx) => (
                <TableRow key={vendor.name} data-testid={`row-burn-${idx}`}>
                  <TableCell className="font-medium">{vendor.name}</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      placeholder={vendor.fixed !== null ? String(vendor.fixed) : "Variable"}
                      value={vendor.amount}
                      onChange={(e) => updateVendorAmount(idx, e.target.value)}
                      data-testid={`input-burn-${vendor.name.toLowerCase().replace(/\s+/g, "-")}`}
                      className="w-36"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Separator />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-muted/40 rounded-lg text-center">
              <Label className="text-xs text-muted-foreground">Total Monthly Burn</Label>
              <p className="text-2xl font-bold mt-1" data-testid="metric-total-burn">
                ${totalBurn.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="p-4 bg-muted/40 rounded-lg text-center">
              <Label className="text-xs text-muted-foreground">Cash Collected This Month</Label>
              <p className="text-2xl font-bold mt-1">
                ${monthlyRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className={`p-4 rounded-lg text-center ${runwayMonths !== null && runwayMonths < 3 ? "bg-red-100 dark:bg-red-900/20" : "bg-green-100 dark:bg-green-900/20"}`}>
              <Label className="text-xs text-muted-foreground">Revenue / Burn Ratio</Label>
              <p className="text-2xl font-bold mt-1" data-testid="metric-burn-ratio">
                {runwayMonths !== null ? `${runwayMonths.toFixed(1)}x` : "—"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {runwayMonths !== null && runwayMonths < 1 ? "Cash-flow negative" : ""}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {metrics?.recentTransactions && metrics.recentTransactions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order Number</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {metrics.recentTransactions.map((transaction) => (
                  <TableRow key={transaction.id} data-testid={`transaction-${transaction.id}`}>
                    <TableCell className="font-medium">{transaction.orderNumber}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{transaction.userName}</p>
                        <p className="text-sm text-muted-foreground">{transaction.userEmail}</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">
                      ${parseFloat(transaction.amount).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(transaction.status)}>
                        {transaction.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(transaction.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No transactions yet
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
