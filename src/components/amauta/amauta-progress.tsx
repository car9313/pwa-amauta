import * as React from "react"

import { cn } from "@/lib/utils"
import { ProgressBar, type ProgressBarProps } from "@/components/ui/progress-bar"

type AmautaProgressVariant = "lesson" | "xp" | "level" | "default"

interface AmautaProgressProps extends Omit<ProgressBarProps, "color"> {
  amautaVariant?: AmautaProgressVariant
  label?: string
  showValue?: boolean
  hideLabel?: boolean
}

const variantToColor: Record<AmautaProgressVariant, ProgressBarProps["color"]> = {
  lesson: "primary",
  xp: "accent",
  level: "success",
  default: "primary",
}

const variantToLabel: Record<AmautaProgressVariant, string> = {
  lesson: "Progreso de lección",
  xp: "Puntos de experiencia",
  level: "Nivel",
  default: "Progreso",
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
  ...props
}: AmautaProgressProps) {
  if (hideLabel) {
    return (
      <ProgressBar
        value={value}
        size={size}
        animated={animated}
        color={variantToColor[amautaVariant]}
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
        color={variantToColor[amautaVariant]}
        {...props}
      />
    </div>
  )
}

export { AmautaProgress, variantToColor, variantToLabel }
export type { AmautaProgressProps, AmautaProgressVariant }
