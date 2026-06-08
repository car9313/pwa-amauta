import { WifiOff } from "lucide-react";
import { useOnlineStatus } from "@/features/auth/hooks/useOnlineStatus";

export function PublicConnectionBanner() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center justify-center gap-2 bg-accent px-4 py-2 text-white shadow-md"
    >
      <WifiOff className="h-4 w-4" />
      <span className="text-sm font-medium">
        No tienes internet. Algunas funciones no estarán disponibles.
      </span>
    </div>
  );
}
