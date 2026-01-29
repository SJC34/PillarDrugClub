import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Pill, Check, CreditCard, AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
const STRIPE_PUBLIC_KEY = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
// Only load Stripe if we have a valid public key (starts with pk_)
const stripePromise = (STRIPE_PUBLIC_KEY && STRIPE_PUBLIC_KEY.startsWith('pk_')) ? loadStripe(STRIPE_PUBLIC_KEY) : null;

const SubscribeForm = ({ selectedPlan }: { selectedPlan: 'basic' | 'plus' }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const planPrice = selectedPlan === 'basic' ? 59 : 99;
  const planName = selectedPlan === 'basic' ? 'Gold Plan (1-3 meds)' : 'Platinum Plan (4+ meds)';

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
        title: "Subscription Successful",
        description: "Welcome to Pillar Drug Club! You now have access to wholesale pricing.",
      });
      setLocation("/dashboard");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-gray-50 p-4 rounded-lg">
        <PaymentElement />
      </div>
      
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="text-sm">
          By subscribing, you agree to our <a href="/refund-policy" target="_blank" className="underline font-medium hover:text-primary" data-testid="link-checkout-refund-policy">refund policy</a>. Annual membership billed once per year.
        </AlertDescription>
      </Alert>

      <Button 
        type="submit" 
        className="w-full" 
        size="lg"
        disabled={!stripe || isLoading}
        data-testid="button-subscribe"
      >
        {isLoading ? "Processing..." : `Subscribe ${planName} for $${planPrice}/year`}
      </Button>
    </form>
  );
};

export default function SubscriptionPage() {
  const [clientSecret, setClientSecret] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<'basic' | 'plus'>('plus');
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();

  const benefits = [
    "Access wholesale prescription pricing",
    "No insurance required",
    "Home delivery nationwide",
    "Real cost calculator",
    "Transparent pricing"
  ];

  useEffect(() => {
    // Wait for auth to load
    if (authLoading) return;
    
    // Check if user is logged in
    if (!isAuthenticated || !user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to subscribe.",
        variant: "destructive",
      });
      setLocation("/login");
      return;
    }

    // Check if Stripe is configured
    if (!STRIPE_PUBLIC_KEY) {
      setIsLoading(false);
      return;
    }

    // Reset loading state and clear previous client secret when plan changes
    setIsLoading(true);
    setClientSecret("");

    // Track the current plan to prevent race conditions
    const currentPlan = selectedPlan;
    let cancelled = false;

    // Create subscription with selected plan
    apiRequest("POST", "/api/create-subscription", { 
      userId: user.id,
      plan: selectedPlan 
    })
      .then((res) => res.json())
      .then((data) => {
        // Ignore response if plan changed or effect was cancelled
        if (cancelled || currentPlan !== selectedPlan) {
          console.log(`Ignoring stale response for ${currentPlan} plan`);
          return;
        }
        
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
        } else {
          throw new Error("No client secret received");
        }
      })
      .catch((error) => {
        // Only show error if this is still the active request
        if (!cancelled && currentPlan === selectedPlan) {
          console.error("Subscription creation error:", error);
          toast({
            title: "Error",
            description: "Failed to initialize subscription. Please try again.",
            variant: "destructive",
          });
        }
      })
      .finally(() => {
        // Only update loading state if this is still the active request
        if (!cancelled && currentPlan === selectedPlan) {
          setIsLoading(false);
        }
      });

    // Cleanup function to cancel stale requests
    return () => {
      cancelled = true;
    };
  }, [authLoading, isAuthenticated, user, selectedPlan]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600">Setting up your subscription...</p>
        </div>
      </div>
    );
  }

  // Show message if Stripe is not configured
  if (!STRIPE_PUBLIC_KEY) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Pill className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <CardTitle>Subscription Not Available</CardTitle>
            <CardDescription>
              Payment processing is not currently configured. Please contact support for assistance.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-3">
            <Link href="/dashboard">
              <Button className="w-full" data-testid="button-dashboard">
                Go to Dashboard
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="w-full" data-testid="button-home">
                Back to Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Unable to Load Subscription</h2>
            <p className="text-gray-600 mb-4">There was an error setting up your subscription. Please try again.</p>
            <Link href="/register">
              <Button>Try Again</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <div className="max-w-5xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Pill className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">Pillar Drug Club</span>
            </div>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Membership</h1>
          <p className="text-gray-600">Choose your plan and access wholesale prescription pricing</p>
        </div>

        {/* Plan Selection */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 text-center">Select Your Plan</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
            <Card 
              className={`cursor-pointer transition-all hover-elevate ${selectedPlan === 'basic' ? 'border-primary/50 bg-gradient-to-br from-primary/10 to-secondary/10' : 'border-secondary/30'}`}
              onClick={() => setSelectedPlan('basic')}
              data-testid="card-plan-basic"
            >
              <CardHeader>
                <CardTitle className="text-lg">Gold Plan</CardTitle>
                <div className="text-2xl font-bold text-primary">
                  $59<span className="text-base text-muted-foreground">/year</span>
                </div>
                <CardDescription>1-3 medications</CardDescription>
                <div className="mt-2 text-xs text-muted-foreground">
                  50% off order fee • 6-month supply access
                </div>
              </CardHeader>
            </Card>

            <Card 
              className={`cursor-pointer transition-all hover-elevate relative ${selectedPlan === 'plus' ? 'border-primary/50 bg-gradient-to-br from-primary/10 to-secondary/10' : 'border-secondary/30'}`}
              onClick={() => setSelectedPlan('plus')}
              data-testid="card-plan-plus"
            >
              {selectedPlan === 'plus' && (
                <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 rounded-bl-lg rounded-tr-lg text-xs font-bold">
                  SELECTED
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-lg">Platinum Plan</CardTitle>
                <div className="text-2xl font-bold text-primary">
                  $99<span className="text-base text-muted-foreground">/year</span>
                </div>
                <CardDescription>4+ medications</CardDescription>
                <div className="mt-2 text-xs text-muted-foreground">
                  50% off order fee • Up to 1-year supply access
                </div>
              </CardHeader>
            </Card>
          </div>
        </div>

        {/* Annual Membership Notice */}
        <Alert className="mb-8 max-w-3xl mx-auto" data-testid="alert-commitment">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="ml-2">
            <strong>Annual Membership:</strong> All memberships are billed annually and include 50% off order fees plus access to extended supply options.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Subscription Benefits */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-blue-600" />
                Your Membership Benefits
              </CardTitle>
              <CardDescription>
                Everything included in your subscription
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {benefits.map((benefit, idx) => (
                  <li key={idx} className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span className="text-gray-700">{benefit}</span>
                  </li>
                ))}
              </ul>
              
              <div className="mt-6 space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">Money-Back Guarantee</h4>
                  <p className="text-sm text-gray-600">
                    Not satisfied? Get a full refund within your first 30 days.
                  </p>
                </div>
                
                <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <h4 className="font-semibold text-gray-900 mb-2">Annual Membership Terms</h4>
                  <p className="text-sm text-gray-600">
                    Annual memberships are billed once per year and are non-refundable once activated. 
                    Your membership renews automatically unless cancelled.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Form */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Information</CardTitle>
              <CardDescription>
                Secure payment powered by Stripe
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-3xl font-bold text-blue-600">
                    ${selectedPlan === 'basic' ? '59' : '99'}
                  </div>
                  <div className="text-gray-600">per year</div>
                  <div className="text-sm text-gray-500 mt-1">
                    {selectedPlan === 'basic' ? '1-3 medications • 50% off order fees' : '4+ medications • 50% off order fees'}
                  </div>
                </div>
              </div>

              {/* Make SURE to wrap the form in <Elements> which provides the stripe context. */}
              <Elements key={clientSecret} stripe={stripePromise} options={{ clientSecret }}>
                <SubscribeForm selectedPlan={selectedPlan} />
              </Elements>

              <div className="mt-4 space-y-2">
                <div className="text-center text-xs text-gray-500">
                  Your payment information is secure and encrypted. 
                  We use Stripe for payment processing.
                </div>
                <div className="text-center text-xs text-gray-500">
                  By subscribing, you agree to our annual membership terms.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Back option */}
        <div className="text-center mt-8">
          <Link href="/register">
            <Button variant="outline" data-testid="button-back">
              Back to Registration
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}