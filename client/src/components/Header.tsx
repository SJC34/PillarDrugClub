import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, Sun, Moon, Pill } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const navigation = [
    { name: "MEDICATIONS", href: "/medications" },
    { name: "COST CALCULATOR", href: "/cost-calculator" },
    { name: "DASHBOARD", href: "/dashboard" },
    { name: "PRESCRIPTIONS", href: "/prescriptions" },
    { name: "ORDERS", href: "/orders" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-background backdrop-blur-lg border-b border-primary/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        <div className="flex h-16 items-center justify-between lg:justify-evenly">
          {/* Left side - Hamburger (mobile) or Brand (desktop) */}
          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              data-testid="button-mobile-menu"
              className="relative z-[102] md:hidden"
            >
              {isMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>

            {/* Brand name with pill symbol */}
            <a href="/" className="text-xl font-black text-foreground flex items-center gap-2 hover:text-primary transition-colors" data-testid="text-logo">
              pillar drug club
              <Pill className="h-5 w-5 text-secondary" />
            </a>
          </div>
            
          {/* Desktop Navigation - centered */}
          <nav className="hidden lg:flex items-center space-x-8">
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
          </nav>

          {/* Right side - Dark mode toggle and auth buttons */}
          <div className="flex items-center space-x-3">
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
                  SIGN IN
                </Button>
              </a>
              <a href="/register">
                <Button size="sm" className="font-bold px-4" data-testid="button-signup">
                  GET STARTED
                </Button>
              </a>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="fixed inset-0 z-[100] md:hidden">
            <div className="fixed inset-0 z-[100]" style={{ backgroundColor: 'rgba(13, 148, 136, 0.5)' }} onClick={() => setIsMenuOpen(false)} data-testid="mobile-menu-backdrop" />
            <div className="fixed top-0 right-0 bottom-0 w-full max-w-sm z-[101]" style={{ backgroundColor: 'rgba(13, 148, 136, 0.95)' }} data-testid="mobile-menu-panel">
              <div className="flex flex-col h-full">
                <div className="px-6 py-4 border-b border-teal-700">
                  <div className="flex items-center gap-2">
                    <a href="/" className="text-xl font-black flex items-center gap-2 !text-white hover:!text-teal-100 transition-colors" onClick={() => setIsMenuOpen(false)}>
                      pillar drug club
                      <Pill className="h-5 w-5 !text-white" />
                    </a>
                  </div>
                </div>
                <div className="flex-1 px-6 py-6 space-y-3">
                  {navigation.map((item) => (
                    <a
                      key={item.name}
                      href={item.href}
                      className="block text-lg font-bold !text-white transition-all py-3 px-4 rounded-lg"
                      style={{ backgroundColor: 'rgba(255, 255, 255, 0.25)' }}
                      onClick={() => setIsMenuOpen(false)}
                      data-testid={`mobile-link-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      {item.name}
                    </a>
                  ))}
                </div>
                <div className="px-6 py-6 border-t border-teal-700 space-y-3">
                  <a href="/login" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="outline" className="w-full font-bold !text-white !border-white hover:!bg-white hover:!text-teal-600" data-testid="mobile-button-login">
                      SIGN IN
                    </Button>
                  </a>
                  <a href="/register" onClick={() => setIsMenuOpen(false)}>
                    <Button className="w-full font-bold !bg-white !text-teal-600 hover:!bg-teal-50" data-testid="mobile-button-signup">
                      GET STARTED
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