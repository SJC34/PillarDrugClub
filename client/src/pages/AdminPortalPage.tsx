import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Shield, 
  Users, 
  BarChart3, 
  Settings,
  Database,
  AlertTriangle,
  Lock,
  ArrowLeft,
  Activity,
  FileText
} from "lucide-react";

export default function AdminPortalPage() {
  const features = [
    {
      title: "User Management",
      description: "Manage user accounts across all portals and roles",
      icon: Users,
      color: "bg-orange-50 border-orange-200",
      iconColor: "text-orange-600",
      href: "/admin/users"
    },
    {
      title: "System Analytics",
      description: "Monitor platform performance and usage statistics",
      icon: BarChart3,
      color: "bg-blue-50 border-blue-200",
      iconColor: "text-blue-600",
      href: "/admin/analytics"
    },
    {
      title: "HIPAA Compliance",
      description: "Ensure data privacy and regulatory compliance",
      icon: Lock,
      color: "bg-red-50 border-red-200",
      iconColor: "text-red-600",
      href: "/admin/compliance"
    },
    {
      title: "Platform Monitoring",
      description: "Real-time system health and performance monitoring",
      icon: Activity,
      color: "bg-green-50 border-green-200",
      iconColor: "text-green-600",
      href: "/admin/monitoring"
    },
    {
      title: "Database Management",
      description: "Manage medication data, backups, and migrations",
      icon: Database,
      color: "bg-purple-50 border-purple-200",
      iconColor: "text-purple-600",
      href: "/admin/database"
    },
    {
      title: "System Configuration",
      description: "Configure platform settings and integrations",
      icon: Settings,
      color: "bg-cyan-50 border-cyan-200",
      iconColor: "text-cyan-600",
      href: "/admin/settings"
    }
  ];

  const systemAlerts = [
    { type: "warning", message: "High memory usage on server cluster", time: "5 min ago", priority: "Medium" },
    { type: "info", message: "Scheduled maintenance window this weekend", time: "2 hours ago", priority: "Low" },
    { type: "error", message: "Failed API call to HealthWarehouse", time: "30 min ago", priority: "High" }
  ];

  const recentActivity = [
    { action: "User login", user: "Dr. Sarah Johnson", details: "Client Portal", time: "2 min ago" },
    { action: "Prescription uploaded", user: "Mike Chen", details: "Order #1247", time: "15 min ago" },
    { action: "Payment processed", user: "Lisa Rodriguez", details: "$127.50", time: "22 min ago" },
    { action: "New user registration", user: "James Wilson", details: "Company Portal", time: "1 hour ago" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/">
            <Button variant="outline" size="sm" data-testid="button-back">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Portals
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Portal</h1>
            <p className="text-gray-600">System administration and platform management</p>
          </div>
        </div>

        {/* System Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Users className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">1,247</p>
                  <p className="text-sm text-gray-600">Total Users</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Activity className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">99.9%</p>
                  <p className="text-sm text-gray-600">System Uptime</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Database className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">3,258</p>
                  <p className="text-sm text-gray-600">Medications</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Shield className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">Compliant</p>
                  <p className="text-sm text-gray-600">HIPAA Status</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Feature Grid */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <Card 
                    key={feature.title}
                    className={`${feature.color} transition-all duration-200 hover:shadow-lg hover:scale-[1.02]`}
                    data-testid={`card-feature-${feature.title.toLowerCase().replace(/\\s+/g, '-')}`}
                  >
                    <CardHeader className="pb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg bg-white ${feature.iconColor}`}>
                          <Icon className="h-6 w-6" />
                        </div>
                        <CardTitle className="text-lg text-gray-900">
                          {feature.title}
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-gray-600 mb-4">
                        {feature.description}
                      </CardDescription>
                      <Button className="w-full" data-testid={`button-${feature.title.toLowerCase().replace(/\\s+/g, '-')}`}>
                        Open {feature.title}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent System Activity</CardTitle>
                <CardDescription>Latest user actions and system events</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentActivity.map((activity, idx) => (
                    <div key={idx} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Activity className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{activity.action}</p>
                        <p className="text-sm text-gray-600">{activity.user} • {activity.details}</p>
                      </div>
                      <span className="text-sm text-gray-500">{activity.time}</span>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="w-full mt-4">
                  View Full Activity Log
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* System Alerts */}
          <Card>
            <CardHeader>
              <CardTitle>System Alerts</CardTitle>
              <CardDescription>Critical notifications and warnings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {systemAlerts.map((alert, idx) => {
                  const alertIcon = alert.type === 'error' ? AlertTriangle : 
                                   alert.type === 'warning' ? AlertTriangle : FileText;
                  const alertColor = alert.type === 'error' ? 'text-red-600 bg-red-100' :
                                    alert.type === 'warning' ? 'text-yellow-600 bg-yellow-100' :
                                    'text-blue-600 bg-blue-100';
                  const priorityColor = alert.priority === 'High' ? 'bg-red-100 text-red-700' :
                                       alert.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                                       'bg-green-100 text-green-700';
                  
                  return (
                    <div key={idx} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${alertColor}`}>
                          <alertIcon className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{alert.message}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`text-xs px-2 py-1 rounded-full ${priorityColor}`}>
                              {alert.priority} Priority
                            </span>
                            <span className="text-sm text-gray-500">{alert.time}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <Button variant="outline" className="w-full mt-4">
                View All Alerts
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}