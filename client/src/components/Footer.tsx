import { Button } from "@/components/ui/button";
import logoImage from "@assets/Add a heading_1758988919681.png";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-accent/20 border-t">
      {/* CTA Section */}
      <div className="border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl py-20">
          <div className="text-center max-w-4xl mx-auto">
            <h2 className="text-4xl font-semibold tracking-tight mb-6 sm:text-5xl">
              Ready to start saving on your medications?
            </h2>
            <p className="text-xl text-muted-foreground mb-10 leading-relaxed">
              Join thousands of members who are saving up to 80% on their prescription medications.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="px-8 py-3 text-base font-medium rounded-lg" data-testid="button-footer-join">
                Become a member
              </Button>
              <Button variant="outline" size="lg" className="px-8 py-3 text-base font-medium rounded-lg" data-testid="button-footer-browse">
                Browse medications
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Links */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-2">
            <div className="mb-6">
              <img 
                src={logoImage} 
                alt="Pillar Drug Club" 
                className="h-12 w-auto"
              />
            </div>
            <p className="text-muted-foreground mb-8 max-w-md leading-relaxed">
              Making prescription medications affordable and accessible through transparent 
              wholesale pricing and convenient home delivery.
            </p>
          </div>

          <div>
            <h3 className="font-medium mb-6 text-foreground">Company</h3>
            <ul className="space-y-3 text-muted-foreground">
              <li><a href="#about" className="hover:text-foreground transition-colors">About us</a></li>
              <li><a href="#how-it-works" className="hover:text-foreground transition-colors">How it works</a></li>
              <li><a href="#careers" className="hover:text-foreground transition-colors">Careers</a></li>
              <li><a href="#contact" className="hover:text-foreground transition-colors">Contact</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-medium mb-6 text-foreground">Support</h3>
            <ul className="space-y-3 text-muted-foreground">
              <li><a href="#help" className="hover:text-foreground transition-colors">Help center</a></li>
              <li><a href="#privacy" className="hover:text-foreground transition-colors">Privacy policy</a></li>
              <li><a href="#terms" className="hover:text-foreground transition-colors">Terms of service</a></li>
              <li><a href="#pharmacy" className="hover:text-foreground transition-colors">Pharmacy information</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t text-center text-muted-foreground">
          <p className="mb-2">&copy; {currentYear} Pillar. All rights reserved.</p>
          <p className="text-sm">
            Licensed physicians • FDA-approved medications • Secure delivery • HIPAA compliant
          </p>
        </div>
      </div>
    </footer>
  );
}