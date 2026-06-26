import * as React from "react"
import { cn } from "@/lib/utils"

import { AmautaSection } from "./amauta-section"
import { AmautaContainer } from "./amauta-container"

interface HowItWorksStep {
  number: number
  title: string
  description: string
  icon?: React.ReactNode
}

interface HowItWorksProps {
  title: string
  subtitle?: string
  steps: HowItWorksStep[]
  variant?: "default" | "alt"
  className?: string
  id?: string
}

function HowItWorks({
  title,
  subtitle,
  steps,
  variant = "default",
  className,
  id,
}: HowItWorksProps) {
  return (
    <AmautaSection variant={variant} id={id} className={className}>
      <AmautaContainer>
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-3 text-base text-muted-foreground">
              {subtitle}
            </p>
          )}
        </div>

        <div className="relative mx-auto max-w-4xl">
          {steps.map((step, index) => {
            const isLast = index === steps.length - 1

            return (
              <div key={step.number} className="relative flex gap-6 pb-12 last:pb-0">
                {!isLast && (
                  <div className="absolute left-6 top-14 h-full w-0.5 bg-[var(--amauta-blue-light)]" />
                )}

                <div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--amauta-blue)] text-lg font-bold text-white shadow-lg">
                  {step.icon ? (
                    <span className="h-6 w-6">{step.icon}</span>
                  ) : (
                    step.number
                  )}
                </div>

                <div
                  className={cn(
                    "flex-1 rounded-2xl border bg-card p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5",
                    index % 2 === 0
                      ? "border-[var(--amauta-blue-light)]"
                      : "border-[var(--amauta-orange-light)]"
                  )}
                >
                  <h3 className="text-lg font-bold text-foreground">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </AmautaContainer>
    </AmautaSection>
  )
}

export { HowItWorks }
export type { HowItWorksProps, HowItWorksStep }
