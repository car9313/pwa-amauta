import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/features/auth/presentation/store/auth-store";
import { redirectToDashboard } from "@/features/auth/presentation/routing/auth-navigation";

export function useAuthRedirectAfterHydration(): { isReady: boolean } {
  const navigate = useNavigate();
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!hasHydrated) return;

    if (user?.role) {
      redirectToDashboard(navigate, user.role);
    }
  }, [hasHydrated, user, navigate]);

  return { isReady: hasHydrated };
}
