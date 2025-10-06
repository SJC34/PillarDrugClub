import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Pill, Eye, EyeOff, CreditCard, Check, ArrowRight, ArrowLeft, Building, Send, User, Calendar } from "lucide-react";
import { FaApple, FaXTwitter } from "react-icons/fa6";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { apiRequest } from "@/lib/queryClient";
import { DoctorSearch } from "@/components/DoctorSearch";
import { PharmacySearch } from "@/components/PharmacySearch";
import { MedicationSearch } from "@/components/MedicationSearch";
import { handleDateInputChange } from "@/lib/dateFormatter";

// Schemas for different steps
const step1SocialSchema = z.object({
  authMethod: z.enum(["social", "email"])
});

const step2DetailsSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  email: z.string().email("Please enter a valid email address").optional(),
  phoneNumber: z.string().min(10, "Please enter a valid phone number"),
  password: z.string().min(8, "Password must be at least 8 characters").optional(),
  confirmPassword: z.string().optional(),
  drugAllergies: z.string().optional(),
  smsConsent: z.boolean()
});

const step3RxPreferenceSchema = z.object({
  rxType: z.enum(["new", "transfer", "skip"]),
  // New RX fields
  medicationName: z.string().optional(),
  dosage: z.string().optional(),
  quantity: z.string().optional(),
  doctorName: z.string().optional(),
  doctorEmail: z.string().optional(),
  doctorPhone: z.string().optional(),
  doctorFax: z.string().optional(),
  doctorAddress: z.string().optional(),
  urgency: z.enum(["routine", "urgent", "emergency"]).optional(),
  // Transfer RX fields
  prescriptionNumber: z.string().optional(),
  currentPharmacyName: z.string().optional(),
  currentPharmacyPhone: z.string().optional(),
  currentPharmacyAddress: z.string().optional(),
  lastFillDate: z.string().optional(),
  refillsRemaining: z.string().optional()
});

type Step2DetailsForm = z.infer<typeof step2DetailsSchema>;
type Step3RxPreferenceForm = z.infer<typeof step3RxPreferenceSchema>;

// Load Stripe
const STRIPE_PUBLIC_KEY = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
const stripePromise = STRIPE_PUBLIC_KEY ? loadStripe(STRIPE_PUBLIC_KEY) : null;

// Payment form component
const PaymentForm = ({ clientSecret, onSuccess }: { clientSecret: string; onSuccess: () => void }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + "/dashboard",
      },
      redirect: "if_required",
    });

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
      setIsLoading(false);
    } else {
      toast({
        title: "Registration Complete!",
        description: "Welcome to Pillar Drug Club! You now have access to wholesale pricing.",
      });
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
        <PaymentElement />
      </div>
      <Button 
        type="submit" 
        className="w-full" 
        disabled={!stripe || isLoading}
        data-testid="button-complete-subscription"
      >
        {isLoading ? "Processing Payment..." : "Complete Registration - $10/month"}
      </Button>
    </form>
  );
};

export default function RegisterPage() {
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [authMethod, setAuthMethod] = useState<"social" | "email">("social");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [clientSecret, setClientSecret] = useState('');
  const [registeredUser, setRegisteredUser] = useState<any>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [selectedPharmacy, setSelectedPharmacy] = useState<any>(null);
  const [selectedMedication, setSelectedMedication] = useState<any>(null);
  const { toast } = useToast();

  // Forms for each step
  const step2Form = useForm<Step2DetailsForm>({
    resolver: zodResolver(step2DetailsSchema),
    defaultValues: {
      smsConsent: false
    }
  });

  const step3Form = useForm<Step3RxPreferenceForm>({
    resolver: zodResolver(step3RxPreferenceSchema),
    defaultValues: {
      rxType: "skip",
      urgency: "routine"
    }
  });

  // Check for error parameter in URL (from OAuth failures)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get('error');
    if (error) {
      toast({
        title: "Authentication Error",
        description: error,
        variant: "destructive"
      });
      setTimeout(() => {
        window.history.replaceState({}, '', '/register');
      }, 100);
    }
  }, [toast]);

  // Check for OAuth success
  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) {
      try {
        const userData = JSON.parse(user);
        if (userData.id) {
          // User authenticated via OAuth, move to step 2
          setRegisteredUser(userData);
          setCurrentStep(2);
          
          // Pre-fill email and name if available
          if (userData.email) {
            step2Form.setValue("email", userData.email);
          }
          if (userData.firstName) {
            step2Form.setValue("firstName", userData.firstName);
          }
          if (userData.lastName) {
            step2Form.setValue("lastName", userData.lastName);
          }
        }
      } catch (e) {
        console.error("Error parsing user data:", e);
      }
    }
  }, []);

  const benefits = [
    "Access wholesale prescription pricing",
    "No insurance required", 
    "Home delivery nationwide",
    "Real cost calculator",
    "Transparent pricing",
    "Cancel anytime"
  ];

  // Handle doctor selection
  const handleDoctorSelect = (doctor: any) => {
    setSelectedDoctor(doctor);
    if (doctor) {
      const fullAddress = `${doctor.address}, ${doctor.city}, ${doctor.state} ${doctor.zipCode}`;
      step3Form.setValue("doctorName", doctor.name);
      step3Form.setValue("doctorPhone", doctor.phone || "");
      step3Form.setValue("doctorFax", doctor.fax || "");
      step3Form.setValue("doctorAddress", fullAddress);
    }
  };

  // Handle pharmacy selection
  const handlePharmacySelect = (pharmacy: any) => {
    setSelectedPharmacy(pharmacy);
    if (pharmacy) {
      const fullAddress = `${pharmacy.address}, ${pharmacy.city}, ${pharmacy.state} ${pharmacy.zipCode}`;
      step3Form.setValue("currentPharmacyName", pharmacy.name);
      step3Form.setValue("currentPharmacyPhone", pharmacy.phone || "");
      step3Form.setValue("currentPharmacyAddress", fullAddress);
    }
  };

  // Handle medication selection
  const handleMedicationSelect = (medication: any) => {
    setSelectedMedication(medication);
    if (medication) {
      step3Form.setValue("medicationName", medication.name);
      step3Form.setValue("dosage", medication.strength || "");
    }
  };

  // Step 2: Submit user details
  const onStep2Submit = async (data: Step2DetailsForm) => {
    try {
      // If social auth, user is already created, just update phone and SMS consent
      if (registeredUser?.id) {
        // Update user with additional details
        const response = await apiRequest("PATCH", `/api/users/${registeredUser.id}`, {
          phoneNumber: data.phoneNumber,
          dateOfBirth: data.dateOfBirth,
          smsConsent: data.smsConsent ? "true" : "false",
          firstName: data.firstName,
          lastName: data.lastName,
          drugAllergies: data.drugAllergies ? data.drugAllergies.split(',').map(a => a.trim()).filter(Boolean) : []
        });

        if (!response.ok) {
          throw new Error("Failed to update user details");
        }

        const updatedUser = await response.json();
        setRegisteredUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
        
        setCurrentStep(3);
      } else {
        // Email/password registration - create new account
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            firstName: data.firstName,
            lastName: data.lastName,
            dateOfBirth: data.dateOfBirth,
            email: data.email,
            phoneNumber: data.phoneNumber,
            password: data.password,
            smsConsent: data.smsConsent ? "true" : "false",
            drugAllergies: data.drugAllergies ? data.drugAllergies.split(',').map(a => a.trim()).filter(Boolean) : []
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Registration failed");
        }

        setRegisteredUser(result.user);
        localStorage.setItem("user", JSON.stringify(result.user));
        
        setCurrentStep(3);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save your information. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Step 3: Submit RX preference
  const onStep3Submit = async (data: Step3RxPreferenceForm) => {
    try {
      // Save RX preference if not skipped
      if (data.rxType !== "skip") {
        if (data.rxType === "new") {
          // Validate required fields for new RX
          if (!data.medicationName || !data.dosage || !data.quantity || !data.doctorName) {
            toast({
              title: "Missing Information",
              description: "Please fill in all required fields for your prescription request.",
              variant: "destructive"
            });
            return;
          }

          // Submit new RX request
          const response = await fetch('/api/prescriptions/generate-pdf', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              patientName: `${registeredUser.firstName} ${registeredUser.lastName}`,
              dateOfBirth: registeredUser.dateOfBirth || "",
              medicationName: data.medicationName,
              dosage: data.dosage,
              quantity: data.quantity,
              doctorName: data.doctorName,
              doctorEmail: data.doctorEmail || "",
              doctorPhone: data.doctorPhone || "",
              doctorFax: data.doctorFax || "",
              doctorAddress: data.doctorAddress || "",
              urgency: data.urgency || "routine",
              userId: registeredUser.id
            })
          });

          if (!response.ok) {
            throw new Error('Failed to save prescription request');
          }
        } else if (data.rxType === "transfer") {
          // Validate required fields for transfer
          if (!data.medicationName || !data.prescriptionNumber || !data.currentPharmacyName) {
            toast({
              title: "Missing Information",
              description: "Please fill in all required fields for your prescription transfer.",
              variant: "destructive"
            });
            return;
          }

          // Submit transfer request
          const response = await apiRequest("POST", "/api/prescriptions/transfer", {
            patientName: `${registeredUser.firstName} ${registeredUser.lastName}`,
            dateOfBirth: registeredUser.dateOfBirth || "",
            medicationName: data.medicationName,
            dosage: data.dosage || "",
            quantity: data.quantity || "",
            prescriptionNumber: data.prescriptionNumber,
            currentPharmacyName: data.currentPharmacyName,
            currentPharmacyPhone: data.currentPharmacyPhone || "",
            currentPharmacyAddress: data.currentPharmacyAddress || "",
            lastFillDate: data.lastFillDate || "",
            refillsRemaining: data.refillsRemaining || "",
            userId: registeredUser.id
          });

          if (!response.ok) {
            throw new Error('Failed to save prescription transfer');
          }
        }
      }

      // Check if Stripe is configured
      if (!STRIPE_PUBLIC_KEY) {
        // Skip payment step if Stripe is not configured
        toast({
          title: "Registration Complete!",
          description: "Welcome to Pillar Drug Club! You can subscribe later to access wholesale pricing.",
        });
        setLocation("/dashboard");
        return;
      }

      // Move to payment step
      const subscriptionResponse = await apiRequest("POST", "/api/create-subscription", { 
        userId: registeredUser.id 
      });
      const subscriptionData = await subscriptionResponse.json();

      if (subscriptionData.clientSecret) {
        setClientSecret(subscriptionData.clientSecret);
        setCurrentStep(4);
      } else {
        throw new Error("Payment setup failed. Please try again or contact support.");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save prescription information. Please try again.",
        variant: "destructive"
      });
    }
  };

  const onPaymentSuccess = () => {
    setLocation("/dashboard");
  };

  const rxType = step3Form.watch("rxType");

  // Step 1: Choose Authentication Method
  if (currentStep === 1) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-6 md:mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Join Pillar Drug Club</h1>
            <p className="text-sm md:text-base text-muted-foreground">Get wholesale prescription pricing for $10/month</p>
          </div>

          <Card className="border-secondary/20">
            <CardHeader>
              <CardTitle className="text-lg md:text-xl font-display">Choose Sign Up Method</CardTitle>
              <CardDescription className="text-sm md:text-base">
                Step 1 of 4 - Select how you'd like to create your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Social Sign Up Buttons */}
              <div className="space-y-3">
                <p className="text-sm font-semibold text-foreground">Recommended: Sign up with social account</p>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-11 md:h-12"
                  onClick={() => window.location.href = '/api/auth/google'}
                  data-testid="button-google-register"
                >
                  <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span className="text-sm md:text-base">Continue with Google</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-11 md:h-12"
                  onClick={() => window.location.href = '/api/auth/apple'}
                  data-testid="button-apple-register"
                >
                  <FaApple className="mr-2 h-5 w-5" />
                  <span className="text-sm md:text-base">Continue with Apple</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-11 md:h-12 bg-black text-white hover:bg-gray-900 dark:hover:bg-gray-800"
                  onClick={() => window.location.href = '/api/auth/twitter'}
                  data-testid="button-x-register"
                >
                  <FaXTwitter className="mr-2 h-5 w-5" />
                  <span className="text-sm md:text-base">Continue with X</span>
                </Button>
              </div>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or use email</span>
                </div>
              </div>

              <Button
                type="button"
                variant="secondary"
                className="w-full h-11 md:h-12"
                onClick={() => {
                  setAuthMethod("email");
                  setCurrentStep(2);
                }}
                data-testid="button-email-register"
              >
                Sign up with Email & Password
              </Button>

              <div className="mt-6 text-center">
                <div className="text-xs md:text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <Link href="/login">
                    <Button variant="ghost" className="p-0 h-auto font-semibold text-teal-600">
                      Sign in
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="text-center mt-6">
            <Link href="/">
              <Button variant="secondary" data-testid="button-back-home" className="w-full sm:w-auto">
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Collect Additional Details
  if (currentStep === 2) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-6 md:mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Your Information</h1>
            <p className="text-sm md:text-base text-muted-foreground">Complete your profile to continue</p>
          </div>

          <Card className="border-secondary/20">
            <CardHeader>
              <CardTitle className="text-lg md:text-xl font-display">Contact Details</CardTitle>
              <CardDescription className="text-sm md:text-base">
                Step 2 of 4 - We need a few more details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={step2Form.handleSubmit(onStep2Submit)} className="space-y-4">
                {!registeredUser?.id && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName" className="text-sm md:text-base">First Name</Label>
                        <Input
                          id="firstName"
                          placeholder="John"
                          {...step2Form.register("firstName")}
                          data-testid="input-first-name"
                          className="h-10 md:h-11"
                        />
                        {step2Form.formState.errors.firstName && (
                          <p className="text-xs md:text-sm text-destructive">{step2Form.formState.errors.firstName.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="lastName" className="text-sm md:text-base">Last Name</Label>
                        <Input
                          id="lastName"
                          placeholder="Smith"
                          {...step2Form.register("lastName")}
                          data-testid="input-last-name"
                          className="h-10 md:h-11"
                        />
                        {step2Form.formState.errors.lastName && (
                          <p className="text-xs md:text-sm text-destructive">{step2Form.formState.errors.lastName.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm md:text-base">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="john@example.com"
                        {...step2Form.register("email")}
                        data-testid="input-email"
                        className="h-10 md:h-11"
                      />
                      {step2Form.formState.errors.email && (
                        <p className="text-xs md:text-sm text-destructive">{step2Form.formState.errors.email.message}</p>
                      )}
                    </div>
                  </>
                )}

                {registeredUser?.id && (
                  <div className="space-y-2">
                    <Label className="text-sm md:text-base">Signed in as</Label>
                    <div className="p-3 bg-muted rounded-lg text-sm">
                      <p className="font-semibold">{registeredUser.firstName} {registeredUser.lastName}</p>
                      <p className="text-muted-foreground">{registeredUser.email}</p>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="phoneNumber" className="text-sm md:text-base">Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    placeholder="(555) 123-4567"
                    {...step2Form.register("phoneNumber")}
                    data-testid="input-phone-number"
                    className="h-10 md:h-11"
                  />
                  {step2Form.formState.errors.phoneNumber && (
                    <p className="text-xs md:text-sm text-destructive">{step2Form.formState.errors.phoneNumber.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth" className="text-sm md:text-base">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    placeholder="MM/DD/YYYY"
                    maxLength={10}
                    {...step2Form.register("dateOfBirth")}
                    onChange={(e) => handleDateInputChange(e, (value) => step2Form.setValue("dateOfBirth", value))}
                    data-testid="input-date-of-birth"
                    className="h-10 md:h-11"
                  />
                  {step2Form.formState.errors.dateOfBirth && (
                    <p className="text-xs md:text-sm text-destructive">{step2Form.formState.errors.dateOfBirth.message}</p>
                  )}
                </div>

                {!registeredUser?.id && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-sm md:text-base">Password</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Create a secure password"
                          {...step2Form.register("password")}
                          data-testid="input-password"
                          className="h-10 md:h-11 pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                          data-testid="button-toggle-password"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                      {step2Form.formState.errors.password && (
                        <p className="text-xs md:text-sm text-destructive">{step2Form.formState.errors.password.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-sm md:text-base">Confirm Password</Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirm your password"
                          {...step2Form.register("confirmPassword")}
                          data-testid="input-confirm-password"
                          className="h-10 md:h-11 pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          data-testid="button-toggle-confirm-password"
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                      {step2Form.formState.errors.confirmPassword && (
                        <p className="text-xs md:text-sm text-destructive">{step2Form.formState.errors.confirmPassword.message}</p>
                      )}
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label htmlFor="drugAllergies" className="text-sm md:text-base">Drug Allergies (Optional)</Label>
                  <Textarea
                    id="drugAllergies"
                    placeholder="Enter any drug allergies, separated by commas (e.g., Penicillin, Sulfa drugs)"
                    {...step2Form.register("drugAllergies")}
                    data-testid="input-drug-allergies"
                    className="min-h-[80px] resize-none"
                  />
                  <p className="text-xs text-muted-foreground">
                    List any medications you are allergic to. This helps us ensure your safety.
                  </p>
                </div>

                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="smsConsent"
                    onCheckedChange={(checked) => step2Form.setValue("smsConsent", checked as boolean)}
                    data-testid="checkbox-sms-consent"
                    className="mt-1"
                  />
                  <Label htmlFor="smsConsent" className="text-xs md:text-sm leading-relaxed">
                    I consent to receive text messages about my prescriptions, orders, and account updates. Message frequency varies. Message and data rates may apply. Reply HELP for help or STOP to cancel.
                  </Label>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep(1)}
                    data-testid="button-back-step1"
                    className="flex-1"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1" 
                    disabled={step2Form.formState.isSubmitting}
                    data-testid="button-continue-step2"
                  >
                    Continue
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Step 3: RX Preference
  if (currentStep === 3) {
    return (
      <div className="min-h-screen px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-6 md:mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Prescription Setup</h1>
            <p className="text-sm md:text-base text-muted-foreground">Do you need to request or transfer a prescription?</p>
          </div>

          <Card className="border-secondary/20">
            <CardHeader>
              <CardTitle className="text-lg md:text-xl font-display">Choose Your Option</CardTitle>
              <CardDescription className="text-sm md:text-base">
                Step 3 of 4 - You can skip this step and add prescriptions later
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={step3Form.handleSubmit(onStep3Submit)} className="space-y-6">
                {/* RX Type Selection */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Select an option:</Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Card 
                      className={`cursor-pointer hover-elevate ${rxType === "new" ? "border-primary" : ""}`}
                      onClick={() => step3Form.setValue("rxType", "new")}
                      data-testid="card-rx-new"
                    >
                      <CardContent className="p-4 text-center">
                        <Send className="h-8 w-8 mx-auto mb-2 text-primary" />
                        <p className="font-semibold text-sm">Request New RX</p>
                        <p className="text-xs text-muted-foreground mt-1">From your doctor</p>
                      </CardContent>
                    </Card>

                    <Card 
                      className={`cursor-pointer hover-elevate ${rxType === "transfer" ? "border-primary" : ""}`}
                      onClick={() => step3Form.setValue("rxType", "transfer")}
                      data-testid="card-rx-transfer"
                    >
                      <CardContent className="p-4 text-center">
                        <Building className="h-8 w-8 mx-auto mb-2 text-primary" />
                        <p className="font-semibold text-sm">Transfer RX</p>
                        <p className="text-xs text-muted-foreground mt-1">From current pharmacy</p>
                      </CardContent>
                    </Card>

                    <Card 
                      className={`cursor-pointer hover-elevate ${rxType === "skip" ? "border-primary" : ""}`}
                      onClick={() => step3Form.setValue("rxType", "skip")}
                      data-testid="card-rx-skip"
                    >
                      <CardContent className="p-4 text-center">
                        <ArrowRight className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="font-semibold text-sm">Skip for Now</p>
                        <p className="text-xs text-muted-foreground mt-1">Add prescriptions later</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* New RX Form */}
                {rxType === "new" && (
                  <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
                    <h3 className="font-semibold text-base flex items-center gap-2">
                      <Send className="h-5 w-5 text-primary" />
                      Request New Prescription from Doctor
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <Label className="mb-2 block">Search for Medication</Label>
                        <MedicationSearch 
                          onSelect={handleMedicationSelect} 
                          selectedMedication={selectedMedication}
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="medicationName">Medication Name *</Label>
                          <Input
                            id="medicationName"
                            placeholder="e.g., Atorvastatin"
                            {...step3Form.register("medicationName")}
                            data-testid="input-medication-name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="dosage">Dosage *</Label>
                          <Input
                            id="dosage"
                            placeholder="e.g., 20mg"
                            {...step3Form.register("dosage")}
                            data-testid="input-dosage"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="quantity">Quantity *</Label>
                        <Input
                          id="quantity"
                          placeholder="e.g., 90 tablets"
                          {...step3Form.register("quantity")}
                          data-testid="input-quantity"
                        />
                      </div>

                      <Separator />

                      <div>
                        <Label className="mb-2 block">Find Your Doctor</Label>
                        <DoctorSearch onDoctorSelect={handleDoctorSelect} />
                      </div>

                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="doctorName">Doctor Name *</Label>
                          <Input
                            id="doctorName"
                            placeholder="Dr. Jane Smith"
                            {...step3Form.register("doctorName")}
                            data-testid="input-doctor-name"
                          />
                        </div>

                        <div>
                          <Label htmlFor="doctorEmail">Doctor Email</Label>
                          <Input
                            id="doctorEmail"
                            type="email"
                            placeholder="doctor@example.com"
                            {...step3Form.register("doctorEmail")}
                            data-testid="input-doctor-email"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="doctorPhone">Doctor Phone</Label>
                            <Input
                              id="doctorPhone"
                              placeholder="(555) 123-4567"
                              {...step3Form.register("doctorPhone")}
                              data-testid="input-doctor-phone"
                            />
                          </div>
                          <div>
                            <Label htmlFor="doctorFax">Doctor Fax</Label>
                            <Input
                              id="doctorFax"
                              placeholder="(555) 123-4568"
                              {...step3Form.register("doctorFax")}
                              data-testid="input-doctor-fax"
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="doctorAddress">Doctor Address</Label>
                          <Input
                            id="doctorAddress"
                            placeholder="123 Medical Plaza, City, ST 12345"
                            {...step3Form.register("doctorAddress")}
                            data-testid="input-doctor-address"
                          />
                        </div>

                        <div>
                          <Label htmlFor="urgency">Urgency</Label>
                          <Select 
                            onValueChange={(value) => step3Form.setValue("urgency", value as any)}
                            defaultValue="routine"
                          >
                            <SelectTrigger data-testid="select-urgency">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="routine">Routine</SelectItem>
                              <SelectItem value="urgent">Urgent</SelectItem>
                              <SelectItem value="emergency">Emergency</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Transfer RX Form */}
                {rxType === "transfer" && (
                  <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
                    <h3 className="font-semibold text-base flex items-center gap-2">
                      <Building className="h-5 w-5 text-primary" />
                      Transfer from Current Pharmacy
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <Label className="mb-2 block">Search for Medication</Label>
                        <MedicationSearch 
                          onSelect={handleMedicationSelect} 
                          selectedMedication={selectedMedication}
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="transferMedicationName">Medication Name *</Label>
                          <Input
                            id="transferMedicationName"
                            placeholder="e.g., Atorvastatin"
                            {...step3Form.register("medicationName")}
                            data-testid="input-transfer-medication-name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="prescriptionNumber">Prescription Number *</Label>
                          <Input
                            id="prescriptionNumber"
                            placeholder="RX123456"
                            {...step3Form.register("prescriptionNumber")}
                            data-testid="input-prescription-number"
                          />
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <Label className="mb-2 block">Find Your Current Pharmacy</Label>
                        <PharmacySearch onPharmacySelect={handlePharmacySelect} />
                      </div>

                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="currentPharmacyName">Current Pharmacy Name *</Label>
                          <Input
                            id="currentPharmacyName"
                            placeholder="CVS Pharmacy"
                            {...step3Form.register("currentPharmacyName")}
                            data-testid="input-current-pharmacy-name"
                          />
                        </div>

                        <div>
                          <Label htmlFor="currentPharmacyPhone">Pharmacy Phone</Label>
                          <Input
                            id="currentPharmacyPhone"
                            placeholder="(555) 123-4567"
                            {...step3Form.register("currentPharmacyPhone")}
                            data-testid="input-current-pharmacy-phone"
                          />
                        </div>

                        <div>
                          <Label htmlFor="currentPharmacyAddress">Pharmacy Address</Label>
                          <Input
                            id="currentPharmacyAddress"
                            placeholder="123 Main St, City, ST 12345"
                            {...step3Form.register("currentPharmacyAddress")}
                            data-testid="input-current-pharmacy-address"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="lastFillDate">Last Fill Date</Label>
                            <Input
                              id="lastFillDate"
                              type="date"
                              {...step3Form.register("lastFillDate")}
                              data-testid="input-last-fill-date"
                            />
                          </div>
                          <div>
                            <Label htmlFor="refillsRemaining">Refills Remaining</Label>
                            <Input
                              id="refillsRemaining"
                              placeholder="3"
                              {...step3Form.register("refillsRemaining")}
                              data-testid="input-refills-remaining"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep(2)}
                    data-testid="button-back-step2"
                    className="flex-1"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1" 
                    disabled={step3Form.formState.isSubmitting}
                    data-testid="button-continue-step3"
                  >
                    {rxType === "skip" ? "Skip & Continue" : "Save & Continue"}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Step 4: Payment
  if (currentStep === 4 && clientSecret) {
    return (
      <div className="min-h-screen px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-6 md:mb-8">
            <Link href="/">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Pill className="h-8 w-8 text-teal-600" />
                <span className="text-xl md:text-2xl font-bold text-foreground">Pillar Drug Club</span>
              </div>
            </Link>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Complete Your Registration</h1>
            <p className="text-sm md:text-base text-muted-foreground">Step 4 of 4 - Subscribe for $10/month to access wholesale pricing</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            {/* Benefits */}
            <Card className="border-secondary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg md:text-xl font-display">
                  <Check className="h-5 w-5 text-secondary" />
                  Your Membership Benefits
                </CardTitle>
                <CardDescription className="text-sm md:text-base">
                  Everything included in your $10/month subscription
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {benefits.map((benefit, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-secondary flex-shrink-0 mt-0.5" />
                      <span className="text-sm md:text-base text-foreground">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Payment Form */}
            <Card className="border-secondary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg md:text-xl font-display">
                  <CreditCard className="h-5 w-5 text-teal-600" />
                  Payment Information
                </CardTitle>
                <CardDescription className="text-sm md:text-base">
                  Secure payment powered by Stripe
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl md:text-3xl font-bold text-teal-600">$10</div>
                    <div className="text-sm md:text-base text-muted-foreground">per month</div>
                    <div className="text-xs md:text-sm text-muted-foreground mt-1">Cancel anytime</div>
                  </div>
                </div>

                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <PaymentForm clientSecret={clientSecret} onSuccess={onPaymentSuccess} />
                </Elements>

                <div className="mt-4 text-center text-xs md:text-sm text-muted-foreground">
                  Your payment information is secure and encrypted.
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-6 md:mt-8">
            <Button variant="outline" onClick={() => setCurrentStep(3)} data-testid="button-back-step3">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Prescription Setup
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
