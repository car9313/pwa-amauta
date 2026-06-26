import * as React from "react"
import type { LucideIcon } from "lucide-react"

import { AmautaGrid } from "./amauta-grid"
import { AmautaCard, AmautaCardContent, AmautaCardTitle, AmautaCardDescription } from "./amauta-card"
import { AmautaContainer } from "./amauta-container"
import { AmautaSection } from "./amauta-section"

interface FeatureItem {
  icon: LucideIcon
  title: string
  description: string
}

interface FeatureGridProps {
  title?: string
  subtitle?: string
  features: FeatureItem[]
  cols?: 2 | 3 | 4
  variant?: "default" | "alt"
  className?: string
  id?: string
}

function FeatureGrid({
  title,
  subtitle,
  features,
  cols = 3,
  variant = "default",
  className,
  id,
}: FeatureGridProps) {
  return (
    <AmautaSection variant={variant} id={id} className={className}>
      <AmautaContainer>
        {(title || subtitle) && (
          <div className="mx-auto mb-12 max-w-2xl text-center">
            {title && (
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="mt-3 text-base text-muted-foreground">
                {subtitle}
              </p>
            )}
          </div>
        )}

        <AmautaGrid cols={cols} gap="lg">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <AmautaCard
                key={index}
                amautaVariant="interactive"
                className="text-center"
              >
                <AmautaCardContent className="flex flex-col items-center gap-3 pt-6">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--amauta-blue-light)] text-[var(--amauta-blue)]">
                    <Icon className="h-7 w-7" />
                  </div>
                  <AmautaCardTitle>{feature.title}</AmautaCardTitle>
                  <AmautaCardDescription>
                    {feature.description}
                  </AmautaCardDescription>
                </AmautaCardContent>
              </AmautaCard>
            )
          })}
        </AmautaGrid>
      </AmautaContainer>
    </AmautaSection>
  )
}

export { FeatureGrid }
export type { FeatureGridProps, FeatureItem }
