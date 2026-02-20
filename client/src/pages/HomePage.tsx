import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { Loader2, ArrowRight } from "lucide-react";
import { SEOHead, pharmacySchema, medicalWebPageSchema, organizationSchema, faqSchema, howToSaveMoneySchema, getBaseUrl } from "@/components/SEOHead";
import pdcLogo from "@assets/image_1771566531369.jpeg";

export default function HomePage() {
  const [email, setEmail] = useState("");
  const { toast } = useToast();

  const signupMutation = useMutation({
    mutationFn: async (data: { name: string; email: string; phone: string }) => {
      return apiRequest("POST", "/api/email-signup", data);
    },
    onSuccess: () => {
      toast({
        title: "You're on the list!",
        description: "We'll reach out before launch.",
      });
      setEmail("");
      localStorage.setItem("pillar_signup_completed", "true");
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
    if (!email) {
      toast({
        variant: "destructive",
        title: "Email required",
        description: "Please enter your email address.",
      });
      return;
    }
    signupMutation.mutate({ name: "", email, phone: "" });
  };

  const combinedSchema = {
    "@context": "https://schema.org",
    "@graph": [
      pharmacySchema,
      medicalWebPageSchema,
      organizationSchema,
      faqSchema,
      howToSaveMoneySchema
    ]
  };

  const stats = [
    { value: "29%", description: "of insured adults skipped a prescription due to cost last year" },
    { value: "$456", description: "average annual OOP spend for uninsured adults" },
    { value: "59M", description: "gig workers in the U.S. without stable prescription benefits" },
    { value: "18%", description: "drop in adherence when copay exceeds $50/month" },
  ];

  const problems = [
    {
      number: "01",
      title: "GoodRx isn't reliable",
      description: "The price you see doesn't always match the price at the counter. Pharmacies can reject coupons. Prices vary by location. You have to check every single time.",
    },
    {
      number: "02",
      title: "Refills are manual work",
      description: "Phone trees. Hold music. Expired prescriptions. Running out before you remember to reorder. The whole system punishes you for not managing it perfectly.",
    },
    {
      number: "03",
      title: "You never know what you'll pay",
      description: "Whether you're uninsured, between jobs, or freelancing — your prescription costs are a variable you can't plan around. That uncertainty compounds.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Save 90% on Prescriptions | Get Meds Without Insurance | Pillar Drug Club"
        description="Can't afford your prescriptions? Get medications for as low as $0.01 per tablet. No insurance needed. Free delivery. Save hundreds on diabetes, blood pressure, cholesterol & more."
        canonical={getBaseUrl()}
        schema={combinedSchema}
      />

      {/* Header Logo */}
      <div className="flex items-center justify-center pt-8 pb-4 px-6">
        <img src={pdcLogo} alt="Pillar Drug Club" className="h-16 md:h-20 object-contain" data-testid="img-logo-header" />
      </div>

      {/* Stats Section */}
      <section className="py-12 md:py-20 px-6 md:px-12">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {stats.map((stat, idx) => (
            <div key={idx} className="text-center" data-testid={`stat-item-${idx}`}>
              <div className="text-4xl md:text-5xl font-black text-primary mb-2">{stat.value}</div>
              <p className="text-sm md:text-base text-muted-foreground leading-snug">{stat.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* The Problem Section */}
      <section className="py-16 md:py-24 px-6 md:px-12 bg-muted/30">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-bold tracking-[0.3em] uppercase text-primary mb-4" data-testid="text-problem-label">THE PROBLEM</p>
          <h2 className="text-3xl md:text-5xl font-black text-foreground mb-16 leading-tight" data-testid="text-problem-headline">
            The pharmacy system is<br />built to confuse you.
          </h2>

          <div className="space-y-12">
            {problems.map((problem) => (
              <div key={problem.number} className="flex gap-6" data-testid={`problem-item-${problem.number}`}>
                <div className="flex-shrink-0">
                  <span className="text-4xl md:text-5xl font-black text-primary/20">{problem.number}</span>
                </div>
                <div>
                  <h3 className="text-xl md:text-2xl font-bold text-foreground mb-2">{problem.title}</h3>
                  <p className="text-base md:text-lg text-muted-foreground leading-relaxed">{problem.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA / Waitlist Section */}
      <section id="waitlist" className="py-20 md:py-32 px-6 md:px-12">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl md:text-4xl font-black text-foreground mb-3 leading-tight" data-testid="text-cta-headline">
            Stop guessing. Start automating.
          </h2>
          <p className="text-base md:text-lg text-muted-foreground mb-10" data-testid="text-cta-subline">
            Join the waitlist. We're onboarding the first 100 members personally.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto mb-4" data-testid="form-waitlist">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={signupMutation.isPending}
              className="h-12 text-base flex-1"
              data-testid="input-email-waitlist"
              required
            />
            <Button
              type="submit"
              size="lg"
              className="h-12 font-bold px-8"
              disabled={signupMutation.isPending}
              data-testid="button-submit-waitlist"
              style={{ backgroundColor: '#2aa8a8' }}
            >
              {signupMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  JOIN WAITLIST
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>
          <p className="text-xs text-muted-foreground" data-testid="text-no-spam">
            No spam. No commitment. We'll reach out before launch.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8 px-6 md:px-12">
        <div className="max-w-5xl mx-auto text-center">
          <img src={pdcLogo} alt="Pillar Drug Club" className="h-8 md:h-10 object-contain mx-auto mb-4" data-testid="img-logo-footer" />
          <p className="text-xs text-muted-foreground">
            &copy; 2026 Pillar Drug Club &middot; Seattle, WA &middot; Not a licensed pharmacy. Powered by HealthWarehouse.
          </p>
        </div>
      </footer>
    </div>
  );
}
