import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import { MedicationAutocomplete, type MedicationOption } from "@/components/MedicationAutocomplete";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, CheckCircle2, Info, Pill, Plus, Shield, Trash2, XCircle, Crown } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface UserMedication {
  id: string;
  userId: string;
  medicationName: string;
  genericName: string | null;
  brandName: string | null;
  strength: string | null;
  dosageForm: string | null;
  dosage: string | null;
  frequency: string | null;
  route: string | null;
  startDate: string | null;
  endDate: string | null;
  prescribedBy: string | null;
  isActive: boolean;
  isFromPdc: boolean;
  fromPrescription: boolean;
  ndcCode: string | null;
  externalSourceName: string | null;
  openFdaCache: any;
  lastFdaSync: string | null;
  cacheExpiresAt: string | null;
}

interface SideEffect {
  effect: string;
  medicationCount: number;
  medications: string[];
  likelihood: 'low' | 'moderate' | 'high';
}

interface DrugInteraction {
  medication1: string;
  medication2: string;
  warning: string;
  severity: 'minor' | 'moderate' | 'major';
}

interface MedicationFormData {
  medicationName: string;
  genericName: string;
  brandName?: string;
  strength: string;
  dosageForm: string;
  dosage: string;
  frequency: string;
  route: string;
  ndcCode?: string;
  isFromPdc: boolean;
}

export default function MyMedicationsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState<MedicationOption | null>(null);
  const [activeTab, setActiveTab] = useState("medications");
  
  // Form state for adding medication
  const [formData, setFormData] = useState<MedicationFormData>({
    medicationName: "",
    genericName: "",
    brandName: "",
    strength: "",
    dosageForm: "",
    dosage: "",
    frequency: "once daily",
    route: "oral",
    ndcCode: "",
    isFromPdc: false
  });

  // Fetch user's medications
  const { data: medicationsData, isLoading: medicationsLoading } = useQuery<{ medications: UserMedication[] }>({
    queryKey: ['/api/users', user?.id, 'medications'],
    enabled: !!user?.id,
  });

  // Fetch side effects analysis (Gold/Platinum only)
  const { data: sideEffectsData, isLoading: sideEffectsLoading } = useQuery<{
    sideEffects: SideEffect[];
    medicationCount: number;
  }>({
    queryKey: ['/api/medication-analysis/side-effects', user?.id],
    enabled: !!user?.id && activeTab === "side-effects" && (user?.subscriptionTier === 'gold' || user?.subscriptionTier === 'platinum'),
  });

  // Fetch drug interactions analysis (Gold/Platinum only)
  const { data: interactionsData, isLoading: interactionsLoading } = useQuery<{
    hasInteractions: boolean;
    interactions: DrugInteraction[];
    medicationCount: number;
    message?: string;
  }>({
    queryKey: ['/api/medication-analysis/interactions', user?.id],
    enabled: !!user?.id && activeTab === "interactions" && (user?.subscriptionTier === 'gold' || user?.subscriptionTier === 'platinum'),
  });

  const medications = medicationsData?.medications || [];
  const isGoldOrPlatinum = user?.subscriptionTier === 'gold' || user?.subscriptionTier === 'platinum';

  // Add medication mutation
  const addMutation = useMutation({
    mutationFn: async (values: any) => {
      return apiRequest("POST", `/api/users/${user?.id}/medications`, values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", user?.id, "medications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/medication-analysis/side-effects", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/medication-analysis/interactions", user?.id] });
      toast({ title: "Medication added successfully" });
      setAddDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to add medication",
        description: error.message,
      });
    },
  });

  // Remove medication mutation
  const removeMutation = useMutation({
    mutationFn: async (medicationId: string) => {
      return apiRequest("DELETE", `/api/users/${user?.id}/medications/${medicationId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", user?.id, "medications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/medication-analysis/side-effects", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/medication-analysis/interactions", user?.id] });
      toast({ title: "Medication removed successfully" });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to remove medication",
        description: error.message,
      });
    },
  });

  const handleMedicationSelect = (medication: MedicationOption) => {
    setSelectedMedication(medication);
    setFormData({
      medicationName: medication.name,
      genericName: medication.genericName,
      brandName: medication.brandName || "",
      strength: medication.strength || "",
      dosageForm: medication.dosageForm || "",
      dosage: "",
      frequency: "once daily",
      route: "oral",
      ndcCode: medication.ndc || "",
      isFromPdc: medication.isFromPdc
    });
  };

  const resetForm = () => {
    setSelectedMedication(null);
    setFormData({
      medicationName: "",
      genericName: "",
      brandName: "",
      strength: "",
      dosageForm: "",
      dosage: "",
      frequency: "once daily",
      route: "oral",
      ndcCode: "",
      isFromPdc: false
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.medicationName || !formData.genericName || !formData.strength) {
      toast({
        variant: "destructive",
        title: "Missing required fields",
        description: "Please fill in medication name, generic name, and strength"
      });
      return;
    }

    addMutation.mutate({
      medicationName: formData.medicationName,
      genericName: formData.genericName,
      brandName: formData.brandName,
      strength: formData.strength,
      dosageForm: formData.dosageForm,
      dosage: formData.dosage,
      frequency: formData.frequency,
      route: formData.route,
      ndcCode: formData.ndcCode,
      isFromPdc: formData.isFromPdc,
      isActive: true
    });
  };

  const getLikelihoodBadge = (likelihood: 'low' | 'moderate' | 'high') => {
    const variants = {
      high: "destructive",
      moderate: "default",
      low: "secondary"
    } as const;
    
    return (
      <Badge variant={variants[likelihood]} data-testid={`badge-likelihood-${likelihood}`}>
        {likelihood.charAt(0).toUpperCase() + likelihood.slice(1)} Likelihood
      </Badge>
    );
  };

  const getSeverityBadge = (severity: 'minor' | 'moderate' | 'major') => {
    const variants = {
      major: "destructive",
      moderate: "default",
      minor: "secondary"
    } as const;
    
    return (
      <Badge variant={variants[severity]} data-testid={`badge-severity-${severity}`}>
        {severity.charAt(0).toUpperCase() + severity.slice(1)}
      </Badge>
    );
  };

  if (medicationsLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-muted-foreground">Loading medications...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="heading-my-medications">Clinical Safety Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage your medications and view safety analysis</p>
        </div>
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-medication">
              <Plus className="mr-2 h-4 w-4" />
              Add Medication
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl" data-testid="dialog-add-medication">
            <DialogHeader>
              <DialogTitle>Add Medication</DialogTitle>
              <DialogDescription>
                Search for a medication from our catalog or add one from another pharmacy.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="medication-search">Search Medication</Label>
                <MedicationAutocomplete
                  onSelect={handleMedicationSelect}
                  placeholder="Search for a medication..."
                  className="mt-2"
                />
              </div>

              {selectedMedication && (
                <Alert data-testid="alert-medication-selected">
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    Selected: {selectedMedication.name} ({selectedMedication.genericName})
                  </AlertDescription>
                </Alert>
              )}

              <Separator />

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="medicationName">Medication Name *</Label>
                    <Input
                      id="medicationName"
                      value={formData.medicationName}
                      onChange={(e) => setFormData({ ...formData, medicationName: e.target.value })}
                      required
                      data-testid="input-medication-name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="genericName">Generic Name *</Label>
                    <Input
                      id="genericName"
                      value={formData.genericName}
                      onChange={(e) => setFormData({ ...formData, genericName: e.target.value })}
                      required
                      data-testid="input-generic-name"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="strength">Strength *</Label>
                    <Input
                      id="strength"
                      value={formData.strength}
                      onChange={(e) => setFormData({ ...formData, strength: e.target.value })}
                      placeholder="e.g., 10mg"
                      required
                      data-testid="input-strength"
                    />
                  </div>

                  <div>
                    <Label htmlFor="dosageForm">Dosage Form</Label>
                    <Input
                      id="dosageForm"
                      value={formData.dosageForm}
                      onChange={(e) => setFormData({ ...formData, dosageForm: e.target.value })}
                      placeholder="e.g., tablet, capsule"
                      data-testid="input-dosage-form"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="dosage">Dosage</Label>
                    <Input
                      id="dosage"
                      value={formData.dosage}
                      onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                      placeholder="e.g., 1 tablet"
                      data-testid="input-dosage"
                    />
                  </div>

                  <div>
                    <Label htmlFor="frequency">Frequency</Label>
                    <Select 
                      value={formData.frequency} 
                      onValueChange={(value) => setFormData({ ...formData, frequency: value })}
                    >
                      <SelectTrigger data-testid="select-frequency">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="once daily">Once daily</SelectItem>
                        <SelectItem value="twice daily">Twice daily</SelectItem>
                        <SelectItem value="three times daily">Three times daily</SelectItem>
                        <SelectItem value="every 4 hours">Every 4 hours</SelectItem>
                        <SelectItem value="every 6 hours">Every 6 hours</SelectItem>
                        <SelectItem value="every 8 hours">Every 8 hours</SelectItem>
                        <SelectItem value="every 12 hours">Every 12 hours</SelectItem>
                        <SelectItem value="as needed">As needed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="route">Route</Label>
                    <Select 
                      value={formData.route} 
                      onValueChange={(value) => setFormData({ ...formData, route: value })}
                    >
                      <SelectTrigger data-testid="select-route">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="oral">Oral</SelectItem>
                        <SelectItem value="topical">Topical</SelectItem>
                        <SelectItem value="injection">Injection</SelectItem>
                        <SelectItem value="inhalation">Inhalation</SelectItem>
                        <SelectItem value="rectal">Rectal</SelectItem>
                        <SelectItem value="sublingual">Sublingual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setAddDialogOpen(false);
                      resetForm();
                    }}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={addMutation.isPending}
                    data-testid="button-submit"
                  >
                    {addMutation.isPending ? "Adding..." : "Add Medication"}
                  </Button>
                </div>
              </form>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3" data-testid="tabs-clinical-safety">
          <TabsTrigger value="medications" data-testid="tab-medications">
            <Pill className="h-4 w-4 mr-2" />
            Medications
          </TabsTrigger>
          <TabsTrigger value="side-effects" data-testid="tab-side-effects">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Side Effects
          </TabsTrigger>
          <TabsTrigger value="interactions" data-testid="tab-interactions">
            <Shield className="h-4 w-4 mr-2" />
            Interactions
          </TabsTrigger>
        </TabsList>

        {/* Medications Tab */}
        <TabsContent value="medications" className="space-y-4">
          {medications.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Pill className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No medications added yet</h3>
                <p className="text-muted-foreground text-center mb-4 max-w-md">
                  Start by adding your current medications to see safety information and potential interactions.
                </p>
                <Button onClick={() => setAddDialogOpen(true)} data-testid="button-add-first-medication">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Medication
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {medications.map((med) => (
                <Card key={med.id} data-testid={`card-medication-${med.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2 flex-wrap">
                          <Pill className="h-5 w-5" />
                          {med.medicationName}
                          {med.fromPrescription && (
                            <Badge variant="secondary" data-testid={`badge-from-prescription-${med.id}`}>
                              From Prescription
                            </Badge>
                          )}
                          {!med.isFromPdc && med.externalSourceName && (
                            <Badge variant="outline" data-testid={`badge-external-${med.id}`}>
                              {med.externalSourceName}
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription className="mt-2">
                          <div className="space-y-1">
                            {med.genericName && (
                              <div><span className="font-medium">Generic:</span> {med.genericName}</div>
                            )}
                            {med.strength && (
                              <div><span className="font-medium">Strength:</span> {med.strength}</div>
                            )}
                            {med.dosage && med.frequency && (
                              <div><span className="font-medium">Dosage:</span> {med.dosage} {med.frequency}</div>
                            )}
                          </div>
                        </CardDescription>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeMutation.mutate(med.id)}
                        disabled={removeMutation.isPending}
                        data-testid={`button-remove-${med.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  {med.openFdaCache && (
                    <CardContent>
                      <div className="space-y-2">
                        {med.openFdaCache.warnings?.boxedWarning?.[0] && (
                          <Alert variant="destructive" data-testid={`alert-boxed-warning-${med.id}`}>
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription className="text-sm">
                              <strong>Boxed Warning:</strong> {med.openFdaCache.warnings.boxedWarning[0].substring(0, 150)}...
                            </AlertDescription>
                          </Alert>
                        )}
                        {med.openFdaCache.warnings?.warnings?.[0] && (
                          <Alert data-testid={`alert-warning-${med.id}`}>
                            <Info className="h-4 w-4" />
                            <AlertDescription className="text-sm">
                              <strong>Warning:</strong> {med.openFdaCache.warnings.warnings[0].substring(0, 120)}...
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Side Effects Tab */}
        <TabsContent value="side-effects" className="space-y-4">
          {!isGoldOrPlatinum ? (
            <Card className="border-primary/20" data-testid="card-upgrade-cta-side-effects">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-primary" />
                  Premium Feature: Side Effects Analysis
                </CardTitle>
                <CardDescription>
                  Upgrade to Gold or Platinum to unlock comprehensive side effects analysis grouped by likelihood
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm">With Gold or Platinum, you get:</p>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />
                      <span>Side effects grouped by likelihood (high, moderate, low)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />
                      <span>See which medications cause each side effect</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />
                      <span>FDA-sourced safety information</span>
                    </li>
                  </ul>
                </div>
                <Link href="/settings?tab=subscription">
                  <Button className="w-full" data-testid="button-upgrade-gold">
                    Upgrade Now
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : sideEffectsLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : (
            <>
              {sideEffectsData && sideEffectsData.sideEffects.length > 0 ? (
                <>
                  {['high', 'moderate', 'low'].map((likelihood) => {
                    const effects = sideEffectsData.sideEffects.filter(
                      (se) => se.likelihood === likelihood
                    );
                    if (effects.length === 0) return null;

                    return (
                      <Card key={likelihood} data-testid={`card-side-effects-${likelihood}`}>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            {getLikelihoodBadge(likelihood as 'low' | 'moderate' | 'high')}
                            <span className="text-base font-normal text-muted-foreground">
                              {effects.length} side effect{effects.length !== 1 ? 's' : ''}
                            </span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {effects.map((effect, idx) => (
                              <div key={idx} className="p-3 rounded-md bg-muted" data-testid={`side-effect-${likelihood}-${idx}`}>
                                <div className="font-medium mb-1">{effect.effect}</div>
                                <div className="text-sm text-muted-foreground">
                                  Caused by: {effect.medications.join(', ')}
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Side Effects Data</h3>
                    <p className="text-muted-foreground text-center">
                      No side effects information available for your current medications.
                    </p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* Interactions Tab */}
        <TabsContent value="interactions" className="space-y-4">
          {!isGoldOrPlatinum ? (
            <Card className="border-primary/20" data-testid="card-upgrade-cta-interactions">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-primary" />
                  Premium Feature: Drug Interaction Analysis
                </CardTitle>
                <CardDescription>
                  Upgrade to Gold or Platinum to unlock comprehensive drug interaction warnings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm">With Gold or Platinum, you get:</p>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />
                      <span>Interactions grouped by severity (major, moderate, minor)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />
                      <span>Pairwise medication warnings</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />
                      <span>FDA-sourced interaction data</span>
                    </li>
                  </ul>
                </div>
                <Link href="/settings?tab=subscription">
                  <Button className="w-full" data-testid="button-upgrade-platinum">
                    Upgrade Now
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : interactionsLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : (
            <>
              {interactionsData && interactionsData.hasInteractions ? (
                <>
                  {['major', 'moderate', 'minor'].map((severity) => {
                    const interactions = interactionsData.interactions.filter(
                      (int) => int.severity === severity
                    );
                    if (interactions.length === 0) return null;

                    return (
                      <Card key={severity} data-testid={`card-interactions-${severity}`}>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            {getSeverityBadge(severity as 'minor' | 'moderate' | 'major')}
                            <span className="text-base font-normal text-muted-foreground">
                              {interactions.length} interaction{interactions.length !== 1 ? 's' : ''}
                            </span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {interactions.map((interaction, idx) => (
                              <div 
                                key={idx} 
                                className={cn(
                                  "p-3 rounded-md",
                                  severity === 'major' && "bg-destructive/10",
                                  severity === 'moderate' && "bg-orange-50 dark:bg-orange-950",
                                  severity === 'minor' && "bg-muted"
                                )}
                                data-testid={`interaction-${severity}-${idx}`}
                              >
                                <div className="font-medium mb-1">
                                  {interaction.medication1} ↔ {interaction.medication2}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {interaction.warning}
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Interactions Detected</h3>
                    <p className="text-muted-foreground text-center">
                      {medications.length < 2 
                        ? "Add more medications to check for interactions."
                        : "No known drug interactions detected between your current medications."
                      }
                    </p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
