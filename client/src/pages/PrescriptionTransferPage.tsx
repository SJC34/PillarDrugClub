import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Pill, 
  FileText, 
  Building, 
  Phone, 
  Mail, 
  MapPin, 
  User, 
  Calendar,
  Send,
  ArrowRight,
  CheckCircle,
  Clock
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const doctorFaxSchema = z.object({
  patientName: z.string().min(2, "Patient name is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  medicationName: z.string().min(2, "Medication name is required"),
  dosage: z.string().min(1, "Dosage is required"),
  quantity: z.string().min(1, "Quantity is required"),
  doctorName: z.string().min(2, "Doctor name is required"),
  doctorPhone: z.string().min(10, "Doctor phone is required"),
  doctorFax: z.string().min(10, "Doctor fax is required"),
  doctorAddress: z.string().min(5, "Doctor address is required"),
  urgency: z.enum(["routine", "urgent", "emergency"]),
  specialInstructions: z.string().optional()
});

const pharmacyTransferSchema = z.object({
  patientName: z.string().min(2, "Patient name is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  medicationName: z.string().min(2, "Medication name is required"),
  dosage: z.string().min(1, "Dosage is required"),
  prescriptionNumber: z.string().min(1, "Prescription number is required"),
  currentPharmacyName: z.string().min(2, "Current pharmacy name is required"),
  currentPharmacyPhone: z.string().min(10, "Current pharmacy phone is required"),
  currentPharmacyAddress: z.string().min(5, "Current pharmacy address is required"),
  lastFillDate: z.string().min(1, "Last fill date is required"),
  refillsRemaining: z.string().min(1, "Refills remaining is required"),
  transferReason: z.string().optional()
});

type DoctorFaxForm = z.infer<typeof doctorFaxSchema>;
type PharmacyTransferForm = z.infer<typeof pharmacyTransferSchema>;

export default function PrescriptionTransferPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("doctor-fax");
  const [submissionStatus, setSubmissionStatus] = useState<"idle" | "submitting" | "success">("idle");

  const doctorForm = useForm<DoctorFaxForm>({
    resolver: zodResolver(doctorFaxSchema),
    defaultValues: {
      urgency: "routine"
    }
  });

  const pharmacyForm = useForm<PharmacyTransferForm>({
    resolver: zodResolver(pharmacyTransferSchema)
  });

  const onDoctorSubmit = async (data: DoctorFaxForm) => {
    setSubmissionStatus("submitting");
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      
      const prescriptionData = {
        customerId: user.id,
        medicationName: data.medicationName,
        dosage: data.dosage,
        quantity: parseInt(data.quantity) || 1,
        prescriber: data.doctorName,
        prescriberPhone: data.doctorPhone,
        prescriberFax: data.doctorFax,
        prescriberAddress: data.doctorAddress,
        patientName: data.patientName,
        patientDateOfBirth: data.dateOfBirth,
        urgency: data.urgency,
        specialInstructions: data.specialInstructions,
        isTransfer: false,
        status: "pending"
      };

      const response = await apiRequest("POST", "/api/prescriptions", prescriptionData);
      const result = await response.json();
      
      toast({
        title: "Prescription Request Sent",
        description: result.message || "Your prescription request has been faxed to your doctor. They will respond within 24-48 hours.",
      });
      
      setSubmissionStatus("success");
      doctorForm.reset();
    } catch (error: any) {
      console.error("Doctor prescription request error:", error);
      toast({
        title: "Request Failed",
        description: "Failed to send prescription request. Please try again.",
        variant: "destructive"
      });
      setSubmissionStatus("idle");
    }
  };

  const onPharmacySubmit = async (data: PharmacyTransferForm) => {
    setSubmissionStatus("submitting");
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      
      const prescriptionData = {
        customerId: user.id,
        medicationName: data.medicationName,
        dosage: data.dosage,
        quantity: parseInt(data.quantity) || 1,
        prescriptionNumber: data.prescriptionNumber,
        transferFromPharmacy: data.currentPharmacyName,
        transferFromPharmacyPhone: data.currentPharmacyPhone,
        transferFromPharmacyAddress: data.currentPharmacyAddress,
        patientName: data.patientName,
        patientDateOfBirth: data.dateOfBirth,
        lastFillDate: data.lastFillDate,
        refillsRemaining: parseInt(data.refillsRemaining) || 0,
        transferReason: data.transferReason,
        isTransfer: true,
        status: "pending"
      };

      const response = await apiRequest("POST", "/api/prescriptions", prescriptionData);
      const result = await response.json();
      
      toast({
        title: "Transfer Request Submitted",
        description: result.message || "Your prescription transfer request has been submitted. We'll contact your current pharmacy to transfer your prescription.",
      });
      
      setSubmissionStatus("success");
      pharmacyForm.reset();
    } catch (error: any) {
      console.error("Pharmacy transfer request error:", error);
      toast({
        title: "Transfer Failed", 
        description: "Failed to submit transfer request. Please try again.",
        variant: "destructive"
      });
      setSubmissionStatus("idle");
    }
  };

  if (submissionStatus === "success") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
        <div className="max-w-4xl mx-auto p-6">
          {/* Header */}
          <div className="text-center mb-8">
            <Link href="/dashboard">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Pill className="h-8 w-8 text-blue-600" />
                <span className="text-2xl font-bold text-gray-900">Pillar Drug Club</span>
              </div>
            </Link>
          </div>

          <Card className="text-center">
            <CardContent className="p-8">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Request Submitted Successfully</h2>
              <p className="text-gray-600 mb-6">
                {activeTab === "doctor-fax" 
                  ? "Your prescription request has been sent to your doctor. You'll receive a confirmation once they respond."
                  : "Your prescription transfer request has been submitted. We'll handle the transfer process for you."
                }
              </p>
              <div className="space-y-3">
                <Link href="/dashboard">
                  <Button size="lg">Return to Dashboard</Button>
                </Link>
                <div>
                  <Button variant="outline" onClick={() => setSubmissionStatus("idle")}>
                    Submit Another Request
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/dashboard">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Pill className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">Pillar Drug Club</span>
            </div>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Prescription Transfer</h1>
          <p className="text-gray-600">Get your prescriptions at wholesale prices - we'll handle the transfer process</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="doctor-fax" className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              New Prescription from Doctor
            </TabsTrigger>
            <TabsTrigger value="pharmacy-transfer" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              Transfer from Current Pharmacy
            </TabsTrigger>
          </TabsList>

          {/* Doctor Fax Tab */}
          <TabsContent value="doctor-fax">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5 text-blue-600" />
                  Request New Prescription from Doctor
                </CardTitle>
                <CardDescription>
                  We'll fax your doctor to request a new prescription for you. This typically takes 24-48 hours.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={doctorForm.handleSubmit(onDoctorSubmit)} className="space-y-6">
                  {/* Patient Information */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Patient Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="patientName">Full Name</Label>
                        <Input
                          id="patientName"
                          placeholder="John Smith"
                          {...doctorForm.register("patientName")}
                          data-testid="input-patient-name"
                        />
                        {doctorForm.formState.errors.patientName && (
                          <p className="text-sm text-red-600 mt-1">{doctorForm.formState.errors.patientName.message}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="dateOfBirth">Date of Birth</Label>
                        <Input
                          id="dateOfBirth"
                          type="date"
                          {...doctorForm.register("dateOfBirth")}
                          data-testid="input-date-of-birth"
                        />
                        {doctorForm.formState.errors.dateOfBirth && (
                          <p className="text-sm text-red-600 mt-1">{doctorForm.formState.errors.dateOfBirth.message}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Medication Information */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Pill className="h-5 w-5" />
                      Medication Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="medicationName">Medication Name</Label>
                        <Input
                          id="medicationName"
                          placeholder="Lisinopril"
                          {...doctorForm.register("medicationName")}
                          data-testid="input-medication-name"
                        />
                        {doctorForm.formState.errors.medicationName && (
                          <p className="text-sm text-red-600 mt-1">{doctorForm.formState.errors.medicationName.message}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="dosage">Dosage</Label>
                        <Input
                          id="dosage"
                          placeholder="10mg"
                          {...doctorForm.register("dosage")}
                          data-testid="input-dosage"
                        />
                        {doctorForm.formState.errors.dosage && (
                          <p className="text-sm text-red-600 mt-1">{doctorForm.formState.errors.dosage.message}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="quantity">Quantity</Label>
                        <Input
                          id="quantity"
                          placeholder="30 tablets"
                          {...doctorForm.register("quantity")}
                          data-testid="input-quantity"
                        />
                        {doctorForm.formState.errors.quantity && (
                          <p className="text-sm text-red-600 mt-1">{doctorForm.formState.errors.quantity.message}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Doctor Information */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Doctor Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="doctorName">Doctor Name</Label>
                        <Input
                          id="doctorName"
                          placeholder="Dr. Sarah Johnson"
                          {...doctorForm.register("doctorName")}
                          data-testid="input-doctor-name"
                        />
                        {doctorForm.formState.errors.doctorName && (
                          <p className="text-sm text-red-600 mt-1">{doctorForm.formState.errors.doctorName.message}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="doctorPhone">Phone Number</Label>
                        <Input
                          id="doctorPhone"
                          placeholder="(555) 123-4567"
                          {...doctorForm.register("doctorPhone")}
                          data-testid="input-doctor-phone"
                        />
                        {doctorForm.formState.errors.doctorPhone && (
                          <p className="text-sm text-red-600 mt-1">{doctorForm.formState.errors.doctorPhone.message}</p>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <Label htmlFor="doctorFax">Fax Number</Label>
                        <Input
                          id="doctorFax"
                          placeholder="(555) 123-4568"
                          {...doctorForm.register("doctorFax")}
                          data-testid="input-doctor-fax"
                        />
                        {doctorForm.formState.errors.doctorFax && (
                          <p className="text-sm text-red-600 mt-1">{doctorForm.formState.errors.doctorFax.message}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="urgency">Request Urgency</Label>
                        <Select onValueChange={(value) => doctorForm.setValue("urgency", value as any)}>
                          <SelectTrigger data-testid="select-urgency">
                            <SelectValue placeholder="Select urgency" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="routine">Routine (24-48 hours)</SelectItem>
                            <SelectItem value="urgent">Urgent (Same day)</SelectItem>
                            <SelectItem value="emergency">Emergency (Immediate)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="mt-4">
                      <Label htmlFor="doctorAddress">Doctor Office Address</Label>
                      <Textarea
                        id="doctorAddress"
                        placeholder="123 Medical Center Dr, City, State 12345"
                        {...doctorForm.register("doctorAddress")}
                        data-testid="textarea-doctor-address"
                      />
                      {doctorForm.formState.errors.doctorAddress && (
                        <p className="text-sm text-red-600 mt-1">{doctorForm.formState.errors.doctorAddress.message}</p>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Special Instructions */}
                  <div>
                    <Label htmlFor="specialInstructions">Special Instructions (Optional)</Label>
                    <Textarea
                      id="specialInstructions"
                      placeholder="Any additional information for your doctor..."
                      {...doctorForm.register("specialInstructions")}
                      data-testid="textarea-special-instructions"
                    />
                  </div>

                  <div className="flex gap-4">
                    <Button 
                      type="submit" 
                      className="flex-1" 
                      disabled={submissionStatus === "submitting"}
                      data-testid="button-submit-doctor-fax"
                    >
                      {submissionStatus === "submitting" ? (
                        <>
                          <Clock className="h-4 w-4 mr-2 animate-spin" />
                          Sending Fax...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Send Prescription Request
                        </>
                      )}
                    </Button>
                    <Link href="/dashboard">
                      <Button variant="outline">Cancel</Button>
                    </Link>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pharmacy Transfer Tab */}
          <TabsContent value="pharmacy-transfer">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5 text-blue-600" />
                  Transfer from Current Pharmacy
                </CardTitle>
                <CardDescription>
                  We'll contact your current pharmacy to transfer your existing prescription to our wholesale pricing.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={pharmacyForm.handleSubmit(onPharmacySubmit)} className="space-y-6">
                  {/* Patient Information */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Patient Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="transferPatientName">Full Name</Label>
                        <Input
                          id="transferPatientName"
                          placeholder="John Smith"
                          {...pharmacyForm.register("patientName")}
                          data-testid="input-transfer-patient-name"
                        />
                        {pharmacyForm.formState.errors.patientName && (
                          <p className="text-sm text-red-600 mt-1">{pharmacyForm.formState.errors.patientName.message}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="transferDateOfBirth">Date of Birth</Label>
                        <Input
                          id="transferDateOfBirth"
                          type="date"
                          {...pharmacyForm.register("dateOfBirth")}
                          data-testid="input-transfer-date-of-birth"
                        />
                        {pharmacyForm.formState.errors.dateOfBirth && (
                          <p className="text-sm text-red-600 mt-1">{pharmacyForm.formState.errors.dateOfBirth.message}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Prescription Information */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Prescription Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="transferMedicationName">Medication Name</Label>
                        <Input
                          id="transferMedicationName"
                          placeholder="Lisinopril"
                          {...pharmacyForm.register("medicationName")}
                          data-testid="input-transfer-medication-name"
                        />
                        {pharmacyForm.formState.errors.medicationName && (
                          <p className="text-sm text-red-600 mt-1">{pharmacyForm.formState.errors.medicationName.message}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="transferDosage">Dosage</Label>
                        <Input
                          id="transferDosage"
                          placeholder="10mg"
                          {...pharmacyForm.register("dosage")}
                          data-testid="input-transfer-dosage"
                        />
                        {pharmacyForm.formState.errors.dosage && (
                          <p className="text-sm text-red-600 mt-1">{pharmacyForm.formState.errors.dosage.message}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="prescriptionNumber">Prescription Number</Label>
                        <Input
                          id="prescriptionNumber"
                          placeholder="RX123456789"
                          {...pharmacyForm.register("prescriptionNumber")}
                          data-testid="input-prescription-number"
                        />
                        {pharmacyForm.formState.errors.prescriptionNumber && (
                          <p className="text-sm text-red-600 mt-1">{pharmacyForm.formState.errors.prescriptionNumber.message}</p>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <Label htmlFor="lastFillDate">Last Fill Date</Label>
                        <Input
                          id="lastFillDate"
                          type="date"
                          {...pharmacyForm.register("lastFillDate")}
                          data-testid="input-last-fill-date"
                        />
                        {pharmacyForm.formState.errors.lastFillDate && (
                          <p className="text-sm text-red-600 mt-1">{pharmacyForm.formState.errors.lastFillDate.message}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="refillsRemaining">Refills Remaining</Label>
                        <Input
                          id="refillsRemaining"
                          placeholder="3"
                          {...pharmacyForm.register("refillsRemaining")}
                          data-testid="input-refills-remaining"
                        />
                        {pharmacyForm.formState.errors.refillsRemaining && (
                          <p className="text-sm text-red-600 mt-1">{pharmacyForm.formState.errors.refillsRemaining.message}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Current Pharmacy Information */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Building className="h-5 w-5" />
                      Current Pharmacy Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="currentPharmacyName">Pharmacy Name</Label>
                        <Input
                          id="currentPharmacyName"
                          placeholder="CVS Pharmacy"
                          {...pharmacyForm.register("currentPharmacyName")}
                          data-testid="input-current-pharmacy-name"
                        />
                        {pharmacyForm.formState.errors.currentPharmacyName && (
                          <p className="text-sm text-red-600 mt-1">{pharmacyForm.formState.errors.currentPharmacyName.message}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="currentPharmacyPhone">Pharmacy Phone</Label>
                        <Input
                          id="currentPharmacyPhone"
                          placeholder="(555) 123-4567"
                          {...pharmacyForm.register("currentPharmacyPhone")}
                          data-testid="input-current-pharmacy-phone"
                        />
                        {pharmacyForm.formState.errors.currentPharmacyPhone && (
                          <p className="text-sm text-red-600 mt-1">{pharmacyForm.formState.errors.currentPharmacyPhone.message}</p>
                        )}
                      </div>
                    </div>
                    <div className="mt-4">
                      <Label htmlFor="currentPharmacyAddress">Pharmacy Address</Label>
                      <Textarea
                        id="currentPharmacyAddress"
                        placeholder="123 Main St, City, State 12345"
                        {...pharmacyForm.register("currentPharmacyAddress")}
                        data-testid="textarea-current-pharmacy-address"
                      />
                      {pharmacyForm.formState.errors.currentPharmacyAddress && (
                        <p className="text-sm text-red-600 mt-1">{pharmacyForm.formState.errors.currentPharmacyAddress.message}</p>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Transfer Reason */}
                  <div>
                    <Label htmlFor="transferReason">Reason for Transfer (Optional)</Label>
                    <Textarea
                      id="transferReason"
                      placeholder="Cost savings, better service, etc."
                      {...pharmacyForm.register("transferReason")}
                      data-testid="textarea-transfer-reason"
                    />
                  </div>

                  <div className="flex gap-4">
                    <Button 
                      type="submit" 
                      className="flex-1" 
                      disabled={submissionStatus === "submitting"}
                      data-testid="button-submit-pharmacy-transfer"
                    >
                      {submissionStatus === "submitting" ? (
                        <>
                          <Clock className="h-4 w-4 mr-2 animate-spin" />
                          Submitting Transfer...
                        </>
                      ) : (
                        <>
                          <ArrowRight className="h-4 w-4 mr-2" />
                          Submit Transfer Request
                        </>
                      )}
                    </Button>
                    <Link href="/dashboard">
                      <Button variant="outline">Cancel</Button>
                    </Link>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Information Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                Processing Times
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Doctor Fax (Routine):</span>
                  <Badge variant="secondary">24-48 hours</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Doctor Fax (Urgent):</span>
                  <Badge variant="secondary">Same day</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Pharmacy Transfer:</span>
                  <Badge variant="secondary">1-3 business days</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                What We Need
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Patient name and date of birth
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Current prescription information
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Doctor or pharmacy contact details
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Active membership subscription
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}