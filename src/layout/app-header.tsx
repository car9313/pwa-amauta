import { Button } from "@/components/ui/button";
import { AppMenuSheet } from "@/features/navigation/components/app-menu-sheet";
import { Menu } from "lucide-react";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <img
          src="/icons/favicon-96x96.png"
          alt="Amauta"
          className="h-10 w-auto object-contain"
        />

        <div className="flex items-center gap-2">
          <span className="h-4 w-4 rounded-full bg-amauta-blue" />

          <AppMenuSheet
            trigger={
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="rounded-full text-amauta-blue hover:bg-amauta-blue-light"
                aria-label="Abrir menú"
              >
                <Menu className="h-5 w-5" />
              </Button>
            }
          />
        </div>
      </div>
    </header>
  );
}