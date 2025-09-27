import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, Sun, Moon } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const navigation = [
    { name: "How It Works", href: "#how-it-works" },
    { name: "Pricing", href: "#pricing" },
    { name: "Medications", href: "#medications" },
    { name: "About", href: "#about" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-xl font-semibold text-primary" data-testid="text-logo">
                Pillar Drug Club
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:block">
            <div className="flex items-center space-x-8">
              {navigation.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                  data-testid={`link-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  {item.name}
                </a>
              ))}
            </div>
          </nav>

          {/* Right side actions */}
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              data-testid="button-theme-toggle"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
            
            <div className="hidden md:flex items-center space-x-3">
              <Button variant="ghost" data-testid="button-login">
                Sign In
              </Button>
              <Button data-testid="button-signup">
                Join Now
              </Button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                data-testid="button-mobile-menu"
              >
                {isMenuOpen ? (
                  <X className="h-4 w-4" />
                ) : (
                  <Menu className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t pt-4 pb-6">
            <div className="space-y-3">
              {navigation.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="block text-sm font-medium text-muted-foreground"
                  onClick={() => setIsMenuOpen(false)}
                  data-testid={`mobile-link-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  {item.name}
                </a>
              ))}
              <div className="pt-3 space-y-2">
                <Button variant="ghost" className="w-full justify-start" data-testid="mobile-button-login">
                  Sign In
                </Button>
                <Button className="w-full justify-start" data-testid="mobile-button-signup">
                  Join Now
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}