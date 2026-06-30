import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const amautaButtonVariants = cva("", {
  variants: {
    amautaVariant: {
      default: "",
      accent:
        "bg-[var(--amauta-orange)] text-white hover:bg-[var(--amauta-orange-dark)] shadow-md hover:shadow-lg",
      "accent-ghost":
        "bg-[var(--amauta-orange-light)] text-[var(--amauta-orange-dark)] hover:bg-[var(--amauta-orange-light)]/80",
      success:
        "bg-success text-white hover:bg-success/90",
    },
  },
  defaultVariants: {
    amautaVariant: "default",
  },
})

type AmautaButtonVariant = NonNullable<VariantProps<typeof amautaButtonVariants>["amautaVariant"]>

interface AmautaButtonProps
  extends React.ComponentProps<typeof Button> {
  amautaVariant?: AmautaButtonVariant
}

function AmautaButton({
  className,
  variant,
  size = "child-md",
  amautaVariant = "default",
  ...props
}: AmautaButtonProps) {
  const shadcnVariant = amautaVariant === "default" ? (variant ?? "default") : "default"

  return (
    <Button
      variant={shadcnVariant}
      size={size}
      className={cn(
        "rounded-xl transition-all duration-200 hover-lift",
        amautaButtonVariants({ amautaVariant }),
        className
      )}
      {...props}
    />
  )
}

export { AmautaButton }
export type { AmautaButtonProps, AmautaButtonVariant }
