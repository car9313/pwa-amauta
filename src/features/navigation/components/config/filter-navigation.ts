import type { UserRole } from "@/features/auth/presentation/store/auth-store";
import { navigationItems } from "./navigation.config";

export function getNavigationItems(role: UserRole | null) {
  return navigationItems.filter((item) => {
    if (item.publicOnly) return true;
    if (!role) return false;
    if (!item.roles) return true;
    return item.roles.includes(role);
  });
}