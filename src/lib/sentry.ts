import * as Sentry from "@sentry/react"

let _initialized = false

export function initSentry(): boolean {
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined
  if (!dsn) {
    if (import.meta.env.DEV) {
      console.warn("[Sentry] VITE_SENTRY_DSN not configured, skipping initialization")
    }
    return false
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    release: `amauta@${import.meta.env.VITE_APP_VERSION ?? "dev"}`,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    beforeSend: (event) => {
      if (!navigator.onLine) return null
      return event
    },
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 0,
    replaysSessionSampleRate: import.meta.env.PROD ? 0.1 : 0,
    replaysOnErrorSampleRate: 1.0,
  })

  _initialized = true
  return true
}

export function captureSentryError(
  error: Error,
  context?: Record<string, unknown>,
): void {
  if (!_initialized) return
  Sentry.captureException(error, { extra: context })
}

export { Sentry }
