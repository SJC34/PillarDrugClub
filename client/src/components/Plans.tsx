import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

interface Plan {
  name: string;
  description: string;
  coverage: string;
  upfrontFee: string;
  monthlyFee: string;
  features: string[];
  highlighted: boolean;
}

export default function Plans() {
  const plans: Plan[] = [
    {
      name: "Gold Plan",
      description: "Perfect for employees with basic prescription needs",
      coverage: "1-4 prescriptions per employee",
      upfrontFee: "$60",
      monthlyFee: "$5 PEPM",
      features: [
        "Pharmacy services (labor + shipping)",
        "Transparent, no-markup pricing",
        "Direct-to-employee delivery",
        "24/7 customer support"
      ],
      highlighted: false
    },
    {
      name: "Platinum Plan",
      description: "Comprehensive coverage for employees with multiple prescriptions",
      coverage: "4+ prescriptions per employee",
      upfrontFee: "$120",
      monthlyFee: "$10 PEPM",
      features: [
        "All Gold Plan benefits",
        "Advanced medication management",
        "Priority customer support",
        "Claims assessment and reporting"
      ],
      highlighted: true
    }
  ];

  return (
    <section className="py-20 lg:py-32" id="pricing">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-semibold tracking-tight sm:text-5xl mb-6">
            Simple, transparent plans
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Choose the plan that fits your employee population. No hidden fees, no surprises.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <Card 
              key={index} 
              className={`relative ${plan.highlighted ? 'border-primary border-2 shadow-lg' : 'border-0 shadow-sm'} hover:shadow-md transition-shadow duration-200`}
              data-testid={`card-plan-${index}`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}
              <CardContent className="p-8">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-semibold mb-2" data-testid={`text-plan-name-${index}`}>
                      {plan.name}
                    </h3>
                    <p className="text-muted-foreground mb-4" data-testid={`text-plan-description-${index}`}>
                      {plan.description}
                    </p>
                    <p className="text-sm font-medium text-primary" data-testid={`text-plan-coverage-${index}`}>
                      Covers {plan.coverage}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold">{plan.upfrontFee}</span>
                      <span className="text-muted-foreground">upfront fee (annual)</span>
                    </div>
                    <div className="text-center py-2">
                      <span className="text-lg font-medium">+</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold">{plan.monthlyFee}</span>
                      <span className="text-muted-foreground">per employee per month</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center gap-3">
                        <Check className="w-5 h-5 text-chart-2 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Button 
                    className={`w-full font-medium ${plan.highlighted ? '' : 'variant-outline'}`}
                    variant={plan.highlighted ? 'default' : 'outline'}
                    data-testid={`button-select-plan-${index}`}
                  >
                    Get started with {plan.name}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">
            Ready to see how much you could save?
          </p>
          <Button size="lg" variant="outline" className="px-8 py-3 text-base font-medium rounded-lg">
            Request free claims assessment
          </Button>
        </div>
      </div>
    </section>
  );
}