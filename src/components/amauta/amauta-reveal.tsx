import * as React from "react"
import { Sparkles, X } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog"

interface AmautaRevealProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  icon?: React.ReactNode
  children?: React.ReactNode
  action?: React.ReactNode
}

function AmautaReveal({
  open,
  onClose,
  title,
  description,
  icon,
  children,
  action,
}: AmautaRevealProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        showCloseButton={false}
        className="max-w-sm text-center"
        aria-live="polite"
      >
        <DialogClose className="absolute top-4 right-4 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
          <X className="h-4 w-4" />
          <span className="sr-only">Cerrar</span>
        </DialogClose>

        <DialogHeader>
          <div className="relative mb-4 flex justify-center">
            <div className="absolute -top-2 -right-2">
              <Sparkles className="h-6 w-6 text-[var(--amauta-orange)] animate-sparkle" />
            </div>
            <div className="absolute -top-1 -left-1">
              <Sparkles className="h-4 w-4 text-[var(--amauta-orange)] animate-sparkle animation-delay-500" />
            </div>

            <div
              className={cn(
                "flex h-20 w-20 items-center justify-center rounded-full",
                "bg-[var(--amauta-orange-light)] animate-scale-in",
                "shadow-lg shadow-[var(--amauta-orange)]/20"
              )}
            >
              {icon ?? (
                <Sparkles className="h-10 w-10 text-[var(--amauta-orange-dark)] animate-bounce-gentle" />
              )}
            </div>
          </div>

          <DialogTitle className="text-2xl font-bold animate-fade-in-up">
            {title}
          </DialogTitle>

          {description && (
            <DialogDescription className="text-base animate-fade-in-up animation-delay-200">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        {children && (
          <div className="flex justify-center animate-fade-in-up animation-delay-300">
            {children}
          </div>
        )}

        {action && (
          <div className="flex justify-center animate-fade-in-up animation-delay-400">
            {action}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export { AmautaReveal }
export type { AmautaRevealProps }
