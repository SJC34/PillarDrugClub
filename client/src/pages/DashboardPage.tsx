import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calculator, 
  Pill, 
  Package,
  User,
  CreditCard,
  Settings,
  TrendingDown,
  Clock,
  CheckCircle,
  FileText,
  ArrowRight
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function DashboardPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>("loading");

  useEffect(() => {
    // Check if user is logged in
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      toast({
        title: "Authentication Required",
        description: "Please log in to access your dashboard.",
        variant: "destructive",
      });
      setLocation("/login");
      return;
    }

    const userData = JSON.parse(userStr);
    setUser(userData);

    // Check subscription status
    fetch(`/api/subscription-status/${userData.id}`)
      .then(res => res.json())
      .then(data => {
        setSubscriptionStatus(data.subscriptionStatus);
        if (!data.hasAccess) {
          toast({
            title: "Subscription Required",
            description: "Please complete your subscription to access member features.",
            variant: "destructive",
          });
          setLocation("/subscribe");
        }
      })
      .catch(error => {
        console.error("Error checking subscription:", error);
        setSubscriptionStatus("error");
      });
  }, []);

  if (!user || subscriptionStatus === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Mock data - in real app this would come from API
  const memberData = {
    name: `${user.firstName} ${user.lastName}`,
    memberSince: new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" }),
    subscriptionStatus: subscriptionStatus === "active" ? "Active" : "Pending",
    totalSavings: 247.50,
    activePrescriptions: 3,
    ordersThisMonth: 2
  };

  const recentActivity = [
    {
      type: "calculation",
      description: "Cost calculation for Lisinopril 10mg",
      savings: 23.40,
      time: "2 hours ago"
    },
    {
      type: "order",
      description: "Order #1247 shipped",
      medication: "Metformin 30-day supply",
      time: "1 day ago"
    },
    {
      type: "calculation",
      description: "Cost calculation for Atorvastatin 20mg",
      savings: 45.20,
      time: "3 days ago"
    }
  ];

  const quickActions = [
    {
      title: "Cost Calculator",
      description: "Compare medication costs",
      icon: Calculator,
      href: "/cost-calculator",
      color: "bg-blue-50 text-blue-600"
    },
    {
      title: "Prescription Transfer",
      description: "Transfer prescriptions or request new ones",
      icon: FileText,
      href: "/prescription-transfer",
      color: "bg-orange-50 text-orange-600"
    },
    {
      title: "Browse Medications",
      description: "Search our medication database",
      icon: Pill,
      href: "/medications",
      color: "bg-green-50 text-green-600"
    },
    {
      title: "Order History",
      description: "View past orders",
      icon: Package,
      href: "/orders",
      color: "bg-purple-50 text-purple-600"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Pill className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Pillar Drug Club</h1>
                <p className="text-sm text-gray-600">Member Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="text-green-600 border-green-200">
                <CheckCircle className="h-3 w-3 mr-1" />
                {memberData.subscriptionStatus}
              </Badge>
              <Button variant="outline" size="sm">
                <User className="h-4 w-4 mr-2" />
                {memberData.name}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {memberData.name}
          </h2>
          <p className="text-gray-600">
            Member since {memberData.memberSince} • Access to wholesale prescription pricing
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingDown className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    ${memberData.totalSavings}
                  </p>
                  <p className="text-sm text-gray-600">Total Savings</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Pill className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {memberData.activePrescriptions}
                  </p>
                  <p className="text-sm text-gray-600">Active Prescriptions</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Package className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {memberData.ordersThisMonth}
                  </p>
                  <p className="text-sm text-gray-600">Orders This Month</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <CreditCard className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">$10</p>
                  <p className="text-sm text-gray-600">Monthly Membership</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Common tasks and features
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {quickActions.map((action) => {
                    const Icon = action.icon;
                    return (
                      <Link key={action.title} href={action.href}>
                        <Card className="hover:shadow-md transition-shadow cursor-pointer">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${action.color}`}>
                                <Icon className="h-5 w-5" />
                              </div>
                              <div>
                                <h4 className="font-medium text-gray-900">
                                  {action.title}
                                </h4>
                                <p className="text-sm text-gray-600">
                                  {action.description}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Your latest actions and savings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity, idx) => {
                  const icon = activity.type === 'calculation' ? Calculator : Package;
                  const IconComponent = icon;
                  
                  return (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="p-2 bg-blue-100 rounded-lg mt-0.5">
                        <IconComponent className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm">
                          {activity.description}
                        </p>
                        {activity.medication && (
                          <p className="text-sm text-gray-600">
                            {activity.medication}
                          </p>
                        )}
                        {activity.savings && (
                          <p className="text-sm text-green-600 font-medium">
                            Saved ${activity.savings}
                          </p>
                        )}
                        <div className="flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3 text-gray-400" />
                          <span className="text-xs text-gray-500">
                            {activity.time}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <Button variant="outline" className="w-full mt-4">
                View All Activity
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Membership Info */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Membership Information</CardTitle>
            <CardDescription>
              Manage your subscription and billing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Current Plan</h4>
                <p className="text-lg font-semibold text-blue-600">
                  Pillar Club Membership
                </p>
                <p className="text-sm text-gray-600">$10/month</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Next Billing Date</h4>
                <p className="text-gray-900">March 15, 2024</p>
                <p className="text-sm text-gray-600">Auto-renewal enabled</p>
              </div>
              <div className="flex items-end">
                <Button variant="outline">
                  Manage Subscription
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}