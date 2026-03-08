import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { SEOHead, getBaseUrl } from "@/components/SEOHead";
import { FAQAccordion, FAQItem } from "@/components/FAQAccordion";
import { ArrowRight, Check, X } from "lucide-react";

const FAQS: FAQItem[] = [
  {
    question: "Does GoodRx actually save you money?",
    answer:
      "GoodRx can reduce retail pharmacy prices on generic medications, but the discounts vary widely by location and drug. Prices you see on GoodRx may not match what you're charged at the counter, and pharmacies can decline to honor coupons. For people on multiple medications, the savings are inconsistent.",
  },
  {
    question: "Is a pharmacy membership better than GoodRx?",
    answer:
      "For people who take two or more generic medications regularly, a pharmacy membership like Pillar Drug Club typically saves more than GoodRx. GoodRx discounts retail prices; Pillar Drug Club starts at wholesale — the price before any retail markup. The $99/year membership pays for itself quickly for most chronic medication users.",
  },
  {
    question: "What is the difference between wholesale pricing and a GoodRx coupon?",
    answer:
      "GoodRx negotiates discounts off the retail price pharmacies charge. Wholesale pricing is the cost pharmacies themselves pay to acquire the medication before any markup. Wholesale pricing is fundamentally lower — there's no markup layer to discount from.",
  },
  {
    question: "Who should use a pharmacy membership instead of GoodRx?",
    answer:
      "A pharmacy membership makes the most sense for people who take two or more generic medications on an ongoing basis, especially for chronic conditions like diabetes, high blood pressure, or high cholesterol. If you take a single medication occasionally, GoodRx may be sufficient.",
  },
  {
    question: "Can I use both GoodRx and a pharmacy membership?",
    answer:
      "No — you would choose one or the other for your regular prescriptions. Pillar Drug Club members fill through our fulfillment partner at wholesale prices, which typically beats any GoodRx coupon for the medications we carry.",
  },
];

const comparisonRows = [
  { feature: "Cost model", goodrx: "Coupon discounts off retail price", pdc: "True wholesale pricing — below retail" },
  { feature: "Annual cost", goodrx: "Free (basic), up to $99+/yr (Gold)", pdc: "$99/year flat — no tiers" },
  { feature: "Generic drug pricing", goodrx: "Varies by coupon, pharmacy, and location", pdc: "Consistent wholesale cost + $10 dispensing fee" },
  { feature: "90-day supply", goodrx: "Available at participating pharmacies", pdc: "Yes — up to 12-month supply available" },
  { feature: "Membership required", goodrx: "No (basic), Yes (Gold)", pdc: "Yes — $99/year" },
  { feature: "Best for", goodrx: "Occasional users, single medications", pdc: "Multiple chronic medications, predictable costs" },
];

export default function PharmacyMembershipVsGoodRxPage() {
  const pageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Pharmacy Membership vs GoodRx: Real Cost Comparison (2025)",
    description:
      "GoodRx offers coupons. Pillar Drug Club offers wholesale prices. See the real cost difference on generic medications for cash-pay patients.",
    url: `${getBaseUrl()}/pharmacy-membership-vs-goodrx`,
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Pharmacy Membership vs GoodRx: Real Cost Comparison (2025)"
        description="GoodRx offers coupons. Pillar Drug Club offers wholesale prices. See the real cost difference on generic medications for cash-pay patients."
        canonical={`${getBaseUrl()}/pharmacy-membership-vs-goodrx`}
        schema={pageSchema}
      />

      <div className="max-w-3xl mx-auto px-6 py-16 md:py-24">

        {/* H1 */}
        <h1
          className="text-3xl md:text-5xl font-black text-foreground mb-6 leading-tight"
          data-testid="text-page-headline"
        >
          Pharmacy Membership vs GoodRx: Which Actually Saves You More?
        </h1>

        {/* Direct answer */}
        <p className="text-lg text-muted-foreground mb-12 leading-relaxed">
          GoodRx negotiates coupons off retail pharmacy prices — useful, but still tied to a marked-up baseline. A pharmacy membership like Pillar Drug Club gives you access to wholesale pricing, which is what pharmacies themselves pay before any markup. For people on two or more generic medications, the membership typically saves more money per year.
        </p>

        {/* How does GoodRx work */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-4">How does GoodRx work?</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            GoodRx aggregates discount codes from pharmacy benefit managers (PBMs) and displays the best available coupon price at pharmacies near you. When you show the GoodRx coupon at the counter, the pharmacy processes it through their PBM agreement and applies the discount.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            The result is a discounted retail price — which is still a retail price. Prices vary by pharmacy and zip code, coupons can be declined, and GoodRx earns a referral fee each time you use one.
          </p>
        </section>

        {/* How does a pharmacy membership work */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-4">How does a pharmacy membership work?</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            A pharmacy membership like Pillar Drug Club charges a flat annual fee ($99/year) in exchange for access to wholesale drug pricing. Members pay the actual acquisition cost of the medication — no retail markup — plus a flat $10 dispensing fee per medication and $5 shipping per order.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Fulfillment is handled through licensed pharmacy partners. Members can get up to a 12-month supply in a single order, which further reduces the per-dose cost of dispensing and shipping fees.
          </p>
        </section>

        {/* Comparison table */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">Which saves more on generic medications?</h2>

          <div className="overflow-x-auto rounded-md border border-border">
            <table className="w-full text-sm" data-testid="comparison-table">
              <thead>
                <tr className="bg-muted/50">
                  <th className="text-left px-4 py-3 font-bold text-foreground">Feature</th>
                  <th className="text-left px-4 py-3 font-bold text-foreground">GoodRx</th>
                  <th className="text-left px-4 py-3 font-bold text-primary">Pillar Drug Club</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row, i) => (
                  <tr key={i} className="border-t border-border">
                    <td className="px-4 py-3 font-medium text-foreground">{row.feature}</td>
                    <td className="px-4 py-3 text-muted-foreground">{row.goodrx}</td>
                    <td className="px-4 py-3 text-foreground">{row.pdc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Specific example */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-4">Real example: Metformin 500mg, 90-day supply</h2>
          <div className="bg-muted/30 rounded-md p-6 space-y-4">
            <div>
              <p className="font-semibold text-foreground mb-1">With GoodRx</p>
              <p className="text-muted-foreground">
                A 90-day supply of metformin 500mg (90 tablets) costs approximately $4 to $15 depending on your local pharmacy and the current coupon. Prices fluctuate — the same medication can vary by 3x across different zip codes.
              </p>
            </div>
            <div className="border-t border-border pt-4">
              <p className="font-semibold text-foreground mb-1">With Pillar Drug Club</p>
              <p className="text-muted-foreground">
                The same 90-day supply costs the wholesale price (typically under $3) plus a $10 dispensing fee and $5 shipping — roughly $18 total. Over a full year with quarterly fills, you'd pay about $72 in fees on top of the $99 membership. But order a 12-month supply once and those same fees drop to $15 for the entire year.
              </p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-3">
            The real advantage shows when you're on 3+ medications. A single 12-month order for 3 medications is $30 dispensing + $5 shipping = $35 in fees for the entire year.
          </p>
        </section>

        {/* Who should use a membership */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-4">Who should use a pharmacy membership instead of GoodRx?</h2>
          <div className="space-y-3">
            {[
              "People on two or more generic medications for ongoing conditions",
              "Gig workers, self-employed, or anyone without employer-sponsored insurance",
              "People with high-deductible health plans who pay out of pocket until they hit their deductible",
              "Anyone who wants predictable, consistent prescription costs without coupon hunting",
              "People who want 6- or 12-month supplies to reduce trips and administrative hassle",
            ].map((point, i) => (
              <div key={i} className="flex items-start gap-3">
                <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-foreground">{point}</p>
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
          <p className="text-xl font-bold text-foreground mb-2">Stop coupon hunting. Start paying wholesale.</p>
          <p className="text-muted-foreground mb-6">
            Join Pillar Drug Club and pay the price pharmacies pay — not the price they charge.
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
