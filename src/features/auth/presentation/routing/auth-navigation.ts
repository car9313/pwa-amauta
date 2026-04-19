import type { NavigateFunction } from "react-router-dom";
import type { UserRole } from "@/features/auth/domain/types";

export function redirectToDashboard(
  navigate: NavigateFunction,
  role: UserRole
): void {
  navigate(getDashboardPath(role), { replace: true });
}

export function redirectToRoles(navigate: NavigateFunction): void {
  navigate("/roles", { replace: true });
}

export function getDashboardPath(role: UserRole | null) {
  if (role === "student") return "/dashboard/student";
  if (role === "parent") return "/dashboard/parent";
  if (role === "teacher") return "/dashboard/teacher";
  return "/login";
}
