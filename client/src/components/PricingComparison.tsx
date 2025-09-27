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
    { name: "Lisinopril", dosage: "10mg", retailPrice: 25.99, ourPrice: 9.99 },
    { name: "Metformin", dosage: "500mg", retailPrice: 15.50, ourPrice: 5.99 },
    { name: "Atorvastatin", dosage: "10mg", retailPrice: 32.99, ourPrice: 12.99 },
    { name: "Sertraline", dosage: "50mg", retailPrice: 24.50, ourPrice: 9.99 },
  ];

  const calculateSavings = (retail: number, our: number) => {
    return Math.round(((retail - our) / retail) * 100);
  };

  return (
    <section className="py-16 lg:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            See How Much You Could Save
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Compare our wholesale prices with typical retail prices for common medications.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {medications.map((med, index) => (
            <Card key={index} className="hover-elevate" data-testid={`card-medication-${index}`}>
              <CardContent className="p-6">
                <div className="text-center">
                  <h3 className="font-semibold text-lg mb-1" data-testid={`text-medication-name-${index}`}>
                    {med.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4" data-testid={`text-medication-dosage-${index}`}>
                    {med.dosage}
                  </p>
                  
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Retail Price</p>
                      <p className="text-sm line-through text-muted-foreground" data-testid={`text-retail-price-${index}`}>
                        ${med.retailPrice.toFixed(2)}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-xs text-muted-foreground">Our Price</p>
                      <p className="text-2xl font-bold text-primary" data-testid={`text-our-price-${index}`}>
                        ${med.ourPrice.toFixed(2)}
                      </p>
                    </div>
                    
                    <Badge variant="secondary" className="bg-chart-2/10 text-chart-2 hover:bg-chart-2/20">
                      Save {calculateSavings(med.retailPrice, med.ourPrice)}%
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Button size="lg" data-testid="button-view-all-medications">
            View All Medications
          </Button>
        </div>
      </div>
    </section>
  );
}