import type { UserRole } from "@/features/auth/domain/auth.types";
import {
  Home,
  BookOpen,
  BarChart3,
  Gamepad2,
  TrendingUp,
  Users,
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
    label: "Mi Dashboard",
    path: "/dashboard/student",
    icon: Home,
    roles: ["student", "parent"],
  },
  {
    label: "Lecciones",
    path: "/lessons",
    icon: BookOpen,
    roles: ["student", "parent"],
  },
  {
    label: "Práctica",
    path: "/practice",
    icon: BarChart3,
    roles: ["student", "parent"],
  },
  {
    label: "¡Juguemos!",
    path: "/games",
    icon: Gamepad2,
    roles: ["student", "parent"],
  },
  {
    label: "Mi Progreso",
    path: "/progress",
    icon: TrendingUp,
    roles: ["student", "parent"],
  },
  {
    label: "Panel de Padres",
    path: "/dashboard/parent",
    icon: Users,
    roles: ["parent"],
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