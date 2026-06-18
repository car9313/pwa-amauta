import * as React from "react"

import { AmautaHero, AmautaHeroContent, AmautaHeroActions } from "./amauta-hero"
import { CondorGuide } from "./condor-guide"
import { AmautaButton } from "./amauta-button"

interface HeroWithCondorProps {
  headline: string
  subtitle: string
  condorMessage?: string
  primaryCta?: {
    label: string
    onClick: () => void
  }
  secondaryCta?: {
    label: string
    onClick: () => void
  }
  className?: string
}

function HeroWithCondor({
  headline,
  subtitle,
  condorMessage,
  primaryCta,
  secondaryCta,
  className,
}: HeroWithCondorProps) {
  return (
    <AmautaHero className={className}>
      <AmautaHeroContent>
        <div className="mb-8 flex justify-center">
          <CondorGuide
            message={condorMessage}
            size="lg"
          />
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
          {headline}
        </h1>

        <p className="mt-4 text-base sm:text-lg text-white/80 max-w-2xl mx-auto">
          {subtitle}
        </p>

        {(primaryCta || secondaryCta) && (
          <AmautaHeroActions>
            {primaryCta && (
              <AmautaButton
                size="child-lg"
                className="bg-white text-[var(--amauta-blue)] hover:bg-white/90 hover:scale-105 active:scale-95"
                onClick={primaryCta.onClick}
              >
                {primaryCta.label}
              </AmautaButton>
            )}
            {secondaryCta && (
              <AmautaButton
                variant="ghost"
                size="child-md"
                className="text-white border-2 border-white/40 hover:bg-white/10 hover:scale-105 active:scale-95"
                onClick={secondaryCta.onClick}
              >
                {secondaryCta.label}
              </AmautaButton>
            )}
          </AmautaHeroActions>
        )}
      </AmautaHeroContent>
    </AmautaHero>
  )
}

export { HeroWithCondor }
export type { HeroWithCondorProps }
