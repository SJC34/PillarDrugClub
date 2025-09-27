import { Button } from "@/components/ui/button";
import logoImage from "@assets/Add a heading_1758988919681.png";

export default function Hero() {
  return (
    <section className="relative py-32 lg:py-40 bg-gradient-to-br from-background via-background to-accent/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
        <div className="text-center">
          <div className="mb-8">
            <img 
              src={logoImage} 
              alt="Pillar Drug Club" 
              className="h-20 w-auto mx-auto"
              data-testid="img-hero-logo"
            />
          </div>
          <h1 className="text-5xl font-semibold tracking-tight text-foreground sm:text-6xl lg:text-7xl leading-tight">
            Prescription medications at{" "}
            <span className="text-primary">wholesale prices</span>
          </h1>
          <p className="mt-8 text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Skip the insurance hassles and hidden markups. Get your medications delivered 
            directly to your door at transparent, wholesale pricing.
          </p>
          
          <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="text-base px-12 py-4 h-auto rounded-lg font-medium"
              data-testid="button-hero-join"
            >
              Join Pillar Drug Club
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="text-base px-12 py-4 h-auto rounded-lg font-medium"
              data-testid="button-hero-pricing"
            >
              See how it works
            </Button>
          </div>

          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="space-y-3">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <div className="w-8 h-8 bg-primary rounded-full"></div>
              </div>
              <h3 className="font-medium text-foreground">Wholesale pricing</h3>
              <p className="text-sm text-muted-foreground">Pay the same prices pharmacies pay their wholesalers</p>
            </div>
            <div className="space-y-3">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <div className="w-8 h-8 bg-primary rounded-full"></div>
              </div>
              <h3 className="font-medium text-foreground">No insurance needed</h3>
              <p className="text-sm text-muted-foreground">Skip the complexity and save more than your copay</p>
            </div>
            <div className="space-y-3">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <div className="w-8 h-8 bg-primary rounded-full"></div>
              </div>
              <h3 className="font-medium text-foreground">Home delivery</h3>
              <p className="text-sm text-muted-foreground">Medications shipped directly to your door</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}