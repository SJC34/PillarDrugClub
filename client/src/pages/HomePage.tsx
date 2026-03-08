import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { Loader2, ArrowRight, Plus } from "lucide-react";
import { SEOHead, pharmacySchema, medicalWebPageSchema, organizationSchema, howToSaveMoneySchema, getBaseUrl } from "@/components/SEOHead";
import { FAQAccordion } from "@/components/FAQAccordion";
import pdcLogo from "@assets/image_1771566531369.jpeg";

export default function HomePage() {
  const [email, setEmail] = useState("");
  const [reserveEmail, setReserveEmail] = useState("");
  const [rxSource, setRxSource] = useState("");
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

  const handleReserve = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reserveEmail) {
      toast({
        variant: "destructive",
        title: "Email required",
        description: "Please enter your email address.",
      });
      return;
    }
    signupMutation.mutate({ name: rxSource ? `rx_source:${rxSource}` : "", email: reserveEmail, phone: "" });
    setReserveEmail("");
    setRxSource("");
  };

  const combinedSchema = {
    "@context": "https://schema.org",
    "@graph": [
      pharmacySchema,
      medicalWebPageSchema,
      organizationSchema,
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

      {/* Hero Section */}
      <section className="pt-16 md:pt-24 pb-8 px-6 md:px-12 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-black text-foreground leading-tight mb-6" data-testid="text-hero-headline">
            <span className="whitespace-nowrap">Your prescriptions</span>
            <br />
            <span className="text-primary">on autopilot. 🛩</span>
          </h1>
          <p className="text-base md:text-lg text-muted-foreground leading-relaxed mb-10 max-w-2xl mx-auto" data-testid="text-hero-subline">
            Stop guessing what you'll pay at the pharmacy. Pillar Drug Club locks in pass-through pricing on generics with 6–12 month supplies — no insurance games, no surprises.
          </p>
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto mb-3" data-testid="form-hero-waitlist">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={signupMutation.isPending}
              className="h-12 text-base flex-1"
              data-testid="input-email-hero"
              required
            />
            <Button
              type="submit"
              size="lg"
              className="h-12 font-bold px-8"
              disabled={signupMutation.isPending}
              data-testid="button-submit-hero"
            >
              {signupMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  JOIN THE WAITLIST
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>
          <p className="text-xs font-bold text-foreground">Lock in $99/yr for first 100 members</p>
          <p className="text-sm font-bold text-primary">Only 16 spots left!</p>
        </div>
      </section>

      {/* Annual Membership Card */}
      <section className="py-12 md:py-20 px-6 md:px-12">
        <div className="max-w-lg mx-auto">
          <div className="bg-card border border-border rounded-xl p-8 md:p-10 shadow-lg" data-testid="membership-card">
            <p className="text-sm font-bold tracking-[0.25em] uppercase text-green-800 dark:text-green-400 mb-6" data-testid="text-membership-label">ANNUAL MEMBERSHIP</p>

            <p className="text-xl md:text-2xl text-muted-foreground line-through mb-1">$149</p>
            <div className="mb-2">
              <span className="text-6xl md:text-7xl font-black text-foreground" data-testid="text-price">$99</span>
              <span className="text-xl text-muted-foreground ml-2">/ year</span>
            </div>
            <p className="text-sm font-bold mb-8 text-primary" data-testid="text-savings">Most members save $300–$600+ annually</p>

            <div className="space-y-0">
              {[
                "Pass-through generic pricing — no markup",
                "6–12 month supplies — fewer orders",
                "Price locked at cost, no retail markup",
                "Mail-order delivery",
                "No insurance required, ever",
              ].map((benefit, idx) => (
                <div key={idx} className="flex items-start gap-3 py-4 border-t border-border" data-testid={`membership-benefit-${idx}`}>
                  <Plus className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm md:text-base text-foreground">{benefit}</span>
                </div>
              ))}
            </div>

            <form onSubmit={handleReserve} className="mt-8 space-y-3" data-testid="form-reserve">
              <Input
                type="email"
                placeholder="Your email address"
                value={reserveEmail}
                onChange={(e) => setReserveEmail(e.target.value)}
                disabled={signupMutation.isPending}
                className="h-12 text-base"
                data-testid="input-email-reserve"
                required
              />
              <Select value={rxSource} onValueChange={setRxSource}>
                <SelectTrigger className="h-12 text-base" data-testid="select-rx-source">
                  <SelectValue placeholder="How do you currently get prescriptions?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="retail_pharmacy">Retail pharmacy (CVS, Walgreens, etc.)</SelectItem>
                  <SelectItem value="mail_order">Mail-order pharmacy</SelectItem>
                  <SelectItem value="goodrx">GoodRx or discount card</SelectItem>
                  <SelectItem value="insurance">Through insurance</SelectItem>
                  <SelectItem value="no_prescriptions">I don't currently take prescriptions</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <Button
                type="submit"
                size="lg"
                className="w-full h-12 font-bold tracking-wider"
                disabled={signupMutation.isPending}
                data-testid="button-reserve"
              >
                {signupMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "RESERVE MY SPOT"
                )}
              </Button>
            </form>
            <p className="text-xs font-bold text-foreground mt-2 text-center">Lock in $99/yr for first 100 members</p>
            <p className="text-sm font-bold text-primary text-center">Only 16 spots left!</p>
          </div>
        </div>
      </section>

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
            <span className="whitespace-nowrap">The pharmacy system is</span><br /><span className="whitespace-nowrap">built to confuse you.</span>
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
          <p className="text-xs font-bold text-muted-foreground" data-testid="text-no-spam">
            No spam. No commitment. We'll reach out before launch.
          </p>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 md:py-24 px-6 md:px-12 bg-muted/30">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-4xl font-black text-foreground mb-8 leading-tight" data-testid="text-faq-headline">
            Common Questions
          </h2>
          <FAQAccordion
            noSchema
            items={[
              {
                question: "What is Pillar Drug Club?",
                answer:
                  "A membership pharmacy that gives you access to generic medications at true wholesale prices — what pharmacies actually pay, before any markup. Pay $99/year, get wholesale pricing on hundreds of generics. Most tablets cost as little as $0.01, making a full year's supply as low as $3.65. No insurance needed. Available in all 50 states.",
              },
              {
                question: "What is a PBM and why does it matter?",
                answer:
                  "PBMs — CVS Caremark, Express Scripts, OptumRx — control roughly 80% of US prescription transactions. They sit between manufacturers, insurers, and pharmacies, collecting rebates and profiting from spread pricing. The more expensive the drug, the more they make. Cash-pay PDC members bypass PBMs entirely. No middleman. No spread pricing. Just wholesale cost plus a flat fee.",
              },
              {
                question: "How is PDC different from Mark Cuban's Cost Plus Drugs?",
                answer:
                  "Cost Plus charges a 15% markup over wholesale plus fees — better than retail, but still a markup. The more expensive your medication, the more they earn per transaction. PDC charges zero markup on medications. Every dollar of profit comes from the $99 membership — not from your prescriptions. Think Costco: they profit on memberships, not products, which forces them to deliver genuine value on everything they sell. Same model here.",
              },
              {
                question: "How does the $99 membership work?",
                answer:
                  "Pay $99 once, get 12 months of wholesale pricing. Each order is billed separately: wholesale drug cost + $10 dispensing fee per medication + $5 flat shipping per order. To maximize savings, order a 365-day supply in one order. Example: 3 medications, annual order = ~$10.95 drug cost + $30 dispensing + $5 shipping = $45.95 for a full year. Same 3 medications ordered monthly = $430+. Membership auto-renews annually — cancel anytime from your account.",
              },
              {
                question: "Can I see my savings before I join?",
                answer:
                  "Yes. The savings calculator shows your wholesale cost side-by-side with average retail prices for every medication. Enter your drugs, see your annual savings. Most members on 2+ generics save significantly more than the $99 membership fee in the first order alone.",
              },
              {
                question: "How does signup work?",
                answer:
                  "Entirely online, takes minutes. Pay $99, wholesale access activates immediately. Submit your prescription through your member dashboard — transfer from your current pharmacy (1–2 business days) or have your doctor send a new prescription directly to HealthWarehouse. Set up auto-refills, refill renewal alerts, and manage all active medications from one dashboard. Orders ship to any US address including addresses different from your billing address.",
              },
            ]}
          />
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
