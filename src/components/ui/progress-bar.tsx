import { cn } from "@/lib/utils"

interface ProgressBarProps {
  value: number
  className?: string
  size?: "sm" | "md" | "lg"
  animated?: boolean
  color?: "primary" | "accent" | "success"
}

const sizeStyles = {
  sm: "h-1.5",
  md: "h-3",
  lg: "h-4",
} as const

const colorStyles = {
  primary: "bg-primary",
  accent: "bg-accent",
  success: "bg-emerald-500",
} as const

function ProgressBar({
  value,
  className,
  size = "md",
  animated = true,
  color = "primary",
}: ProgressBarProps) {
  const clampedValue = Math.max(0, Math.min(100, value))

  return (
    <div
      role="progressbar"
      aria-valuenow={clampedValue}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`${clampedValue}%`}
      className={cn(
        "w-full overflow-hidden rounded-full bg-secondary",
        sizeStyles[size],
        className
      )}
    >
      <div
        className={cn(
          "h-full rounded-full transition-all duration-500 ease-out",
          colorStyles[color],
          animated && "animate-pulse"
        )}
        style={{ width: `${clampedValue}%` }}
      />
    </div>
  )
}

export { ProgressBar }
export type { ProgressBarProps }
