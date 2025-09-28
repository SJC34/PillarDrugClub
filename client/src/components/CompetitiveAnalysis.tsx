import { Card, CardContent } from "@/components/ui/card";

interface Competitor {
  name: string;
  cost: number;
  color: string;
}

export default function CompetitiveAnalysis() {
  const competitors: Competitor[] = [
    { name: "pillar drug club", cost: 236, color: "bg-primary" },
    { name: "Mark Cuban Cost Plus", cost: 261, color: "bg-chart-3" },
    { name: "Blueberry Pharmacy", cost: 242, color: "bg-chart-4" },
    { name: "ScriptCo", cost: 316, color: "bg-destructive" }
  ];

  const maxCost = Math.max(...competitors.map(c => c.cost));

  return (
    <section className="py-20 lg:py-32 bg-accent/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-semibold tracking-tight sm:text-5xl mb-6">
            Competition is no match
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Annual cost comparison for 4 generic medications. Our transparent, 
            no-markup pricing model delivers unmatched value.
          </p>
        </div>

        <Card className="border-secondary/20 shadow-lg">
          <CardContent className="p-8">
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-center mb-8">
                Annual Cost for 4 Generic Medications
              </h3>
              
              <div className="space-y-4">
                {competitors.map((competitor, index) => (
                  <div key={index} className="flex items-center gap-4" data-testid={`competitor-${index}`}>
                    <div className="w-40 text-sm font-medium text-right">
                      {competitor.name}
                    </div>
                    <div className="flex-1 relative">
                      <div className="h-12 bg-muted rounded-lg overflow-hidden">
                        <div 
                          className={`h-full ${competitor.color} flex items-center justify-end pr-4 transition-all duration-1000 ease-out`}
                          style={{ width: `${(competitor.cost / maxCost) * 100}%` }}
                        >
                          <span className="text-white font-bold text-sm">
                            ${competitor.cost}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 text-center">
                <div className="inline-flex items-center px-6 py-3 rounded-full bg-secondary/10 text-secondary border border-secondary/20">
                  <span className="font-semibold">
                    25% less than closest competitor
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}