import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const amautaBadgeVariants = cva(
  "inline-flex items-center gap-1.5 font-semibold whitespace-nowrap",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--amauta-blue-light)] text-[var(--amauta-blue)]",
        success:
          "bg-success/15 text-success",
        warning:
          "bg-warning/15 text-warning",
        xp:
          "bg-[var(--amauta-orange-light)] text-[var(--amauta-orange-dark)]",
        streak:
          "bg-gradient-to-r from-[var(--amauta-orange-light)] to-[var(--amauta-orange)] text-white",
        achievement:
          "bg-gradient-to-br from-[var(--amauta-blue)] to-[var(--amauta-blue-dark)] text-white shadow-sm",
      },
      size: {
        sm: "px-2 py-0.5 text-xs rounded-md",
        md: "px-3 py-1 text-sm rounded-lg",
        lg: "px-4 py-1.5 text-base rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
)

interface AmautaBadgeProps
  extends React.ComponentProps<"span">,
    VariantProps<typeof amautaBadgeVariants> {}

function AmautaBadge({
  className,
  variant,
  size,
  ...props
}: AmautaBadgeProps) {
  return (
    <span
      className={cn(amautaBadgeVariants({ variant, size }), className)}
      {...props}
    />
  )
}

export { AmautaBadge }
export type { AmautaBadgeProps }
