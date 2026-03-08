import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { SEOHead, getBaseUrl } from "@/components/SEOHead";
import { FAQAccordion, FAQItem } from "@/components/FAQAccordion";
import { ArrowRight, Check } from "lucide-react";

const FAQS: FAQItem[] = [
  {
    question: "What is ScriptCo and how does it work?",
    answer:
      "ScriptCo is a membership pharmacy service founded in 2019 that charges an annual fee for access to discounted generic medications. Members pay a membership fee plus per-prescription costs. The service operates in a similar model to other direct-pay pharmacy clubs.",
  },
  {
    question: "Is Pillar Drug Club cheaper than ScriptCo?",
    answer:
      "Pillar Drug Club's $99/year membership includes access to wholesale generic pricing plus a flat $10 dispensing fee per medication and $5 flat shipping. Whether this is cheaper than ScriptCo depends on which medications you take and how frequently you order — we recommend calculating your specific annual cost using our Cost Calculator.",
  },
  {
    question: "How do I switch from ScriptCo to Pillar Drug Club?",
    answer:
      "Join Pillar Drug Club at $99/year, then provide your prescription information during onboarding. We coordinate the transfer from your current fulfillment source. Most transfers are completed within 1–2 business days. You don't need to do anything at your previous pharmacy.",
  },
  {
    question: "Does Pillar Drug Club carry the same medications as ScriptCo?",
    answer:
      "Pillar Drug Club covers hundreds of generic medications across major categories: diabetes, blood pressure, cholesterol, thyroid, mental health, and more. Members can request a medication lookup before joining to confirm their specific prescriptions are available.",
  },
  {
    question: "What makes Pillar Drug Club different from other pharmacy membership clubs?",
    answer:
      "Pillar Drug Club offers pass-through wholesale pricing (no markup on drug costs), up to 12-month supply fills to reduce per-dose overhead, HIPAA-compliant data handling, and direct mail delivery through our licensed pharmacy partner. We focus on transparency: you always know exactly what you're paying and why.",
  },
];

const comparisonRows = [
  { feature: "Annual membership cost", scriptco: "Varies by tier", pdc: "$99/year — single tier" },
  { feature: "Medication pricing model", scriptco: "Discounted retail or fixed formulary", pdc: "Wholesale pass-through — no markup" },
  { feature: "90-day supply", scriptco: "Available", pdc: "Yes — up to 12-month supply" },
  { feature: "Fulfillment", scriptco: "Pharmacy network", pdc: "HealthWarehouse (licensed pharmacy partner)" },
  { feature: "Founded", scriptco: "2019", pdc: "2024" },
];

export default function ScriptCoAlternativePage() {
  const pageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Best ScriptCo Alternative 2025 | Pillar Drug Club",
    description:
      "ScriptCo has been around since 2019 but growth has been slow. See how Pillar Drug Club compares on price, service, and medication access.",
    url: `${getBaseUrl()}/scriptco-alternative`,
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Best ScriptCo Alternative 2025 | Pillar Drug Club"
        description="ScriptCo has been around since 2019 but growth has been slow. See how Pillar Drug Club compares on price, service, and medication access."
        canonical={`${getBaseUrl()}/scriptco-alternative`}
        schema={pageSchema}
      />

      <div className="max-w-3xl mx-auto px-6 py-16 md:py-24">

        {/* H1 */}
        <h1
          className="text-3xl md:text-5xl font-black text-foreground mb-6 leading-tight"
          data-testid="text-page-headline"
        >
          Looking for a ScriptCo Alternative? Here's How Pillar Drug Club Compares
        </h1>

        {/* Direct answer */}
        <p className="text-lg text-muted-foreground mb-12 leading-relaxed">
          If you're looking for a ScriptCo alternative, Pillar Drug Club is a direct-pay pharmacy membership that gives members wholesale generic pricing with a flat $99/year fee. It's a newer option built around price transparency and up to 12-month supply fills — designed for people who want predictable, affordable prescriptions without insurance games.
        </p>

        {/* What is ScriptCo */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-4">What is ScriptCo?</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            ScriptCo is a pharmacy membership club founded in 2019. Members pay an annual fee in exchange for access to discounted generic medications at prices below typical retail pharmacy rates. The service operates as a direct-pay model — no insurance billing, members pay out of pocket at membership pricing.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            The model was early in the pharmacy membership space, but the category has grown with newer entrants offering more transparent pricing structures and modern digital experiences.
          </p>
        </section>

        {/* What are ScriptCo's limitations */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-4">What are ScriptCo's limitations?</h2>
          <div className="space-y-3">
            {[
              "Multiple membership tiers can make it harder to know which plan is right for you",
              "Growth has been slow relative to the broader direct-pay pharmacy market",
              "Limited public transparency around exactly how medication pricing is calculated",
              "No 12-month supply option for maximum cost-per-dose reduction",
            ].map((point, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="h-5 w-5 rounded-full border border-muted-foreground/40 flex-shrink-0 mt-0.5" />
                <p className="text-muted-foreground">{point}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How is Pillar Drug Club different */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-4">How is Pillar Drug Club different from ScriptCo?</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Pillar Drug Club is built around a single $99/year membership with no tiers to navigate. Pricing is pass-through wholesale: you pay what the pharmacy pays for the drug, plus a flat $10 dispensing fee per medication and $5 flat shipping per order.
          </p>
          <div className="space-y-3">
            {[
              "One membership, one price — no tiered confusion",
              "True wholesale drug costs — no markup on the medication itself",
              "Up to 12-month supply in a single fill, reducing dispensing and shipping costs dramatically",
              "HIPAA-compliant data handling with field-level encryption",
              "Direct mail delivery via HealthWarehouse, a licensed U.S. pharmacy",
            ].map((point, i) => (
              <div key={i} className="flex items-start gap-3">
                <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-foreground">{point}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Comparison table */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">Is Pillar Drug Club cheaper than ScriptCo?</h2>
          <p className="text-muted-foreground mb-6 leading-relaxed">
            The answer depends on your specific medications and fill frequency. Use our{" "}
            <Link href="/cost-calculator" className="text-primary underline underline-offset-2">
              Cost Calculator
            </Link>{" "}
            to see your actual annual cost. Below is a side-by-side comparison of the two services.
          </p>

          <div className="overflow-x-auto rounded-md border border-border">
            <table className="w-full text-sm" data-testid="comparison-table">
              <thead>
                <tr className="bg-muted/50">
                  <th className="text-left px-4 py-3 font-bold text-foreground">Feature</th>
                  <th className="text-left px-4 py-3 font-bold text-foreground">ScriptCo</th>
                  <th className="text-left px-4 py-3 font-bold text-primary">Pillar Drug Club</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row, i) => (
                  <tr key={i} className="border-t border-border">
                    <td className="px-4 py-3 font-medium text-foreground">{row.feature}</td>
                    <td className="px-4 py-3 text-muted-foreground">{row.scriptco}</td>
                    <td className="px-4 py-3 text-foreground">{row.pdc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* How to switch */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-4">How do I switch from ScriptCo to Pillar Drug Club?</h2>
          <div className="space-y-4">
            {[
              { step: "1", text: "Join Pillar Drug Club at $99/year — takes about 5 minutes." },
              { step: "2", text: "During onboarding, enter your current prescription information." },
              { step: "3", text: "We coordinate the transfer to our pharmacy partner. Most complete in 1–2 business days." },
              { step: "4", text: "Your medications ship directly to your door. No action required at your previous pharmacy." },
            ].map((item) => (
              <div key={item.step} className="flex gap-4">
                <span className="text-3xl font-black text-primary/30 flex-shrink-0 leading-tight">{item.step}</span>
                <p className="text-foreground leading-relaxed pt-1">{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">Common questions</h2>
          <FAQAccordion items={FAQS} />
        </section>

        {/* CTA */}
        <div className="pt-8 border-t border-border text-center">
          <p className="text-xl font-bold text-foreground mb-2">Ready to make the switch?</p>
          <p className="text-muted-foreground mb-6">
            Join Pillar Drug Club and start paying wholesale prices on your generic medications.
          </p>
          <Link href="/register">
            <Button size="lg" className="font-bold px-8" data-testid="button-cta-join">
              Join Pillar Drug Club for $99/year
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
