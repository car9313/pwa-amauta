import * as React from "react"

import { cn } from "@/lib/utils"

type AmautaGridCols = 1 | 2 | 3 | 4
type AmautaGridGap = "sm" | "md" | "lg"

interface AmautaGridProps {
  children: React.ReactNode
  className?: string
  cols?: AmautaGridCols
  gap?: AmautaGridGap
}

const colsMap: Record<AmautaGridCols, string> = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
}

const gapMap: Record<AmautaGridGap, string> = {
  sm: "gap-4",
  md: "gap-6",
  lg: "gap-8",
}

function AmautaGrid({
  children,
  className,
  cols = 1,
  gap = "md",
}: AmautaGridProps) {
  return (
    <div
      className={cn(
        "grid",
        colsMap[cols],
        gapMap[gap],
        className
      )}
    >
      {children}
    </div>
  )
}

export { AmautaGrid }
export type { AmautaGridProps, AmautaGridCols, AmautaGridGap }
