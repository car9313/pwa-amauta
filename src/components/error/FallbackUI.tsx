import { useTranslation } from "react-i18next"
import { AmautaButton } from "@/components/amauta"
import { AmautaCard, AmautaCardContent, AmautaCardHeader, AmautaCardTitle } from "@/components/amauta"
import { AlertTriangle, RefreshCw, Home } from "lucide-react"

export interface FallbackProps {
  error: Error
  resetError: () => void
  isNetworkError?: boolean
}

interface GenericFallbackProps extends FallbackProps {
  title?: string
  message?: string
  showHome?: boolean
}

export function GenericFallback({
  error,
  resetError,
  isNetworkError,
  title = "",
  message = "",
  showHome = true,
}: GenericFallbackProps) {
  const { t } = useTranslation("errors")
  const resolvedTitle = title || (isNetworkError ? t("fallback.networkTitle") : t("fallback.genericTitle"))
  const resolvedMessage = message || (isNetworkError ? t("fallback.networkMessage") : t("fallback.genericMessage"))

  return (
    <div className="flex min-h-[200px] w-full items-center justify-center p-4">
      <AmautaCard className="w-full max-w-md border-destructive/20 bg-destructive/10">
        <AmautaCardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/20">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <AmautaCardTitle className="text-xl text-destructive">{resolvedTitle}</AmautaCardTitle>
        </AmautaCardHeader>
        <AmautaCardContent className="space-y-4 text-center">
          <p className="text-sm text-destructive">{resolvedMessage}</p>
          {error.message && (
            <p className="text-xs text-destructive bg-destructive/20 p-2 rounded">
              {error.message}
            </p>
          )}
          <div className="flex gap-2 justify-center">
            <AmautaButton
              onClick={resetError}
              variant="outline"
              className="border-destructive/30 text-destructive hover:bg-destructive/20"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              {isNetworkError ? t("fallback.retryConnection") : t("fallback.retry")}
            </AmautaButton>
            {showHome && !isNetworkError && (
              <AmautaButton
                onClick={() => window.location.href = "/"}
                variant="outline"
                className="border-destructive/30 text-destructive hover:bg-destructive/20"
              >
                <Home className="mr-2 h-4 w-4" />
                {t("fallback.goHome")}
              </AmautaButton>
            )}
          </div>
        </AmautaCardContent>
      </AmautaCard>
    </div>
  )
}

export function StudentFallback({ resetError, isNetworkError }: FallbackProps) {
  const { t } = useTranslation("errors")

  return (
    <div className="flex min-h-[300px] w-full items-center justify-center p-4">
      <AmautaCard className="w-full max-w-md border-0 bg-white shadow-xl">
        <AmautaCardHeader className="text-center pb-2">
          <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-accent/10">
            <AlertTriangle className="h-10 w-10 text-accent" />
          </div>
          <AmautaCardTitle className="text-2xl font-bold text-primary">
            {isNetworkError ? t("student.networkTitle") : t("student.genericTitle")}
          </AmautaCardTitle>
        </AmautaCardHeader>
        <AmautaCardContent className="space-y-4 text-center">
          <p className="text-base text-muted-foreground">
            {isNetworkError ? t("student.networkMessage") : t("student.genericMessage")}
          </p>
          <div className="flex flex-col gap-2">
            <AmautaButton
              onClick={resetError}
              className="w-full bg-accent hover:bg-accent/90"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              {isNetworkError ? t("student.retryNetwork") : t("student.retryGeneric")}
            </AmautaButton>
            <AmautaButton
              onClick={() => window.location.href = "/"}
              variant="outline"
              className="w-full border-2 border-muted"
            >
              <Home className="mr-2 h-4 w-4" />
              {t("student.goHome")}
            </AmautaButton>
          </div>
        </AmautaCardContent>
      </AmautaCard>
    </div>
  )
}

export function ParentFallback({ error, resetError, isNetworkError }: FallbackProps) {
  const { t } = useTranslation("errors")

  return (
    <div className="flex min-h-[250px] w-full items-center justify-center p-4">
      <AmautaCard className="w-full max-w-md border-muted">
        <AmautaCardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-warning/20">
            <AlertTriangle className="h-5 w-5 text-warning" />
          </div>
          <AmautaCardTitle className="text-lg text-foreground">
            {isNetworkError ? t("parent.networkTitle") : t("parent.genericTitle")}
          </AmautaCardTitle>
        </AmautaCardHeader>
        <AmautaCardContent className="space-y-3 text-center">
          <p className="text-sm text-muted-foreground">
            {isNetworkError ? t("parent.networkMessage") : t("parent.genericMessage")}
          </p>
          {import.meta.env.DEV && error.message && (
            <p className="text-xs bg-muted p-2 rounded text-left font-mono">
              {error.message}
            </p>
          )}
          <div className="flex gap-2 justify-center pt-2">
            <AmautaButton onClick={resetError} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              {isNetworkError ? t("parent.retryConnection") : t("parent.retry")}
            </AmautaButton>
            <AmautaButton
              onClick={() => window.location.href = "/"}
              variant="outline"
            >
              <Home className="mr-2 h-4 w-4" />
              {t("parent.home")}
            </AmautaButton>
          </div>
        </AmautaCardContent>
      </AmautaCard>
    </div>
  )
}

export default {
  GenericFallback,
  StudentFallback,
  ParentFallback,
}
