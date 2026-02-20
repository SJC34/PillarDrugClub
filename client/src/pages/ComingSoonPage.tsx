import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { 
  CheckCircle, 
  DollarSign, 
  Shield, 
  Home, 
  Mail,
  Loader2,
  Sparkles,
  User,
  Phone
} from "lucide-react";

export default function ComingSoonPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const { toast } = useToast();

  const signupMutation = useMutation({
    mutationFn: async (data: { name: string; email: string; phone: string }) => {
      return apiRequest("POST", "/api/email-signup", data);
    },
    onSuccess: () => {
      toast({
        title: "You're on the list!",
        description: "We'll notify you as soon as Pharmacy Autopilot launches.",
      });
      setName("");
      setEmail("");
      setPhone("");
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Oops!",
        description: error.message || "Something went wrong. Please try again.",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone) {
      toast({
        variant: "destructive",
        title: "All fields required",
        description: "Please fill in your name, email, and phone number.",
      });
      return;
    }
    signupMutation.mutate({ name, email, phone });
  };

  const benefits = [
    {
      icon: DollarSign,
      title: "Wholesale Pricing",
      description: "Save up to 95% on prescription medications with direct-to-consumer wholesale pricing"
    },
    {
      icon: Shield,
      title: "No Insurance Needed",
      description: "Skip the insurance hassle. Simple, transparent pricing for everyone"
    },
    {
      icon: Home,
      title: "Home Delivery",
      description: "Your medications delivered right to your door, no pharmacy lines"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute top-60 -left-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-16 md:pt-32 md:pb-24">
          {/* Coming Soon Badge */}
          <div className="flex justify-center mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-primary">Coming Soon</span>
            </div>
          </div>

          {/* Main Heading */}
          <div className="text-center mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent leading-tight">
              Prescription Medications
              <br />
              <span className="text-primary">Tablets As Low As $0.01</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Join the waitlist for Pharmacy Autopilot — your direct access to affordable, 
              year-supply prescriptions without the insurance headaches.
            </p>
          </div>

          {/* Email Signup Form */}
          <div className="max-w-md mx-auto mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
            <Card className="border-2 border-primary/20 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Mail className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-bold text-foreground">Get Early Access</h3>
                </div>
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={signupMutation.isPending}
                      className="h-12 text-base pl-10"
                      data-testid="input-name-signup"
                    />
                  </div>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="Email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={signupMutation.isPending}
                      className="h-12 text-base pl-10"
                      data-testid="input-email-signup"
                    />
                  </div>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="tel"
                      placeholder="Phone number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      disabled={signupMutation.isPending}
                      className="h-12 text-base pl-10"
                      data-testid="input-phone-signup"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full h-12 text-base font-bold"
                    disabled={signupMutation.isPending}
                    data-testid="button-join-waitlist"
                  >
                    {signupMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Joining...
                      </>
                    ) : (
                      "Join the Waitlist"
                    )}
                  </Button>
                </form>
                <p className="text-xs text-muted-foreground mt-3 text-center">
                  We'll send you updates about our launch. Unsubscribe anytime.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Social Proof */}
          <div className="text-center mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
            <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-primary" />
              <span>Join thousands on the waitlist</span>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black mb-4 text-foreground">
              Why Pharmacy Autopilot?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We're revolutionizing prescription access by cutting out the middlemen
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <Card 
                key={index}
                className="border-2 border-border hover-elevate transition-all duration-300"
                data-testid={`card-benefit-${index}`}
              >
                <CardContent className="p-8 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                    <benefit.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-foreground">{benefit.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {benefit.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Teaser */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 rounded-2xl p-8 md:p-12 border-2 border-primary/20">
            <div className="text-center max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-black mb-4 text-foreground">
                The Real Savings
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Compare traditional insurance copays vs. Pharmacy Autopilot's wholesale pricing
              </p>
              
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="bg-background/80 backdrop-blur rounded-lg p-6 border border-border">
                  <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    Traditional Model
                  </p>
                  <p className="text-4xl font-black text-destructive mb-1">$120/year</p>
                  <p className="text-sm text-muted-foreground">
                    $10/month copays × 12 months
                  </p>
                </div>
                
                <div className="bg-background/80 backdrop-blur rounded-lg p-6 border-2 border-primary">
                  <p className="text-sm font-semibold text-primary uppercase tracking-wide mb-2">
                    Pharmacy Autopilot Wholesale
                  </p>
                  <p className="text-4xl font-black text-primary mb-1">$7.30/year</p>
                  <p className="text-sm text-muted-foreground">
                    Year supply, one payment
                  </p>
                </div>
              </div>

              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full font-bold">
                <CheckCircle className="h-5 w-5" />
                Save $112.70 per medication per year
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-black mb-4 text-foreground">
            Ready to Save on Prescriptions?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Be the first to know when Pharmacy Autopilot launches. Join our waitlist today.
          </p>
          
          <div className="max-w-md mx-auto">
            <Card className="border-2 border-primary/20 shadow-xl">
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={signupMutation.isPending}
                      className="h-12 text-base pl-10"
                      data-testid="input-name-signup-footer"
                    />
                  </div>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="Email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={signupMutation.isPending}
                      className="h-12 text-base pl-10"
                      data-testid="input-email-signup-footer"
                    />
                  </div>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="tel"
                      placeholder="Phone number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      disabled={signupMutation.isPending}
                      className="h-12 text-base pl-10"
                      data-testid="input-phone-signup-footer"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full h-12 text-base font-bold"
                    disabled={signupMutation.isPending}
                    data-testid="button-join-waitlist-footer"
                  >
                    {signupMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Joining...
                      </>
                    ) : (
                      "Join the Waitlist"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <p className="text-center text-sm text-muted-foreground">
            © 2025 Pharmacy Autopilot. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
