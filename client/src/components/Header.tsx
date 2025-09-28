import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, Sun, Moon, Pill } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";

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
    <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-lg border-b border-primary/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        <div className="flex h-20 items-center justify-between">
          {/* Left side - Menu button */}
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              data-testid="button-mobile-menu"
              className="relative z-50"
            >
              {isMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>

          {/* Center - Brand name with pill symbol */}
          <div className="absolute left-1/2 transform -translate-x-1/2">
            <span className="text-xl font-black text-foreground flex items-center gap-2" data-testid="text-logo">
              Pillar Drug Club
              <Pill className="h-5 w-5 text-secondary" />
            </span>
          </div>

          {/* Desktop Navigation - hidden on mobile, shown after medium breakpoint */}
          <nav className="hidden lg:block absolute left-1/2 transform -translate-x-1/2 top-full mt-2">
            <div className="flex items-center space-x-8 bg-background/90 backdrop-blur-sm rounded-lg px-4 py-2 shadow-sm border">
              {navigation.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="text-sm font-bold text-muted-foreground transition-colors hover:text-foreground whitespace-nowrap"
                  data-testid={`link-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  {item.name}
                </a>
              ))}
            </div>
          </nav>

          {/* Right side - Dark mode toggle and auth buttons */}
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
              <a href="/login">
                <Button variant="ghost" size="sm" className="font-bold" data-testid="button-login">
                  Sign in
                </Button>
              </a>
              <a href="/register">
                <Button size="sm" className="font-bold px-4" data-testid="button-signup">
                  Get started
                </Button>
              </a>
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
                    <span className="text-xl font-black flex items-center gap-2">
                      Pillar Drug Club
                      <Pill className="h-5 w-5 text-secondary" />
                    </span>
                  </div>
                </div>
                <div className="flex-1 px-6 py-6 space-y-6">
                  {navigation.map((item) => (
                    <a
                      key={item.name}
                      href={item.href}
                      className="block text-lg font-bold text-foreground hover:text-primary transition-colors py-2"
                      onClick={() => setIsMenuOpen(false)}
                      data-testid={`mobile-link-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      {item.name}
                    </a>
                  ))}
                </div>
                <div className="px-6 py-6 border-t space-y-3">
                  <a href="/login" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="outline" className="w-full font-bold" data-testid="mobile-button-login">
                      Sign in
                    </Button>
                  </a>
                  <a href="/register" onClick={() => setIsMenuOpen(false)}>
                    <Button className="w-full font-bold" data-testid="mobile-button-signup">
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