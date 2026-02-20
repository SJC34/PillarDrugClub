import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Loader2,
  ArrowRight,
  User,
  Phone,
  Mail,
  Check,
} from "lucide-react";
import pillarImage from "@assets/image_1771565518024.png";
import pdcLogo from "@assets/image_1771566531369.jpeg";

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
    "Save up to 95% on prescriptions",
    "No insurance required",
    "Delivered to your door",
    "Up to 12-month supply",
  ];

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-md max-h-[90vh] overflow-y-auto [&>button]:hidden p-0"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <div className="px-6 pt-8 pb-4">
          <div className="flex items-center justify-center mb-4">
            <img src={pdcLogo} alt="Pillar Drug Club" className="h-20 md:h-24 object-contain" />
          </div>
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-center text-lg md:text-xl font-semibold text-muted-foreground">
              Your Trusted Pharmacy Autopilot
              <br />
              <span className="text-primary font-bold">For Low as a Penny per Pill</span>
            </DialogTitle>
            <DialogDescription className="text-center text-sm">
              Join our waitlist to unlock access.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-6 pb-6 pt-4 space-y-5">
          <div className="grid grid-cols-2 gap-2">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-start gap-2">
                <div className="rounded-full p-0.5 mt-0.5" style={{ backgroundColor: '#0d4f4f' }}>
                  <Check className="h-3 w-3 text-white" />
                </div>
                <span className="text-sm text-muted-foreground leading-tight">{benefit}</span>
              </div>
            ))}
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
                className="h-11 text-base pl-10"
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
                className="h-11 text-base pl-10"
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
                className="h-11 text-base pl-10"
                data-testid="input-phone-signup"
                required
              />
            </div>
            <Button 
              type="submit" 
              size="lg" 
              className="w-full h-12 text-base font-bold"
              disabled={signupMutation.isPending}
              data-testid="button-submit-signup"
              style={{ backgroundColor: '#2aa8a8' }}
            >
              {signupMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Joining...
                </>
              ) : (
                <>
                  Join the Waitlist
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              No spam. Unsubscribe anytime.
            </p>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
