// src/types/error.types.ts
// ============================================================
// Tipos estándar de errores para Amauta
// ============================================================

export interface ApiError {
  error: string
  message: string
  statusCode: number
  details?: Record<string, unknown>
}

export const ERROR_CODES = {
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  UNAUTHORIZED: 'UNAUTHORIZED',
  STUDENT_NOT_FOUND: 'STUDENT_NOT_FOUND',
  STUDENT_INACTIVE: 'STUDENT_INACTIVE',
  EXERCISE_NOT_FOUND: 'EXERCISE_NOT_FOUND',
  NO_EXERCISES_TODAY: 'NO_EXERCISES_TODAY',
  EXERCISE_UNAVAILABLE: 'EXERCISE_UNAVAILABLE',
  NETWORK_ERROR: 'NETWORK_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
} as const

export type ErrorCode = keyof typeof ERROR_CODES

export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'error' in error &&
    'statusCode' in error
  )
}

export function getErrorMessage(error: unknown): string {
  if (isApiError(error)) {
    switch (error.error) {
      case ERROR_CODES.TOKEN_EXPIRED:
      case ERROR_CODES.TOKEN_INVALID:
        return 'Tu sesión expiró. Por favor, inicia sesión de nuevo.'
      case ERROR_CODES.NO_EXERCISES_TODAY:
        return '¡Ya completaste todos tus ejercicios de hoy! Vuelve mañana.'
      case ERROR_CODES.NETWORK_ERROR:
        return 'Sin conexión. Revisa tu internet e intenta de nuevo.'
      default:
        return error.message ?? 'Algo salió mal. Intenta de nuevo.'
    }
  }
  return 'Algo salió mal. Intenta de nuevo.'
}