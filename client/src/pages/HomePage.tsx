import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowRight, Check, Truck, ShieldCheck, XCircle } from "lucide-react";
import { SEOHead, pharmacySchema, medicalWebPageSchema, organizationSchema, howToSaveMoneySchema, getBaseUrl } from "@/components/SEOHead";
import { FAQAccordion } from "@/components/FAQAccordion";
import { WaitlistModal } from "@/components/WaitlistModal";
import pdcLogo from "@assets/image_1771566531369.jpeg";

const drugs = [
  { name: "Metformin 500mg", qty: "90ct", retail: 32, pdc: 4.80, save: 85 },
  { name: "Lisinopril 10mg", qty: "90ct", retail: 28, pdc: 3.50, save: 87 },
  { name: "Sertraline 50mg", qty: "90ct", retail: 47, pdc: 6.20, save: 87 },
  { name: "Atorvastatin 20mg", qty: "90ct", retail: 54, pdc: 5.90, save: 89 },
];

const steps = [
  {
    n: "01",
    title: "Join for $99/year",
    body: "One flat annual fee. No per-fill charges, no insurance forms, no prior auth. Your membership unlocks wholesale pricing on every covered generic.",
  },
  {
    n: "02",
    title: "Submit your prescription",
    body: "Transfer from your current pharmacy (1–2 business days) or have your doctor send a new script directly to our fulfillment partner. All online.",
  },
  {
    n: "03",
    title: "Receive at wholesale cost",
    body: "Your medications ship to your door at actual acquisition cost — what the pharmacy paid, not what they charge. Most members save hundreds in the first order.",
  },
];

const comparisonDrugs = [
  { name: "Metformin 500mg (90ct)", retail: "$32", goodrx: "$9", costplus: "$6", pdc: "$4.80" },
  { name: "Lisinopril 10mg (90ct)", retail: "$28", goodrx: "$8", costplus: "$5", pdc: "$3.50" },
  { name: "Sertraline 50mg (90ct)", retail: "$47", goodrx: "$14", costplus: "$9", pdc: "$6.20" },
  { name: "Atorvastatin 20mg (90ct)", retail: "$54", goodrx: "$15", costplus: "$9", pdc: "$5.90" },
];

export default function HomePage() {
  const [modalOpen, setModalOpen] = useState(false);

  const homepageFaqSchema = {
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What is Pillar Drug Club?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "A membership pharmacy that gives you access to generic medications at true wholesale prices — what pharmacies actually pay, before any markup. Pay $99/year, get wholesale pricing on hundreds of generics. Most tablets cost as little as $0.01, making a full year's supply as low as $3.65. No insurance needed. Available in all 50 states."
        }
      },
      {
        "@type": "Question",
        "name": "Why are retail pharmacy prices so high?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Because pharmacies don't quote you the real cost of the drug — they quote the insurance billing price. That number is inflated by middlemen called PBMs (Pharmacy Benefit Managers) who profit from the gap between what insurers pay and what drugs actually cost. The result: cash-paying patients get charged the highest price in the supply chain, even though the drug itself may cost pennies to make. PDC removes every middleman and passes you the actual wholesale cost — nothing more."
        }
      },
      {
        "@type": "Question",
        "name": "What is a PBM and why does it matter?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "PBMs — CVS Caremark, Express Scripts, OptumRx — control roughly 80% of US prescription transactions. They sit between manufacturers, insurers, and pharmacies, collecting rebates and profiting from spread pricing. The more expensive the drug, the more they make. Cash-pay PDC members bypass PBMs entirely. No middleman. No spread pricing. Just wholesale cost plus a flat fee."
        }
      },
      {
        "@type": "Question",
        "name": "How is PDC different from GoodRx?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "GoodRx discounts retail prices — you're still paying a marked-up price, just less of it. PDC starts at wholesale — before retail markup exists. For members on multiple generics, the difference is hundreds of dollars per year. GoodRx is free but costs more per prescription. PDC costs $99/year but charges less per prescription."
        }
      },
      {
        "@type": "Question",
        "name": "How is PDC different from Mark Cuban's Cost Plus Drugs?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Cost Plus charges a 15% markup over wholesale plus fees — better than retail, but still a markup. The more expensive your medication, the more they earn per transaction. PDC charges zero markup on medications. Every dollar of profit comes from the $99 membership — not from your prescriptions. Think Costco: they profit on memberships, not products, which forces them to deliver genuine value on everything they sell. Same model here."
        }
      },
      {
        "@type": "Question",
        "name": "How does the $99 membership work?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Pay $99 once, get 12 months of wholesale pricing. Each order is billed separately: wholesale drug cost + $10 dispensing fee per medication + $5 flat shipping per order. To maximize savings, order a 365-day supply in one order. Example: 3 medications, annual order = approximately $10.95 drug cost + $30 dispensing + $5 shipping = $45.95 for a full year. Same 3 medications ordered monthly = $430+. Membership auto-renews annually — cancel anytime from your account."
        }
      },
      {
        "@type": "Question",
        "name": "How do supply length and fees work?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Since dispensing ($10/medication) and shipping ($5/order) are charged per order — not per month — ordering annually costs the same in fees as ordering once for 30 days. One medication, 365-day supply: $3.65 drug cost + $10 dispensing + $5 shipping = $18.65 for the entire year. Stack multiple medications in one order and the $5 shipping is shared across all of them."
        }
      },
      {
        "@type": "Question",
        "name": "What medications are covered?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Hundreds of FDA-approved generic medications — blood pressure, diabetes, cholesterol, thyroid, mental health, acid reflux, and more. No brand-name drugs, no compounded medications, no controlled substances, no OTCs. Search the full drug list on our site before joining — no account required. Pricing shown in real time."
        }
      },
      {
        "@type": "Question",
        "name": "Is prior authorization ever required?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Never. Prior auth is an insurance construct. PDC is cash-pay — no insurance, no prior auth, no step therapy, no formulary restrictions, no claim denials. Your doctor writes it, it is a covered generic, you can order it."
        }
      },
      {
        "@type": "Question",
        "name": "Is this legal?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes. Cash-pay pharmacy is legal in all 50 states. What is new is making wholesale pricing accessible to individuals — the same way Costco made bulk pricing accessible to everyday consumers. Every order goes through HealthWarehouse, a fully licensed US pharmacy, under a valid prescription."
        }
      },
      {
        "@type": "Question",
        "name": "Is PDC a licensed pharmacy?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "PDC is LegitScript certified as a healthcare merchant — the same standard required by Google and Meta for pharmacy advertising. Prescription fulfillment is handled by HealthWarehouse, our licensed pharmacy partner. Your medications are dispensed by a fully regulated US pharmacy."
        }
      },
      {
        "@type": "Question",
        "name": "Is my information private?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes. Full HIPAA compliance. Your data is encrypted, never sold, never shared with advertisers. HealthWarehouse operates under a Business Associate Agreement with PDC. Your prescription history stays private."
        }
      }
    ]
  };

  const combinedSchema = {
    "@context": "https://schema.org",
    "@graph": [
      pharmacySchema,
      medicalWebPageSchema,
      organizationSchema,
      howToSaveMoneySchema,
      homepageFaqSchema
    ]
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Save 90% on Prescriptions | Get Meds Without Insurance | Pillar Drug Club"
        description="Pay $99/year and access generic medications at true wholesale prices. Most tablets as low as $0.01. No insurance required. Founded by a licensed pharmacist."
        canonical={getBaseUrl()}
        schema={combinedSchema}
      />

      <WaitlistModal open={modalOpen} onOpenChange={setModalOpen} />

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="pt-8 md:pt-12 pb-16 md:pb-24 px-6 md:px-12">
        <div className="max-w-3xl">
          <div className="flex justify-center mb-4 md:mb-12">
            <p className="text-xs font-bold tracking-[0.3em] uppercase text-secondary px-5 py-2.5 rounded-lg border border-border shadow-md bg-card text-center" data-testid="text-hero-badge">
              FOUNDED BY A LICENSED PHARMACIST
            </p>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-foreground leading-[1.05] mb-6" data-testid="text-hero-headline">
            Your prescriptions,<br />
            at <em className="text-secondary">actual</em> cost, not markups.
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-10 max-w-2xl" data-testid="text-hero-subline">
            One $99/year membership. Every generic at the price your pharmacy paid — not what they charge you.
          </p>

          <div className="flex flex-col items-center gap-3">
            <Button
              size="lg"
              className="h-14 px-10 text-base font-bold"
              onClick={() => setModalOpen(true)}
              data-testid="button-hero-cta"
            >
              Start Saving Today — $99/year
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <p className="text-sm text-muted-foreground">
              <Check className="inline h-3.5 w-3.5 mr-1 text-primary" />
              Cancel anytime. No contracts.
            </p>
          </div>
        </div>
      </section>

      {/* ── DRUG PRICE TABLE ─────────────────────────────────────── */}
      <section className="py-12 md:py-20 px-6 md:px-12 bg-muted/30">
        <div className="max-w-2xl mx-auto">
          <p className="text-xs font-bold tracking-[0.3em] uppercase text-secondary mb-8 text-center" data-testid="text-table-label">
            WHAT MEMBERS ACTUALLY PAY VS. RETAIL
          </p>

          <div className="space-y-0 rounded-xl border border-border overflow-hidden bg-card">
            {drugs.map((drug, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between gap-4 px-6 py-5 border-b border-border last:border-0"
                data-testid={`drug-row-${idx}`}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-sm md:text-base">{drug.name}</p>
                  <p className="text-xs text-muted-foreground">{drug.qty}</p>
                </div>
                <div className="flex items-center gap-3 md:gap-6 flex-shrink-0">
                  <span className="text-muted-foreground line-through text-sm md:text-base" data-testid={`drug-retail-${idx}`}>
                    ${drug.retail}
                  </span>
                  <span className="text-lg md:text-xl font-black text-foreground" data-testid={`drug-pdc-${idx}`}>
                    ${drug.pdc.toFixed(2)}
                  </span>
                  <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-md whitespace-nowrap" data-testid={`drug-save-${idx}`}>
                    SAVE {drug.save}%
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Proof bar */}
          <div className="mt-6 pt-6 border-t border-border/60 text-center space-y-2">
            <p className="text-sm font-bold text-foreground" data-testid="text-annual-savings">
              Annual savings on those 4 drugs alone:<br />
              <span className="text-primary">$621 vs. retail</span> / 4 fills each
            </p>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-1 mt-3">
              {[
                "PharmD — 10+ years clinical experience",
                "HIPAA-compliant fulfillment",
              ].map((item, i) => (
                <p key={i} className="text-xs text-muted-foreground">
                  <ShieldCheck className="inline h-3 w-3 mr-1 text-primary" />
                  {item}
                </p>
              ))}
            </div>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-1">
              {[
                "Free delivery to your door",
                "No insurance required",
                "Cancel anytime — zero risk",
              ].map((item, i) => (
                <p key={i} className="text-xs text-muted-foreground">
                  <Check className="inline h-3 w-3 mr-1 text-primary" />
                  {item}
                </p>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── THE REAL PROBLEM ─────────────────────────────────────── */}
      <section className="py-16 md:py-24 px-6 md:px-12">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-bold tracking-[0.3em] uppercase text-secondary mb-4 text-center" data-testid="text-problem-label">
            THE REAL PROBLEM
          </p>
          <h2 className="text-3xl md:text-5xl font-black text-foreground mb-6 leading-tight" data-testid="text-problem-headline">
            You're paying retail.<br />The pharmacy didn't.
          </h2>
          <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-2xl" data-testid="text-problem-body">
            Generic drugs are cheap to make. What you pay at the counter has almost nothing to do with what they cost. That markup exists because you've had no way around it — until now.
          </p>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────── */}
      <section className="py-16 md:py-24 px-6 md:px-12 bg-muted/30">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-bold tracking-[0.3em] uppercase text-secondary mb-4 text-center" data-testid="text-how-label">
            HOW IT WORKS
          </p>
          <h2 className="text-3xl md:text-4xl font-black text-foreground mb-12 leading-tight" data-testid="text-how-headline">
            Three steps. Done in five minutes.
          </h2>
          <div className="space-y-10">
            {steps.map((step) => (
              <div key={step.n} className="flex gap-6" data-testid={`step-item-${step.n}`}>
                <div className="flex-shrink-0">
                  <span className="text-4xl md:text-5xl font-black text-primary/20">{step.n}</span>
                </div>
                <div className="pt-1">
                  <h3 className="text-xl md:text-2xl font-bold text-foreground mb-2">{step.title}</h3>
                  <p className="text-base md:text-lg text-muted-foreground leading-relaxed">{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── THE NUMBERS ──────────────────────────────────────────── */}
      <section className="py-16 md:py-24 px-6 md:px-12">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-bold tracking-[0.3em] uppercase text-secondary mb-4 text-center" data-testid="text-numbers-label">
            THE NUMBERS
          </p>
          <h2 className="text-3xl md:text-4xl font-black text-foreground mb-3 leading-tight" data-testid="text-numbers-headline">
            Side-by-side. No spin.
          </h2>
          <p className="text-sm text-muted-foreground mb-10" data-testid="text-numbers-subline">
            Retail prices from major pharmacy chains. GoodRx prices as listed. PDC prices are acquisition cost plus a flat dispensing fee.
          </p>

          <div className="rounded-xl border border-border overflow-hidden bg-card">
            {/* Header row */}
            <div className="grid grid-cols-5 gap-0 bg-muted/40 border-b border-border">
              <div className="col-span-2 px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Medication</div>
              <div className="px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">Retail</div>
              <div className="px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">GoodRx</div>
              <div className="px-4 py-3 text-xs font-bold text-primary uppercase tracking-wider text-right">PDC</div>
            </div>
            {comparisonDrugs.map((drug, idx) => (
              <div key={idx} className="grid grid-cols-5 gap-0 border-b border-border last:border-0" data-testid={`comparison-row-${idx}`}>
                <div className="col-span-2 px-4 py-4">
                  <p className="text-sm font-medium text-foreground">{drug.name}</p>
                </div>
                <div className="px-4 py-4 text-right">
                  <p className="text-sm text-muted-foreground line-through">{drug.retail}</p>
                </div>
                <div className="px-4 py-4 text-right">
                  <p className="text-sm text-muted-foreground">{drug.goodrx}</p>
                </div>
                <div className="px-4 py-4 text-right">
                  <p className="text-sm font-bold text-primary">{drug.pdc}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-4 text-xs text-muted-foreground leading-relaxed" data-testid="text-numbers-footnote">
            GoodRx is free but requires a coupon at a retail counter and prices vary by location. PDC eliminates per-prescription variables entirely. One $99 annual fee, then wholesale on everything.
          </p>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────── */}
      <section className="py-16 md:py-24 px-6 md:px-12 bg-muted/30">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-bold tracking-[0.3em] uppercase text-secondary mb-4 text-center" data-testid="text-faq-label">
            QUESTIONS
          </p>
          <h2 className="text-3xl md:text-4xl font-black text-foreground mb-10 leading-tight" data-testid="text-faq-headline">
            If you're wondering, here's the answer.
          </h2>
          <FAQAccordion
            noSchema
            items={[
              {
                question: "What is Pillar Drug Club?",
                answer: "A membership pharmacy that gives you access to generic medications at true wholesale prices — what pharmacies actually pay, before any markup. Pay $99/year, get wholesale pricing on hundreds of generics. Most tablets cost as little as $0.01, making a full year's supply as low as $3.65. No insurance needed. Available in all 50 states.",
              },
              {
                question: "What is a PBM and why does it matter?",
                answer: "PBMs — CVS Caremark, Express Scripts, OptumRx — control roughly 80% of US prescription transactions. They sit between manufacturers, insurers, and pharmacies, collecting rebates and profiting from spread pricing. The more expensive the drug, the more they make. Cash-pay PDC members bypass PBMs entirely. No middleman. No spread pricing. Just wholesale cost plus a flat fee.",
              },
              {
                question: "How is PDC different from Mark Cuban's Cost Plus Drugs?",
                answer: "Cost Plus charges a 15% markup over wholesale plus fees — better than retail, but still a markup. The more expensive your medication, the more they earn per transaction. PDC charges zero markup on medications. Every dollar of profit comes from the $99 membership — not from your prescriptions. Think Costco: they profit on memberships, not products, which forces them to deliver genuine value on everything they sell. Same model here.",
              },
              {
                question: "How does the $99 membership work?",
                answer: "Pay $99 once, get 12 months of wholesale pricing. Each order is billed separately: wholesale drug cost + $10 dispensing fee per medication + $5 flat shipping per order. To maximize savings, order a 365-day supply in one order. Example: 3 medications, annual order = ~$10.95 drug cost + $30 dispensing + $5 shipping = $45.95 for a full year. Same 3 medications ordered monthly = $430+. Membership auto-renews annually — cancel anytime from your account.",
              },
              {
                question: "Can I see my savings before I join?",
                answer: "Yes. The savings calculator shows your wholesale cost side-by-side with average retail prices for every medication. Enter your drugs, see your annual savings. Most members on 2+ generics save significantly more than the $99 membership fee in the first order alone.",
              },
              {
                question: "How does signup work?",
                answer: "Entirely online, takes minutes. Pay $99, wholesale access activates immediately. Submit your prescription through your member dashboard — transfer from your current pharmacy (1–2 business days) or have your doctor send a new prescription directly to HealthWarehouse. Set up auto-refills, refill renewal alerts, and manage all active medications from one dashboard. Orders ship to any US address including addresses different from your billing address.",
              },
            ]}
          />
        </div>
      </section>

      {/* ── BOTTOM CTA ───────────────────────────────────────────── */}
      <section className="py-20 md:py-32 px-6 md:px-12">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-black text-foreground mb-6 leading-tight" data-testid="text-bottom-cta-headline">
            Pay wholesale.<br />Keep the difference.
          </h2>
          <p className="text-base md:text-lg text-muted-foreground mb-10 leading-relaxed max-w-lg mx-auto" data-testid="text-bottom-cta-body">
            $99/year. Cancel anytime. No insurance required. If PDC doesn't save you more than $99 in your first year, email us and we'll refund the membership.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 mb-10">
            <div className="text-center">
              <p className="text-6xl md:text-7xl font-black text-foreground" data-testid="text-bottom-price">$99</p>
              <p className="text-sm text-muted-foreground mt-1">per year</p>
            </div>
            <div className="hidden sm:block w-px h-16 bg-border" />
            <div className="text-center">
              <p className="text-xl font-bold text-primary" data-testid="text-bottom-savings">$480 avg. retail savings/year</p>
              <p className="text-sm text-muted-foreground mt-1">Most members save 4–8× the fee</p>
            </div>
          </div>

          <Button
            size="lg"
            className="h-14 px-10 text-base font-bold mb-6"
            onClick={() => setModalOpen(true)}
            data-testid="button-bottom-cta"
          >
            Join Pillar Drug Club
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>

          <div className="flex flex-wrap justify-center gap-x-6 gap-y-1">
            {["Cancel anytime", "Free delivery", "Satisfaction guarantee"].map((item) => (
              <p key={item} className="text-sm text-muted-foreground">
                <Check className="inline h-3.5 w-3.5 mr-1 text-primary" />
                {item}
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────── */}
      <footer className="border-t border-border/40 py-10 px-6 md:px-12">
        <div className="max-w-3xl mx-auto text-center">
          <img src={pdcLogo} alt="Pillar Drug Club" className="h-8 md:h-10 object-contain mx-auto mb-6" data-testid="img-logo-footer" />
          <p className="text-xs text-muted-foreground leading-relaxed mb-4 max-w-xl mx-auto" data-testid="text-footer-legal">
            Pillar Drug Club is not an insurance product. PDC provides access to wholesale medication pricing through licensed pharmacy partners. Not all medications are available. Controlled substances are excluded.
          </p>
          <div className="flex justify-center gap-4 mb-4">
            <Link href="/privacy-policy" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</Link>
            <span className="text-xs text-muted-foreground">·</span>
            <Link href="/terms-of-service" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Terms of Service</Link>
            <span className="text-xs text-muted-foreground">·</span>
            <a href="mailto:support@pillardrugclub.com" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Contact</a>
          </div>
          <p className="text-xs text-muted-foreground" data-testid="text-footer-copyright">
            &copy; 2026 Pillar Drug Club. Founded and operated by a licensed pharmacist.
          </p>
        </div>
      </footer>
    </div>
  );
}
