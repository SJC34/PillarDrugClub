import { Link, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Building2, 
  Shield, 
  UserCheck,
  Stethoscope,
  FileText,
  CreditCard,
  BarChart3
} from "lucide-react";

export default function PortalNav() {
  const [location] = useLocation();

  const portals = [
    {
      id: "client",
      title: "Client Portal",
      description: "Access your prescriptions, find doctors, and manage your healthcare",
      icon: Users,
      color: "bg-blue-50 border-blue-200 hover:bg-blue-100",
      iconColor: "text-blue-600",
      features: ["Cost Calculator", "Doctor Finder", "Prescription Upload", "Order History"],
      path: "/client"
    },
    {
      id: "broker",
      title: "Broker Portal", 
      description: "Manage client relationships and track commissions",
      icon: UserCheck,
      color: "bg-green-50 border-green-200 hover:bg-green-100",
      iconColor: "text-green-600",
      features: ["Client Management", "Commission Tracking", "Reports", "Lead Generation"],
      path: "/broker"
    },
    {
      id: "company",
      title: "Company Portal",
      description: "Employer medication benefits and employee management",
      icon: Building2,
      color: "bg-purple-50 border-purple-200 hover:bg-purple-100", 
      iconColor: "text-purple-600",
      features: ["Employee Benefits", "Utilization Reports", "Cost Management", "Policy Administration"],
      path: "/company"
    },
    {
      id: "admin",
      title: "Admin Portal",
      description: "System administration, analytics, and user management",
      icon: Shield,
      color: "bg-orange-50 border-orange-200 hover:bg-orange-100",
      iconColor: "text-orange-600", 
      features: ["User Management", "System Analytics", "HIPAA Compliance", "Platform Monitoring"],
      path: "/admin"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Pharmacy Autopilot
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Transparent wholesale prescription pricing with no insurance requirements. 
            Choose your portal to access specialized features for your role.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {portals.map((portal) => {
            const Icon = portal.icon;
            return (
              <Card 
                key={portal.id} 
                className={`${portal.color} transition-all duration-200 hover:shadow-lg hover:scale-[1.02]`}
                data-testid={`card-portal-${portal.id}`}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg bg-white ${portal.iconColor}`}>
                      <Icon className="h-8 w-8" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl text-gray-900">
                        {portal.title}
                      </CardTitle>
                      <CardDescription className="text-gray-600 mt-1">
                        {portal.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-2">Key Features:</h4>
                      <ul className="grid grid-cols-2 gap-2">
                        {portal.features.map((feature, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <Link href={portal.path}>
                      <Button 
                        className="w-full"
                        size="lg"
                        data-testid={`button-enter-${portal.id}`}
                      >
                        Enter {portal.title}
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-16 text-center">
          <div className="max-w-4xl mx-auto bg-white rounded-lg p-8 shadow-sm border">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Comprehensive Pharmacy Platform
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
              <div className="text-center">
                <Stethoscope className="h-12 w-12 text-blue-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-800">Doctor Network</h3>
                <p className="text-sm text-gray-600">Find qualified physicians in your area</p>
              </div>
              <div className="text-center">
                <FileText className="h-12 w-12 text-green-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-800">Prescription Upload</h3>
                <p className="text-sm text-gray-600">Easy prescription submission process</p>
              </div>
              <div className="text-center">
                <CreditCard className="h-12 w-12 text-purple-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-800">Transparent Pricing</h3>
                <p className="text-sm text-gray-600">Wholesale pricing with no hidden fees</p>
              </div>
              <div className="text-center">
                <BarChart3 className="h-12 w-12 text-orange-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-800">Cost Analytics</h3>
                <p className="text-sm text-gray-600">Compare real medication costs</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}