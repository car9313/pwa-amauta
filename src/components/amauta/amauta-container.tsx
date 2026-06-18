import * as React from "react"

import { cn } from "@/lib/utils"
import { Container } from "@/components/ui/container"

type AmautaContainerSize = "sm" | "md" | "lg" | "full"
type AmautaContainerElement = "div" | "section" | "article" | "main" | "header" | "footer"

interface AmautaContainerProps {
  children: React.ReactNode
  className?: string
  size?: AmautaContainerSize
  as?: AmautaContainerElement
}

const sizeMap: Record<AmautaContainerSize, string> = {
  sm: "max-w-4xl",
  md: "max-w-5xl",
  lg: "max-w-7xl",
  full: "max-w-none",
}

function AmautaContainer({
  children,
  className,
  size = "lg",
  as,
}: AmautaContainerProps) {
  return (
    <Container
      as={as}
      className={cn(sizeMap[size], className)}
    >
      {children}
    </Container>
  )
}

export { AmautaContainer }
export type { AmautaContainerProps, AmautaContainerSize }
