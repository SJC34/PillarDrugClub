import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  DollarSign, 
  BarChart3, 
  Target,
  Phone,
  Mail,
  TrendingUp,
  ArrowLeft
} from "lucide-react";

export default function BrokerPortalPage() {
  const features = [
    {
      title: "Client Management",
      description: "Manage your client portfolio and track their healthcare needs",
      icon: Users,
      color: "bg-green-50 border-green-200",
      iconColor: "text-green-600",
      href: "/broker/clients"
    },
    {
      title: "Commission Tracking",
      description: "Monitor your earnings and commission structure",
      icon: DollarSign,
      color: "bg-blue-50 border-blue-200",
      iconColor: "text-blue-600",
      href: "/broker/commissions"
    },
    {
      title: "Performance Reports",
      description: "Analyze your sales performance and client satisfaction",
      icon: BarChart3,
      color: "bg-purple-50 border-purple-200",
      iconColor: "text-purple-600",
      href: "/broker/reports"
    },
    {
      title: "Lead Generation",
      description: "Find and convert new prospects into clients",
      icon: Target,
      color: "bg-orange-50 border-orange-200",
      iconColor: "text-orange-600",
      href: "/broker/leads"
    },
    {
      title: "Client Communications",
      description: "Stay in touch with clients through secure messaging",
      icon: Mail,
      color: "bg-cyan-50 border-cyan-200",
      iconColor: "text-cyan-600",
      href: "/broker/communications"
    },
    {
      title: "Market Analytics",
      description: "Understand market trends and opportunities",
      icon: TrendingUp,
      color: "bg-emerald-50 border-emerald-200",
      iconColor: "text-emerald-600",
      href: "/broker/analytics"
    }
  ];

  const recentClients = [
    { name: "Sarah Johnson", plan: "Family Plan", status: "Active", lastContact: "2 days ago" },
    { name: "Mike Chen", plan: "Individual", status: "Pending", lastContact: "1 week ago" },
    { name: "Lisa Rodriguez", plan: "Senior Plan", status: "Active", lastContact: "3 days ago" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 p-6">
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
            <h1 className="text-3xl font-bold text-gray-900">Broker Portal</h1>
            <p className="text-gray-600">Manage your client relationships and grow your business</p>
          </div>
        </div>

        {/* Performance Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Users className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">247</p>
                  <p className="text-sm text-gray-600">Active Clients</p>
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
                  <p className="text-2xl font-bold text-gray-900">$12,450</p>
                  <p className="text-sm text-gray-600">Monthly Commission</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Target className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">15</p>
                  <p className="text-sm text-gray-600">New Leads</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">18%</p>
                  <p className="text-sm text-gray-600">Growth Rate</p>
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

          {/* Recent Clients */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Client Activity</CardTitle>
              <CardDescription>Your latest client interactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentClients.map((client, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 font-semibold text-sm">
                        {client.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{client.name}</p>
                      <p className="text-sm text-gray-600">{client.plan}</p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                        client.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {client.status}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">{client.lastContact}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-4">
                View All Clients
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button variant="outline" className="p-6 h-auto flex flex-col gap-2">
                <Phone className="h-6 w-6 text-green-600" />
                <span>Schedule Client Call</span>
              </Button>
              <Button variant="outline" className="p-6 h-auto flex flex-col gap-2">
                <Mail className="h-6 w-6 text-blue-600" />
                <span>Send Newsletter</span>
              </Button>
              <Button variant="outline" className="p-6 h-auto flex flex-col gap-2">
                <Target className="h-6 w-6 text-purple-600" />
                <span>Add New Lead</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}