import { Navigate } from "react-router-dom";
import { getDashboardPath } from "@/features/auth/presentation/routing/get-dashboard-path";
import { useAuthStore } from "@/features/auth/presentation/store/auth-store";

export function HomeRedirect() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const role = useAuthStore((state) => state.role);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!role) {
    return <Navigate to="/roles" replace />;
  }

  return <Navigate to={getDashboardPath(role)} replace />;
}