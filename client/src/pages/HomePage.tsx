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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Navigation */}
      <nav className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Pill className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Pillar Drug Club</h1>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login">
                <Button variant="outline" data-testid="button-login">
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button data-testid="button-register">
                  Join Now
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Wholesale Prescription Prices
            <span className="text-blue-600 block">No Insurance Required</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Join thousands of patients saving money on prescription medications with transparent wholesale pricing. 
            Get access to real costs and home delivery for just $10/month.
          </p>
          <div className="flex items-center justify-center gap-4 mb-12">
            <Link href="/register">
              <Button size="lg" className="text-lg px-8 py-6" data-testid="button-join-hero">
                Start Saving Today
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/calculator">
              <Button variant="outline" size="lg" className="text-lg px-8 py-6" data-testid="button-try-calculator">
                Try Cost Calculator
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Simple, Transparent Pricing</h2>
          <Card className="max-w-md mx-auto border-blue-200 bg-blue-50">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Membership</CardTitle>
              <div className="text-4xl font-bold text-blue-600">
                $10
                <span className="text-lg text-gray-600 font-normal">/month</span>
              </div>
              <CardDescription>Cancel anytime</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6">
                {benefits.map((benefit, idx) => (
                  <li key={idx} className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span className="text-gray-700">{benefit}</span>
                  </li>
                ))}
              </ul>
              <Link href="/register">
                <Button className="w-full" size="lg" data-testid="button-subscribe-pricing">
                  Start Membership
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Everything You Need to Save on Prescriptions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <Card key={idx} className="text-center">
                  <CardHeader>
                    <div className="mx-auto w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                      <Icon className="h-6 w-6 text-blue-600" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-6 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Saving?</h2>
          <p className="text-xl mb-8 text-blue-100">
            Join thousands of patients who have already saved money on their prescriptions.
          </p>
          <Link href="/register">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-6" data-testid="button-join-cta">
              Join Pillar Drug Club
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Pill className="h-6 w-6" />
            <span className="text-xl font-semibold">Pillar Drug Club</span>
          </div>
          <p className="text-gray-400 mb-4">
            Transparent wholesale prescription pricing for everyone.
          </p>
          <div className="flex items-center justify-center gap-6 text-sm text-gray-400">
            <a href="#" className="hover:text-white">Privacy Policy</a>
            <a href="#" className="hover:text-white">Terms of Service</a>
            <a href="#" className="hover:text-white">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}