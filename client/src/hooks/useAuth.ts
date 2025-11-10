// Re-export useAuth from AuthContext for backwards compatibility
export { useAuth } from "@/contexts/AuthContext";

// Add a helper to maintain backwards compatibility with existing code
import { useAuth as useAuthContext } from "@/contexts/AuthContext";

export function useAuthCompat() {
  const { user, isLoading, login, logout, refreshUser } = useAuthContext();
  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    refreshUser,
  };
}
