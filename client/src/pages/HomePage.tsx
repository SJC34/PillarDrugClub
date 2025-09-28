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
import avoidImage from "@assets/IMG_6107_1759082772316.jpeg";

export default function HomePage() {
  const benefits = [
    "Access wholesale prescription pricing",
    "No insurance required",
    "Home delivery nationwide", 
    "Real cost calculator",
    "Transparent pricing",
    "Cancel anytime"
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
      <section className="py-12 md:py-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto text-center">
          {/* Image with "AVOID THIS" overlay */}
          <div className="relative mb-8 max-w-md mx-auto">
            <img 
              src={avoidImage} 
              alt="Medication costs comparison" 
              className="w-full h-auto rounded-lg shadow-lg"
            />
            <div className="absolute inset-0 flex items-center justify-end pr-4">
              <div className="bg-black/50 rounded-lg px-8 py-6 backdrop-blur-sm text-right">
                <div className="flex flex-col items-end">
                  <span className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black text-primary leading-none transform scale-x-75 origin-right">AVOID</span>
                  <span className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black text-white leading-none transform scale-x-75 origin-right">THIS</span>
                </div>
              </div>
            </div>
          </div>
          
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-6">
            Wholesale Prescription Prices
            <span className="text-primary block">No Insurance Required</span>
          </h1>
          <p className="text-lg md:text-xl font-bold text-muted-foreground max-w-3xl mx-auto mb-8">
            Join thousands of patients saving money on prescription medications with transparent wholesale pricing. 
            Get access to real costs and home delivery for just $10/month.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link href="/register">
              <Button size="lg" className="w-full sm:w-auto text-lg font-bold px-8 py-4" data-testid="button-join-hero">
                Start Saving Today
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/cost-calculator">
              <Button variant="outline" size="lg" className="w-full sm:w-auto text-lg font-bold px-8 py-4" data-testid="button-try-calculator">
                Try Cost Calculator
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-12 md:py-16 px-4 sm:px-6 bg-muted/30">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8">Simple, Transparent Pricing</h2>
          <Card className="max-w-md mx-auto border-secondary/30 bg-gradient-to-br from-primary/5 to-secondary/5">
            <CardHeader className="text-center">
              <CardTitle className="text-xl md:text-2xl font-bold">Membership</CardTitle>
              <div className="text-3xl md:text-4xl font-bold text-primary">
                $10
                <span className="text-base md:text-lg text-muted-foreground font-bold">/month</span>
              </div>
              <CardDescription className="font-bold">Cancel anytime</CardDescription>
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
                <Button className="w-full font-bold" size="lg" data-testid="button-subscribe-pricing">
                  Start Membership
                </Button>
              </Link>
            </CardContent>
          </Card>
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
              return (
                <Card key={idx} className="text-center p-4 md:p-6 border-secondary/20 hover:border-secondary/40 transition-colors">
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
            <Button size="lg" variant="secondary" className="w-full sm:w-auto text-lg font-bold px-8 py-4" data-testid="button-join-cta">
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
            <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-foreground transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}