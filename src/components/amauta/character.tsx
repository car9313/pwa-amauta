import { useState } from "react"
import { motion, useReducedMotion, type TargetAndTransition } from "motion/react"

import { cn } from "@/lib/utils"

type CharacterSize = "sm" | "md" | "lg" | "xl" | "2xl"

type CharacterExpression =
  | "idle"
  | "thinking"
  | "happy"
  | "encouraging"
  | "superstar"
  | "sad"

interface CharacterProps {
  size?: CharacterSize
  expression?: CharacterExpression
  className?: string
}

const sizeMap: Record<CharacterSize, string> = {
  sm: "w-12 h-12",
  md: "w-16 h-16",
  lg: "w-24 h-24",
  xl: "w-32 h-32",
  "2xl": "w-44 h-44 sm:w-52 sm:h-52",
}

const FALLBACK_SRC = "/img/amauta-mascot.jpg"

const EXPRESSION_SRC: Record<CharacterExpression, string> = {
  idle: "/img/mascota/idle.webp",
  thinking: "/img/mascota/thinking.webp",
  happy: "/img/mascota/happy.webp",
  encouraging: "/img/mascota/encouraging.webp",
  superstar: "/img/mascota/superstar.webp",
  sad: "/img/mascota/sad.webp",
}

const EXPRESSION_ANIMATION: Record<CharacterExpression, TargetAndTransition> = {
  idle: {
    y: [0, -4, 0],
    transition: { duration: 2.6, repeat: Infinity, ease: "easeInOut" },
  },
  thinking: {
    rotate: [-2, 2, -2],
    y: [0, -3, 0],
    transition: { duration: 2, repeat: Infinity, ease: "easeInOut" },
  },
  happy: {
    scale: [1, 1.06, 1],
    rotate: [-4, 4, -2, 0],
    transition: { duration: 0.7, repeat: Infinity, repeatDelay: 0.35 },
  },
  encouraging: {
    y: [0, 3, 0],
    transition: { duration: 1.6, repeat: Infinity, ease: "easeInOut" },
  },
  superstar: {
    scale: [1, 1.12, 1.04, 1.12, 1],
    rotate: [-8, 8, -6, 6, 0],
    transition: { duration: 0.9, repeat: Infinity, repeatDelay: 0.2 },
  },
  sad: {
    y: [0, 2, 0],
    scale: [1, 0.98, 1],
    transition: { duration: 2.4, repeat: Infinity, ease: "easeInOut" },
  },
}

function Character({ size = "md", expression, className }: CharacterProps) {
  const reduceMotion = useReducedMotion()
  const desiredSrc = expression ? EXPRESSION_SRC[expression] : FALLBACK_SRC
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const src = failedSrc === desiredSrc ? FALLBACK_SRC : desiredSrc

  return (
    <motion.div
      animate={!reduceMotion && expression ? EXPRESSION_ANIMATION[expression] : undefined}
      className={cn(
        "relative overflow-hidden rounded-full border-2 border-white/40 bg-white shadow-xl",
        sizeMap[size],
        className
      )}
    >
      <img
        src={src}
        alt="Amauta"
        onError={() => setFailedSrc(desiredSrc)}
        className="h-full w-full object-contain"
      />
    </motion.div>
  )
}

export { Character }
export type { CharacterProps, CharacterSize, CharacterExpression }
