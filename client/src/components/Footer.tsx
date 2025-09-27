import { Button } from "@/components/ui/button";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-muted/50 border-t">
      {/* CTA Section */}
      <div className="border-b bg-primary/5">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold tracking-tight mb-4">
              Ready to start saving on your medications?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join thousands of members who are saving up to 80% on their prescription medications.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" data-testid="button-footer-join">
                Become a Member
              </Button>
              <Button variant="outline" size="lg" data-testid="button-footer-browse">
                Browse Medications
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Links */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="mb-4">
              <span className="text-xl font-semibold text-primary">
                Pillar Drug Club
              </span>
            </div>
            <p className="text-muted-foreground mb-6 max-w-md">
              Making prescription medications affordable and accessible through transparent 
              wholesale pricing and convenient home delivery.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#about" className="hover:text-foreground transition-colors">About Us</a></li>
              <li><a href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</a></li>
              <li><a href="#careers" className="hover:text-foreground transition-colors">Careers</a></li>
              <li><a href="#contact" className="hover:text-foreground transition-colors">Contact</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Support</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#help" className="hover:text-foreground transition-colors">Help Center</a></li>
              <li><a href="#privacy" className="hover:text-foreground transition-colors">Privacy Policy</a></li>
              <li><a href="#terms" className="hover:text-foreground transition-colors">Terms of Service</a></li>
              <li><a href="#pharmacy" className="hover:text-foreground transition-colors">Pharmacy Info</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>&copy; {currentYear} Pillar Drug Club. All rights reserved.</p>
          <p className="mt-2">
            FDA-approved medications • Licensed U.S. wholesalers • Secure delivery
          </p>
        </div>
      </div>
    </footer>
  );
}