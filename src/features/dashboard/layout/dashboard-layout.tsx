import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";/* 
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"; */
import { SidebarNav } from "./sidebar-nav";
import { studentNavItems, parentNavItems } from "./nav-items";
import { useAuthStore } from "@/features/auth/store/auth-store";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function DashboardLayout() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const role = useAuthStore((state) => state.role);
  const clearRole = useAuthStore((state) => state.clearRole);

  const isStudent = role === "student";
  const navItems = isStudent ? studentNavItems : parentNavItems;

  const handleLogout = () => {
    clearRole();
    navigate("/choose-role");
  };

  return (
    <div className="min-h-screen bg-background text-foreground lg:flex">
      <aside className="hidden lg:sticky lg:top-0 lg:block lg:h-screen lg:w-85 lg:border-r lg:border-border/70">
        <SidebarNav
          userName={isStudent ? "Mario" : "Ana"}
          userRole={isStudent ? "Estudiante" : "Padre o Madre"}
          userLevel={isStudent ? "Nivel 2" : undefined}
          navItems={navItems}
          onLogout={handleLogout}
        />
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header
          className={cn(
            "flex items-center justify-between border-b border-border/70 bg-background px-4 py-4",
            "lg:px-8"
          )}
        >
          <div className="flex items-center gap-3">
            <img
              src="/amauta-logo.png"
              alt="Amauta"
              className="h-9 w-auto object-contain"
            />
          </div>
<div>Hola Mundo</div>
          <div className="lg:hidden">
             <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="rounded-full text-amauta-blue hover:bg-amauta-blue-light"
                  aria-label="Abrir menú"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>

              <SheetContent side="right" className="w-[90vw] max-w-sm p-0">
                <SidebarNav
                  userName={isStudent ? "Mario" : "Ana"}
                  userRole={isStudent ? "Estudiante" : "Padre o Madre"}
                  userLevel={isStudent ? "Nivel 2" : undefined}
                  navItems={navItems}
                  onClose={() => setOpen(false)}
                  onLogout={handleLogout}
                />
              </SheetContent>
            </Sheet>
           </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}