import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface ProgressBarProps {
  value: number
  max?: number
  className?: string
  size?: "sm" | "md" | "lg"
  animated?: boolean
  color?: "primary" | "accent" | "success"
  gloss?: boolean
  showTipStar?: boolean
  interactive?: boolean
}

const sizeStyles = {
  sm: "h-5",
  md: "h-7",
  lg: "h-9",
} as const

const colorStyles = {
  primary: "bg-primary",
  accent: "bg-accent",
  success: "bg-success",
} as const

const glowStyles = {
  primary: "group-hover/progress:shadow-[0_0_14px_-2px_var(--color-primary)]",
  accent: "group-hover/progress:shadow-[0_0_14px_-2px_var(--color-accent)]",
  success: "group-hover/progress:shadow-[0_0_14px_-2px_var(--color-success)]",
} as const

function ProgressBar({
  value,
  max = 100,
  className,
  size = "md",
  animated = true,
  color = "primary",
  gloss = false,
  showTipStar = false,
  interactive = true,
}: ProgressBarProps) {
  const safeMax = Math.max(1, max)
  const clampedValue = Math.max(0, Math.min(safeMax, value))
  const percentage = Math.round((clampedValue / safeMax) * 100)

  return (
    <div
      role="progressbar"
      aria-valuenow={percentage}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`${percentage}%`}
      className={cn(
        "w-full rounded-full bg-secondary border-2 border-border/70 shadow-inner p-1 flex items-center relative",
        interactive && "group/progress",
        sizeStyles[size],
        className
      )}
    >
      <div
        className={cn(
          "h-full rounded-full transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] relative",
          colorStyles[color],
          interactive && glowStyles[color],
        )}
        style={{ width: `${percentage}%` }}
      >
        <div className="absolute inset-0 overflow-hidden rounded-full">
          {animated && (
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer-sweep" />
          )}
          {gloss && (
            <div className="absolute inset-x-0 top-0 h-1/2 bg-white/30 rounded-t-full pointer-events-none" />
          )}
        </div>
        {showTipStar && percentage > 6 && (
          <div className="absolute right-0.5 top-1/2 -translate-y-1/2 flex h-4 w-4 items-center justify-center rounded-full bg-background shadow-md animate-bounce">
            <Star className="h-2.5 w-2.5 fill-warning text-warning" />
          </div>
        )}
      </div>
    </div>
  )
}

export { ProgressBar }
export type { ProgressBarProps }
