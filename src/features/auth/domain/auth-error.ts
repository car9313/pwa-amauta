import i18next from "i18next";
import { TimeoutError } from "@/lib/async/withTimeout";

export type AuthErrorCode =
  | "TOKEN_EXPIRED"
  | "TOKEN_INVALID"
  | "TOKEN_REVOKED"
  | "REFRESH_FAILED"
  | "NETWORK_ERROR"
  | "SESSION_NOT_FOUND"
  | "TIMEOUT"
  | "CONFLICT";

export interface AuthError {
  code: AuthErrorCode;
  message: string;
  isOffline?: boolean;
}

export function getAuthErrorMessage(code: AuthErrorCode): string {
  const keyMap: Record<AuthErrorCode, string> = {
    TOKEN_EXPIRED: "auth:errors.tokenExpired",
    TOKEN_INVALID: "auth:errors.tokenInvalid",
    TOKEN_REVOKED: "auth:errors.tokenRevoked",
    REFRESH_FAILED: "auth:errors.refreshFailed",
    NETWORK_ERROR: "auth:errors.networkError",
    SESSION_NOT_FOUND: "auth:errors.sessionNotFound",
    TIMEOUT: "auth:errors.timeout",
    CONFLICT: "auth:errors.conflict",
  }
  return i18next.t(keyMap[code])
}

export const OFFLINE_ERROR_CODES: readonly AuthErrorCode[] = [
  "NETWORK_ERROR",
  "TOKEN_EXPIRED",
  "REFRESH_FAILED",
  "TIMEOUT",
] as const;

export function isOfflineError(code: AuthErrorCode): boolean {
  return OFFLINE_ERROR_CODES.includes(code);
}

export function mapHttpErrorToAuthError(error: unknown, isOnline: boolean): AuthError {
  if (error instanceof TimeoutError) {
    return {
      code: "TIMEOUT",
      message: error.message || i18next.t("auth:errors.timeout"),
      isOffline: true,
    };
  }

  const message = error instanceof Error ? error.message : i18next.t("auth:errors.unknown");

  if (!isOnline) {
    return {
      code: "NETWORK_ERROR",
      message: i18next.t("auth:errors.networkError"),
      isOffline: true,
    };
  }

  if (message.includes("401") || message.toLowerCase().includes("unauthorized")) {
    if (message.toLowerCase().includes("revoked") || message.toLowerCase().includes("invalid")) {
      return {
        code: "TOKEN_REVOKED",
        message: i18next.t("auth:errors.tokenRevoked"),
      };
    }
    return {
      code: "TOKEN_INVALID",
      message: i18next.t("auth:errors.tokenInvalid"),
    };
  }

  if (message.includes("403")) {
    return {
      code: "TOKEN_REVOKED",
      message: i18next.t("auth:errors.tokenRevoked"),
    };
  }

  if (message.toLowerCase().includes("network") || message.toLowerCase().includes("fetch")) {
    return {
      code: "NETWORK_ERROR",
      message: i18next.t("auth:errors.networkError"),
      isOffline: true,
    };
  }

  return {
    code: "REFRESH_FAILED",
    message: i18next.t("auth:errors.refreshFailed"),
  };
}