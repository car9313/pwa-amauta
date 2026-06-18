import * as React from "react"
import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

type AmautaStatColor = "primary" | "accent" | "success" | "warning" | "info"

interface AmautaStatCardProps {
  icon?: LucideIcon
  value: string | number
  label: string
  color?: AmautaStatColor
  className?: string
  trend?: "up" | "down" | "neutral"
  trendValue?: string
}

const colorConfig: Record<AmautaStatColor, { bg: string; text: string; glow: string; orb: string }> = {
  primary: {
    bg: "bg-[var(--amauta-blue-light)] text-[var(--amauta-blue)]",
    text: "text-[var(--amauta-blue)]",
    glow: "shadow-glow-blue",
    orb: "bg-[var(--amauta-blue)]/10",
  },
  accent: {
    bg: "bg-[var(--amauta-orange-light)] text-[var(--amauta-orange-dark)]",
    text: "text-[var(--amauta-orange-dark)]",
    glow: "shadow-glow-orange",
    orb: "bg-[var(--amauta-orange)]/10",
  },
  success: {
    bg: "bg-success/15 text-success",
    text: "text-success",
    glow: "shadow-[0_0_25px_rgba(34,197,94,0.35)]",
    orb: "bg-success/15",
  },
  warning: {
    bg: "bg-warning/15 text-warning",
    text: "text-warning",
    glow: "shadow-[0_0_25px_rgba(245,158,11,0.35)]",
    orb: "bg-warning/15",
  },
  info: {
    bg: "bg-[var(--amauta-blue-light)] text-[var(--amauta-blue)]",
    text: "text-[var(--amauta-blue)]",
    glow: "shadow-glow-blue",
    orb: "bg-[var(--amauta-blue)]/10",
  },
}

function AmautaStatCard({
  icon: Icon,
  value,
  label,
  color = "primary",
  className,
  trend,
  trendValue,
}: AmautaStatCardProps) {
  const cfg = colorConfig[color]

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl bg-card p-4 shadow-sm border border-border",
        "hover-lift hover-glow transition-all duration-300",
        className
      )}
    >
      <div
        className={cn(
          "absolute -top-4 -right-4 h-20 w-20 rounded-full blur-2xl opacity-0 transition-all duration-700 group-hover:opacity-100 group-hover:scale-150 pointer-events-none",
          cfg.orb
        )}
      />
      <div
        className={cn(
          "absolute -bottom-4 -left-4 h-16 w-16 rounded-full blur-2xl opacity-0 transition-all duration-700 delay-100 group-hover:opacity-100 group-hover:scale-150 pointer-events-none",
          cfg.orb
        )}
      />

      <div className="relative z-10 flex flex-col items-center">
        {Icon && (
          <div
            className={cn(
              "mb-2 flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-500 group-hover:scale-125 group-hover:rotate-12",
              cfg.bg
            )}
          >
            <Icon className="h-6 w-6" />
          </div>
        )}

        <span
          className={cn(
            "text-2xl font-bold tabular-nums tracking-tight transition-all duration-500 group-hover:scale-110",
            cfg.text
          )}
        >
          {value}
        </span>

        <span className="mt-1 text-sm font-medium text-muted-foreground">
          {label}
        </span>

        {trend && trendValue && (
          <span
            className={cn(
              "mt-1 text-xs font-semibold",
              trend === "up" && "text-success",
              trend === "down" && "text-destructive",
              trend === "neutral" && "text-muted-foreground"
            )}
          >
            {trend === "up" && "↑ "}
            {trend === "down" && "↓ "}
            {trendValue}
          </span>
        )}
      </div>
    </div>
  )
}

export { AmautaStatCard, colorConfig }
export type { AmautaStatCardProps, AmautaStatColor }
