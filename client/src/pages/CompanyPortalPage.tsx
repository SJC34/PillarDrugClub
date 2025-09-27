import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Building2, 
  Users, 
  DollarSign, 
  FileText,
  Shield,
  BarChart3,
  Settings,
  ArrowLeft
} from "lucide-react";

export default function CompanyPortalPage() {
  const features = [
    {
      title: "Employee Benefits",
      description: "Manage prescription benefits for your workforce",
      icon: Users,
      color: "bg-purple-50 border-purple-200",
      iconColor: "text-purple-600",
      href: "/company/benefits"
    },
    {
      title: "Utilization Reports",
      description: "Track prescription usage and identify trends",
      icon: BarChart3,
      color: "bg-blue-50 border-blue-200", 
      iconColor: "text-blue-600",
      href: "/company/utilization"
    },
    {
      title: "Cost Management",
      description: "Monitor and optimize prescription spending",
      icon: DollarSign,
      color: "bg-green-50 border-green-200",
      iconColor: "text-green-600",
      href: "/company/costs"
    },
    {
      title: "Policy Administration",
      description: "Configure benefit policies and approval workflows",
      icon: Shield,
      color: "bg-orange-50 border-orange-200",
      iconColor: "text-orange-600",
      href: "/company/policies"
    },
    {
      title: "Employee Directory",
      description: "Manage employee enrollment and eligibility",
      icon: Building2,
      color: "bg-cyan-50 border-cyan-200",
      iconColor: "text-cyan-600",
      href: "/company/employees"
    },
    {
      title: "Plan Configuration",
      description: "Set up and modify benefit plan structures",
      icon: Settings,
      color: "bg-emerald-50 border-emerald-200",
      iconColor: "text-emerald-600",
      href: "/company/plans"
    }
  ];

  const employeeStats = [
    { department: "Engineering", employees: 45, enrolled: 42, utilization: "78%" },
    { department: "Sales", employees: 32, enrolled: 28, utilization: "65%" },
    { department: "Marketing", employees: 18, enrolled: 16, utilization: "72%" },
    { department: "Operations", employees: 25, enrolled: 23, utilization: "81%" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 p-6">
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
            <h1 className="text-3xl font-bold text-gray-900">Company Portal</h1>
            <p className="text-gray-600">Manage employee medication benefits and costs</p>
          </div>
        </div>

        {/* Company Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Users className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">120</p>
                  <p className="text-sm text-gray-600">Total Employees</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Shield className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">109</p>
                  <p className="text-sm text-gray-600">Enrolled Members</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <DollarSign className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">$18,250</p>
                  <p className="text-sm text-gray-600">Monthly Spend</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">74%</p>
                  <p className="text-sm text-gray-600">Utilization Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Feature Grid */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
          </div>

          {/* Department Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Department Overview</CardTitle>
              <CardDescription>Enrollment and utilization by department</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {employeeStats.map((dept, idx) => (
                  <div key={idx} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium text-gray-900">{dept.department}</h4>
                      <span className="text-sm font-semibold text-purple-600">{dept.utilization}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="block">Total: {dept.employees}</span>
                        <span className="block">Enrolled: {dept.enrolled}</span>
                      </div>
                      <div className="text-right">
                        <span className="block">{((dept.enrolled / dept.employees) * 100).toFixed(0)}% enrolled</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Recent Plan Activity</CardTitle>
            <CardDescription>Latest changes and updates to your benefit plans</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Policy update: Generic substitution preference</p>
                  <p className="text-sm text-gray-600">Updated automatic generic substitution to "always prefer" for cost savings</p>
                </div>
                <span className="text-sm text-gray-500">2 hours ago</span>
              </div>
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Users className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">New employee enrollment</p>
                  <p className="text-sm text-gray-600">3 new employees from Marketing department added to plan</p>
                </div>
                <span className="text-sm text-gray-500">1 day ago</span>
              </div>
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <DollarSign className="h-4 w-4 text-orange-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Monthly cost report generated</p>
                  <p className="text-sm text-gray-600">February spending: $18,250 • 8% under budget</p>
                </div>
                <span className="text-sm text-gray-500">3 days ago</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}