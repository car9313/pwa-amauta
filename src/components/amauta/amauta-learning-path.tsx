import * as React from "react"

import { cn } from "@/lib/utils"

type LearningPathStepStatus = "completed" | "current" | "locked"

interface LearningPathStep {
  id: string
  label: string
  description?: string
  status: LearningPathStepStatus
}

interface AmautaLearningPathProps {
  steps: LearningPathStep[]
  className?: string
  direction?: "vertical" | "horizontal"
  onStepClick?: (step: LearningPathStep) => void
}

const statusStyles: Record<LearningPathStepStatus, { node: string; line: string; label: string }> = {
  completed: {
    node: "bg-[var(--amauta-orange)] border-[var(--amauta-orange)] text-white shadow-md shadow-[var(--amauta-orange)]/30",
    line: "bg-[var(--amauta-orange)]",
    label: "text-foreground",
  },
  current: {
    node: "bg-white border-2 border-[var(--amauta-blue)] text-[var(--amauta-blue)] shadow-lg shadow-[var(--amauta-blue)]/20 ring-4 ring-[var(--amauta-blue)]/20",
    line: "bg-[var(--amauta-blue-light)]",
    label: "text-[var(--amauta-blue)] font-bold",
  },
  locked: {
    node: "bg-muted border-2 border-muted-foreground/20 text-muted-foreground",
    line: "bg-muted",
    label: "text-muted-foreground",
  },
}

function AmautaLearningPath({
  steps,
  className,
  direction = "vertical",
  onStepClick,
}: AmautaLearningPathProps) {
  if (direction === "horizontal") {
    return (
      <div
        className={cn(
          "flex items-start gap-0 overflow-x-auto pb-4",
          className
        )}
      >
        {steps.map((step, index) => {
          const styles = statusStyles[step.status]
          const isLast = index === steps.length - 1

          return (
            <div key={step.id} className="flex flex-col items-center min-w-24">
              <div className="flex items-center">
                <button
                  type="button"
                  disabled={step.status === "locked"}
                  onClick={() => onStepClick?.(step)}
                  className={cn(
                    "relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-all duration-300",
                    styles.node,
                    step.status !== "locked" && "hover:scale-110 cursor-pointer",
                    step.status === "locked" && "cursor-not-allowed"
                  )}
                >
                  {step.status === "completed" ? (
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : step.status === "current" ? (
                    <span className="animate-pulse">{index + 1}</span>
                  ) : (
                    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>

                {!isLast && (
                  <div
                    className={cn(
                      "h-1 w-12 sm:w-16",
                      styles.line
                    )}
                  />
                )}
              </div>

              <span
                className={cn(
                  "mt-2 text-xs text-center px-1",
                  styles.label
                )}
              >
                {step.label}
              </span>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className={cn("relative flex flex-col gap-0", className)}>
      {steps.map((step, index) => {
        const styles = statusStyles[step.status]
        const isLast = index === steps.length - 1

        return (
          <div key={step.id} className="relative flex gap-4">
            <div className="flex flex-col items-center">
              <button
                type="button"
                disabled={step.status === "locked"}
                onClick={() => onStepClick?.(step)}
                className={cn(
                  "relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-all duration-300",
                  styles.node,
                  step.status !== "locked" && "hover:scale-110 cursor-pointer",
                  step.status === "locked" && "cursor-not-allowed"
                )}
              >
                {step.status === "completed" ? (
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : step.status === "current" ? (
                  <span className="animate-pulse">{index + 1}</span>
                ) : (
                  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>

              {!isLast && (
                <div
                  className={cn(
                    "mt-0 w-1 flex-1 min-h-8",
                    styles.line
                  )}
                />
              )}
            </div>

            <div className={cn("flex flex-col justify-center pb-8", isLast && "pb-0")}>
              <span className={cn("text-sm font-medium", styles.label)}>
                {step.label}
              </span>
              {step.description && (
                <span className="text-xs text-muted-foreground">
                  {step.description}
                </span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export { AmautaLearningPath }
export type { AmautaLearningPathProps, LearningPathStep, LearningPathStepStatus }
