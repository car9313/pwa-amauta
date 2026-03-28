import { Navigate } from "react-router-dom";import { getDashboardPath } from "@/features/auth/presentation/routing/get-dashboard-path";
import { useAuthStore, type UserRole } from "@/features/auth/presentation/store/auth-store";

type RequireRoleProps = {
  allowedRole: UserRole;
  children: React.ReactNode;
};

export function RequireRole({ allowedRole, children }: RequireRoleProps) {
  const role = useAuthStore((state) => state.role);

  if (!role) {
    return <Navigate to="/roles" replace />;
  }

  if (role !== allowedRole) {
     return <Navigate to={getDashboardPath(role)} replace />;
  }

  return <>{children}</>;
}