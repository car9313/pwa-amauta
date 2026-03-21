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
  { label: "Mi Dashboard", href: "/dashboard/student", icon: LayoutDashboard },
  { label: "Lecciones", href: "/lessons", icon: BookOpen },
  { label: "Práctica", href: "/practice", icon: BarChart3 },
  { label: "¡Juguemos!", href: "/games", icon: Gamepad2 },
  { label: "Mi Progreso", href: "/progress", icon: BarChart3 },
  { label: "Panel de Padres", href: "/dashboard/parent", icon: Users },
];

export const parentNavItems: NavItemConfig[] = [
  { label: "Mi Dashboard", href: "/dashboard/parent", icon: LayoutDashboard },
  { label: "Lecciones", href: "/lessons", icon: BookOpen },
  { label: "Progreso", href: "/progress", icon: BarChart3 },
  { label: "Panel de Padres", href: "/dashboard/parent", icon: Users },
];