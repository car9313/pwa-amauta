/* import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area"; */
import { Button } from "@/components/ui/button";
import { LogOut, X } from "lucide-react";
import { NavItem } from "../components/nav-item";
import { UserProfileCard } from "../components/user-profile-card";
import type { NavItemConfig } from "./nav-items";
import { ScrollArea } from "@/components/ui/scroll-area";

type SidebarNavProps = {
  titleLogo?: string;
  userName: string;
  userRole: string;
  userLevel?: string;
  navItems: NavItemConfig[];
  onClose?: () => void;
  onLogout: () => void;
};

export function SidebarNav({
  titleLogo = "/amauta-logo.png",
  userName,
  userRole,
  userLevel,
  navItems,
  onClose,
  onLogout,
}: SidebarNavProps) {
  return (
    <aside className="flex h-full w-full flex-col bg-background">
      <div className="flex items-center justify-between px-4 pt-4">
        <img src={titleLogo} alt="Amauta" className="h-9 w-auto object-contain" />
        {onClose ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Cerrar menú"
            className="rounded-full text-foreground hover:bg-muted"
          >
            <X className="h-5 w-5" />
          </Button>
        ) : null}
      </div>

      <div className="px-4 py-4">
        <UserProfileCard name={userName} role={userRole} level={userLevel} />
      </div>

      {/* <Separator className="bg-border/70" />

       */}
       <ScrollArea className="flex-1 px-4 py-4">
        <nav className="flex flex-col gap-3">
          {navItems.map((item) => (
            <NavItem key={item.href} item={item} onClick={onClose} />
          ))}
        </nav>
      </ScrollArea>

      <div className="p-4">
      {/*   <Separator className="mb-4 bg-border/70" />
 */}
        <Button
          type="button"
          onClick={onLogout}
          variant="secondary"
          className="w-full justify-start gap-3 rounded-2xl bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800"
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </Button>
      </div>
    </aside>
  );
}