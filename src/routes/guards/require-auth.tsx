import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/features/auth/store/auth-store";

type RequireAuthProps = {
  children: React.ReactNode;
};

export function RequireAuth({ children }: RequireAuthProps) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);

  if (!hasHydrated) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}