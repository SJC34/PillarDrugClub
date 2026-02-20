import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface MedicationPrice {
  name: string;
  dosage: string;
  retailPrice: number;
  ourPrice: number;
}

export default function PricingComparison() {
  //todo: remove mock functionality
  const medications: MedicationPrice[] = [
    { name: "Lisinopril", dosage: "10mg", retailPrice: 25.99, ourPrice: 8.99 },
    { name: "Metformin", dosage: "500mg", retailPrice: 15.50, ourPrice: 4.99 },
    { name: "Atorvastatin", dosage: "10mg", retailPrice: 32.99, ourPrice: 11.99 },
    { name: "Sertraline", dosage: "50mg", retailPrice: 24.50, ourPrice: 8.99 },
  ];

  const calculateSavings = (retail: number, our: number) => {
    return Math.round(((retail - our) / retail) * 100);
  };

  return (
    <section className="py-20 lg:py-32" id="pricing">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-semibold tracking-tight sm:text-5xl mb-6">
            Real medications, real savings
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Compare our wholesale prices with what you're paying now. No insurance required.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {medications.map((med, index) => (
            <Card key={index} className="border-0 shadow-sm hover:shadow-md transition-shadow duration-200" data-testid={`card-medication-${index}`}>
              <CardContent className="p-8">
                <div className="text-center space-y-6">
                  <div>
                    <h3 className="font-semibold text-xl mb-1" data-testid={`text-medication-name-${index}`}>
                      {med.name}
                    </h3>
                    <p className="text-muted-foreground" data-testid={`text-medication-dosage-${index}`}>
                      {med.dosage}
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Typical retail</p>
                      <p className="text-lg line-through text-muted-foreground" data-testid={`text-retail-price-${index}`}>
                        ${med.retailPrice.toFixed(2)}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Our price</p>
                      <p className="text-3xl font-semibold text-primary" data-testid={`text-our-price-${index}`}>
                        ${med.ourPrice.toFixed(2)}
                      </p>
                    </div>
                    
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 px-3 py-1 font-semibold">
                      {calculateSavings(med.retailPrice, med.ourPrice)}% less
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Button size="lg" className="px-8 py-3 text-base font-medium rounded-lg" data-testid="button-view-all-medications">
            View all medications
          </Button>
        </div>
      </div>
    </section>
  );
}