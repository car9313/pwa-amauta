import { useEffect } from "react";
import { ErrorBoundary } from "@/components/error";
import { AppRoutes } from "./routes/app-routes";
import { useAuthStore } from "@/features/auth/presentation/store/auth-store";
import { UpdateToast } from "@/components/UpdateToast";
import { initBackgroundSync } from "@/lib/sync/background-sync";

export default function App() {
  const user = useAuthStore((state) => state.user);

  const fallbackType = user?.role === "student" ? "student" : user?.role === "parent" ? "parent" : "generic";

  useEffect(() => {
    initBackgroundSync({ intervalMs: 30000, autoSync: true });
  }, []);

  return (
    <>
      <ErrorBoundary fallbackType={fallbackType}>
        <AppRoutes />
      </ErrorBoundary>
      <UpdateToast />
    </>
  );
}