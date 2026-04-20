import { Navigate } from "react-router-dom";
import { getDashboardPath } from "@/features/auth/presentation/routing/auth-navigation";
import { useAuthStore, type UserRole } from "@/features/auth/presentation/store/auth-store";

type RequireRoleProps = {
  allowedRole: UserRole;
  children: React.ReactNode;
};

export function RequireRole({ allowedRole, children }: RequireRoleProps) {
  const user = useAuthStore((state) => state.user);

  if (!user?.role) {
    return <Navigate to="/roles" replace />;
  }

  if (user.role !== allowedRole) {
    return <Navigate to={getDashboardPath(user.role)} replace />;
  }

  return <>{children}</>;
}
