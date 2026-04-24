export { ErrorBoundary } from "./ErrorBoundary";
export { logError, getErrorLogs, clearErrorLogs, getErrorLogsGrouped } from "./errorLogger";
export {
  GenericFallback,
  StudentFallback,
  ParentFallback,
} from "./FallbackUI";
export type { FallbackProps } from "./FallbackUI";
export type { FallbackType, ErrorBoundaryProps } from "./ErrorBoundary";