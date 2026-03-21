import { ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type RoleCardProps = {
  title: string;
  highlight: string;
  imageSrc: string;
  imageAlt: string;
  accentClassName?: string;
  onSelect: () => void;
};

export function RoleCard({
  title,
  highlight,
  imageSrc,
  imageAlt,
  accentClassName,
  onSelect,
}: RoleCardProps) {
  return (
    <Card
      className={cn(
        "cursor-pointer border-border/70 bg-card shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
        accentClassName
      )}
      onClick={onSelect}
      role="button"
      tabIndex={0}
    >
      <CardContent className="flex items-center gap-4 p-4 sm:p-5">
        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-muted sm:h-16 sm:w-16">
          <img
            src={imageSrc}
            alt={imageAlt}
            className="h-full w-full object-cover"
          />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold text-foreground sm:text-lg">
            {title}{" "}
            <span className="text-amauta-orange">{highlight}</span>
          </p>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Selecciona este perfil para continuar
          </p>
        </div>

        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="shrink-0 rounded-full text-amauta-blue hover:bg-amauta-blue-light hover:text-amauta-blue-dark"
          aria-label={`Seleccionar ${highlight}`}
        >
          <ArrowRight className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}