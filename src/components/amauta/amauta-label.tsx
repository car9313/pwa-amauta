import * as React from "react"

import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

type AmautaLabelProps = React.ComponentProps<typeof Label>

function AmautaLabel({ className, ...props }: AmautaLabelProps) {
  return (
    <Label
      className={cn(
        "text-sm font-semibold text-[var(--amauta-blue-dark)]",
        className
      )}
      {...props}
    />
  )
}

export { AmautaLabel }
export type { AmautaLabelProps }
