import type { NavigateFunction } from "react-router-dom";
import { getDashboardPath } from "./get-dashboard-path";
import type { UserRole } from "../store/auth-store";

export function redirectToDashboard(
  navigate: NavigateFunction,
  role: UserRole
): void {
  navigate(getDashboardPath(role), { replace: true });
}

export function redirectToRoles(navigate: NavigateFunction): void {
  navigate("/roles", { replace: true });
}

export function resolveAuthRole(
  selectedRole: UserRole | null,
  userRole: UserRole | null | undefined
): UserRole | null {
  return selectedRole ?? userRole ?? null;
}