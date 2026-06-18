import * as React from "react"

import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"

type AmautaScrollAreaProps = React.ComponentProps<typeof ScrollArea>

function AmautaScrollArea({
  className,
  children,
  ...props
}: AmautaScrollAreaProps) {
  return (
    <ScrollArea
      className={cn(
        "rounded-xl border border-[var(--amauta-blue-light)]/30 bg-white",
        className
      )}
      {...props}
    >
      {children}
    </ScrollArea>
  )
}

export { AmautaScrollArea }
export type { AmautaScrollAreaProps }
