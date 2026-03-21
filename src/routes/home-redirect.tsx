import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/features/auth/store/auth-store";
import { getDashboardPath } from "@/features/auth/utils/get-dashboard-path";

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