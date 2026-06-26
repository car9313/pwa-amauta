import * as React from "react"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

type AmautaInputProps = React.ComponentProps<typeof Input>

function AmautaInput({ className, ...props }: AmautaInputProps) {
  return (
    <Input
      className={cn(
        "rounded-xl border-[var(--amauta-blue-light)] bg-white shadow-sm",
        "focus-visible:border-[var(--amauta-blue)] focus-visible:ring-[var(--amauta-blue)]/20",
        className
      )}
      {...props}
    />
  )
}

export { AmautaInput }
export type { AmautaInputProps }
