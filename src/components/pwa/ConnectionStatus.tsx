import { useMemo, useState, useCallback } from "react";
import { WifiOff, RefreshCw, AlertCircle, X } from "lucide-react";
import { useOfflineMode } from "@/features/auth/hooks/useOfflineMode";
import { useAuthStore } from "@/features/auth/presentation/store/auth-store";
import { AUTH_ERROR_MESSAGES } from "@/features/auth/domain/auth-error";
import { useFailedMutationCount } from "@/hooks/useFailedMutationCount";
import { Button } from "@/components/ui/button";
import { AnimatedPresence } from "@/components/ui/animated-presence";
import { refreshAccessToken } from "@/lib/api/refresh";

const OFFLINE_STUDENT_MESSAGE = "¡Ups! Algo no funciona. Avísale a un adulto.";
const OFFLINE_PARENT_MESSAGE = "Sin conexión a internet. Puedes seguir usando la app en modo offline.";
const OFFLINE_GENERIC_MESSAGE = "Sin conexión a internet";

export function ConnectionStatus() {
  const { isOnline } = useOfflineMode();
  const lastAuthError = useAuthStore((state) => state.lastAuthError);
  const user = useAuthStore((state) => state.user);
  const setAuthError = useAuthStore((state) => state.setAuthError);
  const setOfflineMode = useAuthStore((state) => state.setOfflineMode);
  const { count: failedCount, loading: retrying, retry, dismiss } = useFailedMutationCount();
  const [retryingAuth, setRetryingAuth] = useState(false);

  const offlineMessage = useMemo(() => {
    if (!user) return OFFLINE_GENERIC_MESSAGE;
    if (user.role === "student") return OFFLINE_STUDENT_MESSAGE;
    return OFFLINE_PARENT_MESSAGE;
  }, [user]);

  const authErrorMessage = useMemo(() => {
    if (!lastAuthError) return null;
    return AUTH_ERROR_MESSAGES[lastAuthError];
  }, [lastAuthError]);

  const handleAuthRetry = useCallback(async () => {
    setRetryingAuth(true);
    try {
      await refreshAccessToken();
      setAuthError(null);
      setOfflineMode(false);
    } catch {
      // Intento fallido, el error persiste
    } finally {
      setRetryingAuth(false);
    }
  }, [setAuthError, setOfflineMode]);

  const handleAuthDismiss = useCallback(() => {
    setAuthError(null);
    setOfflineMode(false);
  }, [setAuthError, setOfflineMode]);

  const isStudent = user?.role === "student";

  return (
    <>
      <AnimatedPresence show={!isOnline}>
        <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-2 bg-accent px-4 py-2 text-white shadow-md">
          <WifiOff className="h-4 w-4" />
          <span className="text-sm font-medium">{offlineMessage}</span>
        </div>
      </AnimatedPresence>

      <AnimatedPresence show={!!(isOnline && lastAuthError)}>
        <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-2 bg-destructive px-4 py-2 text-white shadow-md">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm font-medium">{authErrorMessage}</span>
          {!isStudent && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAuthRetry}
                disabled={retryingAuth}
                className="ml-2 text-white hover:bg-destructive/90"
              >
                <RefreshCw className={`mr-1 h-3 w-3 ${retryingAuth ? "animate-spin" : ""}`} />
                {retryingAuth ? "Reintentando..." : "Reintentar"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAuthDismiss}
                className="ml-1 text-white hover:bg-destructive/90"
              >
                <X className="h-3 w-3" />
              </Button>
            </>
          )}
        </div>
      </AnimatedPresence>

      <AnimatedPresence show={!!(isOnline && failedCount > 0 && !isStudent)}>
        <div className="fixed top-12 left-0 right-0 z-50 flex items-center justify-center gap-2 bg-destructive px-4 py-2 text-white shadow-md">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm font-medium">
            {failedCount} {failedCount === 1 ? "cambio no se pudo guardar" : "cambios no se pudieron guardar"}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={retry}
            disabled={retrying}
            className="ml-2 text-white hover:bg-destructive/90"
          >
            <RefreshCw className={`mr-1 h-3 w-3 ${retrying ? "animate-spin" : ""}`} />
            {retrying ? "Reintentando..." : "Reintentar"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={dismiss}
            className="ml-1 text-white hover:bg-destructive/90"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </AnimatedPresence>
    </>
  );
}