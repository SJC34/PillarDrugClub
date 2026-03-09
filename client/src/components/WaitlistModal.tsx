import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { Loader2, ArrowRight, Check } from "lucide-react";

interface WaitlistModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WaitlistModal({ open, onOpenChange }: WaitlistModalProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  const signupMutation = useMutation({
    mutationFn: async (data: { name: string; email: string; phone: string }) => {
      return apiRequest("POST", "/api/email-signup", data);
    },
    onSuccess: () => {
      setSubmitted(true);
      localStorage.setItem("pillar_signup_completed", "true");
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Something went wrong",
        description: error.message || "Please try again.",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({
        variant: "destructive",
        title: "Email required",
        description: "Please enter your email address.",
      });
      return;
    }
    signupMutation.mutate({ name, email, phone: "" });
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setEmail("");
      setName("");
      setSubmitted(false);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="modal-waitlist">
        {submitted ? (
          <div className="text-center py-6">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Check className="h-6 w-6 text-primary" />
            </div>
            <DialogHeader>
              <DialogTitle className="text-xl font-black text-center">You're on the list.</DialogTitle>
              <DialogDescription className="text-center mt-2">
                We'll reach out before we go live. No spam — just one email when your spot opens.
              </DialogDescription>
            </DialogHeader>
            <p className="mt-4 text-xs text-muted-foreground">
              Lock in $99/yr for founding members.
            </p>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl font-black" data-testid="modal-title">
                Join the waitlist
              </DialogTitle>
              <DialogDescription data-testid="modal-description">
                We're onboarding founding members personally. Lock in $99/yr — price goes to $149 at launch.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-3 mt-2" data-testid="form-waitlist-modal">
              <Input
                type="text"
                placeholder="Your name (optional)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={signupMutation.isPending}
                className="h-11"
                data-testid="input-name-modal"
              />
              <Input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={signupMutation.isPending}
                className="h-11"
                data-testid="input-email-modal"
                required
              />
              <Button
                type="submit"
                size="lg"
                className="w-full font-bold"
                disabled={signupMutation.isPending}
                data-testid="button-submit-modal"
              >
                {signupMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Reserve My Spot
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                No spam. No commitment. One email when your spot opens.
              </p>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
