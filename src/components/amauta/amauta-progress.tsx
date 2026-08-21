import * as React from "react"

import { Star } from "lucide-react"
import { cn } from "@/lib/utils"
import { ProgressBar, type ProgressBarProps } from "@/components/ui/progress-bar"

type AmautaProgressVariant = "lesson" | "xp" | "level" | "default" | "topic"

interface AmautaProgressProps extends Omit<ProgressBarProps, "color"> {
  amautaVariant?: AmautaProgressVariant
  label?: string
  showValue?: boolean
  hideLabel?: boolean
  colorByValue?: boolean
}

const variantToColor: Record<AmautaProgressVariant, ProgressBarProps["color"]> = {
  lesson: "primary",
  xp: "accent",
  level: "success",
  default: "primary",
  topic: "primary",
}

const variantToLabel: Record<AmautaProgressVariant, string> = {
  lesson: "Progreso de lección",
  xp: "Puntos de experiencia",
  level: "Nivel",
  default: "Progreso",
  topic: "Progreso",
}

function getColorByValue(value: number): ProgressBarProps["color"] {
  if (value === 100) return "success"
  if (value >= 50) return "primary"
  return "accent"
}

function AmautaProgress({
  className,
  value,
  max = 100,
  amautaVariant = "default",
  label,
  showValue = true,
  hideLabel = false,
  size = "md",
  animated = true,
  colorByValue = false,
  showTipStar = true,
  ...props
}: AmautaProgressProps) {
  const safeMax = Math.max(1, max)
  const percentage = Math.min(100, Math.max(0, Math.round((value / safeMax) * 100)))
  const resolvedColor = colorByValue ? getColorByValue(percentage) : variantToColor[amautaVariant]

  if (hideLabel) {
    return (
      <ProgressBar
        value={value}
        max={max}
        size={size}
        animated={animated}
        color={resolvedColor}
        showTipStar={showTipStar}
        className={className}
        {...props}
      />
    )
  }

  const resolvedLabel = label ?? variantToLabel[amautaVariant]

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
          <Star className="h-4 w-4 fill-warning text-warning" aria-hidden="true" />
          {resolvedLabel}
        </span>
        {showValue && (
          <span className="rounded-full border border-border bg-secondary px-2.5 py-0.5 text-xs font-bold text-primary">
            {percentage}%
          </span>
        )}
      </div>
      <ProgressBar
        value={value}
        max={max}
        size={size}
        animated={animated}
        color={resolvedColor}
        showTipStar={showTipStar}
        {...props}
      />
    </div>
  )
}

export { AmautaProgress }
export type { AmautaProgressProps, AmautaProgressVariant }
