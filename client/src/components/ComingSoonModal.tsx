import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { 
  DollarSign, 
  Shield, 
  Home, 
  Mail,
  Loader2,
  ArrowRight,
  User,
  Phone,
  Lock
} from "lucide-react";

interface SignupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SignupModal({ open, onOpenChange }: SignupModalProps) {
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
        title: "You're in!",
        description: "We'll be in touch with your membership details shortly.",
      });
      setName("");
      setEmail("");
      setPhone("");
      localStorage.setItem("pillar_signup_completed", "true");
      setTimeout(() => onOpenChange(false), 1500);
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
      description: "Save up to 95% on prescription medications"
    },
    {
      icon: Shield,
      title: "No Insurance Needed",
      description: "Simple, transparent pricing for everyone"
    },
    {
      icon: Home,
      title: "Home Delivery",
      description: "Your medications delivered to your door"
    }
  ];

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-2xl max-h-[90vh] overflow-y-auto [&>button]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <Lock className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-primary">Only $99/year</span>
            </div>
          </div>
          <DialogTitle className="text-center text-3xl md:text-4xl font-black">
            Prescription Medications
            <br />
            <span className="text-primary">Tablets As Low As $0.01</span>
          </DialogTitle>
          <DialogDescription className="text-center text-base">
            Sign up below to unlock access. Join Pharmacy Autopilot for just $99/year 
            and get direct access to affordable, year-supply prescriptions.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <Card className="border-2 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Mail className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-bold text-foreground">Sign Up to Continue</h3>
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
                    required
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
                    required
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
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full h-12 text-base font-semibold"
                  disabled={signupMutation.isPending}
                  data-testid="button-submit-signup"
                >
                  {signupMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Signing Up...
                    </>
                  ) : (
                    <>
                      Sign Up Now
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-3 gap-4">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <div 
                  key={index} 
                  className="flex flex-col items-center text-center p-4 rounded-lg bg-muted/30"
                >
                  <div className="mb-3 p-3 rounded-full bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-bold text-foreground mb-1">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
