import * as React from "react"

import { cn } from "@/lib/utils"
import { AmautaContainer } from "./amauta-container"
import { AmautaButton } from "./amauta-button"

interface CTAEducationalProps {
  headline: string
  description?: string
  buttonLabel: string
  buttonOnClick: () => void
  variant?: "primary" | "accent" | "dark"
  className?: string
}

const variantStyles = {
  primary:
    "bg-gradient-to-br from-[var(--amauta-blue)] via-[var(--amauta-blue)]/90 to-[var(--amauta-orange)] text-white",
  accent:
    "bg-gradient-to-br from-[var(--amauta-orange)] to-[var(--amauta-orange-dark)] text-white",
  dark:
    "bg-gradient-to-br from-[var(--amauta-blue-dark)] to-[var(--amauta-blue)] text-white",
}

function CTAEducational({
  headline,
  description,
  buttonLabel,
  buttonOnClick,
  variant = "primary",
  className,
}: CTAEducationalProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden py-16 sm:py-20",
        variantStyles[variant],
        className
      )}
    >
      <div className="noise-overlay pointer-events-none absolute inset-0 z-0" />
      <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl animate-pulse-ring" />
      <div className="absolute -bottom-8 -left-8 h-48 w-48 rounded-full bg-white/10 blur-3xl animate-float-gentle" />

      <AmautaContainer className="relative z-10 text-center">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
          {headline}
        </h2>

        {description && (
          <p className="mx-auto mt-4 max-w-2xl text-base sm:text-lg text-white/80">
            {description}
          </p>
        )}

        <div className="mt-8">
          <AmautaButton
            size="child-lg"
            className={cn(
              "hover:scale-105 active:scale-95 transition-all duration-200",
              variant === "primary"
                ? "bg-white text-[var(--amauta-blue)] hover:bg-white/90"
                : "bg-white/20 text-white border-2 border-white/40 hover:bg-white/30"
            )}
            onClick={buttonOnClick}
          >
            {buttonLabel}
          </AmautaButton>
        </div>
      </AmautaContainer>
    </section>
  )
}

export { CTAEducational }
export type { CTAEducationalProps }
