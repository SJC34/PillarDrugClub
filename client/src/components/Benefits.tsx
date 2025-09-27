import { Shield, Truck, DollarSign, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface Benefit {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

export default function Benefits() {
  const benefits: Benefit[] = [
    {
      icon: DollarSign,
      title: "Wholesale Pricing",
      description: "Access medications at the same prices pharmacies pay, with no markups or hidden fees."
    },
    {
      icon: Shield,
      title: "Quality Guaranteed",
      description: "All medications are FDA-approved and sourced from licensed U.S. wholesalers."
    },
    {
      icon: Truck,
      title: "Direct Delivery",
      description: "Medications shipped directly to your door in secure, discreet packaging."
    },
    {
      icon: Clock,
      title: "Easy Prescription Management",
      description: "Transfer prescriptions easily and get automatic refill reminders."
    }
  ];

  return (
    <section className="py-16 lg:py-24 bg-muted/30" id="how-it-works">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            Why Choose Pillar Drug Club
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            We're revolutionizing how people access and afford their medications through 
            a transparent membership model.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {benefits.map((benefit, index) => (
            <Card key={index} className="hover-elevate h-full" data-testid={`card-benefit-${index}`}>
              <CardContent className="p-8 text-center h-full flex flex-col">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <benefit.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-4" data-testid={`text-benefit-title-${index}`}>
                  {benefit.title}
                </h3>
                <p className="text-muted-foreground flex-1" data-testid={`text-benefit-description-${index}`}>
                  {benefit.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}