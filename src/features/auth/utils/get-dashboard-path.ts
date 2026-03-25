import type { UserRole } from "../domain/auth.types";

export function getDashboardPath(role: UserRole | null) {
  if (role === "student") return "/dashboard/student";
  if (role === "parent") return "/dashboard/parent";
  return "/login";
}