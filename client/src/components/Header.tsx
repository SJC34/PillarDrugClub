import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, Sun, Moon, Pill, User, LogOut, Settings } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { user, isAuthenticated } = useAuth();

  const handleSignOut = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      if (response.ok) {
        window.location.href = "/login";
      }
    } catch (error) {
      console.error("Logout failed:", error);
      window.location.href = "/login";
    }
  };

  const getUserInitials = () => {
    if (!user?.firstName || !user?.lastName) return "U";
    return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
  };

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

          {/* Right side - Dark mode toggle and auth buttons/user menu */}
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
            
            {isAuthenticated ? (
              <div className="hidden md:flex items-center">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="gap-2 hover-elevate" data-testid="button-user-menu">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-bold text-sm">
                        {user?.firstName} {user?.lastName}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {user?.firstName} {user?.lastName}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user?.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <a href="/settings" className="cursor-pointer" data-testid="menu-item-settings">
                        <Settings className="mr-2 h-4 w-4" />
                        Account Settings
                      </a>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <a href="/dashboard" className="cursor-pointer" data-testid="menu-item-dashboard">
                        <User className="mr-2 h-4 w-4" />
                        Dashboard
                      </a>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={handleSignOut}
                      className="cursor-pointer text-destructive focus:text-destructive"
                      data-testid="menu-item-sign-out"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
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
            )}
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
                      className="block text-lg font-bold !text-white transition-all py-3 px-4 rounded-lg hover:!bg-white/40 active:!bg-white/50"
                      style={{ backgroundColor: 'rgba(255, 255, 255, 0.3)', border: '2px solid rgba(255, 255, 255, 0.5)' }}
                      onClick={() => setIsMenuOpen(false)}
                      data-testid={`mobile-link-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      {item.name}
                    </a>
                  ))}
                </div>
                <div className="px-6 py-6 border-t border-teal-700 space-y-3">
                  {isAuthenticated ? (
                    <>
                      <div className="flex items-center gap-3 mb-4 px-4">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-white text-teal-600 font-bold">
                            {getUserInitials()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-bold !text-white text-sm">
                            {user?.firstName} {user?.lastName}
                          </p>
                          <p className="text-xs !text-teal-100">
                            {user?.email}
                          </p>
                        </div>
                      </div>
                      <a href="/settings" onClick={() => setIsMenuOpen(false)}>
                        <Button variant="outline" className="w-full font-bold !text-white !border-white hover:!bg-white hover:!text-teal-600" data-testid="mobile-button-settings">
                          <Settings className="mr-2 h-4 w-4" />
                          ACCOUNT SETTINGS
                        </Button>
                      </a>
                      <Button 
                        onClick={handleSignOut}
                        variant="outline" 
                        className="w-full font-bold !text-white !border-white hover:!bg-white hover:!text-teal-600" 
                        data-testid="mobile-button-sign-out"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        SIGN OUT
                      </Button>
                    </>
                  ) : (
                    <>
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
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}