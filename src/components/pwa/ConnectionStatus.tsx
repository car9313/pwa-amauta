import { useMemo } from "react";
import { WifiOff, RefreshCw, AlertCircle } from "lucide-react";
import { useOfflineMode } from "@/features/auth/hooks/useOfflineMode";
import { useAuthStore } from "@/features/auth/presentation/store/auth-store";
import { Button } from "@/components/ui/button";

export function ConnectionStatus() {
  const { isOnline, errorMessage, canRetry } = useOfflineMode();
  const lastAuthError = useAuthStore((state) => state.lastAuthError);

  const shouldShow = useMemo(() => {
    return !isOnline || !!lastAuthError;
  }, [isOnline, lastAuthError]);

  if (isOnline) {
    return null;
  }

  if (!shouldShow) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-2 bg-amber-500 px-4 py-2 text-white shadow-md">
      {isOnline ? (
        <AlertCircle className="h-4 w-4" />
      ) : (
        <WifiOff className="h-4 w-4" />
      )}
      <span className="text-sm font-medium">
        {errorMessage || "Sin conexión a internet"}
      </span>
      {canRetry && isOnline && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.location.reload()}
          className="ml-2 text-white hover:bg-amber-600"
        >
          <RefreshCw className="mr-1 h-3 w-3" />
          Reintentar
        </Button>
      )}
    </div>
  );
}