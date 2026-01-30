import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  DollarSign, 
  Shield, 
  Home, 
  Calculator,
  Pill,
  Check,
  ArrowRight
} from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { ComingSoonModal } from "@/components/ComingSoonModal";
import { BlogCarousel } from "@/components/BlogCarousel";
import { SEOHead, pharmacySchema, medicalWebPageSchema, organizationSchema, faqSchema, howToSaveMoneySchema, getBaseUrl } from "@/components/SEOHead";
import avoidVideo from "@assets/1f5aba0b-f324-4f2f-a6a2-9f1af26533a1-video_1759381788386.mp4";
import joinVideo from "@assets/join-pillar-video.mp4";
import goldPillarBadge from "@assets/image_1761454767191.png";
import platinumPillarBadge from "@assets/image_1761453800697.png";

export default function HomePage() {
  const [showComingSoonModal, setShowComingSoonModal] = useState(false);

  useEffect(() => {
    const hasSeenModal = localStorage.getItem("hasSeenComingSoonModal");
    if (!hasSeenModal) {
      setShowComingSoonModal(true);
      localStorage.setItem("hasSeenComingSoonModal", "true");
    }
  }, []);

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
  const benefits = [
    "Save 90% on prescriptions - medications as low as 1¢ per pill",
    "No insurance needed - our prices often beat insurance copays",
    "Free delivery to your door - all 50 states, no extra fees", 
    "See exact costs upfront - no surprises, no hidden charges",
    "Same quality medications - just without the pharmacy markup"
  ];

  const features = [
    {
      icon: Calculator,
      title: "See Exact Costs Before You Order",
      description: "Use our free calculator to see how much YOU'LL save on YOUR medications - no guessing, no surprises"
    },
    {
      icon: Pill,
      title: "3,000+ Medications for Common Conditions",
      description: "Diabetes, high blood pressure, cholesterol, thyroid, depression and more - find your medication at a price you can afford"
    },
    {
      icon: Home,
      title: "Free Delivery to Your Home",
      description: "No more pharmacy trips or long waits - your medications shipped directly to your door at no extra cost"
    },
    {
      icon: Shield,
      title: "Works Without Insurance",
      description: "Have insurance? Don't need it. No insurance? No problem. Our prices often beat insurance copays anyway."
    }
  ];

  return (
    <div className="min-h-screen">
      <SEOHead
        title="Save 90% on Prescriptions | Get Meds Without Insurance - Pillar Drug Club"
        description="Can't afford your prescriptions? Get medications for as low as 1¢ per pill. No insurance needed. Free delivery. Save hundreds on diabetes, blood pressure, cholesterol & more."
        canonical={getBaseUrl()}
        schema={combinedSchema}
      />

      {/* Hero Section */}
      <section className="pt-6 md:pt-12 pb-12 md:pb-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto text-center">
          {/* Question above carousel */}
          <p className="text-lg font-bold text-secondary mb-4 text-center tracking-tight">Paying too much for your prescriptions?</p>
          
          {/* Carousel with pharmacy image and video */}
          <div className="mb-8 max-w-2xl mx-auto">
            <Carousel
              opts={{ loop: true }}
              plugins={[
                Autoplay({
                  delay: 5000,
                  stopOnInteraction: false,
                  stopOnMouseEnter: true,
                })
              ]}
              className="w-full"
            >
              <CarouselContent>
                {/* Slide 1 - "Avoid This" video with text overlay */}
                <CarouselItem>
                  <div className="relative overflow-hidden">
                    <video 
                      src={avoidVideo} 
                      autoPlay={true}
                      loop={true}
                      muted={true}
                      playsInline={true}
                      className="w-full rounded-lg shadow-lg h-[265px] md:h-[400px]"
                      style={{ objectFit: 'cover' }}
                      data-testid="video-avoid-this"
                    />
                    <div className="absolute inset-0 flex items-center justify-end pr-[15%]">
                      <div className="bg-black/50 rounded-lg backdrop-blur-sm px-3 py-2">
                        <div className="flex flex-col text-center min-w-[90px] justify-center">
                          <span className="text-2xl md:text-3xl font-black text-white leading-tight tracking-wide" data-testid="text-avoid">Avoid</span>
                          <span className="text-2xl md:text-3xl font-black text-primary leading-tight tracking-wider" data-testid="text-this">This</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CarouselItem>

                {/* Slide 2 - "Join Pillar!" video with text overlay */}
                <CarouselItem>
                  <div className="relative overflow-hidden">
                    <video 
                      src={joinVideo} 
                      autoPlay={true}
                      loop={true}
                      muted={true}
                      playsInline={true}
                      className="w-full rounded-lg shadow-lg h-[265px] md:h-[400px]"
                      style={{ objectFit: 'cover', objectPosition: '40% 40%' }}
                      data-testid="video-join-pillar"
                    />
                    <div className="absolute inset-0 flex items-center justify-end pr-[15%]">
                      <Link href="/register">
                        <div className="bg-black/50 rounded-lg backdrop-blur-sm cursor-pointer hover-elevate px-3 py-2">
                          <div className="flex flex-col text-center min-w-[90px] justify-center">
                            <span className="text-2xl md:text-3xl font-black text-white leading-tight tracking-wide" data-testid="text-join">Join</span>
                            <span className="text-2xl md:text-3xl font-black text-primary leading-tight tracking-wide" data-testid="text-pillar">Pillar!</span>
                          </div>
                        </div>
                      </Link>
                    </div>
                  </div>
                </CarouselItem>
              </CarouselContent>
            </Carousel>
          </div>
          
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-6">
            Get Your Meds for Pennies
            <span className="text-primary block">As Low As 1¢ Per Pill</span>
          </h1>
          <p className="text-lg md:text-xl font-bold text-muted-foreground max-w-3xl mx-auto mb-8">
            Stop overpaying at traditional pharmacies. No insurance needed.
            <br />
            Save 90% on diabetes, blood pressure, cholesterol & more—delivered free to your door.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link href="/register">
              <Button size="lg" className="w-full sm:w-auto text-lg font-bold px-8 py-4 focus-visible:outline-none" data-testid="button-join-hero">
                Start Saving Today
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/cost-calculator">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto text-lg font-bold px-8 py-4 focus-visible:outline-none" data-testid="button-try-calculator">
                Try Cost Calculator
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-12 md:py-16 px-4 sm:px-6 bg-muted/30">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">Choose Your Savings Plan</h2>
          <p className="text-base md:text-lg text-muted-foreground mb-8 font-bold max-w-3xl mx-auto">
            Simple, transparent membership plans to fit your medication needs
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Gold – 6 Month (Most Popular) */}
            <Card className="border-primary/50 bg-gradient-to-br from-primary/10 to-secondary/10 relative">
              <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 rounded-bl-lg rounded-tr-lg text-xs font-bold">
                MOST POPULAR
              </div>
              <CardHeader className="text-center">
                <div className="flex justify-center mb-3">
                  <img src={goldPillarBadge} alt="Gold – 6 Month" className="w-16 h-16 object-contain" />
                </div>
                <CardTitle className="text-xl md:text-2xl font-bold">Gold – 6 Month</CardTitle>
                <div className="text-3xl md:text-4xl font-bold text-primary">
                  $9
                  <span className="text-base md:text-lg text-muted-foreground font-bold">/mo</span>
                </div>
                <div className="text-sm text-muted-foreground">$108/year billed annually</div>
                <CardDescription className="font-bold">Best for most people on stable medications</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6 text-left">
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-secondary flex-shrink-0 mt-0.5" />
                    <span className="text-sm md:text-base font-bold">Up to 6-month supply</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-secondary flex-shrink-0 mt-0.5" />
                    <span className="text-sm md:text-base font-bold">Wholesale pricing</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-secondary flex-shrink-0 mt-0.5" />
                    <span className="text-sm md:text-base font-bold">Shipping at carrier rates</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-secondary flex-shrink-0 mt-0.5" />
                    <span className="text-sm md:text-base font-bold">Home delivery</span>
                  </li>
                </ul>
                <Link href="/register?tier=gold">
                  <Button className="w-full font-bold focus-visible:outline-none" size="lg" data-testid="button-start-gold">
                    Choose Gold – 6 Month
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Platinum */}
            <Card className="border-secondary/30 bg-gradient-to-br from-primary/5 to-secondary/5">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-3">
                  <img src={platinumPillarBadge} alt="Platinum" className="w-16 h-16 object-contain" />
                </div>
                <CardTitle className="text-xl md:text-2xl font-bold">Platinum</CardTitle>
                <div className="text-3xl md:text-4xl font-bold text-primary">
                  $15
                  <span className="text-base md:text-lg text-muted-foreground font-bold">/mo</span>
                </div>
                <div className="text-sm text-muted-foreground">$180/year billed annually</div>
                <CardDescription className="font-bold">Best for maximum convenience and zero refills</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6 text-left">
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-secondary flex-shrink-0 mt-0.5" />
                    <span className="text-sm md:text-base font-bold">Up to 12-month supply</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-secondary flex-shrink-0 mt-0.5" />
                    <span className="text-sm md:text-base font-bold">Wholesale pricing</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-secondary flex-shrink-0 mt-0.5" />
                    <span className="text-sm md:text-base font-bold">Shipping at carrier rates</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-secondary flex-shrink-0 mt-0.5" />
                    <span className="text-sm md:text-base font-bold">Home delivery</span>
                  </li>
                </ul>
                <Link href="/register?tier=platinum">
                  <Button className="w-full font-bold focus-visible:outline-none" size="lg" data-testid="button-start-platinum">
                    Choose Platinum
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
          <p className="text-sm text-muted-foreground mt-6 font-bold">Annual membership • Billed once per year</p>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 md:py-16 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-foreground mb-8 md:mb-12">
            Everything You Need to Save on Prescriptions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              const isCalculator = feature.title.includes("Cost Calculator");
              
              const cardContent = (
                <Card className={`text-center p-4 md:p-6 border-secondary/20 transition-colors ${isCalculator ? 'hover:border-primary/60 hover-elevate cursor-pointer' : 'hover:border-secondary/40'}`}>
                  <CardHeader className="pb-4">
                    <div className="mx-auto w-12 h-12 bg-gradient-to-br from-primary/10 to-secondary/15 rounded-lg flex items-center justify-center mb-4 border border-secondary/20">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg md:text-xl font-bold">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <CardDescription className="text-sm md:text-base font-bold">{feature.description}</CardDescription>
                  </CardContent>
                </Card>
              );
              
              return (
                <div key={idx}>
                  {isCalculator ? (
                    <Link href="/cost-calculator" data-testid="link-cost-calculator-feature">
                      {cardContent}
                    </Link>
                  ) : (
                    cardContent
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-12 md:py-16 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-foreground mb-4">
            Common Questions About Saving on Prescriptions
          </h2>
          <p className="text-center text-muted-foreground mb-8 md:mb-12 font-bold max-w-2xl mx-auto">
            Get answers to the questions patients ask most about affording their medications.
          </p>
          <Accordion type="single" collapsible className="w-full" data-testid="faq-accordion">
            <AccordionItem value="item-1" data-testid="faq-item-expensive">
              <AccordionTrigger className="text-left font-bold" data-testid="faq-trigger-expensive">
                Why is my prescription so expensive?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground font-bold" data-testid="faq-content-expensive">
                Traditional pharmacies mark up medications by 300-500% due to insurance middlemen (PBMs). Pillar Drug Club buys directly from wholesalers and passes the true cost to you - as low as 1¢ per pill. We cut out the middlemen so you stop overpaying.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" data-testid="faq-item-no-insurance">
              <AccordionTrigger className="text-left font-bold" data-testid="faq-trigger-no-insurance">
                Can I get prescriptions without insurance?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground font-bold" data-testid="faq-content-no-insurance">
                Yes! No insurance needed. Pillar Drug Club offers direct wholesale pricing to anyone. Our prices are often cheaper than insurance copays, so you save money whether you have insurance or not.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" data-testid="faq-item-cost">
              <AccordionTrigger className="text-left font-bold" data-testid="faq-trigger-cost">
                How much will my prescription cost?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground font-bold" data-testid="faq-content-cost">
                Use our free Cost Calculator to see exact prices for your medications. Most generic medications cost just pennies per pill. For example, common blood pressure meds are as low as 1¢ per tablet. No hidden fees - what you see is what you pay.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" data-testid="faq-item-save-money">
              <AccordionTrigger className="text-left font-bold" data-testid="faq-trigger-save-money">
                How do I save money on my medications?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground font-bold" data-testid="faq-content-save-money">
                Get extended supply prescriptions (6 or 12 months) instead of 30-day refills. This reduces dispensing fees and gives you better bulk pricing. Our Gold ($9/mo) and Platinum ($15/mo) plans unlock extended supply savings with just $10 fulfillment per shipment.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5" data-testid="faq-item-cant-afford">
              <AccordionTrigger className="text-left font-bold" data-testid="faq-trigger-cant-afford">
                What if I can't afford my prescriptions?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground font-bold" data-testid="faq-content-cant-afford">
                Start with our Gold tier at just $9/month with $10 fulfillment per shipment. Common medications like metformin, lisinopril, and atorvastatin cost just dollars for a 6-month supply. We also offer payment plans and assistance programs for those who qualify.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6" data-testid="faq-item-delivery">
              <AccordionTrigger className="text-left font-bold" data-testid="faq-trigger-delivery">
                Do you deliver to my home?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground font-bold" data-testid="faq-content-delivery">
                Yes, free delivery nationwide to all 50 states. Your medications are shipped directly to your door with tracking. No pharmacy trips, no waiting in line.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-7" data-testid="faq-item-medications">
              <AccordionTrigger className="text-left font-bold" data-testid="faq-trigger-medications">
                What medications do you carry?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground font-bold" data-testid="faq-content-medications">
                We have 3000+ medications for diabetes, high blood pressure, cholesterol, thyroid, depression, and more. Search our catalog to find your specific medication and see the exact cost before you order.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-8" data-testid="faq-item-safe">
              <AccordionTrigger className="text-left font-bold" data-testid="faq-trigger-safe">
                Is this safe and legitimate?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground font-bold" data-testid="faq-content-safe">
                Yes! We're a licensed pharmacy operating in all 50 states. All medications come from FDA-approved manufacturers through licensed U.S. wholesalers. Same quality medications, just without the markup.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* Blog Carousel */}
      <BlogCarousel />

      {/* CTA Section */}
      <section className="py-12 md:py-16 px-4 sm:px-6 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to Start Saving?</h2>
          <p className="text-lg md:text-xl font-bold mb-8 opacity-90">
            Join thousands of patients who have already saved money on their prescriptions.
          </p>
          <Link href="/register">
            <Button size="lg" variant="secondary" className="w-full sm:w-auto text-lg font-bold px-8 py-4 focus-visible:outline-none" data-testid="button-join-cta">
              Join Pillar Drug Club
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted py-8 md:py-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Pill className="h-6 w-6 text-primary" />
            <span className="text-lg md:text-xl font-bold text-foreground">Pillar Drug Club</span>
          </div>
          <p className="text-muted-foreground font-bold mb-4 text-sm md:text-base">
            Transparent wholesale prescription pricing for everyone.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 text-sm font-bold text-muted-foreground">
            <a href="/refund-policy" className="hover:text-foreground transition-colors" data-testid="link-footer-refund-policy">Refund Policy</a>
            <a href="/privacy-policy" className="hover:text-foreground transition-colors" data-testid="link-footer-privacy-policy">Privacy Policy</a>
            <a href="/terms-of-service" className="hover:text-foreground transition-colors" data-testid="link-footer-terms">Terms of Service</a>
            <a href="mailto:support@pillardrugclub.com" className="hover:text-foreground transition-colors" data-testid="link-footer-contact">Contact</a>
          </div>
        </div>
      </footer>

      {/* Coming Soon Modal */}
      <ComingSoonModal 
        open={showComingSoonModal} 
        onOpenChange={setShowComingSoonModal}
      />
    </div>
  );
}