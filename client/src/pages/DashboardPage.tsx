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
  Edit,
  Trash2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { PrescriptionRequest } from "@shared/pharmacy-schema";
import { useAuth } from "@/hooks/useAuth";
import { AllergyAutocomplete } from "@/components/AllergyAutocomplete";
import platinumPillarBadge from "@assets/image_1761453800697.png";

export default function DashboardPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, refreshUser } = useAuth();
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>("loading");
  const [showDoctorSearch, setShowDoctorSearch] = useState(false);
  const [showAllergiesEdit, setShowAllergiesEdit] = useState(false);
  const [tempAllergies, setTempAllergies] = useState<string[]>([]);

  useEffect(() => {
    // ProtectedRoute handles authentication - we only check subscription here
    if (!user?.id) return;

    // Check subscription status
    fetch(`/api/subscription-status/${user.id}`)
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
  }, [user]);

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

  // Update drug allergies mutation
  const updateAllergiesMutation = useMutation({
    mutationFn: async (allergies: string[]) => {
      console.log('[DashboardPage] Updating allergies for user:', user?.id, 'allergies:', allergies);
      return apiRequest('PUT', `/api/users/${user?.id}/allergies`, { drugAllergies: allergies });
    },
    onSuccess: async () => {
      console.log('[DashboardPage] Allergies updated successfully, refreshing user data');
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/medication-analysis/side-effects', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/medication-analysis/interactions', user?.id] });
      
      // Wait for refreshUser to complete and return updated user data
      const updatedUser = await refreshUser();
      console.log('[DashboardPage] User refreshed, new allergies:', updatedUser?.drugAllergies);
      
      setShowAllergiesEdit(false);
      setTempAllergies([]);
      toast({
        title: "Allergies Updated",
        description: "Your drug allergies have been updated successfully. Clinical analyzer will reflect these changes.",
      });
    },
    onError: (error: any) => {
      console.error('[DashboardPage] Failed to update allergies:', error);
      toast({
        title: "Failed to Update Allergies",
        description: error.message || "Could not update your drug allergies",
        variant: "destructive",
      });
    },
  });

  // Open allergies edit dialog
  const openAllergiesEdit = () => {
    const currentAllergies = user?.drugAllergies || [];
    setTempAllergies([...currentAllergies]);
    setShowAllergiesEdit(true);
  };

  // Add allergy from autocomplete
  const handleAddAllergy = (allergyName: string) => {
    if (!tempAllergies.includes(allergyName)) {
      setTempAllergies([...tempAllergies, allergyName]);
    }
  };

  // Remove allergy from temp list
  const handleRemoveAllergy = (allergyToRemove: string) => {
    setTempAllergies(tempAllergies.filter(a => a !== allergyToRemove));
  };

  // Save allergies
  const saveAllergies = () => {
    if (!user?.id) {
      toast({
        title: "Session Expired",
        description: "Please log in again to update your allergies",
        variant: "destructive",
      });
      setShowAllergiesEdit(false);
      return;
    }
    updateAllergiesMutation.mutate(tempAllergies);
  };

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
    memberSince: user.createdAt 
      ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
      : "Recently",
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
      title: "My Medications",
      description: "Manage your medication list with insights",
      icon: Pill,
      href: "/my-medications",
      color: "bg-purple-50 text-purple-600"
    },
    {
      title: "Prescription Request",
      description: "Request new prescriptions from your doctor",
      icon: FileText,
      href: "/prescription-request",
      color: "bg-orange-50 text-orange-600"
    },
    {
      title: "Referrals",
      description: "Refer friends and earn free months",
      icon: User,
      href: "/referrals",
      color: "bg-pink-50 text-pink-600"
    },
    {
      title: "Browse Medications",
      description: "Search our medication database",
      icon: Package,
      href: "/medications",
      color: "bg-green-50 text-green-600"
    },
    {
      title: "Account Settings",
      description: "Update phone number and address",
      icon: Settings,
      href: "/settings",
      color: "bg-gray-50 text-gray-600"
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
                <h1 className="text-2xl font-bold text-gray-900">Pharmacy Autopilot</h1>
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
                <img src={platinumPillarBadge} alt="Pharmacy Autopilot" className="w-10 h-10 object-contain" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    $99
                  </p>
                  <p className="text-sm text-gray-600">
                    Pharmacy Autopilot Member
                  </p>
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

        {/* Subscription Tier Information */}
        <Card className="mt-8 border-2 border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <img src={platinumPillarBadge} alt="Pharmacy Autopilot" className="w-10 h-10 object-contain" />
                  Current Subscription
                  <Badge variant="default">
                    Pharmacy Autopilot Member
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Up to 12-month supply access
                </CardDescription>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">
                  $99
                  <span className="text-sm text-muted-foreground">/year</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <>
                <div className="mb-4">
                  <h4 className="font-semibold mb-3">Your Plan Benefits:</h4>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-secondary mt-0.5" />
                      <span>Up to 12-month supply</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-secondary mt-0.5" />
                      <span>$10 fulfillment per shipment</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-secondary mt-0.5" />
                      <span>Wholesale pricing</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-secondary mt-0.5" />
                      <span>Shipping at carrier rates</span>
                    </li>
                  </ul>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link href="/settings?tab=subscription" className="flex-1">
                    <Button variant="outline" className="w-full" data-testid="button-manage-subscription">
                      <Settings className="h-4 w-4 mr-2" />
                      Manage Subscription
                    </Button>
                  </Link>
                </div>
              </>
          </CardContent>
        </Card>

        {/* Current Medications */}
        <Card className="mt-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Current Medications</CardTitle>
                <CardDescription>
                  Your active medications with pharmacist insights
                </CardDescription>
              </div>
              <Link href="/my-medications">
                <Button 
                  variant="outline" 
                  size="sm"
                  data-testid="button-manage-medications"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Manage All
                </Button>
              </Link>
            </div>
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
                <Link href="/my-medications">
                  <Button variant="outline" data-testid="button-add-first-medication">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Medication
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {medications.map((med: any) => (
                  <div 
                    key={med.id} 
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/20 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900/30 transition-colors"
                    data-testid={`medication-${med.id}`}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <Pill className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 dark:text-gray-100" data-testid={`medication-name-${med.id}`}>
                          {med.medicationName} {med.strength && <span className="text-blue-600 dark:text-blue-400">{med.strength}</span>}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {med.dosage} • {med.frequency}
                        </p>
                        {med.prescribedBy && (
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            Prescribed by {med.prescribedBy}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {med.isActive && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                          Active
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm(`Are you sure you want to remove ${med.medicationName}?`)) {
                            apiRequest('DELETE', `/api/users/${user?.id}/medications/${med.id}`)
                              .then(() => {
                                queryClient.invalidateQueries({ 
                                  queryKey: [`/api/users/${user?.id}/medications`] 
                                });
                                toast({
                                  title: "Medication Removed",
                                  description: `${med.medicationName} has been removed from your list`,
                                });
                              })
                              .catch((error: any) => {
                                toast({
                                  title: "Failed to Remove Medication",
                                  description: error.message || "Could not remove medication",
                                  variant: "destructive",
                                });
                              });
                          }
                        }}
                        data-testid={`button-delete-medication-${med.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-600" />
                      </Button>
                    </div>
                  </div>
                ))}
                <div className="pt-2">
                  <Link href="/my-medications">
                    <Button variant="outline" className="w-full" data-testid="button-view-all-medications">
                      View All Medications & Insights
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </div>
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

        {/* Drug Allergies */}
        <Card className="mt-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Drug Allergies</CardTitle>
                <CardDescription>
                  Important medication allergies and adverse reactions
                </CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={openAllergiesEdit}
                data-testid="button-edit-allergies"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {!user?.drugAllergies || user.drugAllergies.length === 0 ? (
              <div className="text-center py-8">
                <Pill className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">No drug allergies on file</p>
                <Button 
                  variant="outline"
                  onClick={openAllergiesEdit}
                  data-testid="button-add-allergies"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Allergies
                </Button>
              </div>
            ) : (
              <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                    <Pill className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-red-900 dark:text-red-100 mb-2">
                      Known Allergies
                    </h4>
                    <div className="flex flex-wrap gap-2" data-testid="allergies-list">
                      {user.drugAllergies.map((allergy: string, idx: number) => (
                        <Badge 
                          key={idx} 
                          variant="destructive"
                          data-testid={`allergy-${idx}`}
                        >
                          {allergy}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Allergies Edit Modal */}
        {showAllergiesEdit && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Edit Drug Allergies</CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setShowAllergiesEdit(false);
                      setTempAllergies([]);
                    }}
                    data-testid="button-close-allergies-edit"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <CardDescription>
                  Search and add medications you're allergic to
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Search Medications
                    </label>
                    <AllergyAutocomplete
                      onSelect={handleAddAllergy}
                      existingAllergies={tempAllergies}
                      placeholder="Search for medication (e.g., Penicillin, Aspirin)"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Search for medications using OpenFDA database
                    </p>
                  </div>

                  {tempAllergies.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Current Allergies ({tempAllergies.length})
                      </label>
                      <div className="flex flex-wrap gap-2 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md">
                        {tempAllergies.map((allergy, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-1 bg-red-100 dark:bg-red-900/30 text-red-900 dark:text-red-100 px-3 py-1 rounded-md"
                            data-testid={`temp-allergy-${idx}`}
                          >
                            <span className="text-sm font-medium">{allergy}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 hover:bg-red-200 dark:hover:bg-red-800"
                              onClick={() => handleRemoveAllergy(allergy)}
                              data-testid={`button-remove-allergy-${idx}`}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setShowAllergiesEdit(false);
                        setTempAllergies([]);
                      }}
                      data-testid="button-cancel-allergies"
                    >
                      Cancel
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={saveAllergies}
                      disabled={updateAllergiesMutation.isPending}
                      data-testid="button-save-allergies"
                    >
                      {updateAllergiesMutation.isPending ? "Saving..." : "Save"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

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
                <Link href="/prescription-request">
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