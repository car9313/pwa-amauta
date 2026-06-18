import * as React from "react"

import { cn } from "@/lib/utils"

type AmautaSectionVariant = "default" | "alt" | "primary" | "accent" | "hero"

interface AmautaSectionProps {
  children: React.ReactNode
  className?: string
  variant?: AmautaSectionVariant
  as?: "section" | "div" | "article"
  id?: string
}

const variantStyles: Record<AmautaSectionVariant, string> = {
  default:
    "bg-background text-foreground",
  alt:
    "bg-[var(--amauta-surface-alt)] text-foreground",
  primary:
    "bg-gradient-to-br from-[var(--amauta-blue)] via-[var(--amauta-blue)]/95 to-[var(--amauta-blue-dark)] text-white",
  accent:
    "bg-gradient-to-br from-[var(--amauta-orange-light)] to-[var(--amauta-warm-white)] text-foreground",
  hero:
    "bg-gradient-to-br from-[var(--amauta-blue)] via-[var(--amauta-blue)]/80 to-[var(--amauta-orange)] text-white relative overflow-hidden",
}

function AmautaSection({
  children,
  className,
  variant = "default",
  as: Tag = "section",
  id,
}: AmautaSectionProps) {
  return (
    <Tag
      id={id}
      className={cn(
        "py-16 sm:py-20",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </Tag>
  )
}

export { AmautaSection }
export type { AmautaSectionProps, AmautaSectionVariant }
