import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  FileText, 
  Package, 
  Pill, 
  DollarSign,
  TrendingUp,
  AlertCircle,
  Clock,
  CheckCircle,
  Activity,
  Settings,
  BarChart3,
  Mail,
  Upload,
  Gift,
  PenTool
} from "lucide-react";
import { Link } from "wouter";

interface DashboardMetrics {
  userMetrics: {
    totalUsers: number;
    newUsersThisWeek: number;
    activeUsers: number;
    usersByTier: { basic: number; plus: number };
  };
  prescriptionMetrics: {
    totalActivePrescriptions: number;
    prescriptionsNeedingRefill: number;
    pendingPrescriptionRequests: number;
    prescriptionsByStatus: Record<string, number>;
  };
  orderMetrics: {
    totalOrders: number;
    ordersThisMonth: number;
    ordersByStatus: Record<string, number>;
    revenueEstimate: string;
  };
  refillMetrics: {
    totalRefillRequests: number;
    pendingRefills: number;
    urgentRefills: number;
    refillsApprovedToday: number;
  };
  recentActivity: {
    recentPrescriptionRequests: Array<{
      id: string;
      patientName: string;
      medicationName: string;
      urgency: string;
      requestDate: string;
    }>;
    recentRefillRequests: Array<{
      id: string;
      patientName: string;
      medicationName: string;
      priority: string;
      requestedDate: string;
    }>;
    recentOrders: Array<{
      id: string;
      orderNumber: string;
      status: string;
      total: string;
      createdAt: string;
    }>;
  };
}

export default function AdminDashboardPage() {
  const { data, isLoading } = useQuery<DashboardMetrics>({
    queryKey: ["/api/admin/dashboard-metrics"],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-teal-100 p-4 md:p-6 flex items-center justify-center">
        <div className="text-center">
          <Activity className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const metrics = data;
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-teal-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Executive Dashboard</h1>
          <p className="text-muted-foreground">Real-time overview of your pharmacy operations</p>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Users */}
          <Link href="/admin/users">
            <Card className="hover-elevate cursor-pointer transition-all">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                    <p className="text-2xl font-bold" data-testid="metric-total-users">
                      {metrics?.userMetrics.totalUsers || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      +{metrics?.userMetrics.newUsersThisWeek || 0} this week
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Active Prescriptions */}
          <Card className="hover-elevate">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Active Prescriptions</p>
                  <p className="text-2xl font-bold" data-testid="metric-active-prescriptions">
                    {metrics?.prescriptionMetrics.totalActivePrescriptions || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {metrics?.prescriptionMetrics.prescriptionsNeedingRefill || 0} need refill
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <FileText className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Monthly Orders */}
          <Card className="hover-elevate">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Orders This Month</p>
                  <p className="text-2xl font-bold" data-testid="metric-monthly-orders">
                    {metrics?.orderMetrics.ordersThisMonth || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {metrics?.orderMetrics.totalOrders || 0} total
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <Package className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Revenue */}
          <Link href="/admin/financial">
            <Card className="hover-elevate cursor-pointer transition-all">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Revenue (Est.)</p>
                    <p className="text-2xl font-bold" data-testid="metric-revenue">
                      ${parseFloat(metrics?.orderMetrics.revenueEstimate || "0").toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">From orders</p>
                  </div>
                  <div className="p-3 bg-teal-100 rounded-lg">
                    <DollarSign className="h-6 w-6 text-teal-700 dark:text-teal-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Alerts & Action Items */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/admin-portal">
            <Card className="hover-elevate cursor-pointer transition-all" data-testid="card-pending-prescriptions">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">
                      {metrics?.prescriptionMetrics.pendingPrescriptionRequests || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">Pending Prescriptions</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin-portal">
            <Card className="hover-elevate cursor-pointer transition-all" data-testid="card-urgent-refills">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Clock className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">
                      {metrics?.refillMetrics.urgentRefills || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">Urgent Refills</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Card className="hover-elevate" data-testid="card-approved-refills">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {metrics?.refillMetrics.refillsApprovedToday || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Refills Approved Today</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions - Admin Tools */}
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-4">Admin Tools</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link href="/admin/users">
              <Card className="hover-elevate cursor-pointer transition-all" data-testid="card-user-management">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <Settings className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">User Management</p>
                      <p className="text-sm text-muted-foreground">Manage accounts & roles</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/financial">
              <Card className="hover-elevate cursor-pointer transition-all" data-testid="card-financial-dashboard">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-green-100 rounded-lg">
                      <DollarSign className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Financial Dashboard</p>
                      <p className="text-sm text-muted-foreground">Revenue & transactions</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/communications">
              <Card className="hover-elevate cursor-pointer transition-all" data-testid="card-communications">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <Mail className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Communication Center</p>
                      <p className="text-sm text-muted-foreground">Email & SMS messages</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/reports">
              <Card className="hover-elevate cursor-pointer transition-all" data-testid="card-reports">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-orange-100 rounded-lg">
                      <BarChart3 className="h-6 w-6 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Reports & Analytics</p>
                      <p className="text-sm text-muted-foreground">Data insights & exports</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/pricing">
              <Card className="hover-elevate cursor-pointer transition-all border-2 border-primary/20" data-testid="card-pricing-management">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-teal-100 rounded-lg">
                      <Upload className="h-6 w-6 text-teal-700 dark:text-teal-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Medication Pricing</p>
                      <p className="text-sm text-muted-foreground">Bulk CSV price updates</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/referrals">
              <Card className="hover-elevate cursor-pointer transition-all" data-testid="card-referral-monitoring">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-pink-100 rounded-lg">
                      <Gift className="h-6 w-6 text-pink-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Referral Monitoring</p>
                      <p className="text-sm text-muted-foreground">Track codes & fraud detection</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/blog">
              <Card className="hover-elevate cursor-pointer transition-all border-2 border-indigo-200" data-testid="card-blog-management">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-100 rounded-lg">
                      <PenTool className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Blog Manager</p>
                      <p className="text-sm text-muted-foreground">Create and manage blog posts</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

          </div>
        </div>

        {/* Membership Distribution */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Membership Distribution
              </CardTitle>
              <CardDescription>User breakdown by subscription tier</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg">
                  <div>
                    <p className="font-semibold text-foreground">Pharmacy Autopilot Membership ($99/yr)</p>
                    <p className="text-sm text-muted-foreground">Up to 12-month supply</p>
                  </div>
                  <p className="text-2xl font-bold text-primary" data-testid="metric-total-members">
                    {(metrics?.userMetrics.usersByTier.basic || 0) + (metrics?.userMetrics.usersByTier.plus || 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Pill className="h-5 w-5" />
                Refill Overview
              </CardTitle>
              <CardDescription>Current refill request status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Requests</span>
                  <span className="font-semibold" data-testid="metric-total-refills">
                    {metrics?.refillMetrics.totalRefillRequests || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Pending</span>
                  <Badge variant="secondary" data-testid="metric-pending-refills">
                    {metrics?.refillMetrics.pendingRefills || 0}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Urgent/Emergency</span>
                  <Badge className="bg-orange-100 text-orange-800" data-testid="metric-urgent-refills-badge">
                    {metrics?.refillMetrics.urgentRefills || 0}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Approved Today</span>
                  <Badge className="bg-green-100 text-green-800">
                    {metrics?.refillMetrics.refillsApprovedToday || 0}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest prescription requests, refills, and orders</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Recent Prescription Requests */}
              <div>
                <h3 className="font-semibold mb-3 text-foreground">Recent Prescription Requests</h3>
                {metrics?.recentActivity.recentPrescriptionRequests.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No recent prescription requests</p>
                ) : (
                  <div className="space-y-2">
                    {metrics?.recentActivity.recentPrescriptionRequests.slice(0, 5).map((request) => (
                      <div key={request.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover-elevate" data-testid={`activity-prescription-${request.id}`}>
                        <div className="flex-1">
                          <p className="font-medium text-sm text-foreground">{request.patientName}</p>
                          <p className="text-xs text-muted-foreground">{request.medicationName}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={
                            request.urgency === 'emergency' ? 'bg-red-100 text-red-800' :
                            request.urgency === 'urgent' ? 'bg-orange-100 text-orange-800' :
                            'bg-blue-100 text-blue-800'
                          }>
                            {request.urgency}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(request.requestDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Refill Requests */}
              <div>
                <h3 className="font-semibold mb-3 text-foreground">Recent Refill Requests</h3>
                {metrics?.recentActivity.recentRefillRequests.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No recent refill requests</p>
                ) : (
                  <div className="space-y-2">
                    {metrics?.recentActivity.recentRefillRequests.slice(0, 5).map((refill) => (
                      <div key={refill.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover-elevate" data-testid={`activity-refill-${refill.id}`}>
                        <div className="flex-1">
                          <p className="font-medium text-sm text-foreground">{refill.patientName}</p>
                          <p className="text-xs text-muted-foreground">{refill.medicationName}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={
                            refill.priority === 'emergency' ? 'bg-red-100 text-red-800' :
                            refill.priority === 'urgent' ? 'bg-orange-100 text-orange-800' :
                            'bg-blue-100 text-blue-800'
                          }>
                            {refill.priority}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(refill.requestedDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Orders */}
              <div>
                <h3 className="font-semibold mb-3 text-foreground">Recent Orders</h3>
                {metrics?.recentActivity.recentOrders.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No recent orders</p>
                ) : (
                  <div className="space-y-2">
                    {metrics?.recentActivity.recentOrders.slice(0, 5).map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover-elevate" data-testid={`activity-order-${order.id}`}>
                        <div className="flex-1">
                          <p className="font-medium text-sm text-foreground">Order #{order.orderNumber}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={order.status === 'delivered' ? 'default' : 'secondary'}>
                            {order.status}
                          </Badge>
                          <span className="font-semibold text-sm text-foreground">
                            ${parseFloat(order.total).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
