import { Button } from "@/components/ui/button";

export default function Hero() {
  return (
    <section className="relative py-32 lg:py-40 bg-gradient-to-br from-background via-background to-accent/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        <div className="text-center">
          <h1 className="text-5xl font-semibold tracking-tight text-foreground sm:text-6xl lg:text-7xl leading-tight">
            Take control of your{" "}
            <span className="text-primary">pharmacy costs</span>
          </h1>
          <p className="mt-8 text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
            Employers overpay for prescriptions due to hidden fees and markups. 
            Our transparent, no-markup pricing model eliminates unpredictable expenses.
          </p>
          
          <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="text-base px-12 py-4 h-auto rounded-lg font-medium"
              data-testid="button-hero-join"
            >
              Get free assessment
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="text-base px-12 py-4 h-auto rounded-lg font-medium"
              data-testid="button-hero-pricing"
            >
              View plans
            </Button>
          </div>

          {/* Cost Comparison Visual */}
          <div className="mt-20 bg-card border rounded-2xl p-8 max-w-4xl mx-auto">
            <h3 className="text-lg font-semibold mb-6">Annual out-of-pocket cost for 4+ prescriptions per employee</h3>
            <div className="grid grid-cols-2 gap-8 items-end">
              <div className="text-center">
                <div className="h-32 bg-destructive/20 rounded-lg flex items-end justify-center pb-4 mb-4">
                  <span className="text-2xl font-bold text-destructive">$576</span>
                </div>
                <p className="text-sm text-muted-foreground">Traditional Pharmacies</p>
              </div>
              <div className="text-center">
                <div className="h-20 bg-chart-2 rounded-lg flex items-end justify-center pb-4 mb-4">
                  <span className="text-2xl font-bold text-white">$116</span>
                </div>
                <p className="text-sm text-muted-foreground">Pillar Drug Club</p>
              </div>
            </div>
            <div className="mt-6 text-center">
              <span className="inline-flex items-center px-4 py-2 rounded-full bg-chart-2/10 text-chart-2 text-sm font-medium">
                80% cost reduction
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}