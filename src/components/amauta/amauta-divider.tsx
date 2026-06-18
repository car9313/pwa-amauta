import * as React from "react"

import { cn } from "@/lib/utils"

interface AmautaDividerProps {
  className?: string
  label?: string
  icon?: React.ReactNode
}

function AmautaDivider({ className, label, icon }: AmautaDividerProps) {
  if (!label && !icon) {
    return (
      <hr
        className={cn(
          "border-t border-[var(--amauta-blue-light)]",
          className
        )}
      />
    )
  }

  return (
    <div
      className={cn(
        "flex items-center gap-3",
        className
      )}
    >
      <hr className="flex-1 border-t border-[var(--amauta-blue-light)]" />
      <span className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground whitespace-nowrap">
        {icon && <span className="size-4">{icon}</span>}
        {label}
      </span>
      <hr className="flex-1 border-t border-[var(--amauta-blue-light)]" />
    </div>
  )
}

export { AmautaDivider }
export type { AmautaDividerProps }
