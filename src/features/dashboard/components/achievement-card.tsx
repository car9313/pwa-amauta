import { Trophy, Star, Target } from "lucide-react"
import { cn } from "@/lib/utils"

interface AchievementCardProps {
  type: "streak" | "level" | "accuracy"
  title: string
  description: string
}

const config = {
  streak: {
    icon: Trophy,
    color: "text-accent",
    bg: "bg-accent/20",
  },
  level: {
    icon: Star,
    color: "text-accent",
    bg: "bg-accent/20",
  },
  accuracy: {
    icon: Target,
    color: "text-red-500",
    bg: "bg-red-100",
  },
} as const

export function AchievementCard({
  type,
  title,
  description,
}: AchievementCardProps) {
  const cfg = config[type]
  const Icon = cfg.icon

  return (
    <div className="group flex flex-col items-center p-4 bg-card rounded-2xl shadow-sm border border-border min-w-[120px] hover:scale-[1.02] transition-transform duration-200">
      <div className={cn("p-3 rounded-full mb-2 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300", cfg.bg)}>
        <Icon className={cn("h-8 w-8 transition-transform duration-300 group-hover:scale-110", cfg.color)} />
      </div>
      <span className="text-sm font-semibold text-foreground text-center">
        {title}
      </span>
      <span className="text-xs text-muted-foreground text-center">
        {description}
      </span>
    </div>
  )
}
