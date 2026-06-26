import { useEffect } from "react";
import { ErrorBoundary } from "@/components/error";
import { AppRoutes } from "./routes/app-routes";
import { useAuthStore } from "@/features/auth/presentation/store/auth-store";
import { UpdateToast } from "@/components/UpdateToast";
import { initBackgroundSync, stopBackgroundSync } from "@/lib/sync/background-sync";
import { configureHttpClient } from "@/lib/api";
import { DevOnlineToggle } from "@/components/dev";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";
const API_VERSION = import.meta.env.VITE_API_VERSION ?? "v1";

export default function App() {
  const user = useAuthStore((state) => state.user);

  const fallbackType = user?.role === "student" ? "student" : user?.role === "parent" ? "parent" : "generic";

  useEffect(() => {
    configureHttpClient({
      baseUrl: `${API_BASE_URL}/${API_VERSION}`,
      onUnauthorized: (code) => {
        useAuthStore.getState().handleAuthFailure(code);
      },
      onRefreshFailed: (code) => {
        useAuthStore.getState().handleAuthFailure(code);
      },
    });
    initBackgroundSync({ intervalMs: 30000, autoSync: true });

    return () => {
      stopBackgroundSync();
    };
  }, []);

  return (
    <>
      <ErrorBoundary fallbackType={fallbackType}>
        <AppRoutes />
      </ErrorBoundary>
      <UpdateToast />
      {import.meta.env.DEV && <DevOnlineToggle />}
    </>
  );
}