import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Pill, Eye, EyeOff, CreditCard, Check } from "lucide-react";
import { FaApple, FaXTwitter } from "react-icons/fa6";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { apiRequest } from "@/lib/queryClient";

const registerSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phoneNumber: z.string().min(10, "Please enter a valid phone number"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
  acceptTerms: z.boolean().refine(val => val === true, "You must accept the terms and conditions"),
  smsConsent: z.boolean()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

type RegisterForm = z.infer<typeof registerSchema>;

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
      <div className="bg-gray-50 p-4 rounded-lg">
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
  // Check for Stripe configuration
  if (!STRIPE_PUBLIC_KEY) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-8">
        <div className="max-w-md mx-auto w-full">
          <Card>
            <CardHeader className="text-center">
              <Pill className="h-12 w-12 text-teal-600 mx-auto mb-4" />
              <CardTitle className="font-display">Configuration Required</CardTitle>
              <CardDescription>
                Payment processing is not properly configured. Please contact support.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Link href="/login">
                <Button variant="secondary" className="w-full">
                  Back to Login
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [step, setStep] = useState<'register' | 'payment'>('register');
  const [clientSecret, setClientSecret] = useState('');
  const [registeredUser, setRegisteredUser] = useState<any>(null);
  const { toast } = useToast();
  
  const { register, handleSubmit, formState: { errors, isSubmitting }, watch, setValue } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema)
  });

  const acceptTerms = watch("acceptTerms");

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
      // Clean up URL after a short delay to allow toast to render
      setTimeout(() => {
        window.history.replaceState({}, '', '/register');
      }, 100);
    }
  }, [toast]);

  const benefits = [
    "Access wholesale prescription pricing",
    "No insurance required", 
    "Home delivery nationwide",
    "Real cost calculator",
    "Transparent pricing",
    "Cancel anytime"
  ];

  const onSubmit = async (data: RegisterForm) => {
    try {
      // Step 1: Create account
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phoneNumber: data.phoneNumber,
          password: data.password,
          smsConsent: data.smsConsent ? "true" : "false",
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Registration failed");
      }

      // Store user info
      setRegisteredUser(result.user);
      localStorage.setItem("user", JSON.stringify(result.user));

      // Step 2: Create subscription payment intent
      try {
        const subscriptionResponse = await apiRequest("POST", "/api/create-subscription", { 
          userId: result.user.id 
        });
        const subscriptionData = await subscriptionResponse.json();

        if (subscriptionData.clientSecret) {
          setClientSecret(subscriptionData.clientSecret);
          setStep('payment');
          
          toast({
            title: "Account Created",
            description: "Now complete your payment to access wholesale pricing."
          });
        } else {
          throw new Error("Failed to initialize payment");
        }
      } catch (subscriptionError: any) {
        // If subscription creation fails, still allow user to proceed
        console.error("Subscription creation failed:", subscriptionError);
        
        toast({
          title: "Account Created Successfully",
          description: "Payment processing is temporarily unavailable. You can explore the platform and add payment later.",
          variant: "default"
        });
        
        // Redirect to dashboard even without payment
        setTimeout(() => {
          setLocation("/dashboard");
        }, 2000);
      }
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.message || "An error occurred while creating your account. Please try again.",
        variant: "destructive"
      });
    }
  };

  const onPaymentSuccess = () => {
    setLocation("/dashboard");
  };

  if (step === 'payment' && clientSecret) {
    return (
      <div className="min-h-screen px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-6 md:mb-8">
            <Link href="/">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Pill className="h-8 w-8 text-teal-600" />
                <span className="text-xl md:text-2xl font-bold text-foreground">Pillar Drug Club</span>
              </div>
            </Link>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Complete Your Registration</h1>
            <p className="text-sm md:text-base text-muted-foreground">Subscribe for $10/month to access wholesale pricing</p>
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
            <Button variant="secondary" onClick={() => setStep('register')} data-testid="button-back-to-register" className="w-full sm:w-auto">
              Back to Registration
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Join the Club</h1>
          <p className="text-sm md:text-base text-muted-foreground">Create your account and start saving on prescriptions</p>
        </div>

        {/* Registration Form */}
        <Card className="border-secondary/20">
          <CardHeader>
            <CardTitle className="text-lg md:text-xl font-display">Create Account</CardTitle>
            <CardDescription className="text-sm md:text-base">
              Sign up for $10/month access to wholesale prescription pricing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm md:text-base">First Name</Label>
                  <Input
                    id="firstName"
                    placeholder="John"
                    {...register("firstName")}
                    data-testid="input-first-name"
                    className="h-10 md:h-11"
                  />
                  {errors.firstName && (
                    <p className="text-xs md:text-sm text-destructive">{errors.firstName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm md:text-base">Last Name</Label>
                  <Input
                    id="lastName"
                    placeholder="Smith"
                    {...register("lastName")}
                    data-testid="input-last-name"
                    className="h-10 md:h-11"
                  />
                  {errors.lastName && (
                    <p className="text-xs md:text-sm text-destructive">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm md:text-base">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  {...register("email")}
                  data-testid="input-email"
                  className="h-10 md:h-11"
                />
                {errors.email && (
                  <p className="text-xs md:text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneNumber" className="text-sm md:text-base">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  placeholder="(555) 123-4567"
                  {...register("phoneNumber")}
                  data-testid="input-phone-number"
                  className="h-10 md:h-11"
                />
                {errors.phoneNumber && (
                  <p className="text-xs md:text-sm text-destructive">{errors.phoneNumber.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm md:text-base">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a secure password"
                    {...register("password")}
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
                {errors.password && (
                  <p className="text-xs md:text-sm text-destructive">{errors.password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm md:text-base">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    {...register("confirmPassword")}
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
                {errors.confirmPassword && (
                  <p className="text-xs md:text-sm text-destructive">{errors.confirmPassword.message}</p>
                )}
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="smsConsent"
                  onCheckedChange={(checked) => setValue("smsConsent", checked as boolean)}
                  data-testid="checkbox-sms-consent"
                  className="mt-1"
                />
                <Label htmlFor="smsConsent" className="text-xs md:text-sm leading-relaxed">
                  I consent to receive text messages about my prescriptions, orders, and account updates. Message frequency varies. Message and data rates may apply. Reply HELP for help or STOP to cancel.
                </Label>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="acceptTerms"
                  checked={acceptTerms}
                  onCheckedChange={(checked) => setValue("acceptTerms", checked as boolean)}
                  data-testid="checkbox-accept-terms"
                  className="mt-1"
                />
                <Label htmlFor="acceptTerms" className="text-xs md:text-sm leading-relaxed">
                  I agree to the{" "}
                  <a href="#" className="text-teal-600 hover:underline">
                    Terms of Service
                  </a>{" "}
                  (including SMS consent policies) and{" "}
                  <a href="#" className="text-teal-600 hover:underline">
                    Privacy Policy
                  </a>
                </Label>
              </div>
              {errors.acceptTerms && (
                <p className="text-xs md:text-sm text-destructive">{errors.acceptTerms.message}</p>
              )}

              <Button 
                type="submit" 
                className="w-full h-11 md:h-12 text-sm md:text-base" 
                disabled={isSubmitting}
                data-testid="button-register-submit"
              >
                {isSubmitting ? "Creating Account..." : "Create Account & Subscribe"}
              </Button>
            </form>

            {/* Social Sign Up Separator */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            {/* Social Sign Up Buttons */}
            <div className="space-y-3">
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
                className="w-full h-11 md:h-12 bg-black text-white hover:bg-gray-900"
                onClick={() => window.location.href = '/api/auth/twitter'}
                data-testid="button-x-register"
              >
                <FaXTwitter className="mr-2 h-5 w-5" />
                <span className="text-sm md:text-base">Continue with X</span>
              </Button>
            </div>

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

        {/* Back to Home */}
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