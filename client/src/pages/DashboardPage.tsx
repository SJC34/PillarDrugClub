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
  ArrowRight,
  Download,
  MessageSquare,
  Plus,
  X,
  Edit
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { PrescriptionRequest } from "@shared/pharmacy-schema";

export default function DashboardPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>("loading");
  const [showDoctorSearch, setShowDoctorSearch] = useState(false);

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

  // Fetch user's prescription requests
  const { 
    data: prescriptionRequestsData, 
    isLoading: loadingRequests,
    isError: requestsError,
    error: requestsErrorDetails
  } = useQuery<{ requests: PrescriptionRequest[] }>({
    queryKey: ['/api/prescription-requests/user', user?.id],
    enabled: !!user?.id,
  });

  const prescriptionRequests: PrescriptionRequest[] = prescriptionRequestsData?.requests || [];

  // Fetch user's primary doctor
  const { 
    data: primaryDoctorData,
    isLoading: loadingDoctor
  } = useQuery<{ doctor: any }>({
    queryKey: [`/api/users/${user?.id}/primary-doctor`],
    enabled: !!user?.id,
  });

  const primaryDoctor = primaryDoctorData?.doctor;

  // Fetch user's current medications
  const { 
    data: medicationsData,
    isLoading: loadingMedications
  } = useQuery<{ medications: any[] }>({
    queryKey: [`/api/users/${user?.id}/medications`],
    enabled: !!user?.id,
  });

  const medications = medicationsData?.medications || [];

  // Text PDF to phone mutation
  const textPdfMutation = useMutation({
    mutationFn: async (requestId: string) => {
      return apiRequest('POST', `/api/prescription-requests/${requestId}/text`);
    },
    onSuccess: () => {
      // Invalidate prescription requests cache to refresh UI
      queryClient.invalidateQueries({ 
        queryKey: ['/api/prescription-requests/user', user?.id] 
      });
      
      toast({
        title: "SMS Sent",
        description: "Prescription request PDF link sent to your phone",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Send SMS",
        description: error.message || "Could not send SMS to your phone",
        variant: "destructive",
      });
    },
  });

  // Update primary doctor mutation
  const updateDoctorMutation = useMutation({
    mutationFn: async (doctorData: any) => {
      return apiRequest('PUT', `/api/users/${user?.id}/primary-doctor`, doctorData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: [`/api/users/${user?.id}/primary-doctor`] 
      });
      setShowDoctorSearch(false);
      toast({
        title: "Doctor Updated",
        description: "Your primary care physician has been updated",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Update Doctor",
        description: error.message || "Could not update your primary doctor",
        variant: "destructive",
      });
    },
  });

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

        {/* Current Medications */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Current Medications</CardTitle>
            <CardDescription>
              Your active prescriptions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingMedications ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading medications...</p>
              </div>
            ) : medications.length === 0 ? (
              <div className="text-center py-8">
                <Pill className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">No active medications on file</p>
                <Link href="/prescription-transfer">
                  <Button variant="outline" data-testid="button-add-medication">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Medication
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {medications.map((med: any, idx: number) => (
                  <div 
                    key={idx} 
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    data-testid={`medication-${idx}`}
                  >
                    <div className="flex items-center gap-3">
                      <Pill className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium text-gray-900">{med.name}</p>
                        <p className="text-sm text-gray-600">{med.dosage} - {med.refills} refills remaining</p>
                      </div>
                    </div>
                    <Badge variant="secondary">{med.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Current Doctor/Provider */}
        <Card className="mt-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Primary Care Physician</CardTitle>
                <CardDescription>
                  Your current doctor or healthcare provider
                </CardDescription>
              </div>
              {primaryDoctor && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowDoctorSearch(true)}
                  data-testid="button-change-doctor"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Change Doctor
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loadingDoctor ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading doctor information...</p>
              </div>
            ) : !primaryDoctor ? (
              <div className="text-center py-8">
                <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">No primary care physician on file</p>
                <Button 
                  variant="outline"
                  onClick={() => setShowDoctorSearch(true)}
                  data-testid="button-add-doctor"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Doctor
                </Button>
              </div>
            ) : (
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <User className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1" data-testid="text-doctor-name">
                      {primaryDoctor.name}
                    </h4>
                    {primaryDoctor.npi && (
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">NPI:</span> {primaryDoctor.npi}
                      </p>
                    )}
                    {primaryDoctor.phone && (
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">Phone:</span> {primaryDoctor.phone}
                      </p>
                    )}
                    {primaryDoctor.address && (
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Address:</span>{" "}
                        {typeof primaryDoctor.address === 'string' 
                          ? primaryDoctor.address 
                          : `${primaryDoctor.address.street}, ${primaryDoctor.address.city}, ${primaryDoctor.address.state} ${primaryDoctor.address.zipCode}`
                        }
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Doctor Search Modal */}
        {showDoctorSearch && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Search for Doctor</CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowDoctorSearch(false)}
                    data-testid="button-close-search"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <CardDescription>
                  Search for your primary care physician
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center py-8 text-gray-600">
                    <p className="mb-4">Doctor search functionality coming soon.</p>
                    <p className="text-sm text-gray-500">
                      For now, you can add doctor information during prescription requests.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setShowDoctorSearch(false)}
                    data-testid="button-cancel-search"
                  >
                    Close
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Prescription Requests */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Prescription Requests</CardTitle>
            <CardDescription>
              Your prescription request forms
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingRequests ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading prescription requests...</p>
              </div>
            ) : requestsError ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-red-400 mx-auto mb-4" />
                <p className="text-red-600 font-medium mb-2">Failed to load prescription requests</p>
                <p className="text-gray-600 text-sm mb-4">
                  {requestsErrorDetails?.message || "Please try again later"}
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => queryClient.invalidateQueries({ 
                    queryKey: ['/api/prescription-requests/user', user?.id] 
                  })}
                  data-testid="button-retry-requests"
                >
                  Retry
                </Button>
              </div>
            ) : prescriptionRequests.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">No prescription requests yet</p>
                <Link href="/prescription-transfer">
                  <Button variant="outline" data-testid="button-create-request">
                    Create Request
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {prescriptionRequests.map((request: PrescriptionRequest) => (
                  <Card key={request.id} className="hover:shadow-md transition-shadow" data-testid={`card-request-${request.id}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <FileText className="h-5 w-5 text-blue-600" />
                            <h4 className="font-semibold text-gray-900" data-testid={`text-medication-${request.id}`}>
                              {request.medicationName}
                            </h4>
                            <Badge 
                              variant={request.status === 'sent' ? 'default' : 'secondary'}
                              data-testid={`badge-status-${request.id}`}
                            >
                              {request.status}
                            </Badge>
                          </div>
                          <div className="space-y-1 text-sm text-gray-600">
                            <p data-testid={`text-dosage-${request.id}`}>
                              <span className="font-medium">Dosage:</span> {request.dosage}
                            </p>
                            <p data-testid={`text-quantity-${request.id}`}>
                              <span className="font-medium">Quantity:</span> {request.quantity}
                            </p>
                            <p data-testid={`text-doctor-${request.id}`}>
                              <span className="font-medium">Doctor:</span> {request.doctorName}
                            </p>
                            <p data-testid={`text-date-${request.id}`}>
                              <span className="font-medium">Request Date:</span>{" "}
                              {new Date(request.requestDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                            data-testid={`button-download-${request.id}`}
                          >
                            <a
                              href={`/api/prescription-requests/${request.id}/pdf`}
                              download
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </a>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => textPdfMutation.mutate(request.id)}
                            disabled={textPdfMutation.isPending}
                            data-testid={`button-text-${request.id}`}
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            {textPdfMutation.isPending ? "Sending..." : "Text"}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}