import { cn } from "@/lib/utils"
import { ProgressBar } from "@/components/ui/progress-bar"

interface ProgressCardProps {
  title: string
  progress: number
  color?: "blue" | "green" | "orange"
}

const colorMap = {
  blue: "primary" as const,
  green: "success" as const,
  orange: "accent" as const,
} as const

const textColorMap = {
  blue: "text-primary",
  green: "text-emerald-600",
  orange: "text-accent",
} as const

export function ProgressCard({
  title,
  progress,
  color = "blue",
}: ProgressCardProps) {
  return (
    <div className="space-y-2 hover:scale-[1.01] transition-transform duration-200 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">{title}</span>
        <span className={cn("text-sm font-bold tabular-nums animate-bounce-gentle", textColorMap[color])}>
          {progress}%
        </span>
      </div>
      <ProgressBar
        value={progress}
        size="sm"
        color={colorMap[color]}
        animated={true}
      />
    </div>
  )
}
