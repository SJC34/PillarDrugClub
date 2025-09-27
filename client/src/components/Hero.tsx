import { Button } from "@/components/ui/button";

export default function Hero() {
  return (
    <section className="relative py-32 lg:py-40 bg-gradient-to-br from-background via-background to-accent/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
        <div className="text-center">
          <h1 className="text-5xl font-semibold tracking-tight text-foreground sm:text-6xl lg:text-7xl leading-tight">
            Prescription medications,{" "}
            <span className="text-primary">simplified</span>
          </h1>
          <p className="mt-8 text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Licensed physicians, transparent pricing, and medications delivered to your door. 
            No insurance hassles, no hidden fees.
          </p>
          
          <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="text-base px-12 py-4 h-auto rounded-lg font-medium"
              data-testid="button-hero-join"
            >
              Get started
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="text-base px-12 py-4 h-auto rounded-lg font-medium"
              data-testid="button-hero-pricing"
            >
              View pricing
            </Button>
          </div>

          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="space-y-2">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <div className="w-6 h-6 bg-primary rounded-full"></div>
              </div>
              <h3 className="font-medium text-foreground">Licensed physicians</h3>
              <p className="text-sm text-muted-foreground">FDA-approved medications prescribed by licensed doctors</p>
            </div>
            <div className="space-y-2">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <div className="w-6 h-6 bg-primary rounded-full"></div>
              </div>
              <h3 className="font-medium text-foreground">Transparent pricing</h3>
              <p className="text-sm text-muted-foreground">No insurance required, no hidden fees or markups</p>
            </div>
            <div className="space-y-2">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <div className="w-6 h-6 bg-primary rounded-full"></div>
              </div>
              <h3 className="font-medium text-foreground">Secure delivery</h3>
              <p className="text-sm text-muted-foreground">Discreet packaging shipped directly to your door</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}