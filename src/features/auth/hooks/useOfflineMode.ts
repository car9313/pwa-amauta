import { useEffect, useState, useCallback } from "react";
import { useAuthStore, selectIsOfflineMode } from "@/features/auth/presentation/store/auth-store";
import { refreshAccessToken } from "@/lib/api/refresh";

export function useOfflineMode() {
  const isOfflineMode = useAuthStore(selectIsOfflineMode);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const handleOnline = useCallback(async () => {
    setIsOnline(true);

    const state = useAuthStore.getState();
    if (state.isOfflineMode && state.lastAuthError === "TOKEN_EXPIRED") {
      try {
        await refreshAccessToken();
        state.setOfflineMode(false);
        state.setAuthError(null);
      } catch {
        await state.clearSession();
      }
    } else {
      state.setOfflineMode(false);
      state.setAuthError(null);
    }
  }, []);

  useEffect(() => {
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [handleOnline]);

  return {
    isOnline,
    isOfflineMode,
    canRetry: !isOnline || isOfflineMode,
  };
}

export function useAuthErrorHandler() {
  const handleAuthFailure = useAuthStore((state) => state.handleAuthFailure);
  const setOfflineMode = useAuthStore((state) => state.setOfflineMode);
  const setAuthError = useAuthStore((state) => state.setAuthError);

  return {
    handleAuthFailure,
    setOfflineMode,
    setAuthError,
  };
}