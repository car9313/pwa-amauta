import * as React from "react"

import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog"

type AmautaDialogContentProps = React.ComponentProps<typeof DialogContent>

function AmautaDialogContent({
  className,
  children,
  ...props
}: AmautaDialogContentProps) {
  return (
    <DialogContent
      className={cn(
        "rounded-2xl border-[var(--amauta-blue-light)] shadow-xl sm:max-w-lg",
        className
      )}
      {...props}
    >
      {children}
    </DialogContent>
  )
}

export {
  Dialog as AmautaDialog,
  DialogTrigger as AmautaDialogTrigger,
  AmautaDialogContent,
  DialogHeader as AmautaDialogHeader,
  DialogFooter as AmautaDialogFooter,
  DialogTitle as AmautaDialogTitle,
  DialogDescription as AmautaDialogDescription,
  DialogClose as AmautaDialogClose,
}
