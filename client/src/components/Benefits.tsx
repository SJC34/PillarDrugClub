import { Shield, Truck, DollarSign, Clock } from "lucide-react";

interface Benefit {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

export default function Benefits() {
  const benefits: Benefit[] = [
    {
      icon: DollarSign,
      title: "Wholesale pricing",
      description: "Access medications at the same prices pharmacies pay their wholesalers - no markups or hidden fees."
    },
    {
      icon: Shield,
      title: "Quality guaranteed",
      description: "All medications are FDA-approved and sourced from licensed U.S. wholesalers for safety and quality."
    },
    {
      icon: Truck,
      title: "Free delivery",
      description: "Medications shipped directly to your door in secure, discreet packaging within 2-3 business days."
    },
    {
      icon: Clock,
      title: "Easy management",
      description: "Transfer prescriptions easily and get automatic refill reminders through your member portal."
    }
  ];

  return (
    <section className="py-20 lg:py-32 bg-gradient-to-b from-primary/5 to-background" id="how-it-works">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        <div className="text-center mb-20">
          <h2 className="text-4xl font-semibold tracking-tight sm:text-5xl mb-6">
            How Pillar Drug Club works
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            We've eliminated the middlemen and markups to bring you prescription 
            medications at true wholesale prices.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {benefits.map((benefit, index) => (
            <div key={index} className="text-center space-y-6 p-8 rounded-3xl bg-white/80 dark:bg-card/80 backdrop-blur-sm border border-primary/10 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105" data-testid={`card-benefit-${index}`}>
              <div className="w-24 h-24 bg-gradient-to-br from-primary via-primary to-primary/90 rounded-3xl flex items-center justify-center mx-auto shadow-lg">
                <benefit.icon className="w-12 h-12 text-white" />
              </div>
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-foreground" data-testid={`text-benefit-title-${index}`}>
                  {benefit.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed" data-testid={`text-benefit-description-${index}`}>
                  {benefit.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}