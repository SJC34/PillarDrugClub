import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "admin" | "client" | "broker" | "company";
  redirectTo?: string;
}

export function ProtectedRoute({ 
  children, 
  requiredRole,
  redirectTo = "/login" 
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      // Not logged in - redirect to login
      setLocation(redirectTo);
    } else if (!isLoading && user && requiredRole && user.role !== requiredRole) {
      // Logged in but wrong role - show 403 or redirect to home
      // Note: We don't auto-redirect admins away from client pages
      // This allows admins to access both admin and client views
      console.warn(`Access denied: User has role ${user.role}, but ${requiredRole} required`);
      setLocation("/");
    }
  }, [user, isLoading, requiredRole, redirectTo, setLocation]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen" data-testid="protected-route-loading">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not authenticated - show redirecting message instead of blank screen
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4" data-testid="protected-route-redirecting">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground" data-testid="text-redirecting-message">Redirecting to login...</p>
      </div>
    );
  }

  // Wrong role - show access denied message instead of blank screen
  if (requiredRole && user.role !== requiredRole) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4" data-testid="protected-route-access-denied">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground" data-testid="text-access-denied-message">Access denied. Redirecting...</p>
      </div>
    );
  }

  // Authenticated and authorized
  return <>{children}</>;
}
