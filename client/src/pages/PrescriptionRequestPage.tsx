import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Pill, 
  FileText, 
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
  MessageSquare,
  DollarSign,
  ArrowRightLeft,
  Building2,
  ChevronRight
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { DoctorSearch } from "@/components/DoctorSearch";
import { MedicationSearch } from "@/components/MedicationSearch";
import { useAuth } from "@/hooks/useAuth";
import { handleDateInputChange } from "@/lib/dateFormatter";
import { useMutation } from "@tanstack/react-query";
import { trackRxSubmitted } from "@/hooks/useAnalytics";

const prescriptionRequestSchema = z.object({
  patientName: z.string().min(2, "Patient name is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  drugAllergies: z.string().optional(),
  medicationName: z.string().min(2, "Medication name is required"),
  dosage: z.string().min(1, "Dosage is required"),
  quantity: z.string().min(1, "Quantity is required"),
  // Doctor flow fields
  doctorName: z.string().optional(),
  doctorPhone: z.string().optional(),
  doctorAddress: z.string().optional(),
  // Transfer flow fields
  isTransfer: z.boolean().default(false),
  pharmacyName: z.string().optional(),
  pharmacyPhone: z.string().optional(),
  pharmacyAddress: z.string().optional(),
  urgency: z.enum(["routine", "urgent", "emergency"]),
  specialInstructions: z.string().optional(),
  sendEmail: z.boolean().default(true),
  sendText: z.boolean().default(false),
  downloadForm: z.boolean().default(false)
}).superRefine((data, ctx) => {
  if (!data.isTransfer) {
    if (!data.doctorName || data.doctorName.trim().length < 2) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Doctor name is required", path: ["doctorName"] });
    }
    if (!data.doctorPhone || data.doctorPhone.trim().length < 10) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Doctor phone is required", path: ["doctorPhone"] });
    }
    if (!data.doctorAddress || data.doctorAddress.trim().length < 5) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Doctor address is required", path: ["doctorAddress"] });
    }
  } else {
    if (!data.pharmacyName || data.pharmacyName.trim().length < 2) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Pharmacy name is required", path: ["pharmacyName"] });
    }
    if (!data.pharmacyPhone || data.pharmacyPhone.trim().length < 10) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Pharmacy phone is required", path: ["pharmacyPhone"] });
    }
  }
});

type PrescriptionRequestForm = z.infer<typeof prescriptionRequestSchema>;

export default function PrescriptionRequestPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [requestType, setRequestType] = useState<'doctor' | 'transfer' | null>(null);
  const [submissionStatus, setSubmissionStatus] = useState<"idle" | "submitting" | "success">("idle");
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [messageTemplate, setMessageTemplate] = useState("");
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [prescriptionRequestId, setPrescriptionRequestId] = useState<string>("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [submittedPharmacyName, setSubmittedPharmacyName] = useState("");

  const doctorForm = useForm<PrescriptionRequestForm>({
    resolver: zodResolver(prescriptionRequestSchema),
    defaultValues: {
      urgency: "routine",
      quantity: "90",
      sendEmail: true,
      sendText: false,
      downloadForm: false,
      isTransfer: false
    }
  });

  const handleTypeSelect = (type: 'doctor' | 'transfer') => {
    setRequestType(type);
    doctorForm.setValue('isTransfer', type === 'transfer');
    // Clear type-specific fields to avoid stale validation
    if (type === 'transfer') {
      doctorForm.clearErrors(['doctorName', 'doctorPhone', 'doctorAddress']);
    } else {
      doctorForm.clearErrors(['pharmacyName', 'pharmacyPhone', 'pharmacyAddress']);
    }
  };

  // Text PDF to phone mutation
  const textPdfMutation = useMutation({
    mutationFn: async (requestId: string) => {
      console.log('📱 Sending SMS for prescription request:', requestId);
      const response = await apiRequest('POST', `/api/prescription-requests/${requestId}/text`);
      console.log('✅ SMS response:', response);
      return response;
    },
    onSuccess: () => {
      console.log('✅ SMS sent successfully');
      toast({
        title: "SMS Sent",
        description: "Prescription request PDF link sent to your phone",
      });
    },
    onError: (error: any) => {
      console.error('❌ SMS error:', error);
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
      doctorForm.setValue("doctorAddress", fullAddress);
    } else {
      // Clear form fields if doctor is deselected
      doctorForm.setValue("doctorName", "");
      doctorForm.setValue("doctorPhone", "");
      doctorForm.setValue("doctorAddress", "");
    }
  };

  // Prepopulate form with user data when available
  useEffect(() => {
    // ProtectedRoute ensures user is authenticated - just check if user data exists
    if (user) {
      const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
      const allergies = user.drugAllergies?.join(', ') || '';
      
      if (fullName) {
        doctorForm.setValue("patientName", fullName);
      }
      if (user.dateOfBirth) {
        doctorForm.setValue("dateOfBirth", user.dateOfBirth);
      }
      if (allergies) {
        doctorForm.setValue("drugAllergies", allergies);
      }
    }
  }, [user]);

  // Prepopulate medication fields from URL parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const medicationName = params.get('medicationName');
    const dosage = params.get('dosage');
    const quantity = params.get('quantity');

    if (medicationName) {
      doctorForm.setValue("medicationName", medicationName);
    }
    if (dosage) {
      doctorForm.setValue("dosage", dosage);
    }
    if (quantity) {
      doctorForm.setValue("quantity", quantity);
    }
  }, []);

  // Handle form submission
  const handleDoctorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log("handleDoctorSubmit called");
    console.log("Form errors:", doctorForm.formState.errors);
    
    // ProtectedRoute handles authentication - just validate form
    // Validate form first
    const isValid = await doctorForm.trigger();
    if (!isValid) {
      return;
    }
    
    // Show confirmation dialog
    setShowConfirmDialog(true);
  };

  // Confirm and submit the form
  const confirmDoctorSubmit = () => {
    setShowConfirmDialog(false);
    const data = doctorForm.getValues();
    onDoctorSubmit(data);
  };

  const onDoctorSubmit = async (data: PrescriptionRequestForm) => {
    console.log("Form submitted with data:", data);
    setSubmissionStatus("submitting");
    try {
      if (!user?.id) {
        throw new Error("User not authenticated");
      }
      
      // Build request body based on request type
      const requestBody = data.isTransfer
        ? {
            ...data,
            userId: user.id,
            isTransfer: true,
            transferFromPharmacy: data.pharmacyName,
            transferFromPharmacyPhone: data.pharmacyPhone,
            transferFromPharmacyAddress: data.pharmacyAddress,
          }
        : {
            ...data,
            userId: user.id,
            isTransfer: false,
          };

      // Generate PDF and message template
      const response = await fetch('/api/prescriptions/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(requestBody)
      });

      console.log("Response status:", response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Server error:", errorData);
        throw new Error(errorData.message || 'Failed to generate PDF');
      }

      // Get message template from header
      const messageTemplateBase64 = response.headers.get('X-Message-Template');
      if (messageTemplateBase64) {
        const decodedMessage = atob(messageTemplateBase64);
        setMessageTemplate(decodedMessage);
      }

      // Get prescription request ID from header
      const requestId = response.headers.get('X-Prescription-Request-Id');
      console.log('📋 Prescription Request ID from server:', requestId);
      if (requestId) {
        setPrescriptionRequestId(requestId);
        console.log('✅ Prescription Request ID saved:', requestId);
      } else {
        console.error('❌ No Prescription Request ID in response headers');
      }

      // Capture pharmacy name for transfer success dialog
      const pharmacyName = response.headers.get('X-Transfer-Pharmacy-Name') || '';
      if (pharmacyName) {
        setSubmittedPharmacyName(decodeURIComponent(pharmacyName));
      }

      // Get PDF blob
      const blob = await response.blob();
      setPdfBlob(blob);
      
      // If download form is checked, trigger download immediately
      if (data.downloadForm) {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = data.isTransfer ? `pharmacy-transfer.pdf` : `prescription-request.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
      
      trackRxSubmitted();
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
    console.log('📥 Download PDF clicked, pdfBlob exists:', !!pdfBlob);
    if (pdfBlob) {
      const url = window.URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = requestType === 'transfer' ? `pharmacy-transfer.pdf` : `prescription-request.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "PDF Downloaded",
        description: "Your prescription request has been downloaded.",
      });
    } else {
      console.error('❌ No PDF blob available');
      toast({
        title: "Download Failed",
        description: "PDF not available. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleTextToPhone = () => {
    console.log('📱 Text to Phone button clicked');
    console.log('   - Prescription Request ID:', prescriptionRequestId);
    console.log('   - Mutation pending:', textPdfMutation.isPending);
    
    if (!prescriptionRequestId) {
      console.error('❌ No prescription request ID available');
      toast({
        title: "Error",
        description: "Prescription request ID not found. Please try submitting again.",
        variant: "destructive"
      });
      return;
    }
    
    textPdfMutation.mutate(prescriptionRequestId);
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
    doctorForm.reset({
      urgency: "routine",
      quantity: "90",
      sendEmail: true,
      sendText: false,
      downloadForm: false,
      isTransfer: requestType === 'transfer'
    });
    setMessageTemplate("");
    setPdfBlob(null);
    setPrescriptionRequestId("");
    setSubmissionStatus("idle");
    setSubmittedPharmacyName("");
  };

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
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Get Your Prescription Filled</h1>
          <p className="text-sm md:text-base text-muted-foreground">Choose how to get your medication filled at wholesale prices through HealthWarehouse</p>
        </div>

        {/* Request Type Selector */}
        <div className="mb-6">
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">How would you like to get your prescription?</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => handleTypeSelect('doctor')}
              data-testid="button-type-message-doctor"
              className={`text-left p-4 rounded-md border-2 transition-colors ${
                requestType === 'doctor'
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-card hover:border-primary/50'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`rounded-full p-2 flex-shrink-0 ${requestType === 'doctor' ? 'bg-primary/10' : 'bg-muted'}`}>
                  <Send className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-foreground">Message My Doctor</p>
                    {requestType === 'doctor' && <CheckCircle className="h-4 w-4 text-primary" />}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">I'll ask my doctor to send a new prescription directly to HealthWarehouse</p>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleTypeSelect('transfer')}
              data-testid="button-type-transfer-pharmacy"
              className={`text-left p-4 rounded-md border-2 transition-colors ${
                requestType === 'transfer'
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-card hover:border-primary/50'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`rounded-full p-2 flex-shrink-0 ${requestType === 'transfer' ? 'bg-primary/10' : 'bg-muted'}`}>
                  <ArrowRightLeft className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-foreground">Transfer from My Pharmacy</p>
                    {requestType === 'transfer' && <CheckCircle className="h-4 w-4 text-primary" />}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">I have an existing prescription — transfer it from my current pharmacy (1–2 business days)</p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Savings Explanation Section — only show for doctor flow */}
        {requestType === 'doctor' && (
        <Card className="mb-6 bg-primary/5 border-primary/20">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-start gap-4">
              <div className="hidden sm:block bg-primary/10 rounded-full p-3">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-base md:text-lg font-bold text-foreground mb-2 flex items-center gap-2">
                  <DollarSign className="h-5 w-5 sm:hidden text-primary" />
                  Maximize Your Savings with Year Supply Prescriptions
                </h3>
                <p className="text-sm md:text-base text-muted-foreground mb-3">
                  Request your chronic medications as a year supply instead of monthly refills to unlock the lowest possible prices.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-background/80 rounded-lg p-4">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Traditional Insurance Model</p>
                    <p className="text-lg font-bold text-destructive">$120/year</p>
                    <p className="text-xs text-muted-foreground">30 tablets + 11 refills<br/>$10/month copays × 12 months</p>
                    <p className="text-sm font-medium text-foreground mt-2">Example: Levothyroxine 25mcg</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-primary uppercase tracking-wide">Pharmacy Autopilot Wholesale Price</p>
                    <p className="text-lg font-bold text-primary">$7.30/year</p>
                    <p className="text-xs text-muted-foreground">#365 tablets, no refills<br/>One-time payment</p>
                    <div className="inline-flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded text-xs font-bold mt-2">
                      <CheckCircle className="h-3 w-3" />
                      Save $112.70 per year
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-3 italic">
                  Tip: Ask your doctor to write the prescription as "#365 tablets, no refills" for maximum savings on chronic medications.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        )}

        {requestType !== null && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
              {requestType === 'transfer' ? (
                <ArrowRightLeft className="h-5 w-5 text-primary" />
              ) : (
                <Send className="h-5 w-5 text-primary" />
              )}
              {requestType === 'transfer' ? 'Transfer from My Pharmacy' : 'Message My Doctor'}
            </CardTitle>
            <CardDescription className="text-sm md:text-base">
              {requestType === 'transfer'
                ? "Provide your current pharmacy's information and HealthWarehouse will contact them within 1–2 business days to transfer your prescription."
                : "We'll generate a prescription request form for you to forward to your doctor. Your doctor then sends the prescription directly to HealthWarehouse."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleDoctorSubmit} className="space-y-6">
              {/* Step 1: Patient Information */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
                {/* Left: Step Indicator */}
                <div className="lg:col-span-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                      1
                    </div>
                    <div className="hidden lg:block">
                      <p className="font-semibold text-sm text-foreground">Patient Info</p>
                      <p className="text-xs text-muted-foreground mt-1">Your details</p>
                    </div>
                  </div>
                </div>

                {/* Right: Patient Information Form */}
                <div className="lg:col-span-9 space-y-6">
                  <h3 className="text-base md:text-lg font-semibold mb-4 flex items-center gap-2 lg:hidden">
                    <User className="h-5 w-5" />
                    Patient Information
                  </h3>
                  {/* Patient Information Fields */}
                  <div>
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
                </div>
              </div>

              {/* Step 2: Medication Information */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
                {/* Left: Step Indicator */}
                <div className="lg:col-span-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                      2
                    </div>
                    <div className="hidden lg:block">
                      <p className="font-semibold text-sm text-foreground">Medication</p>
                      <p className="text-xs text-muted-foreground mt-1">What you need</p>
                    </div>
                  </div>
                </div>

                {/* Right: Medication Information */}
                <div className="lg:col-span-9">
                  <h3 className="text-base md:text-lg font-semibold mb-4 flex items-center gap-2 lg:hidden">
                    <Pill className="h-5 w-5" />
                    Medication Information
                  </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="medicationName" className="text-sm md:text-base">Medication Name</Label>
                        <MedicationSearch
                          value={doctorForm.watch("medicationName") || ""}
                          onChange={(value) => doctorForm.setValue("medicationName", value)}
                          placeholder="Search medications (e.g., Lisinopril)"
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
                        <Label htmlFor="quantity" className="text-sm md:text-base">Supply Length</Label>
                        <Select
                          value={doctorForm.watch("quantity") || ""}
                          onValueChange={(value) => doctorForm.setValue("quantity", value)}
                        >
                          <SelectTrigger className="h-10 md:h-11 text-sm md:text-base" data-testid="select-supply-length">
                            <SelectValue placeholder="Select supply length" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="30">30-day supply (#30)</SelectItem>
                            <SelectItem value="90">90-day supply (#90)</SelectItem>
                            {user?.subscriptionTier !== "free" && (
                              <>
                                <SelectItem value="180">6-month supply (#180)</SelectItem>
                                <SelectItem value="365">1-year supply (#365)</SelectItem>
                              </>
                            )}
                          </SelectContent>
                        </Select>
                        {user?.subscriptionTier === "free" && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Join Pharmacy Autopilot for up to 12-month supply access
                          </p>
                        )}
                        {doctorForm.formState.errors.quantity && (
                          <p className="text-xs md:text-sm text-destructive mt-1">{doctorForm.formState.errors.quantity.message}</p>
                        )}
                      </div>
                    </div>
                </div>
              </div>

              <Separator />

              {/* Step 3: Provider / Pharmacy Information */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
                {/* Left: Step Indicator */}
                <div className="lg:col-span-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                      3
                    </div>
                    <div className="hidden lg:block">
                      <p className="font-semibold text-sm text-foreground">{requestType === 'transfer' ? 'Pharmacy Info' : 'Doctor Info'}</p>
                      <p className="text-xs text-muted-foreground mt-1">{requestType === 'transfer' ? 'Current pharmacy' : 'Provider details'}</p>
                    </div>
                  </div>
                </div>

                {/* Right: Conditional form — Doctor or Pharmacy */}
                <div className="lg:col-span-9 space-y-4">
                  {requestType === 'transfer' ? (
                    <>
                      <h3 className="text-base md:text-lg font-semibold flex items-center gap-2 lg:hidden">
                        <Building2 className="h-5 w-5" />
                        Current Pharmacy Information
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Enter the details of the pharmacy where your prescription currently is. HealthWarehouse will contact them to initiate the transfer.
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="sm:col-span-2">
                          <Label htmlFor="pharmacyName" className="text-sm md:text-base">Pharmacy Name</Label>
                          <Input
                            id="pharmacyName"
                            placeholder="CVS, Walgreens, Rite Aid, or independent pharmacy name"
                            {...doctorForm.register("pharmacyName")}
                            data-testid="input-pharmacy-name"
                            className="h-10 md:h-11 text-sm md:text-base"
                          />
                          {doctorForm.formState.errors.pharmacyName && (
                            <p className="text-xs md:text-sm text-destructive mt-1">{doctorForm.formState.errors.pharmacyName.message}</p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="pharmacyPhone" className="text-sm md:text-base">Pharmacy Phone</Label>
                          <Input
                            id="pharmacyPhone"
                            placeholder="(555) 123-4567"
                            {...doctorForm.register("pharmacyPhone")}
                            data-testid="input-pharmacy-phone"
                            className="h-10 md:h-11 text-sm md:text-base"
                          />
                          {doctorForm.formState.errors.pharmacyPhone && (
                            <p className="text-xs md:text-sm text-destructive mt-1">{doctorForm.formState.errors.pharmacyPhone.message}</p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="pharmacyAddress" className="text-sm md:text-base">Pharmacy Address <span className="text-muted-foreground font-normal">(Optional)</span></Label>
                          <Input
                            id="pharmacyAddress"
                            placeholder="123 Main St, City, State 12345"
                            {...doctorForm.register("pharmacyAddress")}
                            data-testid="input-pharmacy-address"
                            className="h-10 md:h-11 text-sm md:text-base"
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <h3 className="text-base md:text-lg font-semibold flex items-center gap-2 lg:hidden">
                        <User className="h-5 w-5" />
                        Doctor Information
                      </h3>
                      
                      {/* Doctor Search */}
                      <DoctorSearch
                        onDoctorSelect={handleDoctorSelect}
                        selectedDoctor={selectedDoctor}
                        className="mb-4"
                      />

                      {!selectedDoctor && (
                        <>
                          <p className="text-sm text-muted-foreground">
                            Or enter doctor information manually:
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="sm:col-span-2">
                              <Label htmlFor="doctorName" className="text-sm md:text-base">Doctor's Name</Label>
                              <Input
                                id="doctorName"
                                placeholder="Dr. Jane Smith"
                                {...doctorForm.register("doctorName")}
                                data-testid="input-doctor-name"
                                className="h-10 md:h-11 text-sm md:text-base"
                              />
                              {doctorForm.formState.errors.doctorName && (
                                <p className="text-xs md:text-sm text-destructive mt-1">{doctorForm.formState.errors.doctorName.message}</p>
                              )}
                            </div>
                            <div>
                              <Label htmlFor="doctorPhone" className="text-sm md:text-base">Doctor's Phone</Label>
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
                          <div>
                            <Label htmlFor="doctorAddress" className="text-sm md:text-base">Doctor's Address</Label>
                            <Textarea
                              id="doctorAddress"
                              placeholder="123 Medical Plaza, Suite 200, City, State 12345"
                              {...doctorForm.register("doctorAddress")}
                              data-testid="textarea-doctor-address"
                              className="min-h-[80px] md:min-h-[100px] text-sm md:text-base"
                            />
                            {doctorForm.formState.errors.doctorAddress && (
                              <p className="text-xs md:text-sm text-destructive mt-1">{doctorForm.formState.errors.doctorAddress.message}</p>
                            )}
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>

              <Separator />

              {/* Step 4: Additional Details */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
                {/* Left: Step Indicator */}
                <div className="lg:col-span-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                      4
                    </div>
                    <div className="hidden lg:block">
                      <p className="font-semibold text-sm text-foreground">Details</p>
                      <p className="text-xs text-muted-foreground mt-1">Additional info</p>
                    </div>
                  </div>
                </div>

                {/* Right: Additional Details Form */}
                <div className="lg:col-span-9 space-y-4">
                  <h3 className="text-base md:text-lg font-semibold flex items-center gap-2 lg:hidden">
                    <FileText className="h-5 w-5" />
                    Additional Details
                  </h3>
                  <div>
                    <Label htmlFor="urgency" className="text-sm md:text-base">Urgency</Label>
                    <Select
                      value={doctorForm.watch("urgency")}
                      onValueChange={(value) => doctorForm.setValue("urgency", value as "routine" | "urgent" | "emergency")}
                    >
                      <SelectTrigger id="urgency" data-testid="select-urgency" className="h-10 md:h-11">
                        <SelectValue placeholder="Select urgency level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="routine">Routine (24-48 hours)</SelectItem>
                        <SelectItem value="urgent">Urgent (Same day)</SelectItem>
                        <SelectItem value="emergency">Emergency (Immediate)</SelectItem>
                      </SelectContent>
                    </Select>
                    {doctorForm.formState.errors.urgency && (
                      <p className="text-xs md:text-sm text-destructive mt-1">{doctorForm.formState.errors.urgency.message}</p>
                    )}
                  </div>

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

                  {/* Delivery Options */}
                  <div className="space-y-3 pt-2">
                    <p className="text-sm font-semibold text-foreground">Form Delivery Options</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="downloadForm"
                          checked={doctorForm.watch("downloadForm")}
                          onCheckedChange={(checked) => doctorForm.setValue("downloadForm", !!checked)}
                          data-testid="checkbox-download-form"
                        />
                        <Label htmlFor="downloadForm" className="text-sm md:text-base font-normal cursor-pointer">
                          Download PDF immediately
                        </Label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 md:gap-4 pt-4">
                <Button 
                  type="submit" 
                  className="flex-1 h-11 md:h-12 text-sm md:text-base" 
                  disabled={submissionStatus === "submitting"}
                  data-testid="button-submit-prescription-request"
                >
                  {submissionStatus === "submitting" ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      {requestType === 'transfer' ? 'Submitting Transfer...' : 'Generating Request...'}
                    </>
                  ) : (
                    <>
                      <ArrowRight className="h-4 w-4 mr-2" />
                      {requestType === 'transfer' ? 'Submit Transfer Request' : 'Generate Prescription Request'}
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
        )}

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
                  <span className="text-sm md:text-base text-muted-foreground">Routine Request:</span>
                  <Badge variant="secondary" className="self-start sm:self-center text-xs">24-48 hours</Badge>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                  <span className="text-sm md:text-base text-muted-foreground">Urgent Request:</span>
                  <Badge variant="secondary" className="self-start sm:self-center text-xs">Same day</Badge>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                  <span className="text-sm md:text-base text-muted-foreground">Emergency Request:</span>
                  <Badge variant="secondary" className="self-start sm:self-center text-xs">Immediate</Badge>
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
                  <span>Medication name, dosage, and quantity</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                  {requestType === 'transfer'
                    ? <span>Current pharmacy name and phone number</span>
                    : <span>Doctor's contact information</span>
                  }
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
                <DialogTitle className="text-xl">
                  {requestType === 'transfer' ? 'Transfer Request Submitted!' : 'Request Ready!'}
                </DialogTitle>
                <DialogDescription className="mt-1">
                  {requestType === 'transfer'
                    ? 'HealthWarehouse will contact your pharmacy to initiate the transfer'
                    : 'Your prescription request has been prepared'}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="space-y-6">
            {requestType === 'transfer' ? (
              /* Transfer success content */
              <>
                <div className="rounded-md bg-primary/5 border border-primary/20 p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <ArrowRightLeft className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-foreground">Transfer Initiated</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        HealthWarehouse will contact <strong>{submittedPharmacyName || 'your pharmacy'}</strong> within <strong>1–2 business days</strong> to transfer your prescription. No action is required from you.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-semibold text-foreground">What happens next:</p>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>HealthWarehouse contacts your current pharmacy by phone</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Prescription is transferred to HealthWarehouse (1–2 business days)</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>You'll be notified when your order is ready to ship</span>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Transfer not completed within 3 business days? Contact us at{' '}
                    <a href="mailto:support@pillardrugclub.com" className="text-primary underline">
                      support@pillardrugclub.com
                    </a>
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    onClick={handleDownloadPDF}
                    variant="outline"
                    className="flex-1"
                    data-testid="button-download-transfer-pdf"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Transfer Form
                  </Button>
                  <Button
                    onClick={handleCloseSuccessDialog}
                    className="flex-1"
                    data-testid="button-close-transfer-dialog"
                  >
                    Done
                  </Button>
                </div>
              </>
            ) : (
              /* Doctor flow success content */
              <>
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
                      onClick={handleTextToPhone}
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

                {/* Step 3: How to Send */}
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
                      <span>Your doctor will send the prescription directly to Pharmacy Autopilot</span>
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
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent data-testid="dialog-confirm-prescription">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {requestType === 'transfer' ? 'Confirm Transfer Request' : 'Confirm Prescription Request'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {requestType === 'transfer'
                ? 'Submit this pharmacy transfer request? HealthWarehouse will contact your current pharmacy within 1–2 business days to initiate the transfer.'
                : 'Are you sure you want to generate the prescription request? This will create a PDF and send notifications based on your selected options.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-confirmation">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDoctorSubmit} data-testid="button-confirm-prescription">
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
