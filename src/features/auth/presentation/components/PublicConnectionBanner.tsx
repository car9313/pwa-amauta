import { useTranslation } from "react-i18next";
import { WifiOff } from "lucide-react";
import { useOnlineStatus } from "@/features/auth/hooks/useOnlineStatus";

export function PublicConnectionBanner() {
  const { t } = useTranslation();
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
        {t("auth:banner.offlineMessage")}
      </span>
    </div>
  );
}
