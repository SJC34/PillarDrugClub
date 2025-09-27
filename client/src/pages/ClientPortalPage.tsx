import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Calculator, 
  MapPin, 
  Upload, 
  Package,
  FileText,
  CreditCard,
  User,
  ArrowLeft
} from "lucide-react";

export default function ClientPortalPage() {
  const features = [
    {
      title: "Cost Calculator",
      description: "Calculate real medication costs using wholesale pricing data",
      icon: Calculator,
      color: "bg-blue-50 border-blue-200",
      iconColor: "text-blue-600",
      href: "/calculator",
      available: true
    },
    {
      title: "Doctor Finder",
      description: "Find qualified physicians and specialists in your area",
      icon: MapPin,
      color: "bg-green-50 border-green-200",
      iconColor: "text-green-600",
      href: "/client/doctors",
      available: false
    },
    {
      title: "Prescription Upload",
      description: "Upload and manage your prescriptions securely",
      icon: Upload,
      color: "bg-purple-50 border-purple-200",
      iconColor: "text-purple-600",
      href: "/client/prescriptions",
      available: false
    },
    {
      title: "Order History",
      description: "Track your medication orders and delivery status",
      icon: Package,
      color: "bg-orange-50 border-orange-200",
      iconColor: "text-orange-600",
      href: "/client/orders",
      available: false
    },
    {
      title: "Medical Records",
      description: "Access and manage your medical information",
      icon: FileText,
      color: "bg-cyan-50 border-cyan-200",
      iconColor: "text-cyan-600",
      href: "/client/records",
      available: false
    },
    {
      title: "Billing & Payments",
      description: "Manage payment methods and view billing history",
      icon: CreditCard,
      color: "bg-emerald-50 border-emerald-200", 
      iconColor: "text-emerald-600",
      href: "/client/billing",
      available: false
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-6">
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
            <h1 className="text-3xl font-bold text-gray-900">Client Portal</h1>
            <p className="text-gray-600">Manage your healthcare and prescriptions</p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">3</p>
                  <p className="text-sm text-gray-600">Active Prescriptions</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Package className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">2</p>
                  <p className="text-sm text-gray-600">Orders This Month</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <CreditCard className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">$247</p>
                  <p className="text-sm text-gray-600">Total Savings</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <MapPin className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">5</p>
                  <p className="text-sm text-gray-600">Nearby Doctors</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card 
                key={feature.title}
                className={`${feature.color} transition-all duration-200 hover:shadow-lg ${
                  feature.available ? 'hover:scale-[1.02]' : 'opacity-75'
                }`}
                data-testid={`card-feature-${feature.title.toLowerCase().replace(/\\s+/g, '-')}`}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-white ${feature.iconColor}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-gray-900">
                        {feature.title}
                        {!feature.available && (
                          <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                            Coming Soon
                          </span>
                        )}
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 mb-4">
                    {feature.description}
                  </CardDescription>
                  {feature.available ? (
                    <Link href={feature.href}>
                      <Button className="w-full" data-testid={`button-${feature.title.toLowerCase().replace(/\\s+/g, '-')}`}>
                        Open {feature.title}
                      </Button>
                    </Link>
                  ) : (
                    <Button disabled className="w-full">
                      Coming Soon
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Recent Activity */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest healthcare interactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Calculator className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Cost calculation for Lisinopril</p>
                  <p className="text-sm text-gray-600">Compared 3 options • Saved $45.20</p>
                </div>
                <span className="text-sm text-gray-500">2 hours ago</span>
              </div>
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Package className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Order #1234 shipped</p>
                  <p className="text-sm text-gray-600">Metformin 30-day supply • Tracking: 1Z999AA1234567890</p>
                </div>
                <span className="text-sm text-gray-500">1 day ago</span>
              </div>
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Upload className="h-4 w-4 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Prescription uploaded</p>
                  <p className="text-sm text-gray-600">Dr. Smith • Atorvastatin 20mg</p>
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