import type { AuthErrorCode } from "./auth-error";

export const NETWORK_ERROR_CODES: readonly AuthErrorCode[] = [
  "NETWORK_ERROR",
  "TIMEOUT",
  "REFRESH_FAILED",
] as const;

export const AUTH_FAILURE_CODES: readonly AuthErrorCode[] = [
  "TOKEN_INVALID",
  "TOKEN_REVOKED",
  "TOKEN_EXPIRED",
  "SESSION_NOT_FOUND",
] as const;

export const SESSION_CLOSED_CODES: readonly AuthErrorCode[] = [
  "TOKEN_REVOKED",
  "TOKEN_EXPIRED",
] as const;
