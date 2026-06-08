import { CheckCircle2, XCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

interface FeedbackOverlayProps {
  open: boolean
  onClose: () => void
  type: "correct" | "incorrect"
  title?: string
  message?: string
  action?: ReactNode
}

const feedbackConfig = {
  correct: {
    icon: CheckCircle2,
    iconClass: "text-emerald-500",
    title: "¡Correcto!",
    description: "Muy bien, sigue así.",
  },
  incorrect: {
    icon: XCircle,
    iconClass: "text-destructive",
    title: "¡Ups!",
    description: "No te preocupes, inténtalo de nuevo.",
  },
} as const

function FeedbackOverlay({
  open,
  onClose,
  type,
  title,
  message,
  action,
}: FeedbackOverlayProps) {
  const config = feedbackConfig[type]
  const Icon = config.icon

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        showCloseButton={false}
        className="max-w-sm text-center"
        aria-live="polite"
      >
        <DialogHeader>
          <div className="flex justify-center mb-2">
            <Icon className={cn("size-16", config.iconClass)} />
          </div>
          <DialogTitle className="text-2xl font-bold">
            {title ?? config.title}
          </DialogTitle>
          <DialogDescription className="text-base">
            {message ?? config.description}
          </DialogDescription>
        </DialogHeader>
        {action && <div className="flex justify-center">{action}</div>}
      </DialogContent>
    </Dialog>
  )
}

export { FeedbackOverlay }
export type { FeedbackOverlayProps }
