import * as React from "react"

import { cn } from "@/lib/utils"

type CharacterSize = "sm" | "md" | "lg" | "xl"

interface CharacterProps {
  size?: CharacterSize
  className?: string
}

const sizeMap: Record<CharacterSize, string> = {
  sm: "w-12 h-12",
  md: "w-16 h-16",
  lg: "w-24 h-24",
  xl: "w-32 h-32",
}

function Character({ size = "md", className }: CharacterProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-full border-2 border-white/40 bg-white shadow-xl",
        sizeMap[size],
        className
      )}
    >
      <img
        src="/img/amauta-mascot.jpg"
        alt="Amauta"
        className="h-full w-full object-contain"
      />
    </div>
  )
}

export { Character }
export type { CharacterProps, CharacterSize }
