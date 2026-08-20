import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "@/features/auth/presentation/store/auth-store";
import { useLocaleStore } from "@/features/locale/store/locale-store";
import { AmautaLoadingState } from "@/components/amauta";
import type { AuthUser } from "@/features/auth/domain/types";
import { checkIfSessionExists } from "@/features/auth/infrastructure/auth-storage";

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
  const verifyLocaleAgainstGeo = useLocaleStore((s) => s.verifyLocaleAgainstGeo);

  const hasInitialized = useRef(false);
  const hasResolvedPostAuth = useRef(false);

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const init = async () => {
      const userId = await checkIfSessionExists();

      if (userId) {
        const found = await hydrateFromStorage(userId);
        if (found) {
          setLocalePhaseReady(true);
          // Verificación no bloqueante: si la geo difiere del país de la cache
          // (viaje entre países), corrige el idioma en caliente sin recargar.
          void verifyLocaleAgainstGeo(userId);
          return;
        }
      }

      await detectPreAuthLocale(800);
      setLocalePhaseReady(true);
    };
    init();
  }, [detectPreAuthLocale, hydrateFromStorage, verifyLocaleAgainstGeo]);

  useEffect(() => {
    if (!hasAuthHydrated || !isAuthenticated || !user) return;
    if (hasResolvedPostAuth.current) return;
    hasResolvedPostAuth.current = true;

    const { geoAlreadyRan, geoFailReason } = useLocaleStore.getState();
    const needsGeoRetry = geoAlreadyRan
      && (geoFailReason === "network_error" || geoFailReason === "timeout");

    const userId = getAuthUserId(user);

    if (needsGeoRetry) {
      // Re-mostrar loading de forma síncrona es intencional: evita el flash de
      // idioma al cambiar el locale tras el reintento de geo (ver doc Problema 5).
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocalePhaseReady(false);
      resolveAndCacheLocale(userId).then(() => {
        setLocalePhaseReady(true);
      });
    } else {
      void resolveAndCacheLocale(userId);
    }
  }, [hasAuthHydrated, isAuthenticated, user, resolveAndCacheLocale]);

  if (!localePhaseReady) {
    return <AmautaLoadingState variant="page" />;
  }

  return <>{children}</>;
}
