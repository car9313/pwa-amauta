import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { LogOut } from "lucide-react";
import { NavItem } from "./nav-item";
import { getNavigationItems } from "./config/filter-navigation";
import { useLogout } from "@/features/auth/presentation/hooks/use-logout";
import { useAuthStore } from "@/features/auth/presentation/store/auth-store";

type AppMenuSheetProps = {
  trigger: React.ReactNode;
};

export function AppMenuSheet({ trigger }: AppMenuSheetProps) {
  
  const role = useAuthStore((state) => state.role);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const { logout } = useLogout();
 
  const items = getNavigationItems(role);
     

  return (
    <Sheet>
      <SheetTrigger asChild>{trigger}</SheetTrigger>

      <SheetContent
        side="right"
        className="w-[320px] overflow-y-auto  border-l border-border bg-background p-0 sm:w-90"
      >
        <div className="flex h-full flex-col">
          <SheetHeader className="border-b border-border/60 px-4 py-4">
            <SheetTitle className="sr-only">Menú de navegación</SheetTitle>
{user && (
  <div className="flex items-center gap-3 rounded-2xl bg-amauta-blue-light p-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-amauta-blue">
                <span className="text-lg font-bold">M</span>
              </div>

              <div className="text-left">
                <p className="text-base font-bold text-foreground">{user.name}</p>
                <p className="text-sm text-muted-foreground">
                  {user.email}
                </p>
              </div>
            </div>)}
              
            
          </SheetHeader>

          <nav className="flex-1 space-y-2 px-4 py-5">
            {items.map((item) => (
              <NavItem
                key={`${item.label}-${item.path}`}
                to={item.path}
                icon={item.icon}
                label={item.label}
              />
            ))}
          </nav>

          <div className="border-t border-border/60 p-4">
            <div className="mb-4 flex justify-center">
              <img
                src="/icons/web-app-manifest-192x192.png"
                alt="Amauta"
                className="h-30 w-30 object-contain"
              />
            </div>
   {isAuthenticated && user && (
        <Button
              type="button"
              className="w-full rounded-2xl py-6 text-base font-semibold bg-amauta-orange hover:bg-amauta-orange-dark"
              onClick={logout}
            >
              <LogOut className="mr-2 h-5 w-5" />
              Cerrar sesión
            </Button>
    
   )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}