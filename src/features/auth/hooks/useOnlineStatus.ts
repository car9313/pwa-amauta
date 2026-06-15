import { useEffect, useState } from "react";

export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState<boolean>(() => navigator.onLine);

  useEffect(() => {
    const handleOnline = (): void => setIsOnline(true);
    const handleOffline = (): void => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // ─── Dev override (solo en desarrollo) ───
  const [devOverride, setDevOverride] = useState<boolean | null>(() => {
    if (!import.meta.env.DEV) return null;
    const stored = localStorage.getItem("__dev_online");
    if (stored === "true") return true;
    if (stored === "false") return false;
    return null;
  });

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      if (detail === "true") setDevOverride(true);
      else if (detail === "false") setDevOverride(false);
      else setDevOverride(null);
    };
    window.addEventListener("__dev-online-change", handler);
    return () => window.removeEventListener("__dev-online-change", handler);
  }, []);

  if (devOverride !== null) return devOverride;
  // ─── Fin dev override ───

  return isOnline;
}
