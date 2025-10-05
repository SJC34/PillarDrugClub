import { useState, useEffect } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Clock,
  Download,
  Copy,
  MessageSquare
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { DoctorSearch } from "@/components/DoctorSearch";
import { PharmacySearch } from "@/components/PharmacySearch";
import { useAuth } from "@/hooks/useAuth";
import { handleDateInputChange } from "@/lib/dateFormatter";
import { useMutation } from "@tanstack/react-query";

const doctorFaxSchema = z.object({
  patientName: z.string().min(2, "Patient name is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  drugAllergies: z.string().optional(),
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
  drugAllergies: z.string().optional(),
  medicationName: z.string().min(2, "Medication name is required"),
  dosage: z.string().min(1, "Dosage is required"),
  quantity: z.string().min(1, "Quantity is required"),
  prescriptionNumber: z.string().min(1, "Prescription number is required"),
  currentPharmacyName: z.string().min(2, "Current pharmacy name is required"),
  currentPharmacyPhone: z.string().min(10, "Current pharmacy phone is required"),
  currentPharmacyAddress: z.string().min(5, "Current pharmacy address is required"),
  lastFillDate: z.string().min(1, "Last fill date is required"),
  refillsRemaining: z.string().min(1, "Refills remaining is required"),
  transferReason: z.string().optional(),
  sendEmail: z.boolean().default(true),
  sendText: z.boolean().default(false)
});

type DoctorFaxForm = z.infer<typeof doctorFaxSchema>;
type PharmacyTransferForm = z.infer<typeof pharmacyTransferSchema>;

export default function PrescriptionTransferPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState("doctor-fax");
  const [submissionStatus, setSubmissionStatus] = useState<"idle" | "submitting" | "success">("idle");
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [selectedPharmacy, setSelectedPharmacy] = useState<any>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [messageTemplate, setMessageTemplate] = useState("");
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [prescriptionRequestId, setPrescriptionRequestId] = useState<string>("");

  const doctorForm = useForm<DoctorFaxForm>({
    resolver: zodResolver(doctorFaxSchema),
    defaultValues: {
      urgency: "routine"
    }
  });

  // Text PDF to phone mutation
  const textPdfMutation = useMutation({
    mutationFn: async (requestId: string) => {
      return apiRequest('POST', `/api/prescription-requests/${requestId}/text`);
    },
    onSuccess: () => {
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

  // Handle doctor selection from search
  const handleDoctorSelect = (doctor: any) => {
    setSelectedDoctor(doctor);
    if (doctor) {
      // Auto-populate form fields
      const fullAddress = `${doctor.address}, ${doctor.city}, ${doctor.state} ${doctor.zipCode}`;
      doctorForm.setValue("doctorName", doctor.name);
      doctorForm.setValue("doctorPhone", doctor.phone || "");
      doctorForm.setValue("doctorFax", doctor.fax || "");
      doctorForm.setValue("doctorAddress", fullAddress);
    } else {
      // Clear form fields if doctor is deselected
      doctorForm.setValue("doctorName", "");
      doctorForm.setValue("doctorPhone", "");
      doctorForm.setValue("doctorFax", "");
      doctorForm.setValue("doctorAddress", "");
    }
  };

  const pharmacyForm = useForm<PharmacyTransferForm>({
    resolver: zodResolver(pharmacyTransferSchema),
    defaultValues: {
      sendEmail: true,
      sendText: false
    }
  });

  // Prepopulate forms with user data when authenticated
  useEffect(() => {
    if (user && isAuthenticated) {
      const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
      const allergies = user.drugAllergies?.join(', ') || '';
      
      // Prepopulate doctor fax form
      if (fullName) {
        doctorForm.setValue("patientName", fullName);
      }
      if (user.dateOfBirth) {
        doctorForm.setValue("dateOfBirth", user.dateOfBirth);
      }
      if (allergies) {
        doctorForm.setValue("drugAllergies", allergies);
      }
      
      // Prepopulate pharmacy transfer form
      if (fullName) {
        pharmacyForm.setValue("patientName", fullName);
      }
      if (user.dateOfBirth) {
        pharmacyForm.setValue("dateOfBirth", user.dateOfBirth);
      }
      if (allergies) {
        pharmacyForm.setValue("drugAllergies", allergies);
      }
    }
  }, [user, isAuthenticated]);

  // Handle pharmacy selection from search
  const handlePharmacySelect = (pharmacy: any) => {
    setSelectedPharmacy(pharmacy);
    if (pharmacy) {
      // Auto-populate form fields
      const fullAddress = `${pharmacy.address}, ${pharmacy.city}, ${pharmacy.state} ${pharmacy.zipCode}`;
      pharmacyForm.setValue("currentPharmacyName", pharmacy.name);
      pharmacyForm.setValue("currentPharmacyPhone", pharmacy.phone || "");
      pharmacyForm.setValue("currentPharmacyAddress", fullAddress);
    } else {
      // Clear form fields if pharmacy is deselected
      pharmacyForm.setValue("currentPharmacyName", "");
      pharmacyForm.setValue("currentPharmacyPhone", "");
      pharmacyForm.setValue("currentPharmacyAddress", "");
    }
  };

  // Handle form submission with authentication check
  const handleDoctorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check authentication first
    if (!isAuthenticated || !user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to submit prescription requests.",
        variant: "destructive"
      });
      setLocation("/login");
      return;
    }
    
    // If authenticated, proceed with form validation and submission
    doctorForm.handleSubmit(onDoctorSubmit)(e);
  };

  const onDoctorSubmit = async (data: DoctorFaxForm) => {
    setSubmissionStatus("submitting");
    try {
      if (!user?.id) {
        throw new Error("User not authenticated");
      }
      
      // Generate PDF and message template
      const response = await fetch('/api/prescriptions/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ...data,
          userId: user.id
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      // Get message template from header
      const messageTemplateBase64 = response.headers.get('X-Message-Template');
      if (messageTemplateBase64) {
        const decodedMessage = atob(messageTemplateBase64);
        setMessageTemplate(decodedMessage);
      }

      // Get prescription request ID from header
      const requestId = response.headers.get('X-Prescription-Request-Id');
      if (requestId) {
        setPrescriptionRequestId(requestId);
      }

      // Get PDF blob
      const blob = await response.blob();
      setPdfBlob(blob);
      
      setSubmissionStatus("success");
      setShowSuccessDialog(true);
      
    } catch (error: any) {
      console.error("Doctor prescription request error:", error);
      toast({
        title: "Request Failed",
        description: "Failed to generate prescription request. Please try again.",
        variant: "destructive"
      });
      setSubmissionStatus("idle");
    }
  };

  const handleDownloadPDF = () => {
    if (pdfBlob) {
      const url = window.URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `prescription-request.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "PDF Downloaded",
        description: "Your prescription request has been downloaded.",
      });
    }
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(messageTemplate);
    toast({
      title: "Message Copied",
      description: "The message has been copied to your clipboard.",
    });
  };

  const handleCloseSuccessDialog = () => {
    setShowSuccessDialog(false);
    doctorForm.reset();
    setMessageTemplate("");
    setPdfBlob(null);
    setPrescriptionRequestId("");
    setSubmissionStatus("idle");
  };

  // Handle pharmacy form submission with authentication check
  const handlePharmacySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check authentication first
    if (!isAuthenticated || !user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to submit transfer requests.",
        variant: "destructive"
      });
      setLocation("/login");
      return;
    }
    
    // If authenticated, proceed with form validation and submission
    pharmacyForm.handleSubmit(onPharmacySubmit)(e);
  };

  const onPharmacySubmit = async (data: PharmacyTransferForm) => {
    setSubmissionStatus("submitting");
    try {
      if (!user?.id) {
        throw new Error("User not authenticated");
      }
      
      const transferData = {
        userId: user.id,
        patientName: data.patientName,
        dateOfBirth: data.dateOfBirth,
        medicationName: data.medicationName,
        dosage: data.dosage,
        quantity: data.quantity,
        prescriptionNumber: data.prescriptionNumber,
        currentPharmacyName: data.currentPharmacyName,
        currentPharmacyPhone: data.currentPharmacyPhone,
        currentPharmacyAddress: data.currentPharmacyAddress,
        lastFillDate: data.lastFillDate,
        refillsRemaining: data.refillsRemaining,
        transferReason: data.transferReason,
        sendEmail: data.sendEmail,
        sendText: data.sendText
      };

      const response = await apiRequest("POST", "/api/prescriptions/transfer", transferData);
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

  if (submissionStatus === "success" && activeTab === "pharmacy-transfer") {
    return (
      <div className="min-h-screen px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-6 md:mb-8">
            <Link href="/dashboard">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Pill className="h-8 w-8 text-primary" />
                <span className="text-xl md:text-2xl font-bold text-foreground">Pillar Drug Club</span>
              </div>
            </Link>
          </div>

          <Card className="text-center">
            <CardContent className="p-6 md:p-8">
              <CheckCircle className="h-12 w-12 md:h-16 md:w-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-xl md:text-2xl font-bold text-foreground mb-2">Request Submitted Successfully</h2>
              <p className="text-sm md:text-base text-muted-foreground mb-6">
                Your prescription transfer request has been submitted. We'll handle the transfer process for you.
              </p>
              <div className="space-y-3">
                <Link href="/dashboard">
                  <Button size="lg" className="w-full sm:w-auto">Return to Dashboard</Button>
                </Link>
                <div>
                  <Button variant="outline" onClick={() => setSubmissionStatus("idle")} className="w-full sm:w-auto">
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
    <div className="min-h-screen px-4 py-6 md:py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 md:mb-8">
          <Link href="/dashboard">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Pill className="h-8 w-8 text-primary" />
              <span className="text-xl md:text-2xl font-bold text-foreground">pillar drug club</span>
            </div>
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Prescription Transfer</h1>
          <p className="text-sm md:text-base text-muted-foreground">Get your prescriptions at wholesale prices - we'll handle the transfer process</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-0 h-auto sm:h-10">
            <TabsTrigger value="doctor-fax" className="flex items-center gap-2 h-12 sm:h-auto text-xs sm:text-sm">
              <Send className="h-4 w-4" />
              <span className="hidden sm:inline">New Prescription from Doctor</span>
              <span className="sm:hidden">New from Doctor</span>
            </TabsTrigger>
            <TabsTrigger value="pharmacy-transfer" className="flex items-center gap-2 h-12 sm:h-auto text-xs sm:text-sm">
              <Building className="h-4 w-4" />
              <span className="hidden sm:inline">Transfer from Current Pharmacy</span>
              <span className="sm:hidden">Transfer from Pharmacy</span>
            </TabsTrigger>
          </TabsList>

          {/* Doctor Fax Tab */}
          <TabsContent value="doctor-fax">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                  <Send className="h-5 w-5 text-primary" />
                  Request New Prescription from Doctor
                </CardTitle>
                <CardDescription className="text-sm md:text-base">
                  Get a prescription request form to send to your doctor. You can download it or text it to your phone, then forward it to your doctor via their patient portal or email.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleDoctorSubmit} className="space-y-6">
                  {/* Patient Information */}
                  <div>
                    <h3 className="text-base md:text-lg font-semibold mb-4 flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Patient Information
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="patientName" className="text-sm md:text-base">Full Name</Label>
                        <Input
                          id="patientName"
                          placeholder="John Smith"
                          {...doctorForm.register("patientName")}
                          data-testid="input-patient-name"
                          className="h-10 md:h-11 text-sm md:text-base"
                        />
                        {doctorForm.formState.errors.patientName && (
                          <p className="text-xs md:text-sm text-destructive mt-1">{doctorForm.formState.errors.patientName.message}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="dateOfBirth" className="text-sm md:text-base">Date of Birth</Label>
                        <Input
                          id="dateOfBirth"
                          placeholder="MM/DD/YYYY"
                          maxLength={10}
                          {...doctorForm.register("dateOfBirth")}
                          onChange={(e) => handleDateInputChange(e, (value) => doctorForm.setValue("dateOfBirth", value))}
                          data-testid="input-date-of-birth"
                          className="h-10 md:h-11 text-sm md:text-base"
                        />
                        {doctorForm.formState.errors.dateOfBirth && (
                          <p className="text-xs md:text-sm text-destructive mt-1">{doctorForm.formState.errors.dateOfBirth.message}</p>
                        )}
                      </div>
                    </div>
                    <div className="mt-4">
                      <Label htmlFor="drugAllergies" className="text-sm md:text-base">Drug Allergies (Optional)</Label>
                      <Textarea
                        id="drugAllergies"
                        placeholder="Enter any drug allergies, separated by commas (e.g., Penicillin, Sulfa drugs)"
                        {...doctorForm.register("drugAllergies")}
                        data-testid="input-drug-allergies"
                        className="min-h-[60px] resize-none text-sm md:text-base"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        List any medications you are allergic to for safety.
                      </p>
                    </div>
                  </div>

                  <Separator />

                  {/* Medication Information */}
                  <div>
                    <h3 className="text-base md:text-lg font-semibold mb-4 flex items-center gap-2">
                      <Pill className="h-5 w-5" />
                      Medication Information
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="medicationName" className="text-sm md:text-base">Medication Name</Label>
                        <Input
                          id="medicationName"
                          placeholder="Lisinopril"
                          {...doctorForm.register("medicationName")}
                          data-testid="input-medication-name"
                          className="h-10 md:h-11 text-sm md:text-base"
                        />
                        {doctorForm.formState.errors.medicationName && (
                          <p className="text-xs md:text-sm text-destructive mt-1">{doctorForm.formState.errors.medicationName.message}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="dosage" className="text-sm md:text-base">Dosage</Label>
                        <Input
                          id="dosage"
                          placeholder="10mg"
                          {...doctorForm.register("dosage")}
                          data-testid="input-dosage"
                          className="h-10 md:h-11 text-sm md:text-base"
                        />
                        {doctorForm.formState.errors.dosage && (
                          <p className="text-xs md:text-sm text-destructive mt-1">{doctorForm.formState.errors.dosage.message}</p>
                        )}
                      </div>
                      <div className="sm:col-span-2 lg:col-span-1">
                        <Label htmlFor="quantity" className="text-sm md:text-base">Quantity</Label>
                        <Input
                          id="quantity"
                          placeholder="30 tablets"
                          {...doctorForm.register("quantity")}
                          data-testid="input-quantity"
                          className="h-10 md:h-11 text-sm md:text-base"
                        />
                        {doctorForm.formState.errors.quantity && (
                          <p className="text-xs md:text-sm text-destructive mt-1">{doctorForm.formState.errors.quantity.message}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Doctor Information */}
                  <div>
                    <h3 className="text-base md:text-lg font-semibold mb-4 flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Doctor Information
                    </h3>
                    
                    {/* Doctor Search */}
                    <div className="mb-6">
                      <DoctorSearch 
                        onDoctorSelect={handleDoctorSelect}
                        selectedDoctor={selectedDoctor}
                        className="mb-4"
                      />
                    </div>
                    
                    {/* Manual Entry Fields - shown only if no doctor selected or as fallback */}
                    {!selectedDoctor && (
                      <div className="space-y-4">
                        <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                          Can't find your doctor? Enter their information manually below.
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="doctorName" className="text-sm md:text-base">Doctor Name</Label>
                            <Input
                              id="doctorName"
                              placeholder="Dr. Sarah Johnson"
                              {...doctorForm.register("doctorName")}
                              data-testid="input-doctor-name"
                              className="h-10 md:h-11 text-sm md:text-base"
                            />
                            {doctorForm.formState.errors.doctorName && (
                              <p className="text-xs md:text-sm text-destructive mt-1">{doctorForm.formState.errors.doctorName.message}</p>
                            )}
                          </div>
                          <div>
                            <Label htmlFor="doctorPhone" className="text-sm md:text-base">Phone Number</Label>
                            <Input
                              id="doctorPhone"
                              placeholder="(555) 123-4567"
                              {...doctorForm.register("doctorPhone")}
                              data-testid="input-doctor-phone"
                              className="h-10 md:h-11 text-sm md:text-base"
                            />
                            {doctorForm.formState.errors.doctorPhone && (
                              <p className="text-xs md:text-sm text-destructive mt-1">{doctorForm.formState.errors.doctorPhone.message}</p>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="doctorFax" className="text-sm md:text-base">Fax Number</Label>
                            <Input
                              id="doctorFax"
                              placeholder="(555) 123-4568"
                              {...doctorForm.register("doctorFax")}
                              data-testid="input-doctor-fax"
                              className="h-10 md:h-11 text-sm md:text-base"
                            />
                            {doctorForm.formState.errors.doctorFax && (
                              <p className="text-xs md:text-sm text-destructive mt-1">{doctorForm.formState.errors.doctorFax.message}</p>
                            )}
                          </div>
                          <div>
                            <Label htmlFor="urgency" className="text-sm md:text-base">Request Urgency</Label>
                            <Select onValueChange={(value) => doctorForm.setValue("urgency", value as any)}>
                              <SelectTrigger data-testid="select-urgency" className="h-10 md:h-11">
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
                        <div>
                          <Label htmlFor="doctorAddress" className="text-sm md:text-base">Doctor Office Address</Label>
                          <Textarea
                            id="doctorAddress"
                            placeholder="123 Medical Center Dr, City, State 12345"
                            {...doctorForm.register("doctorAddress")}
                            data-testid="textarea-doctor-address"
                            className="min-h-[80px] md:min-h-[100px] text-sm md:text-base"
                          />
                          {doctorForm.formState.errors.doctorAddress && (
                            <p className="text-xs md:text-sm text-destructive mt-1">{doctorForm.formState.errors.doctorAddress.message}</p>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Urgency selector - always shown */}
                    {selectedDoctor && (
                      <div className="mt-4">
                        <Label htmlFor="urgency" className="text-sm md:text-base">Request Urgency</Label>
                        <Select onValueChange={(value) => doctorForm.setValue("urgency", value as any)}>
                          <SelectTrigger data-testid="select-urgency" className="h-10 md:h-11">
                            <SelectValue placeholder="Select urgency" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="routine">Routine (24-48 hours)</SelectItem>
                            <SelectItem value="urgent">Urgent (Same day)</SelectItem>
                            <SelectItem value="emergency">Emergency (Immediate)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Special Instructions */}
                  <div>
                    <Label htmlFor="specialInstructions" className="text-sm md:text-base">Special Instructions (Optional)</Label>
                    <Textarea
                      id="specialInstructions"
                      placeholder="Any additional information for your doctor..."
                      {...doctorForm.register("specialInstructions")}
                      data-testid="textarea-special-instructions"
                      className="min-h-[80px] md:min-h-[100px] text-sm md:text-base"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                    <Button 
                      type="submit" 
                      className="flex-1 h-11 md:h-12 text-sm md:text-base" 
                      disabled={submissionStatus === "submitting"}
                      data-testid="button-submit-doctor-fax"
                    >
                      {submissionStatus === "submitting" ? (
                        <>
                          <Clock className="h-4 w-4 mr-2 animate-spin" />
                          Generating Form...
                        </>
                      ) : (
                        <>
                          <FileText className="h-4 w-4 mr-2" />
                          Get Prescription Request
                        </>
                      )}
                    </Button>
                    <Link href="/dashboard">
                      <Button variant="outline" className="w-full sm:w-auto h-11 md:h-12 text-sm md:text-base">Cancel</Button>
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
                <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                  <Building className="h-5 w-5 text-primary" />
                  Transfer from Current Pharmacy
                </CardTitle>
                <CardDescription className="text-sm md:text-base">
                  We'll contact your current pharmacy to transfer your existing prescription to our wholesale pricing.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePharmacySubmit} className="space-y-6">
                  {/* Patient Information */}
                  <div>
                    <h3 className="text-base md:text-lg font-semibold mb-4 flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Patient Information
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="transferPatientName" className="text-sm md:text-base">Full Name</Label>
                        <Input
                          id="transferPatientName"
                          placeholder="John Smith"
                          {...pharmacyForm.register("patientName")}
                          data-testid="input-transfer-patient-name"
                          className="h-10 md:h-11 text-sm md:text-base"
                        />
                        {pharmacyForm.formState.errors.patientName && (
                          <p className="text-xs md:text-sm text-destructive mt-1">{pharmacyForm.formState.errors.patientName.message}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="transferDateOfBirth" className="text-sm md:text-base">Date of Birth</Label>
                        <Input
                          id="transferDateOfBirth"
                          placeholder="MM/DD/YYYY"
                          maxLength={10}
                          {...pharmacyForm.register("dateOfBirth")}
                          onChange={(e) => handleDateInputChange(e, (value) => pharmacyForm.setValue("dateOfBirth", value))}
                          data-testid="input-transfer-date-of-birth"
                          className="h-10 md:h-11 text-sm md:text-base"
                        />
                        {pharmacyForm.formState.errors.dateOfBirth && (
                          <p className="text-xs md:text-sm text-destructive mt-1">{pharmacyForm.formState.errors.dateOfBirth.message}</p>
                        )}
                      </div>
                    </div>
                    <div className="mt-4">
                      <Label htmlFor="transferDrugAllergies" className="text-sm md:text-base">Drug Allergies (Optional)</Label>
                      <Textarea
                        id="transferDrugAllergies"
                        placeholder="Enter any drug allergies, separated by commas (e.g., Penicillin, Sulfa drugs)"
                        {...pharmacyForm.register("drugAllergies")}
                        data-testid="input-transfer-drug-allergies"
                        className="min-h-[60px] resize-none text-sm md:text-base"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        List any medications you are allergic to for safety.
                      </p>
                    </div>
                  </div>

                  <Separator />

                  {/* Prescription Information */}
                  <div>
                    <h3 className="text-base md:text-lg font-semibold mb-4 flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Prescription Information
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="transferMedicationName" className="text-sm md:text-base">Medication Name</Label>
                        <Input
                          id="transferMedicationName"
                          placeholder="Lisinopril"
                          {...pharmacyForm.register("medicationName")}
                          data-testid="input-transfer-medication-name"
                          className="h-10 md:h-11 text-sm md:text-base"
                        />
                        {pharmacyForm.formState.errors.medicationName && (
                          <p className="text-xs md:text-sm text-destructive mt-1">{pharmacyForm.formState.errors.medicationName.message}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="transferDosage" className="text-sm md:text-base">Dosage</Label>
                        <Input
                          id="transferDosage"
                          placeholder="10mg"
                          {...pharmacyForm.register("dosage")}
                          data-testid="input-transfer-dosage"
                          className="h-10 md:h-11 text-sm md:text-base"
                        />
                        {pharmacyForm.formState.errors.dosage && (
                          <p className="text-xs md:text-sm text-destructive mt-1">{pharmacyForm.formState.errors.dosage.message}</p>
                        )}
                      </div>
                      <div className="sm:col-span-2 lg:col-span-1">
                        <Label htmlFor="prescriptionNumber" className="text-sm md:text-base">Prescription Number</Label>
                        <Input
                          id="prescriptionNumber"
                          placeholder="RX123456789"
                          {...pharmacyForm.register("prescriptionNumber")}
                          data-testid="input-prescription-number"
                          className="h-10 md:h-11 text-sm md:text-base"
                        />
                        {pharmacyForm.formState.errors.prescriptionNumber && (
                          <p className="text-xs md:text-sm text-destructive mt-1">{pharmacyForm.formState.errors.prescriptionNumber.message}</p>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                      <div>
                        <Label htmlFor="lastFillDate" className="text-sm md:text-base">Last Fill Date</Label>
                        <Input
                          id="lastFillDate"
                          type="date"
                          {...pharmacyForm.register("lastFillDate")}
                          data-testid="input-last-fill-date"
                          className="h-10 md:h-11 text-sm md:text-base"
                        />
                        {pharmacyForm.formState.errors.lastFillDate && (
                          <p className="text-xs md:text-sm text-destructive mt-1">{pharmacyForm.formState.errors.lastFillDate.message}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="refillsRemaining" className="text-sm md:text-base">Refills Remaining</Label>
                        <Input
                          id="refillsRemaining"
                          placeholder="3"
                          {...pharmacyForm.register("refillsRemaining")}
                          data-testid="input-refills-remaining"
                          className="h-10 md:h-11 text-sm md:text-base"
                        />
                        {pharmacyForm.formState.errors.refillsRemaining && (
                          <p className="text-xs md:text-sm text-destructive mt-1">{pharmacyForm.formState.errors.refillsRemaining.message}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Current Pharmacy Information */}
                  <div>
                    <h3 className="text-base md:text-lg font-semibold mb-4 flex items-center gap-2">
                      <Building className="h-5 w-5" />
                      Current Pharmacy Information
                    </h3>
                    
                    {/* Pharmacy Search */}
                    <PharmacySearch
                      onPharmacySelect={handlePharmacySelect}
                      selectedPharmacy={selectedPharmacy}
                      className="mb-4"
                    />

                    {!selectedPharmacy && (
                      <>
                        <p className="text-sm text-muted-foreground mb-4">
                          Or enter pharmacy information manually:
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="currentPharmacyName" className="text-sm md:text-base">Pharmacy Name</Label>
                        <Input
                          id="currentPharmacyName"
                          placeholder="CVS Pharmacy"
                          {...pharmacyForm.register("currentPharmacyName")}
                          data-testid="input-current-pharmacy-name"
                          className="h-10 md:h-11 text-sm md:text-base"
                        />
                        {pharmacyForm.formState.errors.currentPharmacyName && (
                          <p className="text-xs md:text-sm text-destructive mt-1">{pharmacyForm.formState.errors.currentPharmacyName.message}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="currentPharmacyPhone" className="text-sm md:text-base">Pharmacy Phone</Label>
                        <Input
                          id="currentPharmacyPhone"
                          placeholder="(555) 123-4567"
                          {...pharmacyForm.register("currentPharmacyPhone")}
                          data-testid="input-current-pharmacy-phone"
                          className="h-10 md:h-11 text-sm md:text-base"
                        />
                        {pharmacyForm.formState.errors.currentPharmacyPhone && (
                          <p className="text-xs md:text-sm text-destructive mt-1">{pharmacyForm.formState.errors.currentPharmacyPhone.message}</p>
                        )}
                      </div>
                    </div>
                    <div className="mt-4">
                      <Label htmlFor="currentPharmacyAddress" className="text-sm md:text-base">Pharmacy Address</Label>
                      <Textarea
                        id="currentPharmacyAddress"
                        placeholder="123 Main St, City, State 12345"
                        {...pharmacyForm.register("currentPharmacyAddress")}
                        data-testid="textarea-current-pharmacy-address"
                        className="min-h-[80px] md:min-h-[100px] text-sm md:text-base"
                      />
                      {pharmacyForm.formState.errors.currentPharmacyAddress && (
                        <p className="text-xs md:text-sm text-destructive mt-1">{pharmacyForm.formState.errors.currentPharmacyAddress.message}</p>
                      )}
                    </div>
                      </>
                    )}
                  </div>

                  <Separator />

                  {/* Transfer Reason */}
                  <div>
                    <Label htmlFor="transferReason" className="text-sm md:text-base">Reason for Transfer (Optional)</Label>
                    <Textarea
                      id="transferReason"
                      placeholder="Cost savings, better service, etc."
                      {...pharmacyForm.register("transferReason")}
                      data-testid="textarea-transfer-reason"
                      className="min-h-[80px] md:min-h-[100px] text-sm md:text-base"
                    />
                  </div>

                  <Separator />

                  {/* Notification Preferences */}
                  <div>
                    <Label className="text-sm md:text-base mb-3 block">How would you like to receive the prescription form?</Label>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="sendEmail"
                          checked={pharmacyForm.watch("sendEmail")}
                          onCheckedChange={(checked) => pharmacyForm.setValue("sendEmail", !!checked)}
                          data-testid="checkbox-send-email"
                        />
                        <Label htmlFor="sendEmail" className="text-sm md:text-base font-normal cursor-pointer">
                          <Mail className="h-4 w-4 inline mr-2" />
                          Email me the form
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="sendText"
                          checked={pharmacyForm.watch("sendText")}
                          onCheckedChange={(checked) => pharmacyForm.setValue("sendText", !!checked)}
                          data-testid="checkbox-send-text"
                        />
                        <Label htmlFor="sendText" className="text-sm md:text-base font-normal cursor-pointer">
                          <Phone className="h-4 w-4 inline mr-2" />
                          Text me a notification
                        </Label>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                    <Button 
                      type="submit" 
                      className="flex-1 h-11 md:h-12 text-sm md:text-base" 
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
                      <Button variant="outline" className="w-full sm:w-auto h-11 md:h-12 text-sm md:text-base">Cancel</Button>
                    </Link>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Information Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mt-6 md:mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-base md:text-lg flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Processing Times
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                  <span className="text-sm md:text-base text-muted-foreground">Doctor Fax (Routine):</span>
                  <Badge variant="secondary" className="self-start sm:self-center text-xs">24-48 hours</Badge>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                  <span className="text-sm md:text-base text-muted-foreground">Doctor Fax (Urgent):</span>
                  <Badge variant="secondary" className="self-start sm:self-center text-xs">Same day</Badge>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                  <span className="text-sm md:text-base text-muted-foreground">Pharmacy Transfer:</span>
                  <Badge variant="secondary" className="self-start sm:self-center text-xs">1-3 business days</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base md:text-lg flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                What We Need
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-xs md:text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Patient name and date of birth</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Current prescription information</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Doctor or pharmacy contact details</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Active membership subscription</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <DialogTitle className="text-xl">Request Ready!</DialogTitle>
                <DialogDescription className="mt-1">
                  Your prescription request has been prepared
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Step 1: Download or Text PDF */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                  1
                </div>
                <h4 className="font-semibold">Get Your Prescription Request</h4>
              </div>
              <p className="text-sm text-muted-foreground ml-8">
                Download the PDF or text it to your phone
              </p>
              <div className="ml-8 flex flex-col sm:flex-row gap-2">
                <Button 
                  onClick={handleDownloadPDF} 
                  className="flex-1 sm:flex-none sm:w-auto"
                  data-testid="button-download-pdf"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
                <Button 
                  onClick={() => prescriptionRequestId && textPdfMutation.mutate(prescriptionRequestId)}
                  disabled={!prescriptionRequestId || textPdfMutation.isPending}
                  variant="outline"
                  className="flex-1 sm:flex-none sm:w-auto"
                  data-testid="button-text-pdf"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  {textPdfMutation.isPending ? "Sending..." : "Text to Phone"}
                </Button>
              </div>
            </div>

            <Separator />

            {/* Step 2: Copy Message */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                  2
                </div>
                <h4 className="font-semibold">Send to Your Doctor</h4>
              </div>
              <p className="text-sm text-muted-foreground ml-8">
                Copy this message and send it to your doctor via your patient portal or email, along with the PDF
              </p>
              <div className="ml-8 space-y-2">
                <div className="relative">
                  <Textarea 
                    value={messageTemplate} 
                    readOnly 
                    className="min-h-[200px] text-sm font-mono pr-12"
                    data-testid="textarea-message-template"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute top-2 right-2"
                    onClick={handleCopyMessage}
                    data-testid="button-copy-message"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <Separator />

            {/* Instructions */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                  3
                </div>
                <h4 className="font-semibold">How to Send</h4>
              </div>
              <div className="ml-8 space-y-2 text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Log into your doctor's patient portal (e.g., MyChart, FollowMyHealth)</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Or email your doctor's office with the message and PDF attachment</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Your doctor will send the prescription directly to Pillar Drug Club</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                onClick={handleCloseSuccessDialog} 
                variant="outline" 
                className="flex-1"
                data-testid="button-close-dialog"
              >
                Done
              </Button>
              <Button 
                onClick={handleDownloadPDF} 
                className="flex-1"
                data-testid="button-download-pdf-footer"
              >
                <Download className="h-4 w-4 mr-2" />
                Download PDF Again
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}