import * as React from "react"

import { cn } from "@/lib/utils"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  CardAction,
} from "@/components/ui/card"

type AmautaCardVariant = "default" | "glass" | "elevated" | "bordered" | "interactive"

interface AmautaCardProps extends React.ComponentProps<typeof Card> {
  amautaVariant?: AmautaCardVariant
}

function AmautaCard({
  className,
  variant: _variant,
  amautaVariant = "default",
  ...props
}: AmautaCardProps) {
  const resolvedVariant = amautaVariant === "default" || amautaVariant === "glass"
    ? amautaVariant
    : "default"

  return (
    <Card
      variant={resolvedVariant as "default" | "glass"}
      className={cn(
        amautaVariant === "elevated" &&
          "bg-card text-card-foreground border-0 shadow-lg hover:shadow-xl transition-shadow",
        amautaVariant === "bordered" &&
          "bg-card text-card-foreground border-2 border-[var(--amauta-blue-light)]",
        amautaVariant === "interactive" &&
          "bg-card text-card-foreground border shadow-sm hover:shadow-md hover:border-[var(--amauta-blue-light)] hover:-translate-y-1 transition-all duration-200 cursor-pointer",
        className
      )}
      {...props}
    />
  )
}

export {
  AmautaCard,
  CardHeader as AmautaCardHeader,
  CardTitle as AmautaCardTitle,
  CardDescription as AmautaCardDescription,
  CardContent as AmautaCardContent,
  CardFooter as AmautaCardFooter,
  CardAction as AmautaCardAction,
}
export type { AmautaCardProps, AmautaCardVariant }
