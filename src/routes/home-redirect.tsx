import { Navigate } from "react-router-dom";
import { getDashboardPath } from "@/features/auth/presentation/routing/auth-navigation";
import { useAuthStore } from "@/features/auth/presentation/store/auth-store";

export function HomeRedirect() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!user?.role) {
    return <Navigate to="/roles" replace />;
  }

  return <Navigate to={getDashboardPath(user.role)} replace />;
}
