import { useEffect, useState } from "react";
import { useAuthStore, selectIsOfflineMode, selectLastAuthError } from "@/features/auth/presentation/store/auth-store";
import { AUTH_ERROR_MESSAGES } from "@/features/auth/domain/auth-error";

export function useOfflineMode() {
  const isOfflineMode = useAuthStore(selectIsOfflineMode);
  const lastAuthError = useAuthStore(selectLastAuthError);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const errorMessage = lastAuthError ? AUTH_ERROR_MESSAGES[lastAuthError] : null;

  return {
    isOnline,
    isOfflineMode,
    errorMessage,
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