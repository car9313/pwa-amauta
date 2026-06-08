import { AlertCircle, KeyRound, Loader2, RefreshCw, WifiOff } from "lucide-react";
import type { AuthError, AuthErrorCode } from "../../domain/auth-error";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ICON_BY_CODE: Record<AuthErrorCode, typeof AlertCircle> = {
  TOKEN_EXPIRED: KeyRound,
  TOKEN_INVALID: KeyRound,
  TOKEN_REVOKED: KeyRound,
  REFRESH_FAILED: AlertCircle,
  NETWORK_ERROR: WifiOff,
  SESSION_NOT_FOUND: KeyRound,
  TIMEOUT: Loader2,
};

const RETRYABLE_CODES: ReadonlySet<AuthErrorCode> = new Set([
  "NETWORK_ERROR",
  "TIMEOUT",
  "REFRESH_FAILED",
]);

const VARIANT_STYLES = {
  error: "border-red-200 bg-red-50 text-red-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
};

export interface FormErrorBannerProps {
  error: AuthError | null;
  onRetry?: () => void;
  variant?: keyof typeof VARIANT_STYLES;
  className?: string;
}

export function FormErrorBanner({
  error,
  onRetry,
  variant = "error",
  className,
}: FormErrorBannerProps) {
  if (!error) return null;

  const Icon = ICON_BY_CODE[error.code] ?? AlertCircle;
  const canRetry = !!onRetry && RETRYABLE_CODES.has(error.code);

  return (
    <div
      role="alert"
      aria-live="polite"
      data-testid="form-error-banner"
      data-error-code={error.code}
      className={cn(
        "flex items-start gap-3 rounded-lg border px-4 py-3 text-sm",
        VARIANT_STYLES[variant],
        className
      )}
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
      <div className="flex-1">
        <p className="font-semibold leading-snug">{error.message}</p>
      </div>
      {canRetry && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRetry}
          className="ml-2 shrink-0"
          aria-label="Reintentar"
        >
          <RefreshCw className="mr-1 h-3.5 w-3.5" />
          Reintentar
        </Button>
      )}
    </div>
  );
}
