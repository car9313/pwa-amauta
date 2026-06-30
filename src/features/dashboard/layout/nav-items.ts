import i18next from "i18next";
import {
  LayoutDashboard,
  BookOpen,
  BarChart3,
  Gamepad2,
  Users,
} from "lucide-react";

export type NavItemConfig = {
  label: string;
  href: string;
  icon: React.ElementType;
};

export const studentNavItems: NavItemConfig[] = [
  { label: i18next.t("navigation:navItems.dashboard"), href: "/dashboard/student", icon: LayoutDashboard },
  { label: i18next.t("navigation:navItems.lessons"), href: "/lessons", icon: BookOpen },
  { label: i18next.t("navigation:navItems.practice"), href: "/practice", icon: BarChart3 },
  { label: i18next.t("navigation:navItems.games"), href: "/games", icon: Gamepad2 },
  { label: i18next.t("navigation:navItems.progress"), href: "/progress", icon: BarChart3 },
  { label: i18next.t("navigation:navItems.parentPanel"), href: "/dashboard/parent", icon: Users },
];

export const parentNavItems: NavItemConfig[] = [
  { label: i18next.t("navigation:navItems.dashboard"), href: "/dashboard/parent", icon: LayoutDashboard },
  { label: i18next.t("navigation:navItems.lessons"), href: "/lessons", icon: BookOpen },
  { label: i18next.t("navigation:navItems.progress"), href: "/progress", icon: BarChart3 },
  { label: i18next.t("navigation:navItems.parentPanel"), href: "/dashboard/parent", icon: Users },
];