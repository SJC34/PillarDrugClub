import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import avoidVideo from "@assets/1f5aba0b-f324-4f2f-a6a2-9f1af26533a1-video_1759381788386.mp4";
import joinVideo from "@assets/join-pillar-video.mp4";

export default function HomePage() {
  const benefits = [
    "Access wholesale prescription pricing",
    "No insurance required",
    "Home delivery nationwide", 
    "Real cost calculator",
    "Transparent pricing"
  ];

  const features = [
    {
      icon: Calculator,
      title: "Cost Calculator",
      description: "Compare real medication costs before you buy"
    },
    {
      icon: Pill,
      title: "3,000+ Medications",
      description: "Access to thousands of prescription medications"
    },
    {
      icon: Home,
      title: "Home Delivery",
      description: "Convenient delivery straight to your door"
    },
    {
      icon: Shield,
      title: "No Insurance Needed",
      description: "Direct access to wholesale pricing"
    }
  ];

  return (
    <div className="min-h-screen">

      {/* Hero Section */}
      <section className="pt-6 md:pt-12 pb-12 md:pb-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto text-center">
          {/* Question above carousel */}
          <p className="text-lg font-bold text-secondary mb-4 text-center tracking-tight">Stuck in lines at the pharmacy?</p>
          
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
            Wholesale prescription prices
            <span className="text-primary block">No insurance required</span>
          </h1>
          <p className="text-lg md:text-xl font-bold text-muted-foreground max-w-3xl mx-auto mb-8">
            Join the drug membership saving people thousands of dollars per year!
            <br />
            Annual medication supplies at true wholesale prices—zero markups, pure savings. 
            Home delivery nationwide starting at just $15/month.
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
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8">Simple, Transparent Pricing</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <Card className="border-secondary/30 bg-gradient-to-br from-primary/5 to-secondary/5">
              <CardHeader className="text-center">
                <CardTitle className="text-xl md:text-2xl font-bold">Foundation Plan</CardTitle>
                <div className="text-3xl md:text-4xl font-bold text-primary">
                  $15
                  <span className="text-base md:text-lg text-muted-foreground font-bold">/month</span>
                </div>
                <CardDescription className="font-bold">1-3 medications</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {benefits.map((benefit, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-left">
                      <Check className="h-5 w-5 text-secondary flex-shrink-0 mt-0.5" />
                      <span className="text-sm md:text-base font-bold text-foreground">{benefit}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/register">
                  <Button className="w-full font-bold focus-visible:outline-none" size="lg" data-testid="button-start-foundation">
                    Start Foundation Plan
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="border-primary/50 bg-gradient-to-br from-primary/10 to-secondary/10 relative">
              <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 rounded-bl-lg rounded-tr-lg text-xs font-bold">
                BEST VALUE
              </div>
              <CardHeader className="text-center">
                <CardTitle className="text-xl md:text-2xl font-bold">Keystone Plan</CardTitle>
                <div className="text-3xl md:text-4xl font-bold text-primary">
                  $25
                  <span className="text-base md:text-lg text-muted-foreground font-bold">/month</span>
                </div>
                <CardDescription className="font-bold">4+ medications</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {benefits.map((benefit, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-left">
                      <Check className="h-5 w-5 text-secondary flex-shrink-0 mt-0.5" />
                      <span className="text-sm md:text-base font-bold text-foreground">{benefit}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/register">
                  <Button className="w-full font-bold focus-visible:outline-none" size="lg" data-testid="button-start-keystone">
                    Start Keystone Plan
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
          <p className="text-sm text-muted-foreground mt-6 font-bold">No hidden fees • Save thousands per year</p>
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
              const isCalculator = feature.title === "Cost Calculator";
              
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
            <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-foreground transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}