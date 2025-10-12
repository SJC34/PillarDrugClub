import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Pill, 
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Package
} from "lucide-react";

export default function RefillHistoryPage() {
  // Get current user from session
  const { data: userData } = useQuery({
    queryKey: ["/api/auth/me"],
  });

  const user = userData?.user;

  // Get user's refill requests
  const { data: refillsData, isLoading } = useQuery({
    queryKey: ["/api/users", user?.id, "refill-requests"],
    enabled: !!user?.id,
  });

  const refillRequests = refillsData?.refillRequests || [];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
      case "filled":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "rejected":
      case "cancelled":
        return <XCircle className="h-5 w-5 text-destructive" />;
      case "pending":
        return <Clock className="h-5 w-5 text-orange-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: any = {
      pending: "bg-orange-500 text-white",
      approved: "bg-blue-500 text-white",
      filled: "bg-green-500 text-white",
      rejected: "bg-destructive text-destructive-foreground",
      cancelled: "bg-muted text-muted-foreground",
    };
    return variants[status] || "bg-muted";
  };

  const getPriorityBadge = (priority: string) => {
    const variants: any = {
      routine: "bg-muted text-muted-foreground",
      urgent: "bg-orange-500 text-white",
      emergency: "bg-destructive text-destructive-foreground",
    };
    return variants[priority] || "bg-muted";
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Please sign in to view your refill history</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Refill History</h1>
          <p className="text-muted-foreground">
            View all your medication refill requests and their current status
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Refill Requests
            </CardTitle>
            <CardDescription>
              All refill requests sorted by most recent
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground">Loading...</div>
            ) : refillRequests.length === 0 ? (
              <div className="p-8 text-center">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No refill requests yet</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Visit the Refills page to request medication refills
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {refillRequests.map((refill: any) => (
                  <Card key={refill.id} className="hover-elevate" data-testid={`card-refill-${refill.id}`}>
                    <CardContent className="p-4 md:p-6">
                      <div className="space-y-4">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 flex-1">
                            {getStatusIcon(refill.status)}
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg">{refill.medicationName}</h3>
                              <p className="text-sm text-muted-foreground">
                                {refill.dosage} - Qty: {refill.quantity}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Badge className={getStatusBadge(refill.status)} data-testid={`badge-status-${refill.id}`}>
                              {refill.status}
                            </Badge>
                            <Badge className={getPriorityBadge(refill.priority)} data-testid={`badge-priority-${refill.id}`}>
                              {refill.priority}
                            </Badge>
                          </div>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-muted-foreground">Requested</p>
                              <p className="font-medium">
                                {new Date(refill.requestedDate).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </p>
                            </div>
                          </div>

                          {refill.dueDate && (
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="text-muted-foreground">Due Date</p>
                                <p className="font-medium">
                                  {new Date(refill.dueDate).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                </p>
                              </div>
                            </div>
                          )}

                          {refill.filledDate && (
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <div>
                                <p className="text-muted-foreground">Filled</p>
                                <p className="font-medium">
                                  {new Date(refill.filledDate).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                </p>
                              </div>
                            </div>
                          )}

                          {refill.approvedDate && !refill.filledDate && (
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-blue-500" />
                              <div>
                                <p className="text-muted-foreground">Approved</p>
                                <p className="font-medium">
                                  {new Date(refill.approvedDate).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Notes */}
                        {(refill.patientNotes || refill.pharmacyNotes) && (
                          <div className="space-y-2 border-t pt-3">
                            {refill.patientNotes && (
                              <div>
                                <p className="text-xs font-medium text-muted-foreground mb-1">Your Notes</p>
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

                        {/* Doctor Info */}
                        {refill.doctorName && (
                          <div className="border-t pt-3">
                            <div className="flex items-center gap-2 text-sm">
                              <Pill className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <span className="text-muted-foreground">Prescriber: </span>
                                <span className="font-medium">{refill.doctorName}</span>
                                {refill.doctorPhone && (
                                  <span className="text-muted-foreground ml-2">• {refill.doctorPhone}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
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
