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
  labelKey: string;
  path: string;
  icon: React.ElementType;
  roles?: UserRole[];
  publicOnly?: boolean;
};

export const navigationItems: NavigationItem[] = [
  {
    labelKey: "navigation:navItems.dashboard",
    path: "/dashboard/student",
    icon: Home,
    roles: ["student", "parent"],
  },
  {
    labelKey: "navigation:navItems.lessons",
    path: "/lessons",
    icon: BookOpen,
    roles: ["student", "parent"],
  },
  {
    labelKey: "navigation:navItems.practice",
    path: "/practice",
    icon: BarChart3,
    roles: ["student", "parent"],
  },
  {
    labelKey: "navigation:navItems.games",
    path: "/games",
    icon: Gamepad2,
    roles: ["student", "parent"],
  },
  {
    labelKey: "navigation:navItems.progress",
    path: "/progress",
    icon: TrendingUp,
    roles: ["student", "parent"],
  },
  {
    labelKey: "navigation:navItems.parentPanel",
    path: "/dashboard/parent",
    icon: Users,
    roles: ["parent"],
  },
  {
    labelKey: "navigation:navItems.teacherPanel",
    path: "/dashboard/teacher",
    icon: GraduationCap,
    roles: ["teacher"],
  },
];