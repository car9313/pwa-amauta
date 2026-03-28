import type { UserRole } from "../store/auth-store";


export function getDashboardPath(role: UserRole | null) {
  if (role === "student") return "/dashboard/student";
  if (role === "parent") return "/dashboard/parent";
  return "/login";
}