import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

type AmautaAchievementSize = "sm" | "md" | "lg";

interface AmautaAchievementProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  unlocked?: boolean;
  size?: AmautaAchievementSize;
  className?: string;
  onReveal?: () => void;
}

const sizeMap: Record<
  AmautaAchievementSize,
  { box: string; icon: string; title: string; desc: string }
> = {
  sm: {
    box: "min-w-[100px] p-3",
    icon: "h-6 w-6",
    title: "text-xs",
    desc: "text-[10px]",
  },
  md: {
    box: "min-w-[120px] p-4",
    icon: "h-8 w-8",
    title: "text-sm",
    desc: "text-xs",
  },
  lg: {
    box: "min-w-[140px] p-5",
    icon: "h-10 w-10",
    title: "text-base",
    desc: "text-sm",
  },
};

function AmautaAchievement({
  icon: Icon,
  title,
  description,
  unlocked = true,
  size = "md",
  className,
  onReveal,
}: AmautaAchievementProps) {
  const sizes = sizeMap[size];

  return (
    <button
      type="button"
      disabled={!unlocked}
      onClick={onReveal}
      className={cn(
        "group relative flex flex-col items-center gap-2 rounded-2xl border text-center transition-all duration-300",
        unlocked
          ? "bg-card border-border shadow-sm hover:shadow-md hover:scale-105 hover:-translate-y-1 cursor-pointer"
          : "bg-muted/50 border-dashed border-muted-foreground/30 cursor-default opacity-60",
        sizes.box,
        unlocked && "hover-lift",
        className,
      )}
    >
      {unlocked && (
        <div className="absolute -top-3 -right-3">
          <Sparkles className="h-5 w-5 text-[var(--amauta-orange)] animate-sparkle" />
        </div>
      )}

      <div
        className={cn(
          "flex items-center justify-center rounded-full transition-all duration-300",
          unlocked
            ? "bg-[var(--amauta-orange-light)] group-hover:scale-110 group-hover:rotate-6"
            : "bg-muted",
          sizes.icon === "h-6 w-6" && "p-2",
          sizes.icon === "h-8 w-8" && "p-3",
          sizes.icon === "h-10 w-10" && "p-3.5",
        )}
      >
        {Icon ? (
          <Icon
            className={cn(
              sizes.icon,
              unlocked
                ? "text-[var(--amauta-orange-dark)]"
                : "text-muted-foreground",
            )}
          />
        ) : (
          <Sparkles
            className={cn(
              sizes.icon,
              unlocked
                ? "text-[var(--amauta-orange-dark)]"
                : "text-muted-foreground",
            )}
          />
        )}
      </div>

      <span
        className={cn(
          "font-semibold",
          sizes.title,
          unlocked ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {title}
      </span>

      {description && (
        <span className={cn("text-muted-foreground", sizes.desc)}>
          {description}
        </span>
      )}
    </button>
  );
}

export { AmautaAchievement };
export type { AmautaAchievementProps, AmautaAchievementSize };
