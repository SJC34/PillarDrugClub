import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Shield, 
  FileText,
  ArrowLeft,
  Pill,
  User,
  Phone,
  Calendar,
  Clock,
  Package,
  Truck
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useLocation } from "wouter";

interface PrescriptionRequest {
  id: string;
  userId?: string;
  patientName: string;
  dateOfBirth: string;
  medicationName: string;
  dosage: string;
  quantity: string;
  doctorName: string;
  doctorPhone: string;
  doctorFax?: string;
  doctorAddress: string;
  urgency: "routine" | "urgent" | "emergency";
  specialInstructions?: string;
  status: "pending" | "sent" | "confirmed" | "cancelled";
  requestDate: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminPortalPage() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user.role !== "admin") {
      setLocation("/");
    }
  }, [setLocation]);

  const { data, isLoading } = useQuery<{ requests: PrescriptionRequest[] }>({
    queryKey: ["/api/admin/prescription-requests"],
  });

  const { data: ordersData, isLoading: ordersLoading } = useQuery<{ orders: any[] }>({
    queryKey: ["/api/orders/search"],
  });

  const { data: refillsData, isLoading: refillsLoading } = useQuery<{ refillRequests: any[] }>({
    queryKey: ["/api/admin/refill-requests"],
  });

  const requests = data?.requests || [];
  const orders = ordersData?.orders || [];
  const refillRequests = refillsData?.refillRequests || [];

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "urgent":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "emergency":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-blue-100 text-blue-800 border-blue-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800 border-green-200";
      case "sent":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "cancelled":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-teal-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="outline" size="sm" data-testid="button-back-dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Pill className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">Admin Management</h1>
                <p className="text-sm md:text-base text-muted-foreground">Manage prescription requests, orders & refills</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
          <Card>
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-teal-100 rounded-lg">
                  <FileText className="h-5 w-5 text-teal-600" />
                </div>
                <div>
                  <p className="text-xl md:text-2xl font-bold text-foreground" data-testid="stat-total-requests">{requests.length}</p>
                  <p className="text-xs md:text-sm text-muted-foreground">Total Requests</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-xl md:text-2xl font-bold text-foreground" data-testid="stat-pending">
                    {requests.filter(r => r.status === "pending").length}
                  </p>
                  <p className="text-xs md:text-sm text-muted-foreground">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Shield className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xl md:text-2xl font-bold text-foreground" data-testid="stat-confirmed">
                    {requests.filter(r => r.status === "confirmed").length}
                  </p>
                  <p className="text-xs md:text-sm text-muted-foreground">Confirmed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Calendar className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-xl md:text-2xl font-bold text-foreground" data-testid="stat-urgent">
                    {requests.filter(r => r.urgency === "urgent" || r.urgency === "emergency").length}
                  </p>
                  <p className="text-xs md:text-sm text-muted-foreground">Urgent</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="prescriptions" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="prescriptions" data-testid="tab-prescriptions">
              <FileText className="h-4 w-4 mr-2" />
              Prescription Requests
            </TabsTrigger>
            <TabsTrigger value="orders" data-testid="tab-orders">
              <Package className="h-4 w-4 mr-2" />
              Orders
            </TabsTrigger>
            <TabsTrigger value="refills" data-testid="tab-refills">
              <Pill className="h-4 w-4 mr-2" />
              Refill Requests
            </TabsTrigger>
          </TabsList>

          <TabsContent value="prescriptions">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Prescription Requests
                </CardTitle>
                <CardDescription>
                  All prescription requests submitted by patients
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="p-8 text-center text-muted-foreground">Loading requests...</div>
                ) : requests.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">No prescription requests yet</div>
                ) : (
                  <div className="space-y-4">
                    {requests.map((request) => (
                      <Card key={request.id} className="hover-elevate" data-testid={`card-request-${request.id}`}>
                        <CardContent className="p-4 md:p-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium text-muted-foreground">Patient</span>
                              </div>
                              <p className="font-semibold text-foreground">{request.patientName}</p>
                              <p className="text-sm text-muted-foreground">DOB: {request.dateOfBirth}</p>
                            </div>
                            
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <Pill className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium text-muted-foreground">Medication</span>
                              </div>
                              <p className="font-semibold text-foreground">{request.medicationName}</p>
                              <p className="text-sm text-muted-foreground">{request.dosage} - Qty: {request.quantity}</p>
                            </div>

                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium text-muted-foreground">Doctor</span>
                              </div>
                              <p className="font-semibold text-foreground">{request.doctorName}</p>
                              <p className="text-sm text-muted-foreground">{request.doctorPhone}</p>
                            </div>

                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium text-muted-foreground">Urgency</span>
                              </div>
                              <Badge className={getUrgencyColor(request.urgency)}>
                                {request.urgency}
                              </Badge>
                            </div>

                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <Shield className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium text-muted-foreground">Status</span>
                              </div>
                              <Badge className={getStatusColor(request.status)}>
                                {request.status}
                              </Badge>
                            </div>

                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium text-muted-foreground">Date</span>
                              </div>
                              <p className="font-semibold text-foreground">{request.requestDate}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Orders
                </CardTitle>
                <CardDescription>
                  All orders placed by customers
                </CardDescription>
              </CardHeader>
              <CardContent>
                {ordersLoading ? (
                  <div className="p-8 text-center text-muted-foreground">Loading orders...</div>
                ) : orders.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">No orders yet</div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <Card key={order.id} className="hover-elevate" data-testid={`card-order-${order.id}`}>
                        <CardContent className="p-4 md:p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <p className="font-semibold text-lg">Order #{order.orderNumber}</p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(order.createdAt).toLocaleDateString('en-US', {
                                  month: 'long',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </p>
                            </div>
                            <Badge variant={order.status === 'delivered' ? 'default' : 'secondary'}>
                              {order.status.replace(/_/g, ' ')}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <p className="text-sm text-muted-foreground mb-1">Items</p>
                              <p className="font-medium">{order.items?.length || 0} items</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground mb-1">Total</p>
                              <p className="font-medium">${parseFloat(order.total).toFixed(2)}</p>
                            </div>
                            <div className="flex items-end justify-end md:justify-start">
                              <Link href={`/orders/${order.id}`}>
                                <Button variant="outline" size="sm">View Details</Button>
                              </Link>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="refills">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Pill className="h-5 w-5" />
                  Refill Requests
                </CardTitle>
                <CardDescription>
                  All medication refill requests from patients
                </CardDescription>
              </CardHeader>
              <CardContent>
                {refillsLoading ? (
                  <div className="p-8 text-center text-muted-foreground">Loading refill requests...</div>
                ) : refillRequests.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">No refill requests yet</div>
                ) : (
                  <div className="space-y-4">
                    {refillRequests.map((refill: any) => (
                      <Card key={refill.id} className="hover-elevate" data-testid={`card-refill-${refill.id}`}>
                        <CardContent className="p-4 md:p-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <Pill className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium text-muted-foreground">Medication</span>
                              </div>
                              <p className="font-semibold text-foreground">{refill.medicationName}</p>
                              <p className="text-sm text-muted-foreground">{refill.dosage} - Qty: {refill.quantity}</p>
                            </div>

                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium text-muted-foreground">Requested</span>
                              </div>
                              <p className="font-semibold text-foreground">
                                {new Date(refill.requestedDate).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </p>
                              {refill.dueDate && (
                                <p className="text-sm text-muted-foreground">
                                  Due: {new Date(refill.dueDate).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                </p>
                              )}
                            </div>

                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <Shield className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium text-muted-foreground">Status & Priority</span>
                              </div>
                              <div className="flex gap-2">
                                <Badge className={
                                  refill.status === 'filled' ? 'bg-green-100 text-green-800' :
                                  refill.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                                  refill.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }>
                                  {refill.status}
                                </Badge>
                                <Badge className={getUrgencyColor(refill.priority)}>
                                  {refill.priority}
                                </Badge>
                              </div>
                            </div>

                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium text-muted-foreground">Doctor</span>
                              </div>
                              {refill.doctorName ? (
                                <>
                                  <p className="font-semibold text-foreground">{refill.doctorName}</p>
                                  {refill.doctorPhone && (
                                    <p className="text-sm text-muted-foreground">{refill.doctorPhone}</p>
                                  )}
                                </>
                              ) : (
                                <p className="text-sm text-muted-foreground">Not specified</p>
                              )}
                            </div>
                          </div>

                          {(refill.patientNotes || refill.pharmacyNotes) && (
                            <div className="mt-4 pt-4 border-t space-y-2">
                              {refill.patientNotes && (
                                <div>
                                  <p className="text-xs font-medium text-muted-foreground mb-1">Patient Notes</p>
                                  <p className="text-sm">{refill.patientNotes}</p>
                                </div>
                              )}
                              {refill.pharmacyNotes && (
                                <div>
                                  <p className="text-xs font-medium text-muted-foreground mb-1">Pharmacy Notes</p>
                                  <p className="text-sm">{refill.pharmacyNotes}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
