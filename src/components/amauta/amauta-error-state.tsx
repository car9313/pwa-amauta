import * as React from "react"
import { useTranslation } from "react-i18next"
import { HelpCircle, RefreshCw } from "lucide-react"

import { cn } from "@/lib/utils"
import { AmautaButton } from "./amauta-button"

interface AmautaErrorStateProps {
  title?: string
  message?: string
  onRetry?: () => void
  retryLabel?: string
  className?: string
}

function AmautaErrorState({
  title,
  message,
  onRetry,
  retryLabel,
  className,
}: AmautaErrorStateProps) {
  const { t } = useTranslation("errors")

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center px-4 py-16",
        className
      )}
    >
      <div className="relative mb-4">
        <div className="absolute inset-0 rounded-full bg-destructive/10 animate-ping" />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <HelpCircle className="h-8 w-8 text-destructive" />
        </div>
      </div>

      <h3 className="text-lg font-bold text-foreground">
        {title ?? t("errorState.title")}
      </h3>

      {message && (
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          {message}
        </p>
      )}

      {onRetry && (
        <div className="mt-6">
          <AmautaButton
            onClick={onRetry}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            {retryLabel ?? t("errorState.retry")}
          </AmautaButton>
        </div>
      )}
    </div>
  )
}

export { AmautaErrorState }
export type { AmautaErrorStateProps }
