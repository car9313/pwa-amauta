import { Navigate } from "react-router-dom";
import { useAuthStore, type UserRole } from "@/features/auth/store/auth-store";
import { getDashboardPath } from "@/features/auth/utils/get-dashboard-path";

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