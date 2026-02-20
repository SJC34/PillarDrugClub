import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Menu, X, Sun, Moon, Pill, User, LogOut, Settings, ShieldCheck, LayoutDashboard } from "lucide-react";
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
  const { user, logout } = useAuth();
  const isAuthenticated = !!user;

  const handleSignOut = () => {
    logout();
  };

  const getUserInitials = () => {
    if (!user?.firstName || !user?.lastName) return "U";
    return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
  };

  const navigation = [
    { name: "MEDICATIONS", href: "/medications" },
    { name: "COST CALCULATOR", href: "/cost-calculator" },
    { name: "DASHBOARD", href: "/dashboard" },
    { name: "PILLAR POST", href: "/blog" },
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
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            >
              {isMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>

            {/* Brand name with pill symbol */}
            <Link href="/" className="text-xl font-black text-foreground flex items-center gap-2 hover:text-primary transition-colors" data-testid="text-logo">
              pillar drug club
              <Pill className="h-5 w-5 text-secondary" />
            </Link>
          </div>
            
          {/* Desktop Navigation - centered */}
          <nav className="hidden lg:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-sm font-bold text-muted-foreground transition-colors hover:text-foreground whitespace-nowrap"
                data-testid={`link-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Right side - Dark mode toggle and auth buttons/user menu */}
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              data-testid="button-theme-toggle"
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
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
                    {user?.role === "admin" && (
                      <>
                        <DropdownMenuItem asChild>
                          <Link href="/admin" className="cursor-pointer" data-testid="menu-item-admin-dashboard">
                            <ShieldCheck className="mr-2 h-4 w-4" />
                            Admin Dashboard
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/dashboard" className="cursor-pointer" data-testid="menu-item-user-dashboard">
                            <LayoutDashboard className="mr-2 h-4 w-4" />
                            User Dashboard
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    {user?.role !== "admin" && (
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard" className="cursor-pointer" data-testid="menu-item-dashboard">
                          <User className="mr-2 h-4 w-4" />
                          Dashboard
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem asChild>
                      <Link href="/settings" className="cursor-pointer" data-testid="menu-item-settings">
                        <Settings className="mr-2 h-4 w-4" />
                        Account Settings
                      </Link>
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
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="font-bold" data-testid="button-login">
                    SIGN IN
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm" className="font-bold px-4" data-testid="button-signup">
                    GET STARTED
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="fixed inset-0 z-[100] md:hidden">
            <div className="fixed inset-0 z-[100] bg-black/40" onClick={() => setIsMenuOpen(false)} data-testid="mobile-menu-backdrop" />
            <div className="fixed inset-y-0 left-0 right-0 z-[101] bg-white dark:bg-gray-950" data-testid="mobile-menu-panel">
              <div className="flex flex-col h-full py-8 bg-white dark:bg-gray-950">
                {/* Logo Header */}
                <div className="px-6 pb-4 bg-white dark:bg-gray-950">
                  <Link href="/" className="text-xl font-black flex items-center gap-2 text-gray-900 dark:text-white hover:text-primary transition-colors" onClick={() => setIsMenuOpen(false)}>
                    pillar drug club
                    <Pill className="h-5 w-5 text-primary" />
                  </Link>
                </div>
                
                {/* Navigation Links */}
                <nav className="flex-1 bg-white dark:bg-gray-950">
                  <div className="space-y-1">
                    {navigation.map((item, index) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setIsMenuOpen(false)}
                        className={`block py-4 px-6 text-lg font-bold text-gray-900 dark:text-white hover:text-primary transition-colors border-b border-gray-200 dark:border-gray-800 ${index === 0 ? 'border-t' : ''}`}
                        data-testid={`mobile-link-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>
                </nav>

                {/* Bottom Section */}
                <div className="border-t border-gray-200 dark:border-gray-800 pt-6 px-6 space-y-4 bg-white dark:bg-gray-950">
                  {isAuthenticated ? (
                    <>
                      <div className="flex items-center gap-3 pb-4">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-primary text-primary-foreground text-lg font-bold">
                            {getUserInitials()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white">
                            {user?.firstName} {user?.lastName}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {user?.email}
                          </p>
                        </div>
                      </div>
                      {user?.role === "admin" && (
                        <>
                          <Link 
                            href="/admin" 
                            onClick={() => setIsMenuOpen(false)}
                            className="block py-3 text-lg font-semibold text-gray-900 dark:text-white hover:text-primary transition-colors"
                            data-testid="mobile-button-admin-dashboard"
                          >
                            Admin Dashboard
                          </Link>
                          <Link 
                            href="/dashboard" 
                            onClick={() => setIsMenuOpen(false)}
                            className="block py-3 text-lg font-semibold text-gray-900 dark:text-white hover:text-primary transition-colors"
                            data-testid="mobile-button-user-dashboard"
                          >
                            User Dashboard
                          </Link>
                        </>
                      )}
                      <Link 
                        href="/settings" 
                        onClick={() => setIsMenuOpen(false)}
                        className="block py-3 text-lg font-semibold text-gray-900 dark:text-white hover:text-primary transition-colors"
                        data-testid="mobile-button-settings"
                      >
                        Account Settings
                      </Link>
                      <button 
                        onClick={handleSignOut}
                        className="block w-full text-left py-3 text-lg font-semibold text-gray-900 dark:text-white hover:text-primary transition-colors" 
                        data-testid="mobile-button-sign-out"
                      >
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <>
                      <Link href="/login" onClick={() => setIsMenuOpen(false)} className="block">
                        <Button variant="outline" className="w-full justify-center text-lg font-bold py-6 bg-white dark:bg-gray-900" data-testid="mobile-button-login">
                          SIGN IN
                        </Button>
                      </Link>
                      <Link href="/register" onClick={() => setIsMenuOpen(false)} className="block">
                        <Button className="w-full justify-center text-lg font-bold py-6" data-testid="mobile-button-signup">
                          GET STARTED
                        </Button>
                      </Link>
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