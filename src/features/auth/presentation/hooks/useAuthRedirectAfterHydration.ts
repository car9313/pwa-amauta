import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { redirectToDashboard } from "../routing/auth-navigation";
import { useAuthStore } from "../store/auth-store";


type UseAuthRedirectAfterHydrationResult = {
  isReady: boolean;
};

export function useAuthRedirectAfterHydration(): UseAuthRedirectAfterHydrationResult {
  const navigate = useNavigate();
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const role = useAuthStore((s) => s.role);

  useEffect(() => {
    if (!hasHydrated) return;

    if (isAuthenticated && role) {
      redirectToDashboard(navigate, role);
    }
  }, [hasHydrated, isAuthenticated, role, navigate]);

  return { isReady: hasHydrated };
}