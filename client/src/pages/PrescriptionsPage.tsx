import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Pill, AlertCircle, CheckCircle2, Clock, XCircle, Ban, ArrowRightLeft } from "lucide-react";

type Prescription = {
  id: string;
  userId: string;
  medicationName: string;
  dosage: string;
  quantity: number;
  prescriberId: string | null;
  prescriberName: string | null;
  prescriberNpi: string | null;
  refillsRemaining: number;
  originalRefills: number;
  directions: string | null;
  writtenDate: string | null;
  expirationDate: string | null;
  status: "pending" | "approved" | "rejected" | "active" | "expired" | "transferred" | "cancelled";
  isTransfer: boolean;
  transferFromPharmacy: string | null;
  lastFillDate: string | null;
  urgency: "routine" | "urgent" | "emergency";
  createdAt: string;
};

const statusIcons: Record<string, any> = {
  pending: Clock,
  approved: CheckCircle2,
  rejected: XCircle,
  active: CheckCircle2,
  expired: AlertCircle,
  transferred: ArrowRightLeft,
  cancelled: Ban,
};

const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "secondary",
  approved: "default",
  rejected: "destructive",
  active: "default",
  expired: "outline",
  transferred: "outline",
  cancelled: "destructive",
};

const statusLabels: Record<string, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  active: "Active",
  expired: "Expired",
  transferred: "Transferred",
  cancelled: "Cancelled",
};

export default function PrescriptionsPage() {
  const { user, isAuthenticated } = useAuth();

  const { data: prescriptions = [], isLoading } = useQuery<Prescription[]>({
    queryKey: [`/api/users/${user?.id}/prescriptions`],
    enabled: !!user?.id,
  });

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Please log in to view your prescriptions.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <h1 className="text-3xl font-bold mb-8">My Prescriptions</h1>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-muted rounded w-1/4"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">My Prescriptions</h1>
        <Link href="/prescription-transfer">
          <Button data-testid="button-transfer-prescription">
            <ArrowRightLeft className="h-4 w-4 mr-2" />
            Transfer Prescription
          </Button>
        </Link>
      </div>

      {prescriptions.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <Pill className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">No prescriptions yet</p>
            <p className="text-sm text-muted-foreground mb-6">
              Transfer your prescriptions from another pharmacy to get started
            </p>
            <Link href="/prescription-transfer">
              <Button data-testid="button-start-transfer">
                Transfer Prescription
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {prescriptions.map((prescription) => {
            const StatusIcon = statusIcons[prescription.status] || Clock;
            
            return (
              <Card key={prescription.id} data-testid={`card-prescription-${prescription.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-lg">
                          {prescription.medicationName}
                        </CardTitle>
                        <Badge 
                          variant={statusColors[prescription.status] || "default"}
                          data-testid={`badge-status-${prescription.id}`}
                        >
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusLabels[prescription.status] || prescription.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {prescription.dosage} {prescription.quantity && `• Qty: ${prescription.quantity}`}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Prescriber</p>
                      <p className="font-medium">
                        {prescription.prescriberName || "Not specified"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Refills</p>
                      <p className="font-medium">
                        {prescription.refillsRemaining} of {prescription.originalRefills} remaining
                      </p>
                    </div>
                    {prescription.directions && (
                      <div className="md:col-span-2">
                        <p className="text-sm text-muted-foreground mb-1">Directions</p>
                        <p className="text-sm">{prescription.directions}</p>
                      </div>
                    )}
                    {prescription.isTransfer && prescription.transferFromPharmacy && (
                      <div className="md:col-span-2">
                        <p className="text-sm text-muted-foreground mb-1">Transferred From</p>
                        <p className="text-sm">{prescription.transferFromPharmacy}</p>
                      </div>
                    )}
                    {prescription.expirationDate && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Expires</p>
                        <p className="text-sm">
                          {new Date(prescription.expirationDate).toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    )}
                    {prescription.lastFillDate && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Last Filled</p>
                        <p className="text-sm">
                          {new Date(prescription.lastFillDate).toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {prescription.urgency !== "routine" && (
                    <div className="mt-4 pt-4 border-t">
                      <Badge variant="outline">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {prescription.urgency.charAt(0).toUpperCase() + prescription.urgency.slice(1)}
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
