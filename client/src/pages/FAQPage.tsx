import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { SEOHead, getBaseUrl } from "@/components/SEOHead";
import { FAQAccordion, FAQItem } from "@/components/FAQAccordion";
import { ArrowRight } from "lucide-react";

const ALL_FAQS: FAQItem[] = [
  {
    question: "What is Pillar Drug Club?",
    answer:
      "Pillar Drug Club is a membership-based pharmacy service that gives members access to generic medications at wholesale prices. For $99 per year, members pay true wholesale drug costs plus a $10 dispensing fee per medication and $5 flat shipping — no insurance required.",
  },
  {
    question: "How is Pillar Drug Club different from GoodRx?",
    answer:
      "GoodRx provides coupons that discount retail pharmacy prices. Pillar Drug Club starts at wholesale — the price before retail markup. For members on multiple generic medications, the annual savings typically far exceed the $99 membership cost.",
  },
  {
    question: "What medications are covered?",
    answer:
      "Pillar Drug Club covers hundreds of generic medications across all major therapeutic categories including blood pressure, diabetes, cholesterol, thyroid, mental health, and more. Brand-name medications are not included. Members can request a specific medication lookup before joining.",
  },
  {
    question: "How does the $99 membership work?",
    answer:
      "Pay $99 once per year. That gives you access to wholesale generic pricing for 12 months. You pay separately for each order: wholesale drug cost + $10 dispensing fee per medication + $5 flat shipping. No monthly fees, no hidden costs.",
  },
  {
    question: "What are the dispensing and shipping fees?",
    answer:
      "Each medication has a $10 dispensing fee. Shipping is a flat $5 per order regardless of how many medications are included. Example: 3 medications in one order = $30 dispensing + $5 shipping = $35 in fees, plus the wholesale cost of the medications.",
  },
  {
    question: "How do I transfer my prescription?",
    answer:
      "After joining, you provide your prescription information during onboarding. PDC coordinates the transfer to our fulfillment partner. You can transfer from any pharmacy. Most transfers are completed within 1–2 business days.",
  },
  {
    question: "Is my data private and HIPAA compliant?",
    answer:
      "Yes. Pillar Drug Club operates under full HIPAA compliance. Your prescription and health information is never sold or shared with advertisers. All data is encrypted and handled according to federal healthcare privacy standards.",
  },
];

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Pillar Drug Club FAQ | How the $99 Pharmacy Membership Works"
        description="Questions about Pillar Drug Club? Learn how the membership works, what medications are covered, fees, HIPAA compliance, and how to transfer your prescription."
        canonical={`${getBaseUrl()}/faq`}
      />

      <div className="max-w-3xl mx-auto px-6 py-16 md:py-24">
        <h1 className="text-4xl md:text-5xl font-black text-foreground mb-4 leading-tight" data-testid="text-faq-headline">
          Frequently Asked Questions About Pillar Drug Club
        </h1>
        <p className="text-lg text-muted-foreground mb-12" data-testid="text-faq-intro">
          Everything you need to know about how Pillar Drug Club works, what it costs, and how to get started.
        </p>

        <FAQAccordion items={ALL_FAQS} />

        <div className="mt-16 pt-10 border-t border-border text-center">
          <p className="text-muted-foreground mb-6">
            Ready to stop overpaying at the pharmacy?
          </p>
          <Link href="/register">
            <Button size="lg" className="font-bold px-8" data-testid="button-faq-cta">
              Join Pillar Drug Club for $99/year
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
