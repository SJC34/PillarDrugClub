import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Pill, AlertTriangle, Info, Trash2, Calendar } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { MedicationSearch } from "@/components/MedicationSearch";

const addMedicationSchema = z.object({
  medicationName: z.string().min(1, "Medication name is required"),
  genericName: z.string().optional(),
  strength: z.string().min(1, "Strength is required"),
  dosage: z.string().min(1, "Dosage is required"),
  frequency: z.string().min(1, "Frequency is required"),
  route: z.string().optional(),
  startDate: z.string().optional(),
  prescribedBy: z.string().optional(),
  notes: z.string().optional(),
});

type AddMedicationForm = z.infer<typeof addMedicationSchema>;

export default function MyMedicationsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [medicationSearchValue, setMedicationSearchValue] = useState("");

  const form = useForm<AddMedicationForm>({
    resolver: zodResolver(addMedicationSchema),
    defaultValues: {
      medicationName: "",
      genericName: "",
      strength: "",
      dosage: "",
      frequency: "",
      route: "oral",
      startDate: new Date().toISOString().split('T')[0],
      prescribedBy: "",
      notes: "",
    },
  });

  // Fetch user's medications
  const { data, isLoading } = useQuery<{
    medications: any[];
    interactions: { hasInteractions: boolean; interactions: any[] };
  }>({
    queryKey: ["/api/users", user?.id, "medications"],
    enabled: !!user?.id,
  });

  const medications = data?.medications || [];
  const interactions = data?.interactions || { hasInteractions: false, interactions: [] };

  // Add medication mutation
  const addMutation = useMutation({
    mutationFn: async (values: AddMedicationForm) => {
      return apiRequest("POST", `/api/users/${user?.id}/medications`, values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", user?.id, "medications"] });
      toast({ title: "Medication added successfully" });
      setAddDialogOpen(false);
      form.reset();
      setMedicationSearchValue("");
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

  const handleMedicationSearchChange = (value: string) => {
    setMedicationSearchValue(value);
    form.setValue("medicationName", value);
  };

  const onSubmit = (values: AddMedicationForm) => {
    addMutation.mutate(values);
  };

  if (isLoading) {
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
          <h1 className="text-3xl font-bold tracking-tight">My Medications</h1>
          <p className="text-muted-foreground mt-1">Manage your current medications and view safety information</p>
        </div>
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-medication">
              <Plus className="mr-2 h-4 w-4" />
              Add Medication
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Medication</DialogTitle>
              <DialogDescription>
                Add a new medication to your list. Search for medications or enter details manually.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <MedicationSearch
                value={medicationSearchValue}
                onChange={handleMedicationSearchChange}
                placeholder="Search for a medication..."
              />
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="medicationName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Medication Name</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-medication-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="strength"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Strength</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g., 50mg" data-testid="input-strength" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="dosage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dosage</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g., 1 tablet" data-testid="input-dosage" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="frequency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Frequency</FormLabel>
                          <FormControl>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger data-testid="select-frequency">
                                <SelectValue placeholder="Select frequency" />
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
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} data-testid="input-start-date" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="prescribedBy"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Prescribed By (Optional)</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Doctor's name" data-testid="input-prescribed-by" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes (Optional)</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="Any additional notes..." data-testid="textarea-notes" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setAddDialogOpen(false)}
                      data-testid="button-cancel"
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={addMutation.isPending} data-testid="button-submit">
                      {addMutation.isPending ? "Adding..." : "Add Medication"}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Interaction Warnings */}
      {interactions.hasInteractions && (
        <Card className="mb-6 border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Drug Interactions Detected
            </CardTitle>
            <CardDescription>
              The following medication interactions have been identified:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {interactions.interactions.map((interaction: any, index: number) => (
                <li key={index} className="flex items-start gap-2 p-3 rounded-md bg-destructive/10">
                  <AlertTriangle className="h-4 w-4 mt-0.5 text-destructive" />
                  <div className="flex-1">
                    <div className="font-medium">
                      {interaction.medication1} ↔ {interaction.medication2}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {interaction.warning}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Medications List */}
      {medications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Pill className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No medications added yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Start by adding your current medications to see safety information and interactions.
            </p>
            <Button onClick={() => setAddDialogOpen(true)} data-testid="button-add-first-medication">
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Medication
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {medications.map((med: any) => (
            <Card key={med.id} data-testid={`card-medication-${med.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Pill className="h-5 w-5" />
                      {med.medicationName}
                      {med.fromPrescription && (
                        <Badge variant="secondary" data-testid={`badge-from-prescription-${med.id}`}>From Prescription</Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {med.strength} • {med.dosage} • {med.frequency}
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
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    {med.genericName && (
                      <div className="mb-2">
                        <span className="text-sm font-medium">Generic Name:</span>
                        <span className="text-sm text-muted-foreground ml-2">{med.genericName}</span>
                      </div>
                    )}
                    {med.prescribedBy && (
                      <div className="mb-2">
                        <span className="text-sm font-medium">Prescribed By:</span>
                        <span className="text-sm text-muted-foreground ml-2">{med.prescribedBy}</span>
                      </div>
                    )}
                    {med.startDate && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          Started {new Date(med.startDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {med.fdaData && (
                    <div className="space-y-2">
                      {med.fdaData.administration?.instructions?.length > 0 && (
                        <div className="p-2 rounded-md bg-blue-50 dark:bg-blue-950">
                          <div className="flex items-start gap-2">
                            <Info className="h-4 w-4 mt-0.5 text-blue-600 dark:text-blue-400" />
                            <div className="flex-1">
                              <div className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                Administration
                              </div>
                              <div className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                                {med.fdaData.administration.instructions[0].substring(0, 150)}...
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {med.fdaData.warnings?.boxedWarning?.length > 0 && (
                        <div className="p-2 rounded-md bg-red-100 dark:bg-red-950">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 mt-0.5 text-red-600 dark:text-red-400" />
                            <div className="flex-1">
                              <div className="text-sm font-medium text-red-900 dark:text-red-100">
                                ⚠️ Boxed Warning
                              </div>
                              <div className="text-xs text-red-700 dark:text-red-300 mt-1">
                                {med.fdaData.warnings.boxedWarning[0].substring(0, 150)}...
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {med.fdaData.warnings?.warnings?.length > 0 && (
                        <div className="p-2 rounded-md bg-orange-50 dark:bg-orange-950">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 mt-0.5 text-orange-600 dark:text-orange-400" />
                            <div className="flex-1">
                              <div className="text-sm font-medium text-orange-900 dark:text-orange-100">
                                Warnings
                              </div>
                              <div className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                                {med.fdaData.warnings.warnings[0].substring(0, 150)}...
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {med.fdaData.warnings?.contraindications?.length > 0 && (
                        <div className="p-2 rounded-md bg-yellow-50 dark:bg-yellow-950">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 mt-0.5 text-yellow-600 dark:text-yellow-400" />
                            <div className="flex-1">
                              <div className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                                Contraindications
                              </div>
                              <div className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                                {med.fdaData.warnings.contraindications[0].substring(0, 150)}...
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {!med.fdaData && (
                    <div className="p-2 rounded-md bg-muted">
                      <div className="flex items-start gap-2">
                        <Info className="h-4 w-4 mt-0.5 text-muted-foreground" />
                        <div className="flex-1">
                          <div className="text-sm text-muted-foreground">
                            No FDA safety information available for this medication.
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {med.notes && (
                  <div className="mt-4 p-3 rounded-md bg-muted">
                    <div className="text-sm font-medium mb-1">Notes</div>
                    <div className="text-sm text-muted-foreground">{med.notes}</div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
