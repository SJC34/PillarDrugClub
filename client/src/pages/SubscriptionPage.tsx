import { useEffect, useState, useRef } from "react";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Pill, Check, CreditCard, AlertCircle, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const SQUARE_APP_ID = import.meta.env.VITE_SQUARE_APP_ID;
const SQUARE_LOCATION_ID = import.meta.env.VITE_SQUARE_LOCATION_ID;
const SQUARE_IS_SANDBOX = import.meta.env.VITE_SQUARE_SANDBOX !== 'false';

const SquareSubscribeForm = ({ userId }: { userId: string }) => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSquareReady, setIsSquareReady] = useState(false);
  const cardRef = useRef<any>(null);

  useEffect(() => {
    const scriptSrc = SQUARE_IS_SANDBOX
      ? 'https://sandbox.web.squarecdn.com/v1/square.js'
      : 'https://web.squarecdn.com/v1/square.js';

    const existing = document.querySelector(`script[src="${scriptSrc}"]`);
    if (existing) { initSquare(); return; }

    const script = document.createElement('script');
    script.src = scriptSrc;
    script.onload = initSquare;
    document.head.appendChild(script);
  }, []);

  const initSquare = async () => {
    const w = window as any;
    if (!w.Square) { setTimeout(initSquare, 200); return; }
    try {
      const payments = w.Square.payments(SQUARE_APP_ID, SQUARE_LOCATION_ID);
      const card = await payments.card();
      await card.attach('#sq-card-container');
      cardRef.current = card;
      setIsSquareReady(true);
    } catch (err) {
      console.error('Square card init failed:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardRef.current) return;
    setIsLoading(true);

    try {
      const result = await cardRef.current.tokenize();
      if (result.status !== 'OK') {
        throw new Error(result.errors?.[0]?.message || 'Card tokenization failed');
      }

      const response = await apiRequest("POST", "/api/create-subscription", {
        userId,
        sourceId: result.token,
      });
      const data = await response.json();

      if (data.error) throw new Error(data.message || data.error);

      toast({
        title: "Subscription Successful",
        description: "Welcome to Pharmacy Autopilot! You now have access to wholesale pricing.",
      });
      setLocation("/dashboard");
    } catch (err: any) {
      toast({
        title: "Payment Failed",
        description: err.message || "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div
        id="sq-card-container"
        className="bg-muted/40 p-4 rounded-lg border border-border min-h-[60px]"
      >
        {!isSquareReady && (
          <div className="flex items-center gap-2 text-muted-foreground text-sm py-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading secure payment form...
          </div>
        )}
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="text-sm">
          By subscribing, you agree to our{" "}
          <a href="/refund-policy" target="_blank" className="underline font-medium hover:text-primary" data-testid="link-checkout-refund-policy">
            refund policy
          </a>. Annual membership billed once per year.
        </AlertDescription>
      </Alert>

      <Button
        type="submit"
        className="w-full"
        size="lg"
        disabled={!isSquareReady || isLoading}
        data-testid="button-subscribe"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : "Subscribe — $99/year"}
      </Button>
    </form>
  );
};

export default function SubscriptionPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();

  const benefits = [
    "Access wholesale prescription pricing",
    "No insurance required",
    "Home delivery nationwide",
    "Real cost calculator",
    "Transparent pricing",
    "Up to 12-month supply per fill",
    "Clinical safety tools included",
  ];

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to subscribe.",
        variant: "destructive",
      });
      setLocation("/login");
    }
  }, [authLoading, isAuthenticated, user]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!SQUARE_APP_ID) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Pill className="h-12 w-12 text-primary mx-auto mb-4" />
            <CardTitle>Subscription Not Available</CardTitle>
            <CardDescription>
              Payment processing is not currently configured. Please contact support.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-3">
            <Link href="/dashboard">
              <Button className="w-full" data-testid="button-dashboard">Go to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto p-6">
        <div className="text-center mb-8">
          <Link href="/">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Pill className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold text-foreground">Pharmacy Autopilot</span>
            </div>
          </Link>
          <h1 className="text-3xl font-bold text-foreground mb-2">Complete Your Membership</h1>
          <p className="text-muted-foreground">Access wholesale prescription pricing — $99/year</p>
        </div>

        <div className="max-w-md mx-auto mb-8">
          <Card className="border-primary/40" data-testid="card-plan-membership">
            <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 rounded-bl-lg rounded-tr-lg text-xs font-bold">
              MEMBERSHIP
            </div>
            <CardHeader>
              <CardTitle className="text-lg">Pharmacy Autopilot Annual Membership</CardTitle>
              <div className="text-2xl font-bold text-primary">
                $99<span className="text-base text-muted-foreground">/year</span>
              </div>
              <CardDescription>Access wholesale pricing — up to 12-month supply</CardDescription>
              <div className="mt-2 text-xs text-muted-foreground">$10 dispensing fee per medication per fill</div>
            </CardHeader>
          </Card>
        </div>

        <Alert className="mb-8 max-w-3xl mx-auto" data-testid="alert-commitment">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="ml-2">
            <strong>Annual Membership:</strong> Billed once per year. Shipping passed through at carrier rates.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Your Membership Benefits
              </CardTitle>
              <CardDescription>Everything included in your subscription</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {benefits.map((benefit, idx) => (
                  <li key={idx} className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                    <span className="text-foreground">{benefit}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-6 p-4 bg-muted/40 rounded-lg border border-border">
                <h4 className="font-semibold text-foreground mb-2">Annual Membership Terms</h4>
                <p className="text-sm text-muted-foreground">
                  Annual memberships are billed once per year and are non-refundable once activated.
                  Your membership renews automatically unless cancelled.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment Information</CardTitle>
              <CardDescription>Secure payment powered by Square</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-3xl font-bold text-primary">$99</div>
                  <div className="text-muted-foreground">per year</div>
                  <div className="text-sm text-muted-foreground mt-1">Pharmacy Autopilot Membership</div>
                </div>
              </div>

              {user && <SquareSubscribeForm userId={user.id} />}

              <div className="mt-4 text-center text-xs text-muted-foreground">
                Your payment information is encrypted and secured by Square.
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-8">
          <Link href="/register">
            <Button variant="outline" data-testid="button-back">Back to Registration</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
