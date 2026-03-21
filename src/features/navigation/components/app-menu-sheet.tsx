import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { LogOut } from "lucide-react";
import { useAuthStore } from "@/features/auth/store/auth-store";
import { NavItem } from "./nav-item";
import { getNavigationItems } from "./config/filter-navigation";

type AppMenuSheetProps = {
  trigger: React.ReactNode;
};

export function AppMenuSheet({ trigger }: AppMenuSheetProps) {
  const role = useAuthStore((state) => state.role);
  const clearSession = useAuthStore((state) => state.clearSession);

  const items = getNavigationItems(role);

  return (
    <Sheet>
      <SheetTrigger asChild>{trigger}</SheetTrigger>

      <SheetContent
        side="right"
        className="w-[320px] border-l border-border bg-background p-0 sm:w-90"
      >
        <div className="flex h-full flex-col">
          <SheetHeader className="border-b border-border/60 px-4 py-4">
            <SheetTitle className="sr-only">Menú de navegación</SheetTitle>

            <div className="flex items-center gap-3 rounded-2xl bg-amauta-blue-light p-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-amauta-blue">
                <span className="text-lg font-bold">M</span>
              </div>

              <div className="text-left">
                <p className="text-base font-bold text-foreground">Mario</p>
                <p className="text-sm text-muted-foreground">
                  Nivel 2 - Estudiante
                </p>
              </div>
            </div>
          </SheetHeader>

          <nav className="flex-1 space-y-2 px-4 py-5">
            {items.map((item) => (
              <NavItem
                key={item.path}
                to={item.path}
                icon={item.icon}
                label={item.label}
              />
            ))}
          </nav>

          <div className="border-t border-border/60 p-4">
            <div className="mb-4 flex justify-center">
              <img
                src="/amauta-mascot.png"
                alt="Amauta"
                className="h-12 w-12 object-contain"
              />
            </div>

            <Button
              type="button"
              variant="destructive"
              className="w-full rounded-2xl py-6 text-base font-semibold"
              onClick={clearSession}
            >
              <LogOut className="mr-2 h-5 w-5" />
              Cerrar sesión
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}