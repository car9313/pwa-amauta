import * as React from "react"

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
  if (value >= 75) return "primary"
  return "accent"
}

function AmautaProgress({
  className,
  value,
  amautaVariant = "default",
  label,
  showValue = true,
  hideLabel = false,
  size = "md",
  animated = true,
  colorByValue = false,
  ...props
}: AmautaProgressProps) {
  const resolvedColor = colorByValue ? getColorByValue(value) : variantToColor[amautaVariant]

  if (hideLabel) {
    return (
      <ProgressBar
        value={value}
        size={size}
        animated={animated}
        color={resolvedColor}
        className={className}
        {...props}
      />
    )
  }

  const resolvedLabel = label ?? variantToLabel[amautaVariant]

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">
          {resolvedLabel}
        </span>
        {showValue && (
          <span className="text-sm text-muted-foreground">
            {Math.round(value)}%
          </span>
        )}
      </div>
      <ProgressBar
        value={value}
        size={size}
        animated={animated}
        color={resolvedColor}
        {...props}
      />
    </div>
  )
}

export { AmautaProgress }
export type { AmautaProgressProps, AmautaProgressVariant }
