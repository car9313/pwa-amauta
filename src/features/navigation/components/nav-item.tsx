import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

type Props = {
  to: string;
  icon: React.ElementType;
  label: string;
  onClick?: () => void;
};

export function NavItem({ to, icon: Icon, label, onClick }: Props) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 rounded-2xl px-4 py-3 text-base font-semibold transition-all",
          isActive
            ? "bg-amauta-blue text-white shadow-sm"
            : "text-foreground hover:bg-amauta-blue-light hover:text-amauta-blue"
        )
      }
    >
      <Icon className="h-5 w-5 shrink-0" />
      <span>{label}</span>
    </NavLink>
  );
}