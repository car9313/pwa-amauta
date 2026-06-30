import { useEffect, useState } from "react";
import { useAuthStore } from "@/features/auth/presentation/store/auth-store";
import { useLocaleStore } from "@/features/locale/store/locale-store";
import { AmautaLoadingState } from "@/components/amauta";
import type { AuthUser } from "@/features/auth/domain/types";

function getAuthUserId(user: AuthUser): string {
  switch (user.role) {
    case "student": return user.studentId;
    case "parent": return user.parentId;
    case "teacher": return user.teacherId;
  }
}

export function LocaleInitializer({ children }: { children: React.ReactNode }) {
  const [localePhaseReady, setLocalePhaseReady] = useState(false);

  const hasAuthHydrated = useAuthStore((s) => s.hasHydrated);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const hydrateFromStorage = useLocaleStore((s) => s.hydrateFromStorage);
  const detectPreAuthLocale = useLocaleStore((s) => s.detectPreAuthLocale);
  const resolveAndCacheLocale = useLocaleStore((s) => s.resolveAndCacheLocale);

  useEffect(() => {
    const init = async () => {
      const found = await hydrateFromStorage();
      if (found) {
        setLocalePhaseReady(true);
        return;
      }
      await detectPreAuthLocale(800);
      setLocalePhaseReady(true);
    };

    init();
  }, [hydrateFromStorage, detectPreAuthLocale]);

  useEffect(() => {
    if (!hasAuthHydrated || !isAuthenticated || !user) return;
    const userId = getAuthUserId(user);
    resolveAndCacheLocale(userId);
  }, [hasAuthHydrated, isAuthenticated, user, resolveAndCacheLocale]);

  if (!localePhaseReady) {
    return <AmautaLoadingState variant="page" />;
  }

  return <>{children}</>;
}
