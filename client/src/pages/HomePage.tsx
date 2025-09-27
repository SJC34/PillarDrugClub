import Header from "@/components/Header";
import Hero from "@/components/Hero";
import PricingComparison from "@/components/PricingComparison";
import Plans from "@/components/Plans";
import CompetitiveAnalysis from "@/components/CompetitiveAnalysis";
import Benefits from "@/components/Benefits";
import Testimonials from "@/components/Testimonials";
import Footer from "@/components/Footer";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Hero />
        <PricingComparison />
        <Plans />
        <CompetitiveAnalysis />
        <Benefits />
        <Testimonials />
      </main>
      <Footer />
    </div>
  );
}