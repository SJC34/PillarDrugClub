import { Shield, Truck, UserCheck, Clock } from "lucide-react";

interface Benefit {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

export default function Benefits() {
  const benefits: Benefit[] = [
    {
      icon: UserCheck,
      title: "Licensed physicians",
      description: "Get prescriptions from licensed doctors who review your medical history and symptoms."
    },
    {
      icon: Shield,
      title: "FDA-approved medications",
      description: "All medications are FDA-approved and sourced from licensed U.S. wholesalers for quality assurance."
    },
    {
      icon: Truck,
      title: "Discreet delivery",
      description: "Medications shipped directly to your door in secure, unmarked packaging within 2-3 days."
    },
    {
      icon: Clock,
      title: "Simple refills",
      description: "Set up automatic refills or reorder anytime through your secure online account."
    }
  ];

  return (
    <section className="py-20 lg:py-32 bg-accent/20" id="how-it-works">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        <div className="text-center mb-20">
          <h2 className="text-4xl font-semibold tracking-tight sm:text-5xl mb-6">
            Healthcare made simple
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            From consultation to delivery, we've streamlined every step to make 
            getting your medications as easy as possible.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {benefits.map((benefit, index) => (
            <div key={index} className="text-center space-y-6" data-testid={`card-benefit-${index}`}>
              <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
                <benefit.icon className="w-10 h-10 text-primary" />
              </div>
              <div className="space-y-3">
                <h3 className="text-xl font-semibold" data-testid={`text-benefit-title-${index}`}>
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