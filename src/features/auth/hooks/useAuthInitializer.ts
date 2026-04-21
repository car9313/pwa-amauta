import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/features/auth/presentation/store/auth-store";
import { authKeys } from "@/lib/query/keys";

export function useAuthInitializer() {
  const queryClient = useQueryClient();
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const hydrateFromStorage = useAuthStore((s) => s.hydrateFromStorage);
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasHydrated || hasRun.current) return;

    hasRun.current = true;
    hydrateFromStorage().then(() => {
      const user = useAuthStore.getState().user;
      if (user) {
        queryClient.setQueryData(authKeys.session(), user);
      }
    });
  }, [hasHydrated]);
}