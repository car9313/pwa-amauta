import i18next from "i18next";
import type { UserRole } from "@/features/auth/domain/types";
import {
  Home,
  BookOpen,
  BarChart3,
  Gamepad2,
  TrendingUp,
  Users,
  GraduationCap,
  } from "lucide-react";

export type NavigationItem = {
  label: string;
  path: string;
  icon: React.ElementType;
  roles?: UserRole[];
  publicOnly?: boolean;
};

export const navigationItems: NavigationItem[] = [
  {
    label: i18next.t("navigation:navItems.dashboard"),
    path: "/dashboard/student",
    icon: Home,
    roles: ["student", "parent"],
  },
  {
    label: i18next.t("navigation:navItems.lessons"),
    path: "/lessons",
    icon: BookOpen,
    roles: ["student", "parent"],
  },
  {
    label: i18next.t("navigation:navItems.practice"),
    path: "/practice",
    icon: BarChart3,
    roles: ["student", "parent"],
  },
  {
    label: i18next.t("navigation:navItems.games"),
    path: "/games",
    icon: Gamepad2,
    roles: ["student", "parent"],
  },
  {
    label: i18next.t("navigation:navItems.progress"),
    path: "/progress",
    icon: TrendingUp,
    roles: ["student", "parent"],
  },
  {
    label: i18next.t("navigation:navItems.parentPanel"),
    path: "/dashboard/parent",
    icon: Users,
    roles: ["parent"],
  },
  {
    label: i18next.t("navigation:navItems.teacherPanel"),
    path: "/dashboard/teacher",
    icon: GraduationCap,
    roles: ["teacher"],
  },
  /* {
    label: "Iniciar sesión",
    path: "/login",
    icon: LogIn,
    publicOnly: true,
  },
  {
    label: "Registro",
    path: "/register",
    icon: UserPlus,
    publicOnly: true,
  }, */
];