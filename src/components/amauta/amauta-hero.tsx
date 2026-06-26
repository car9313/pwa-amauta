import * as React from "react"

import { cn } from "@/lib/utils"

interface AmautaHeroProps {
  children: React.ReactNode
  className?: string
  size?: "default" | "compact" | "large"
}

const sizeStyles = {
  default: "min-h-[60vh] py-20 sm:py-24",
  compact: "min-h-[40vh] py-12 sm:py-16",
  large: "min-h-[80vh] py-24 sm:py-32",
}

function AmautaHero({
  children,
  className,
  size = "default",
}: AmautaHeroProps) {
  return (
    <section
      className={cn(
        "relative flex items-center justify-center overflow-hidden",
        "bg-gradient-to-br from-[var(--amauta-blue)] via-[var(--amauta-blue)]/90 to-[var(--amauta-orange)]",
        "text-white",
        sizeStyles[size],
        className
      )}
    >
      <div className="noise-overlay pointer-events-none absolute inset-0 z-0" />

      <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl animate-pulse-ring" />
      <div className="absolute -bottom-8 -left-8 h-48 w-48 rounded-full bg-[var(--amauta-orange)]/20 blur-3xl animate-float-gentle" />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        {children}
      </div>
    </section>
  )
}

function AmautaHeroContent({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "mx-auto max-w-3xl text-center",
        className
      )}
      {...props}
    />
  )
}

function AmautaHeroActions({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "mt-8 flex flex-col sm:flex-row items-center justify-center gap-4",
        className
      )}
      {...props}
    />
  )
}

export { AmautaHero, AmautaHeroContent, AmautaHeroActions }
export type { AmautaHeroProps }
