import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import type { NavItemConfig } from "../layout/nav-items";

type NavItemProps = {
  item: NavItemConfig;
  onClick?: () => void;
};

export function NavItem({ item, onClick }: NavItemProps) {
  const Icon = item.icon;

  return (
    <NavLink
      to={item.href}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 rounded-2xl px-4 py-3 text-base font-medium transition-all duration-200",
          "hover:bg-amauta-blue-light hover:text-amauta-blue-dark",
          isActive
            ? "bg-amauta-blue text-white shadow-sm hover:bg-amauta-blue"
            : "text-foreground"
        )
      }
    >
      <Icon className="h-5 w-5 shrink-0" />
      <span>{item.label}</span>
    </NavLink>
  );
}