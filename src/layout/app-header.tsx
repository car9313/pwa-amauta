import { AmautaButton, AmautaContainer } from "@/components/amauta";
import { AppMenuSheet } from "@/features/navigation/components/app-menu-sheet";
import { Menu } from "lucide-react";

export function AppHeader() {
  
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/95 backdrop-blur">
      <AmautaContainer className="flex h-16 items-center justify-between">
        <img
          src="/icons/favicon-96x96.png"
          alt="Amauta"
          className="h-10 w-auto object-contain"
        />

        <div className="flex items-center gap-2">
          <span className="h-4 w-4 rounded-full bg-amauta-blue" />

          <AppMenuSheet
            trigger={
              <AmautaButton
                type="button"
                variant="ghost"
                size="icon"
                className="rounded-full text-amauta-blue hover:bg-amauta-blue-light"
                aria-label="Abrir menú"
              >
                <Menu className="h-5 w-5" />
              </AmautaButton>
            }
          />
        </div>
      </AmautaContainer>
    </header>
  );
}