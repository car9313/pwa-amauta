import * as React from "react"

import { cn } from "@/lib/utils"
import { CondorGuide } from "./condor-guide"

interface AmautaEmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  condorMessage?: string
  className?: string
  size?: "sm" | "md" | "lg"
}

const sizeStyles = {
  sm: "py-8",
  md: "py-16",
  lg: "py-24",
}

function AmautaEmptyState({
  icon,
  title,
  description,
  action,
  condorMessage,
  className,
  size = "md",
}: AmautaEmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center px-4",
        sizeStyles[size],
        className
      )}
    >
      {condorMessage && (
        <div className="mb-6 animate-fade-in-up">
          <CondorGuide
            message={condorMessage}
            size="md"
          />
        </div>
      )}

      {!condorMessage && icon && (
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--amauta-blue-light)] text-[var(--amauta-blue)]">
          {icon}
        </div>
      )}

      <h3 className="text-lg font-bold text-foreground">
        {title}
      </h3>

      {description && (
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          {description}
        </p>
      )}

      {action && (
        <div className="mt-6">
          {action}
        </div>
      )}
    </div>
  )
}

export { AmautaEmptyState }
export type { AmautaEmptyStateProps }
