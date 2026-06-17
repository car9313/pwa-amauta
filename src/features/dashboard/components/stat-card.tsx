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
    glow: "group-hover:shadow-glow-orange",
    hoverBg: "bg-accent/5",
    orbColor: "bg-accent/15",
  },
  level: {
    icon: Star,
    bg: "bg-primary/10 text-primary",
    text: "text-primary",
    glow: "group-hover:shadow-glow-blue",
    hoverBg: "bg-primary/5",
    orbColor: "bg-primary/15",
  },
  accuracy: {
    icon: Target,
    bg: "bg-success/10 text-success",
    text: "text-success",
    glow: "group-hover:shadow-[0_0_25px_rgba(34,197,94,0.35)]",
    hoverBg: "bg-success/5",
    orbColor: "bg-success/15",
  },
} as const

export function StatCard({ type, value, label, delay = 0 }: StatCardProps) {
  const cfg = config[type]
  const Icon = cfg.icon
  const delayClass = delay === 0 ? "stagger-1" : delay === 1 ? "stagger-2" : "stagger-3"

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl bg-white p-4 shadow-sm border border-muted",
        "hover-lift hover-glow",
        cfg.glow,
        "animate-scale-in",
        delayClass
      )}
    >
      {/* Floating orbs decorativos */}
      <div className={cn(
        "absolute -top-4 -right-4 h-20 w-20 rounded-full blur-2xl opacity-0 transition-all duration-700 group-hover:opacity-100 group-hover:scale-150",
        cfg.orbColor
      )} />
      <div className={cn(
        "absolute -bottom-4 -left-4 h-16 w-16 rounded-full blur-2xl opacity-0 transition-all duration-700 delay-100 group-hover:opacity-100 group-hover:scale-150",
        cfg.orbColor
      )} />

      <div className="relative z-10 flex flex-col items-center">
        <div className={cn(
          "mb-2 flex h-12 w-12 items-center justify-center rounded-xl",
          "transition-all duration-500 ease-out group-hover:scale-125 group-hover:rotate-12",
          cfg.bg
        )}>
          <Icon className={cn(
            "h-6 w-6 animate-bounce-gentle",
            type === "points" ? "animation-delay-500" : type === "level" ? "animation-delay-1000" : "animation-delay-1500"
          )} />
        </div>

        <span className={cn(
          "text-2xl font-bold tabular-nums tracking-tight",
          "transition-all duration-500 ease-out group-hover:scale-110",
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
