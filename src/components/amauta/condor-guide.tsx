import * as React from "react"

import { cn } from "@/lib/utils"

interface CondorGuideProps {
  message?: string
  className?: string
  position?: "left" | "right" | "center"
  size?: "sm" | "md" | "lg" | "xl"
}

const sizeMap = {
  sm: "w-12 h-12",
  md: "w-16 h-16",
  lg: "w-20 h-20 sm:w-24 sm:h-24",
  xl: "w-32 h-32",
}

function CondorGuide({
  message,
  className,
  position = "center",
  size = "md",
}: CondorGuideProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3",
        position === "left" && "items-start",
        position === "right" && "items-end",
        className
      )}
    >
      {message && (
        <div
          className={cn(
            "relative rounded-2xl bg-white px-4 py-2.5 text-sm font-medium text-foreground shadow-lg",
            "before:absolute before:left-1/2 before:-bottom-2 before:h-3 before:w-3 before:-translate-x-1/2 before:rotate-45 before:bg-white",
            position === "left" && "before:left-8 before:translate-x-0",
            position === "right" && "before:left-auto before:right-8 before:translate-x-0",
            "max-w-xs"
          )}
        >
          {message}
        </div>
      )}

      <div
        className={cn(
          "relative overflow-hidden rounded-full border-2 border-white/40 bg-white shadow-xl",
          sizeMap[size]
        )}
      >
        <img
          src="/img/amauta-mascot.jpg"
          alt="Amauta"
          className="h-full w-full object-cover"
        />
      </div>
    </div>
  )
}

export { CondorGuide }
export type { CondorGuideProps }
