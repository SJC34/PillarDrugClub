import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useLocation } from "wouter";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "admin" | "client" | "broker" | "company";
  membershipTier?: string;
  profileImageUrl?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (user: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        // First check localStorage for immediate UI update
        const storedUser = localStorage.getItem("pillar_user");
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
          } catch {
            // Invalid JSON in localStorage, clear it
            localStorage.removeItem("pillar_user");
          }
        }

        // Then verify with server (this is the source of truth)
        const response = await fetch("/api/auth/user", {
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          if (data.user) {
            setUser(data.user);
            localStorage.setItem("pillar_user", JSON.stringify(data.user));
          } else {
            // Server says no user, clear everything
            localStorage.removeItem("pillar_user");
            setUser(null);
          }
        } else if (response.status === 401 || response.status === 403) {
          // Authentication failed - clear session
          localStorage.removeItem("pillar_user");
          setUser(null);
        } else {
          // Server error (500, 503, etc.) - keep localStorage user for resilience
          // Don't clear user on transient server errors
          console.warn("Server error while checking auth, keeping cached user:", response.status);
        }
      } catch (error) {
        console.error("Failed to load user:", error);
        // On network error, keep localStorage user for offline-first UX
        // but log the error for debugging
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    try {
      localStorage.setItem("pillar_user", JSON.stringify(userData));
    } catch (error) {
      console.error("Failed to save user to localStorage:", error);
      // Continue even if localStorage fails (private browsing, etc.)
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout error:", error);
      // Continue with local logout even if server request fails
    } finally {
      // Always clear local state and redirect, regardless of server response
      setUser(null);
      try {
        localStorage.removeItem("pillar_user");
      } catch (error) {
        console.error("Failed to clear localStorage:", error);
      }
      setLocation("/login");
    }
  };

  const refreshUser = async () => {
    try {
      const response = await fetch("/api/auth/user", {
        credentials: "include",
      });

      if (response.ok) {
        try {
          const data = await response.json();
          if (data.user) {
            setUser(data.user);
            localStorage.setItem("pillar_user", JSON.stringify(data.user));
          } else {
            // Server says no user, clear everything
            localStorage.removeItem("pillar_user");
            setUser(null);
          }
        } catch (parseError) {
          // JSON parse error - malformed response, keep cached user for resilience
          console.error("Failed to parse user data, keeping cached user:", parseError);
        }
      } else if (response.status === 401 || response.status === 403) {
        // Authentication failed - clear session
        localStorage.removeItem("pillar_user");
        setUser(null);
      } else {
        // Server error (500, 503, etc.) - keep localStorage user for resilience
        console.warn("Server error while refreshing auth, keeping cached user:", response.status);
      }
    } catch (error) {
      console.error("Failed to refresh user (network error), keeping cached user:", error);
      // On network error, keep localStorage user for offline-first UX
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
