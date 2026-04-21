import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/features/auth/presentation/store/auth-store";
import { checkAuthValidity, loadAuthFromStorage } from "../infrastructure/auth-storage";
import { authKeys } from "@/lib/query/keys";

export function useAuthInitializer() {
  const queryClient = useQueryClient();
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setVerifying = useAuthStore((s) => s.setVerifying);
  const setUser = useAuthStore((s) => s.setUser);
  const setAuthenticated = useAuthStore((s) => s.setAuthenticated);
  const hasRun = useRef(false);

  useEffect(() => {
    if (!hasHydrated) return;
    if (hasRun.current) return;

    const init = async () => {
      if (isAuthenticated) {
        setVerifying(false);
        hasRun.current = true;
        return;
      }

      setVerifying(true);

      try {
        const isValid = await checkAuthValidity();

        if (isValid) {
          const stored = await loadAuthFromStorage();
          if (stored && stored.user) {
            setAuthenticated(true);
            setUser(stored.user);
            queryClient.setQueryData(authKeys.session(), stored.user);
          }
        }

        hasRun.current = true;
      } catch {
        hasRun.current = true;
      } finally {
        setVerifying(false);
      }
    };

    init();
  }, [hasHydrated, isAuthenticated]);
}