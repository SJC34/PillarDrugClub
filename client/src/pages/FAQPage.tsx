import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { SEOHead, getBaseUrl } from "@/components/SEOHead";
import { FAQAccordion, FAQItem } from "@/components/FAQAccordion";
import { ArrowRight } from "lucide-react";

export const ALL_FAQS: FAQItem[] = [
  {
    question: "What is Pillar Drug Club?",
    answer:
      "A membership pharmacy that gives you access to generic medications at true wholesale prices — what pharmacies actually pay, before any markup. Pay $99/year, get wholesale pricing on hundreds of generics. Most tablets cost as little as $0.01, making a full year's supply as low as $3.65. No insurance needed. Available in all 50 states.",
  },
  {
    question: "Why are retail pharmacy prices so high?",
    answer:
      "Because pharmacies don't quote you the real cost of the drug — they quote the insurance billing price. That number is inflated by middlemen called PBMs (Pharmacy Benefit Managers) who profit from the gap between what insurers pay and what drugs actually cost. The result: cash-paying patients get charged the highest price in the supply chain, even though the drug itself may cost pennies to make. PDC removes every middleman and passes you the actual wholesale cost — nothing more.",
  },
  {
    question: "What is a PBM and why does it matter?",
    answer:
      "PBMs — CVS Caremark, Express Scripts, OptumRx — control roughly 80% of US prescription transactions. They sit between manufacturers, insurers, and pharmacies, collecting rebates and profiting from spread pricing. The more expensive the drug, the more they make. Cash-pay PDC members bypass PBMs entirely. No middleman. No spread pricing. Just wholesale cost plus a flat fee.",
  },
  {
    question: "How is PDC different from GoodRx?",
    answer:
      "GoodRx discounts retail prices — you're still paying a marked-up price, just less of it. PDC starts at wholesale — before retail markup exists. For members on multiple generics, the difference is hundreds of dollars per year. GoodRx is free but costs more per prescription. PDC costs $99/year but charges less per prescription.",
  },
  {
    question: "How is PDC different from Mark Cuban's Cost Plus Drugs?",
    answer:
      "Cost Plus charges a 15% markup over wholesale plus fees — better than retail, but still a markup. The more expensive your medication, the more they earn per transaction. PDC charges zero markup on medications. Every dollar of profit comes from the $99 membership — not from your prescriptions. Think Costco: they profit on memberships, not products, which forces them to deliver genuine value on everything they sell. Same model here.",
  },
  {
    question: "Why can PDC charge so little?",
    answer:
      "Three reasons. First, medications are priced at actual acquisition cost — zero markup. Second, the membership fee funds operations, eliminating margin pressure on every prescription. Third, HealthWarehouse fulfills orders at high volume on thin margins. Remove the PBM, remove the retail markup, remove the insurance billing infrastructure — what's left is the real price of the drug. For most common generics that's a fraction of a cent per tablet.",
  },
  {
    question: "What does wholesale actually cost?",
    answer:
      "Generic drugs are manufactured competitively once brand patents expire, driving costs to near zero for many medications. Metformin, lisinopril, atorvastatin, omeprazole — some of the most prescribed drugs in America — cost less than $0.01 per tablet at wholesale. A 365-day supply: $3.65 in drug cost. Retail pharmacies mark this up 1,000%+. Cost Plus marks it up 15%. PDC marks it up zero.",
  },
  {
    question: "What are AWP, WAC, and AAC?",
    answer:
      "The three pricing benchmarks that drive US drug costs: AWP (Average Wholesale Price) — fictional. Set by manufacturers for insurance billing purposes. Industry insiders call it \"Ain't What's Paid.\" This is what retail pharmacies use to set cash prices. WAC (Wholesale Acquisition Cost) — the manufacturer's list price to distributors. Closer to real but still not actual cost. AAC (Actual Acquisition Cost) — what a pharmacy truly pays after all discounts. This is what PDC charges members. For most generics, AAC is 90–99% below AWP.",
  },
  {
    question: "How does the $99 membership work?",
    answer:
      "Pay $99 once, get 12 months of wholesale pricing. Each order is billed separately: wholesale drug cost + $10 dispensing fee per medication + $5 flat shipping per order. To maximize savings, order a 365-day supply in one order. Example: 3 medications, annual order = ~$10.95 drug cost + $30 dispensing + $5 shipping = $45.95 for a full year. Same 3 medications ordered monthly = $430+. Membership auto-renews annually — cancel anytime from your account.",
  },
  {
    question: "How do supply length and fees work?",
    answer:
      "Since dispensing ($10/medication) and shipping ($5/order) are charged per order — not per month — ordering annually costs the same in fees as ordering once for 30 days. One medication, 365-day supply: $3.65 drug cost + $10 dispensing + $5 shipping = $18.65 for the entire year. Stack multiple medications in one order and the $5 shipping is shared across all of them.",
  },
  {
    question: "Can I order multiple medications in one order?",
    answer:
      "Yes. Order as many medications as needed in a single order. Shipping is a flat $5 regardless of quantity. A member on 5 medications, one annual order, pays $1 per medication in shipping for the entire year.",
  },
  {
    question: "What medications are covered?",
    answer:
      "Hundreds of FDA-approved generic medications — blood pressure, diabetes, cholesterol, thyroid, mental health, acid reflux, and more. No brand-name drugs, no compounded medications, no controlled substances, no OTCs. Search the full drug list on our site before joining — no account required. Pricing shown in real time.",
  },
  {
    question: "Can I see my savings before I join?",
    answer:
      "Yes. The savings calculator shows your wholesale cost side-by-side with average retail prices for every medication. Enter your drugs, see your annual savings. Most members on 2+ generics save significantly more than the $99 membership fee in the first order alone.",
  },
  {
    question: "How does PDC help manage my medications?",
    answer:
      "PDC is more than a pricing model — it's a complete medication management system. Once your prescriptions are set up you can automate the entire process. Auto-refills process automatically before you run out. Refill renewal alerts notify you when a prescription is expiring so you can request a renewal before it lapses. The active medication dashboard shows all your medications in one place with dosing details, refill status, and order history. No more calling the pharmacy. No hold music. No missed refills.",
  },
  {
    question: "How does signup work?",
    answer:
      "Entirely online, takes minutes. Pay $99, wholesale access activates immediately. Submit your prescription through your member dashboard — transfer from your current pharmacy (1–2 business days) or have your doctor send a new prescription directly to HealthWarehouse. Set up auto-refills, refill renewal alerts, and manage all active medications from one dashboard. Orders ship to any US address including addresses different from your billing address.",
  },
  {
    question: "Is prior authorization ever required?",
    answer:
      "Never. Prior auth is an insurance construct. PDC is cash-pay — no insurance, no prior auth, no step therapy, no formulary restrictions, no claim denials. Your doctor writes it, it's a covered generic, you can order it.",
  },
  {
    question: "Is this legal?",
    answer:
      "Yes. Cash-pay pharmacy is legal in all 50 states. What's new is making wholesale pricing accessible to individuals — the same way Costco made bulk pricing accessible to everyday consumers. Every order goes through HealthWarehouse, a fully licensed US pharmacy, under a valid prescription.",
  },
  {
    question: "Is PDC a licensed pharmacy?",
    answer:
      "PDC operates as a healthcare merchant. Prescription fulfillment is handled by HealthWarehouse, our licensed pharmacy partner. Your medications are dispensed by a fully regulated US pharmacy.",
  },
  {
    question: "Is my information private?",
    answer:
      "Yes. Full HIPAA compliance. Your data is encrypted, never sold, never shared with advertisers. HealthWarehouse operates under a Business Associate Agreement (BAA) with PDC. Your prescription history stays private.",
  },
  {
    question: "Can I pause my membership?",
    answer:
      "Yes. Pause anytime from your account settings. While paused your membership year stops counting down — but you cannot place prescription orders during a pause. Resume anytime to restore full access. Useful if you gain temporary insurance coverage or won't need refills for an extended period.",
  },
  {
    question: "What is the refund and cancellation policy?",
    answer:
      "Full refund within 30 days if no prescriptions have been ordered. Once a prescription is filled the membership fee is non-refundable. Membership can be paused — ordering suspended until resumed. If cancelled, access continues through end of paid year. Membership auto-renews annually — turn off auto-renew anytime in account settings.",
  },
];

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Pillar Drug Club FAQ | Wholesale Generic Medications for $99/Year"
        description="Questions about Pillar Drug Club? Learn how the $99 membership works, what medications cost at wholesale, how auto-refills work, fees, HIPAA compliance, and how to get started."
        canonical={`${getBaseUrl()}/faq`}
      />

      <div className="max-w-3xl mx-auto px-6 py-16 md:py-24">
        <h1 className="text-4xl md:text-5xl font-black text-foreground mb-4 leading-tight" data-testid="text-faq-headline">
          Frequently Asked Questions
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
