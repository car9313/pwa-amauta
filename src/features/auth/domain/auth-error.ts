export type AuthErrorCode =
  | "TOKEN_EXPIRED"
  | "TOKEN_INVALID"
  | "TOKEN_REVOKED"
  | "REFRESH_FAILED"
  | "NETWORK_ERROR"
  | "SESSION_NOT_FOUND";

export interface AuthError {
  code: AuthErrorCode;
  message: string;
  isOffline?: boolean;
}

export const AUTH_ERROR_MESSAGES: Record<AuthErrorCode, string> = {
  TOKEN_EXPIRED: "Tu sesión expiró. Por favor, inicia sesión de nuevo.",
  TOKEN_INVALID: "Tu sesión no es válida. Por favor, inicia sesión de nuevo.",
  TOKEN_REVOKED: "Tu sesión fue cerrada por seguridad. Por favor, inicia sesión de nuevo.",
  REFRESH_FAILED: "No pudimos renovar tu sesión. Por favor, inicia sesión de nuevo.",
  NETWORK_ERROR: "Sin conexión a internet. Puedes seguir usando la app en modo offline.",
  SESSION_NOT_FOUND: "No encontramos tu sesión. Por favor, inicia sesión.",
};

export function mapHttpErrorToAuthError(error: unknown, isOnline: boolean): AuthError {
  const message = error instanceof Error ? error.message : "Error desconocido";

  if (!isOnline) {
    return {
      code: "NETWORK_ERROR",
      message: AUTH_ERROR_MESSAGES.NETWORK_ERROR,
      isOffline: true,
    };
  }

  if (message.includes("401") || message.toLowerCase().includes("unauthorized")) {
    if (message.toLowerCase().includes("revoked") || message.toLowerCase().includes("invalid")) {
      return {
        code: "TOKEN_REVOKED",
        message: AUTH_ERROR_MESSAGES.TOKEN_REVOKED,
      };
    }
    return {
      code: "TOKEN_INVALID",
      message: AUTH_ERROR_MESSAGES.TOKEN_INVALID,
    };
  }

  if (message.includes("403")) {
    return {
      code: "TOKEN_REVOKED",
      message: AUTH_ERROR_MESSAGES.TOKEN_REVOKED,
    };
  }

  if (message.includes("Network") || message.includes("fetch")) {
    return {
      code: "NETWORK_ERROR",
      message: AUTH_ERROR_MESSAGES.NETWORK_ERROR,
      isOffline: true,
    };
  }

  return {
    code: "REFRESH_FAILED",
    message: AUTH_ERROR_MESSAGES.REFRESH_FAILED,
  };
}