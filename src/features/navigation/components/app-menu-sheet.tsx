import { useTranslation } from "react-i18next";
import { AmautaButton } from "@/components/amauta";
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
import { useAuthStore } from "@/features/auth/presentation/store/auth-store";
import { useLogout } from "@/features/auth/hooks/useAuth";

type AppMenuSheetProps = {
  trigger: React.ReactNode;
};

export function AppMenuSheet({ trigger }: AppMenuSheetProps) {
  const { t } = useTranslation();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const { logout, isLoading: isLoggingOut } = useLogout();

  const items = getNavigationItems(user?.role ?? null);
  const userInitial = user?.name?.charAt(0).toUpperCase() ?? "U";

  const handleLogout = () => {
    logout();
  };

  return (
    <Sheet>
      <SheetTrigger asChild>{trigger}</SheetTrigger>

      <SheetContent
        side="right"
        className="flex h-full w-[320px] flex-col border-l border-border bg-background p-0 sm:w-[360px]"
      >
        <SheetHeader className="shrink-0 border-b border-border/60 px-4 py-4">
          <SheetTitle className="sr-only">
            {t("navigation:menu.title")}
          </SheetTitle>

          {user && (
            <div className="flex items-center gap-3 rounded-2xl bg-amauta-blue-light p-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-amauta-blue">
                <span className="text-lg font-bold">{userInitial}</span>
              </div>

              <div className="min-w-0 text-left">
                <p className="truncate text-base font-bold text-foreground">
                  {user.name}
                </p>
                <p className="truncate text-sm text-muted-foreground">
                  {user.email}
                </p>
              </div>
            </div>
          )}
        </SheetHeader>

          <nav className="min-h-0 flex-1 space-y-2 overflow-y-auto px-4 py-5">
      {items.map((item) => (
        <NavItem
          key={`${item.path}`}
          to={item.path}
          icon={item.icon}
          label={t(item.labelKey)}
        />
      ))}
    </nav>

        <div className="shrink-0 border-t border-border/60 p-4">
          <div className="mb-4 flex justify-center">
            <img
              src="/icons/web-app-manifest-192x192.png"
              alt="Amauta"
              className="h-30 w-30 object-contain"
            />
          </div>

          {isAuthenticated && user && (
            <AmautaButton
              type="button"
              className="w-full rounded-2xl bg-amauta-orange py-6 text-base font-semibold hover:bg-amauta-orange-dark"
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? (
                t("navigation:menu.logoutLoading")
              ) : (
                <>
                  <LogOut className="mr-2 h-5 w-5" />
                  {t("navigation:menu.logoutButton")}
                </>
              )}
            </AmautaButton>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}