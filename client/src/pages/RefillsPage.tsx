import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Pill, 
  Clock, 
  AlertCircle, 
  CheckCircle,
  Calendar,
  User
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function RefillsPage() {
  const { toast } = useToast();
  const [selectedPrescription, setSelectedPrescription] = useState<any>(null);
  const [priority, setPriority] = useState("routine");
  const [notes, setNotes] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Get current user from session
  const { data: userData } = useQuery({
    queryKey: ["/api/auth/me"],
  });

  const user = userData?.user;

  // Get prescriptions needing refill
  const { data: prescriptionsData, isLoading: prescriptionsLoading } = useQuery({
    queryKey: ["/api/users", user?.id, "prescriptions-needing-refill"],
    enabled: !!user?.id,
  });

  const prescriptions = prescriptionsData?.prescriptions || [];

  // Create refill request mutation
  const createRefillMutation = useMutation({
    mutationFn: async (data: { prescriptionId: string; priority: string; patientNotes?: string }) => {
      const res = await apiRequest("POST", "/api/refill-requests", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", user?.id, "refill-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users", user?.id, "prescriptions-needing-refill"] });
      toast({
        title: "Refill requested",
        description: "Your refill request has been submitted successfully.",
      });
      setIsDialogOpen(false);
      setSelectedPrescription(null);
      setNotes("");
      setPriority("routine");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to request refill",
        variant: "destructive",
      });
    },
  });

  const handleRequestRefill = (prescription: any) => {
    setSelectedPrescription(prescription);
    setIsDialogOpen(true);
  };

  const handleSubmitRefill = () => {
    if (!selectedPrescription) return;

    createRefillMutation.mutate({
      prescriptionId: selectedPrescription.id,
      priority,
      patientNotes: notes || undefined,
    });
  };

  const getDaysUntilColor = (days: number) => {
    if (days <= 2) return "bg-destructive text-destructive-foreground";
    if (days <= 5) return "bg-orange-500 text-white";
    return "bg-primary text-primary-foreground";
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Please sign in to view your refills</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Medication Refills</h1>
          <p className="text-muted-foreground">
            Request refills for your active medications
          </p>
        </div>

        {/* Prescriptions Needing Refill */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Prescriptions Due for Refill
            </CardTitle>
            <CardDescription>
              Medications that need refilling within the next 7 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            {prescriptionsLoading ? (
              <div className="p-8 text-center text-muted-foreground">Loading...</div>
            ) : prescriptions.length === 0 ? (
              <div className="p-8 text-center">
                <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No prescriptions need refilling at this time</p>
              </div>
            ) : (
              <div className="space-y-4">
                {prescriptions.map((prescription: any) => (
                  <Card key={prescription.id} className="hover-elevate" data-testid={`card-prescription-${prescription.id}`}>
                    <CardContent className="p-4 md:p-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-start gap-3">
                            <Pill className="h-5 w-5 text-primary mt-1" />
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg">{prescription.medicationName}</h3>
                              <p className="text-sm text-muted-foreground">
                                {prescription.dosage} - Qty: {prescription.quantity}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="text-xs text-muted-foreground">Due Date</p>
                                <p className="text-sm font-medium">
                                  {new Date(prescription.dueDate).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="text-xs text-muted-foreground">Days Until Refill</p>
                                <Badge className={getDaysUntilColor(prescription.daysUntilRefill)}>
                                  {prescription.daysUntilRefill === 0 ? 'Due Today' : `${prescription.daysUntilRefill} days`}
                                </Badge>
                              </div>
                            </div>

                            {prescription.prescriberName && (
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="text-xs text-muted-foreground">Prescriber</p>
                                  <p className="text-sm font-medium">{prescription.prescriberName}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        <Button 
                          onClick={() => handleRequestRefill(prescription)}
                          data-testid={`button-request-refill-${prescription.id}`}
                        >
                          Request Refill
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Refill Request Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Medication Refill</DialogTitle>
            <DialogDescription>
              Submit a refill request for {selectedPrescription?.medicationName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger id="priority" data-testid="select-priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="routine">Routine</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Select "Urgent" if you need this within 24 hours, or "Emergency" for same-day needs
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                data-testid="textarea-notes"
                placeholder="Any special instructions or information for the pharmacy..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
              />
            </div>

            {selectedPrescription && (
              <div className="rounded-lg bg-muted p-4 space-y-2">
                <p className="text-sm font-medium">Refill Details</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Medication</p>
                    <p className="font-medium">{selectedPrescription.medicationName}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Dosage</p>
                    <p className="font-medium">{selectedPrescription.dosage}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Quantity</p>
                    <p className="font-medium">{selectedPrescription.quantity}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Refills Remaining</p>
                    <p className="font-medium">{selectedPrescription.refillsRemaining}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false);
                setSelectedPrescription(null);
                setNotes("");
                setPriority("routine");
              }}
              data-testid="button-cancel-refill"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitRefill}
              disabled={createRefillMutation.isPending}
              data-testid="button-submit-refill"
            >
              {createRefillMutation.isPending ? "Submitting..." : "Submit Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
