import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  PenTool,
  HeartPulse,
  Headphones,
  AlertTriangle,
} from "lucide-react";
import { Link } from "wouter";

const MEMBERSHIP_PRICE = 99;
const LTV = 446;
const CAC_RED = 110;
const CAC_YELLOW = 94.5;
const CAC_LTV_RATIO_THRESHOLD = 4.4;
const CHURN_YELLOW_PCT = 3;

const CAC_LS_KEY = "admin_dashboard_cac_v1";
const CHURN_LS_KEY = "admin_dashboard_churn_v1";
const NEW_MEMBERS_LS_KEY = "admin_dashboard_new_members_month_v1";

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

function loadNumber(key: string, def: string): string {
  try {
    return localStorage.getItem(key) || def;
  } catch {
    return def;
  }
}

export default function AdminDashboardPage() {
  const { data, isLoading } = useQuery<DashboardMetrics>({
    queryKey: ["/api/admin/dashboard-metrics"],
  });

  const [cac, setCac] = useState<string>(() => loadNumber(CAC_LS_KEY, ""));
  const [churnedMembers, setChurnedMembers] = useState<string>(() => loadNumber(CHURN_LS_KEY, ""));
  const [newMembersMonth, setNewMembersMonth] = useState<string>(() => loadNumber(NEW_MEMBERS_LS_KEY, ""));

  const saveCac = (val: string) => {
    setCac(val);
    localStorage.setItem(CAC_LS_KEY, val);
  };
  const saveChurn = (val: string) => {
    setChurnedMembers(val);
    localStorage.setItem(CHURN_LS_KEY, val);
  };
  const saveNewMembers = (val: string) => {
    setNewMembersMonth(val);
    localStorage.setItem(NEW_MEMBERS_LS_KEY, val);
  };

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
  const activeMembers = (metrics?.userMetrics.usersByTier.basic || 0) + (metrics?.userMetrics.usersByTier.plus || 0);
  const arr = activeMembers * MEMBERSHIP_PRICE;
  const newMembersThisMonth = parseFloat(newMembersMonth) || 0;
  const newArrThisMonth = newMembersThisMonth * MEMBERSHIP_PRICE;

  const churnedCount = parseFloat(churnedMembers) || 0;
  const churnedArr = churnedCount * MEMBERSHIP_PRICE;
  const churnPct = activeMembers > 0 ? (churnedCount / activeMembers) * 100 : 0;

  const cacNum = parseFloat(cac);
  const cacIsRed = !isNaN(cacNum) && cacNum > CAC_RED;
  const cacIsYellow = !isNaN(cacNum) && cacNum >= CAC_YELLOW && cacNum <= CAC_RED;
  const ltvCacRatio = !isNaN(cacNum) && cacNum > 0 ? LTV / cacNum : null;
  const ltvCacIsRed = ltvCacRatio !== null && ltvCacRatio < CAC_LTV_RATIO_THRESHOLD;

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-teal-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Executive Dashboard</h1>
          <p className="text-muted-foreground">Real-time overview of your pharmacy operations</p>
        </div>

        {/* ARR & Business KPIs */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-3">Business KPIs</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Row 1 */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Total Active Members</p>
                    <p className="text-2xl font-bold" data-testid="metric-active-members">
                      {activeMembers.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">Paying members</p>
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
                    <p className="text-sm font-medium text-muted-foreground">ARR</p>
                    <p className="text-2xl font-bold" data-testid="metric-arr">
                      ${arr.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {activeMembers} × ${MEMBERSHIP_PRICE}/yr
                    </p>
                  </div>
                  <div className="p-3 bg-teal-100 rounded-lg">
                    <DollarSign className="h-6 w-6 text-teal-700" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={ltvCacIsRed ? "border-red-400" : ""}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">LTV:CAC</p>
                    <p className={`text-2xl font-bold ${ltvCacIsRed ? "text-red-600" : "text-foreground"}`} data-testid="metric-ltv-cac">
                      {ltvCacRatio !== null ? `${ltvCacRatio.toFixed(1)}x` : "—"}
                    </p>
                    <div className="flex items-center gap-1">
                      <p className="text-xs text-muted-foreground">
                        LTV $446 ÷ CAC {!isNaN(cacNum) ? `$${cacNum}` : "?"}
                      </p>
                      {ltvCacIsRed && <AlertTriangle className="h-3 w-3 text-red-500" />}
                    </div>
                  </div>
                  <div className={`p-3 rounded-lg ${ltvCacIsRed ? "bg-red-100" : "bg-purple-100"}`}>
                    <BarChart3 className={`h-6 w-6 ${ltvCacIsRed ? "text-red-600" : "text-purple-600"}`} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Row 2 */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">New Members This Month</p>
                    <p className="text-2xl font-bold text-green-700" data-testid="metric-new-members-month">
                      {newMembersThisMonth.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">Manual input below</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">New ARR This Month</p>
                    <p className="text-2xl font-bold text-green-700" data-testid="metric-new-arr">
                      ${newArrThisMonth.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {newMembersThisMonth} new × ${MEMBERSHIP_PRICE}
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-lg">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={churnPct > CHURN_YELLOW_PCT ? "border-yellow-400" : ""}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Churned Members This Month</p>
                    <p className="text-2xl font-bold text-red-600" data-testid="metric-churned-members">
                      {churnedCount.toLocaleString()}
                    </p>
                    <div className="flex items-center gap-1">
                      <p className="text-xs text-muted-foreground">
                        {churnPct.toFixed(1)}% of active
                      </p>
                      {churnPct > CHURN_YELLOW_PCT && (
                        <AlertTriangle className="h-3 w-3 text-yellow-500" />
                      )}
                    </div>
                  </div>
                  <div className="p-3 bg-red-100 rounded-lg">
                    <Users className="h-6 w-6 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Churned ARR supplementary */}
          <div className="mt-4 p-4 border rounded-lg flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Churned ARR This Month</p>
              <p className="text-xl font-bold text-red-600" data-testid="metric-churned-arr">
                ${churnedArr.toLocaleString()}
              </p>
            </div>
            <p className="text-xs text-muted-foreground">{churnedCount} members × ${MEMBERSHIP_PRICE}</p>
          </div>
        </div>

        {/* CAC + Churn Inputs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Manual Inputs</CardTitle>
            <CardDescription>Enter CAC and churn to power the KPI cards above</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="space-y-2">
                <Label htmlFor="new-members-month-input">New Members This Month</Label>
                <Input
                  id="new-members-month-input"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  value={newMembersMonth}
                  onChange={(e) => saveNewMembers(e.target.value)}
                  data-testid="input-new-members-month"
                />
                <p className="text-xs text-muted-foreground">Drives New ARR This Month calculation</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cac-input" className="flex items-center gap-2">
                  CAC (Customer Acquisition Cost)
                  {cacIsRed && <Badge className="bg-red-100 text-red-800 text-xs">Above $110 — Red flag</Badge>}
                  {cacIsYellow && !cacIsRed && <Badge className="bg-yellow-100 text-yellow-800 text-xs">$94.50–$110</Badge>}
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    id="cac-input"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="0"
                    value={cac}
                    onChange={(e) => saveCac(e.target.value)}
                    data-testid="input-cac"
                    className={`pl-7 ${cacIsRed ? "border-red-400 focus-visible:ring-red-400" : cacIsYellow ? "border-yellow-400 focus-visible:ring-yellow-400" : ""}`}
                  />
                </div>
                <p className="text-xs text-muted-foreground">Green &lt; $94.50 · Yellow $94.50–$110 · Red &gt; $110</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="churn-input" className="flex items-center gap-2">
                  Churned Members This Month
                  {churnPct > CHURN_YELLOW_PCT && (
                    <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                      {churnPct.toFixed(1)}% — Above 3%
                    </Badge>
                  )}
                </Label>
                <Input
                  id="churn-input"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  value={churnedMembers}
                  onChange={(e) => saveChurn(e.target.value)}
                  data-testid="input-churned-members"
                  className={churnPct > CHURN_YELLOW_PCT ? "border-yellow-400 focus-visible:ring-yellow-400" : ""}
                />
                <p className="text-xs text-muted-foreground">Yellow flag if monthly churn &gt; 3%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Operational Key Metrics Grid */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-3">Operational Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/admin/users">
              <Card className="hover-elevate cursor-pointer transition-all">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Total Members</p>
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

        {/* Admin Tools */}
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
                      <p className="text-sm text-muted-foreground">ARR, burn & transactions</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/marketing">
              <Card className="hover-elevate cursor-pointer transition-all" data-testid="card-marketing-dashboard">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-orange-100 rounded-lg">
                      <BarChart3 className="h-6 w-6 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Marketing Dashboard</p>
                      <p className="text-sm text-muted-foreground">Channels, SEO & email</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/fulfillment">
              <Card className="hover-elevate cursor-pointer transition-all" data-testid="card-fulfillment-dashboard">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-teal-100 rounded-lg">
                      <HeartPulse className="h-6 w-6 text-teal-700" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Fulfillment Dashboard</p>
                      <p className="text-sm text-muted-foreground">HW costs & fill rates</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/cs">
              <Card className="hover-elevate cursor-pointer transition-all" data-testid="card-cs-dashboard">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-100 rounded-lg">
                      <Headphones className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">CS Dashboard</p>
                      <p className="text-sm text-muted-foreground">Retell AI, chatbot & CSAT</p>
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
              <Card className="hover-elevate cursor-pointer transition-all" data-testid="card-pricing-management">
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
              <Card className="hover-elevate cursor-pointer transition-all" data-testid="card-blog-management">
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

        {/* Membership Distribution + Refill Overview */}
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
                    {activeMembers}
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
                      <div key={request.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover-elevate" data-testid={`activity-prescription-${request.id}`}>
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
                      <div key={refill.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover-elevate" data-testid={`activity-refill-${refill.id}`}>
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
                      <div key={order.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover-elevate" data-testid={`activity-order-${order.id}`}>
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
