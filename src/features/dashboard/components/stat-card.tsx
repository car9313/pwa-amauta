import { useEffect, useState } from "react"
import { Trophy, Star, Target } from "lucide-react"
import { cn } from "@/lib/utils"

interface StatCardProps {
  type: "points" | "level" | "accuracy"
  value: string | number
  label: string
  delay?: number
}

const config = {
  points: {
    icon: Trophy,
    bg: "bg-accent/10 text-accent",
    text: "text-accent",
    glow: "group-hover:shadow-[0_0_20px_rgba(242,153,74,0.3)]",
    hoverBg: "bg-accent/5",
  },
  level: {
    icon: Star,
    bg: "bg-primary/10 text-primary",
    text: "text-primary",
    glow: "group-hover:shadow-[0_0_20px_rgba(31,79,163,0.3)]",
    hoverBg: "bg-primary/5",
  },
  accuracy: {
    icon: Target,
    bg: "bg-emerald-50 text-emerald-600",
    text: "text-emerald-600",
    glow: "group-hover:shadow-[0_0_20px_rgba(34,197,94,0.3)]",
    hoverBg: "bg-emerald-50/50",
  },
} as const

export function StatCard({ type, value, label, delay = 0 }: StatCardProps) {
  const [isVisible, setIsVisible] = useState(false)
  const cfg = config[type]
  const Icon = cfg.icon

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay * 150)
    return () => clearTimeout(timer)
  }, [delay])

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl bg-white p-4 shadow-sm border border-slate-100",
        "transition-all duration-500 ease-out",
        "hover-lift hover-glow",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
        cfg.glow
      )}
    >
      <div className={cn(
        "absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100",
        cfg.hoverBg
      )} />

      <div className="relative z-10 flex flex-col items-center">
        <div className={cn(
          "mb-2 flex h-12 w-12 items-center justify-center rounded-xl",
          "transition-transform duration-300 group-hover:scale-110",
          cfg.bg
        )}>
          <Icon className="h-6 w-6" />
        </div>

        <span className={cn(
          "text-2xl font-bold tabular-nums tracking-tight",
          "transition-all duration-300 group-hover:scale-105",
          cfg.text
        )}>
          {value}
        </span>

        <span className="mt-1 text-sm font-medium text-muted-foreground">
          {label}
        </span>
      </div>
    </div>
  )
}
