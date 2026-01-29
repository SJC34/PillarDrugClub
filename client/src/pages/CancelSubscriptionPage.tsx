import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Pill, ArrowLeft, AlertTriangle, Calendar, DollarSign, CheckCircle2, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { queryClient } from "@/lib/queryClient";

const STRIPE_PUBLIC_KEY = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
// Only load Stripe if we have a valid public key (starts with pk_)
const stripePromise = (STRIPE_PUBLIC_KEY && STRIPE_PUBLIC_KEY.startsWith('pk_')) ? loadStripe(STRIPE_PUBLIC_KEY) : null;

interface TerminationFeeDetails {
  needsTerminationFee: boolean;
  monthsPaid: number;
  remainingMonths: number;
  monthlyRate?: number;
  terminationFee?: number;
  terminationFeeFormatted?: string;
  commitmentStartDate?: string;
  commitmentEndDate?: string;
  message?: string;
}

function PaymentForm({ 
  clientSecret, 
  terminationFee, 
  onSuccess 
}: { 
  clientSecret: string; 
  terminationFee: number;
  onSuccess: (paymentIntentId: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setIsProcessing(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/settings`,
        },
        redirect: "if_required",
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message || "Failed to process payment",
          variant: "destructive",
        });
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        onSuccess(paymentIntent.id);
      }
    } catch (err: any) {
      toast({
        title: "Payment Error",
        description: err.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <Button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full"
        data-testid="button-pay-termination-fee"
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Processing Payment...
          </>
        ) : (
          <>
            Pay ${(terminationFee / 100).toFixed(2)} & Cancel Subscription
          </>
        )}
      </Button>
    </form>
  );
}

export default function CancelSubscriptionPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [step, setStep] = useState<"review" | "payment" | "processing" | "success">("review");
  const [paymentClientSecret, setPaymentClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);

  // Fetch termination fee details
  const { data: feeDetails, isLoading: isLoadingFee, error: feeError } = useQuery<TerminationFeeDetails>({
    queryKey: [`/api/subscription/termination-fee/${user?.id}`],
    enabled: !!user?.id && user?.subscriptionStatus === "active",
  });

  // Create payment intent mutation
  const createPaymentIntentMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");
      return apiRequest("POST", "/api/subscription/termination-fee/create-payment-intent", {
        userId: user.id,
      });
    },
    onSuccess: (data: any) => {
      setPaymentClientSecret(data.clientSecret);
      setStep("payment");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to initiate payment",
        variant: "destructive",
      });
    },
  });

  // Cancel subscription mutation (with termination fee)
  const cancelSubscriptionMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id || !paymentIntentId) throw new Error("Missing required data");
      return apiRequest("POST", "/api/subscription/cancel-with-fee", {
        userId: user.id,
        paymentIntentId: paymentIntentId,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setStep("success");
      toast({
        title: "Subscription Canceled",
        description: "Your subscription has been successfully canceled.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Cancellation Failed",
        description: error.message || "Failed to cancel subscription",
        variant: "destructive",
      });
      setStep("payment");
    },
  });

  // Cancel subscription mutation (no fee - commitment fulfilled)
  const cancelNoFeeMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");
      return apiRequest("POST", "/api/subscription/cancel", {
        userId: user.id,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Subscription Canceled",
        description: "Your subscription has been successfully canceled.",
      });
      setTimeout(() => navigate("/dashboard"), 2000);
    },
    onError: (error: any) => {
      toast({
        title: "Cancellation Failed",
        description: error.message || "Failed to cancel subscription",
        variant: "destructive",
      });
    },
  });

  const handlePaymentSuccess = (intentId: string) => {
    setPaymentIntentId(intentId);
    setStep("processing");
  };

  // Automatically cancel subscription after payment succeeds
  useEffect(() => {
    if (step === "processing" && paymentIntentId) {
      cancelSubscriptionMutation.mutate();
    }
  }, [step, paymentIntentId]);

  if (!user || user.subscriptionStatus !== "active") {
    return (
      <div className="min-h-screen px-4 py-6 md:py-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6 md:mb-8">
            <Link href="/settings">
              <Button variant="ghost" className="mb-4" data-testid="button-back">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Settings
              </Button>
            </Link>
          </div>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              You don't have an active subscription to cancel.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (isLoadingFee) {
    return (
      <div className="min-h-screen px-4 py-6 md:py-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (feeError || !feeDetails) {
    return (
      <div className="min-h-screen px-4 py-6 md:py-8">
        <div className="max-w-3xl mx-auto">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Failed to load cancellation details. Please try again later.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  // Success state
  if (step === "success") {
    return (
      <div className="min-h-screen px-4 py-6 md:py-8">
        <div className="max-w-3xl mx-auto">
          <Card>
            <CardContent className="pt-6 text-center">
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Subscription Canceled</h2>
              <p className="text-muted-foreground mb-6">
                Your subscription has been successfully canceled. You will no longer be charged.
              </p>
              <Link href="/dashboard">
                <Button data-testid="button-return-dashboard">Return to Dashboard</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Processing state
  if (step === "processing") {
    return (
      <div className="min-h-screen px-4 py-6 md:py-8 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Canceling Subscription...</h2>
            <p className="text-muted-foreground">Please wait while we process your cancellation.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // No termination fee required
  if (!feeDetails.needsTerminationFee) {
    return (
      <div className="min-h-screen px-4 py-6 md:py-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6 md:mb-8">
            <Link href="/settings">
              <Button variant="ghost" className="mb-4" data-testid="button-back">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Settings
              </Button>
            </Link>
            <div className="flex items-center gap-2 mb-4">
              <Pill className="h-8 w-8 text-primary" />
              <span className="text-xl md:text-2xl font-bold text-foreground">pillar drug club</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Cancel Subscription</h1>
          </div>

          <Alert className="mb-6">
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              {feeDetails.message || "Your annual membership has expired. You can cancel without any fees."}
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle>Membership Status</CardTitle>
              <CardDescription>Your annual membership has ended</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Status:</span>
                <span className="font-semibold text-green-600">Eligible for cancellation</span>
              </div>
              <Separator />
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Are you sure you want to cancel? You will lose access to wholesale medication pricing.
                </AlertDescription>
              </Alert>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/settings" className="flex-1">
                  <Button variant="outline" className="w-full" data-testid="button-keep-subscription">
                    Keep Subscription
                  </Button>
                </Link>
                <Button
                  variant="destructive"
                  className="flex-1"
                  data-testid="button-confirm-cancel"
                  onClick={() => cancelNoFeeMutation.mutate()}
                  disabled={cancelNoFeeMutation.isPending}
                >
                  {cancelNoFeeMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Canceling...
                    </>
                  ) : (
                    "Cancel Subscription"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Review step - show termination fee details
  if (step === "review") {
    return (
      <div className="min-h-screen px-4 py-6 md:py-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6 md:mb-8">
            <Link href="/settings">
              <Button variant="ghost" className="mb-4" data-testid="button-back">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Settings
              </Button>
            </Link>
            <div className="flex items-center gap-2 mb-4">
              <Pill className="h-8 w-8 text-primary" />
              <span className="text-xl md:text-2xl font-bold text-foreground">pillar drug club</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Cancel Subscription</h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Cancel your annual membership
            </p>
          </div>

          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Annual Membership:</strong> Your annual membership is still active. 
              Annual memberships are non-refundable once activated.
            </AlertDescription>
          </Alert>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Membership Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Membership Status:</span>
                <span className="font-semibold">Active</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Time Remaining:</span>
                <span className="font-semibold">{feeDetails.remainingMonths} months</span>
              </div>
              <Separator />
              <p className="text-sm text-muted-foreground">
                Annual memberships are non-refundable. Your membership will remain active until the end of your billing period.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cancel at End of Period</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                You can cancel your membership to prevent auto-renewal. Your membership will remain active until the end of your current billing period. No refund will be issued for the remaining time.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/settings" className="flex-1">
                  <Button variant="outline" className="w-full" data-testid="button-cancel-action">
                    Keep Membership
                  </Button>
                </Link>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => cancelNoFeeMutation.mutate()}
                  disabled={cancelNoFeeMutation.isPending}
                  data-testid="button-proceed-payment"
                >
                  {cancelNoFeeMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Canceling...
                    </>
                  ) : (
                    "Cancel Membership"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Payment step
  if (step === "payment" && paymentClientSecret && stripePromise) {
    return (
      <div className="min-h-screen px-4 py-6 md:py-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6 md:mb-8">
            <Button 
              variant="ghost" 
              className="mb-4" 
              onClick={() => setStep("review")}
              data-testid="button-back-to-review"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center gap-2 mb-4">
              <Pill className="h-8 w-8 text-primary" />
              <span className="text-xl md:text-2xl font-bold text-foreground">pillar drug club</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Process Cancellation</h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Complete any outstanding balance to cancel your membership
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Payment Details</CardTitle>
              <CardDescription>
                One-time charge of {feeDetails.terminationFeeFormatted}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Elements stripe={stripePromise} options={{ clientSecret: paymentClientSecret }}>
                <PaymentForm
                  clientSecret={paymentClientSecret}
                  terminationFee={feeDetails.terminationFee || 0}
                  onSuccess={handlePaymentSuccess}
                />
              </Elements>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return null;
}
