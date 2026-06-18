import * as React from "react"

import { cn } from "@/lib/utils"
import { AmautaSection } from "./amauta-section"
import { AmautaContainer } from "./amauta-container"

interface EducationalSectionProps {
  title: string
  description: string
  icon?: React.ReactNode
  image?: string
  imageAlt?: string
  reversed?: boolean
  variant?: "default" | "alt" | "primary" | "accent"
  action?: React.ReactNode
  className?: string
  id?: string
}

function EducationalSection({
  title,
  description,
  icon,
  image,
  imageAlt = "",
  reversed = false,
  variant = "default",
  action,
  className,
  id,
}: EducationalSectionProps) {
  return (
    <AmautaSection variant={variant} id={id} className={className}>
      <AmautaContainer>
        <div
          className={cn(
            "flex flex-col items-center gap-8 lg:flex-row lg:gap-12",
            reversed && "lg:flex-row-reverse"
          )}
        >
          <div className="flex-1 space-y-4 text-center lg:text-left">
            {icon && (
              <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--amauta-blue-light)] text-[var(--amauta-blue)] lg:mx-0">
                {icon}
              </div>
            )}

            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {title}
            </h2>

            <p className="text-base leading-relaxed text-muted-foreground">
              {description}
            </p>

            {action && <div className="pt-2">{action}</div>}
          </div>

          {image && (
            <div className="flex-1">
              <img
                src={image}
                alt={imageAlt}
                className="w-full rounded-2xl shadow-lg object-cover"
              />
            </div>
          )}
        </div>
      </AmautaContainer>
    </AmautaSection>
  )
}

export { EducationalSection }
export type { EducationalSectionProps }
