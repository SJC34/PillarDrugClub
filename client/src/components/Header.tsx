import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, Sun, Moon } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import logoImage from "@assets/Add a heading_1758988919681.png";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const navigation = [
    { name: "Medications", href: "/medications" },
    { name: "Cost Calculator", href: "/cost-calculator" },
    { name: "Transfer", href: "/prescription-transfer" },
    { name: "Dashboard", href: "/dashboard" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-primary backdrop-blur-lg border-b border-primary-foreground/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        <div className="flex h-20 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-xl font-semibold text-primary-foreground" data-testid="text-logo">
                Pillar Drug Club
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:block">
            <div className="flex items-center space-x-10">
              {navigation.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="text-sm font-medium text-primary-foreground/70 transition-colors hover:text-primary-foreground"
                  data-testid={`link-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  {item.name}
                </a>
              ))}
            </div>
          </nav>

          {/* Right side actions */}
          <div className="flex items-center space-x-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              data-testid="button-theme-toggle"
              className="text-primary-foreground hover:bg-primary-foreground/10"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
            
            <div className="hidden md:flex items-center space-x-4">
              <a href="/login">
                <Button variant="ghost" className="font-medium text-primary-foreground hover:bg-primary-foreground/10" data-testid="button-login">
                  Sign in
                </Button>
              </a>
              <a href="/register">
                <Button variant="secondary" className="font-medium px-6" data-testid="button-signup">
                  Get started
                </Button>
              </a>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                data-testid="button-mobile-menu"
                className="relative z-50 text-primary-foreground hover:bg-primary-foreground/10"
              >
                {isMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            <div className="fixed inset-0 bg-black/50" onClick={() => setIsMenuOpen(false)} />
            <div className="fixed top-0 right-0 bottom-0 w-full max-w-sm bg-background shadow-xl">
              <div className="flex flex-col h-full">
                <div className="px-6 py-4 border-b">
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-semibold">Pillar Drug Club</span>
                  </div>
                </div>
                <div className="flex-1 px-6 py-6 space-y-6">
                  {navigation.map((item) => (
                    <a
                      key={item.name}
                      href={item.href}
                      className="block text-lg font-medium text-foreground hover:text-primary transition-colors py-2"
                      onClick={() => setIsMenuOpen(false)}
                      data-testid={`mobile-link-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      {item.name}
                    </a>
                  ))}
                </div>
                <div className="px-6 py-6 border-t space-y-3">
                  <a href="/login" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="outline" className="w-full font-medium" data-testid="mobile-button-login">
                      Sign in
                    </Button>
                  </a>
                  <a href="/register" onClick={() => setIsMenuOpen(false)}>
                    <Button className="w-full font-medium" data-testid="mobile-button-signup">
                      Get started
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}