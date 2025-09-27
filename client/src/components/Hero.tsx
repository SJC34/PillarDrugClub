import { Button } from "@/components/ui/button";
import heroImage from "@assets/generated_images/Professional_pharmacy_hero_image_3f5e9fb6.png";

export default function Hero() {
  return (
    <section className="relative py-24 lg:py-32">
      {/* Background with overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroImage}
          alt="Professional pharmacy setting"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/40" />
      </div>

      {/* Content */}
      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Affordable Medications at{" "}
            <span className="text-chart-2">Wholesale Prices</span>
          </h1>
          <p className="mt-6 text-lg text-gray-200 max-w-2xl">
            Join Pillar Drug Club and save up to 80% on your prescription medications 
            with our membership-based pharmacy.
          </p>
          
          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <Button 
              size="lg" 
              className="text-base px-8 py-3"
              data-testid="button-hero-join"
            >
              Join Now
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="text-base px-8 py-3 bg-white/10 border-white/20 text-white hover:bg-white/20"
              data-testid="button-hero-pricing"
            >
              See Our Pricing
            </Button>
          </div>

          <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm text-gray-200">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-chart-2 rounded-full"></div>
              <span>No insurance needed - Get wholesale prices directly</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-chart-2 rounded-full"></div>
              <span>Transparent pricing - No hidden fees or markups</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-chart-2 rounded-full"></div>
              <span>Convenient delivery - Medications shipped to your door</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}