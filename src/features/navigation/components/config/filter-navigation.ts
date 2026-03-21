import { navigationItems } from "./navigation.config";
import type { UserRole } from "@/features/auth/store/auth-store";

export function getNavigationItems(role: UserRole | null) {
  return navigationItems.filter((item) => {
    if (item.publicOnly) return true;
    if (!role) return false;
    if (!item.roles) return true;
    return item.roles.includes(role);
  });
}