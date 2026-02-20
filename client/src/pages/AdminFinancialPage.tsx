import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  DollarSign, 
  TrendingUp, 
  CreditCard, 
  Users,
  ArrowLeft,
  Download
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
  // Fetch financial metrics
  const { data: metrics, isLoading } = useQuery<FinancialMetrics>({
    queryKey: ["/api/admin/financial-metrics"],
  });

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
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Link href="/admin/dashboard">
              <Button variant="ghost" size="icon" data-testid="button-back">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Financial Overview</h1>
              <p className="text-muted-foreground">Loading financial data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6" data-testid="page-admin-financial">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/dashboard">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Financial Overview</h1>
            <p className="text-muted-foreground">Track revenue, subscriptions, and transactions</p>
          </div>
        </div>
        <Button variant="outline" data-testid="button-export-report">
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Revenue Metrics */}
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
                <p className="text-sm font-medium text-muted-foreground">Monthly Revenue</p>
                <p className="text-2xl font-bold" data-testid="metric-monthly-revenue">
                  ${metrics?.revenueMetrics.monthlyRevenue || "0.00"}
                </p>
                <p className="text-xs text-muted-foreground">This month</p>
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
                <p className="text-sm font-medium text-muted-foreground">MRR</p>
                <p className="text-2xl font-bold" data-testid="metric-mrr">
                  ${metrics?.revenueMetrics.monthlyRecurringRevenue || "0.00"}
                </p>
                <p className="text-xs text-muted-foreground">Monthly recurring</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <CreditCard className="h-6 w-6 text-purple-600" />
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
              <div className="p-3 bg-teal-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-teal-700 dark:text-teal-400" />
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
            <div className="text-center p-4 border rounded-lg">
              <Users className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <p className="text-2xl font-bold" data-testid="metric-active-subs">
                {metrics?.subscriptionMetrics.activeSubscriptions || 0}
              </p>
              <p className="text-sm text-muted-foreground">Active</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <Users className="h-8 w-8 mx-auto mb-2 text-gray-600" />
              <p className="text-2xl font-bold" data-testid="metric-total-subs">
                {metrics?.subscriptionMetrics.totalSubscriptions || 0}
              </p>
              <p className="text-sm text-muted-foreground">Total</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <Users className="h-8 w-8 mx-auto mb-2 text-red-600" />
              <p className="text-2xl font-bold" data-testid="metric-canceled-subs">
                {metrics?.subscriptionMetrics.canceledSubscriptions || 0}
              </p>
              <p className="text-sm text-muted-foreground">Cancelled</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <Users className="h-8 w-8 mx-auto mb-2 text-orange-600" />
              <p className="text-2xl font-bold" data-testid="metric-pastdue-subs">
                {metrics?.subscriptionMetrics.pastDueSubscriptions || 0}
              </p>
              <p className="text-sm text-muted-foreground">Past Due</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
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
                    labelFormatter={(label) => {
                      const date = new Date(label);
                      return date.toLocaleDateString();
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#8884d8" 
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
