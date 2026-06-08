import { describe, it, expect } from 'vitest'
import { mapHttpErrorToAuthError, AUTH_ERROR_MESSAGES } from './auth-error'
import { TimeoutError } from '@/lib/async/withTimeout'

describe('mapHttpErrorToAuthError', () => {
  describe('timeout errors', () => {
    it('returns TIMEOUT code when error is a TimeoutError', () => {
      const result = mapHttpErrorToAuthError(new TimeoutError('Muy lento'), true)
      expect(result.code).toBe('TIMEOUT')
      expect(result.message).toBe('Muy lento')
      expect(result.isOffline).toBe(true)
    })

    it('returns TIMEOUT code with default message when TimeoutError has no message', () => {
      const result = mapHttpErrorToAuthError(new TimeoutError(), true)
      expect(result.code).toBe('TIMEOUT')
      expect(result.message).toBeTruthy()
    })

    it('returns TIMEOUT for TimeoutError even when isOnline=false', () => {
      const result = mapHttpErrorToAuthError(new TimeoutError('a'), false)
      expect(result.code).toBe('TIMEOUT')
    })
  })

  describe('offline mode (isOnline = false)', () => {
    it('returns NETWORK_ERROR with isOffline true regardless of error message', () => {
      const result = mapHttpErrorToAuthError(new Error('anything'), false)
      expect(result.code).toBe('NETWORK_ERROR')
      expect(result.isOffline).toBe(true)
      expect(result.message).toBe(AUTH_ERROR_MESSAGES.NETWORK_ERROR)
    })

    it('returns NETWORK_ERROR even for null error when offline', () => {
      const result = mapHttpErrorToAuthError(null, false)
      expect(result.code).toBe('NETWORK_ERROR')
      expect(result.isOffline).toBe(true)
    })
  })

  describe('online, 401 / unauthorized', () => {
    it('returns TOKEN_INVALID for 401 status', () => {
      const result = mapHttpErrorToAuthError(new Error('401 Unauthorized'), true)
      expect(result.code).toBe('TOKEN_INVALID')
      expect(result.message).toBe(AUTH_ERROR_MESSAGES.TOKEN_INVALID)
      expect(result.isOffline).toBeUndefined()
    })

    it('returns TOKEN_INVALID for "unauthorized" message (case insensitive)', () => {
      const result = mapHttpErrorToAuthError(new Error('Unauthorized'), true)
      expect(result.code).toBe('TOKEN_INVALID')
    })

    it('returns TOKEN_INVALID for "UNAUTHORIZED" in uppercase', () => {
      const result = mapHttpErrorToAuthError(new Error('UNAUTHORIZED'), true)
      expect(result.code).toBe('TOKEN_INVALID')
    })

    it('returns TOKEN_REVOKED when 401 includes "revoked"', () => {
      const result = mapHttpErrorToAuthError(
        new Error('401 Token has been revoked'), true
      )
      expect(result.code).toBe('TOKEN_REVOKED')
      expect(result.message).toBe(AUTH_ERROR_MESSAGES.TOKEN_REVOKED)
    })

    it('returns TOKEN_REVOKED when unauthorized includes "invalid"', () => {
      const result = mapHttpErrorToAuthError(
        new Error('Unauthorized: token is invalid'), true
      )
      expect(result.code).toBe('TOKEN_REVOKED')
    })

    it('returns TOKEN_REVOKED when 401 includes "invalid" (case insensitive)', () => {
      const result = mapHttpErrorToAuthError(
        new Error('401 Invalid token'), true
      )
      expect(result.code).toBe('TOKEN_REVOKED')
    })
  })

  describe('online, 403 forbidden', () => {
    it('returns TOKEN_REVOKED for 403 status', () => {
      const result = mapHttpErrorToAuthError(new Error('403 Forbidden'), true)
      expect(result.code).toBe('TOKEN_REVOKED')
      expect(result.message).toBe(AUTH_ERROR_MESSAGES.TOKEN_REVOKED)
    })
  })

  describe('online, network / fetch errors', () => {
    it('returns NETWORK_ERROR when message includes "Network"', () => {
      const result = mapHttpErrorToAuthError(
        new Error('Network error: connection lost'), true
      )
      expect(result.code).toBe('NETWORK_ERROR')
      expect(result.isOffline).toBe(true)
    })

    it('returns NETWORK_ERROR when message includes "fetch"', () => {
      const result = mapHttpErrorToAuthError(new Error('Failed to fetch'), true)
      expect(result.code).toBe('NETWORK_ERROR')
      expect(result.isOffline).toBe(true)
    })

    it('returns NETWORK_ERROR for "network" in lowercase', () => {
      const result = mapHttpErrorToAuthError(new Error('network timeout'), true)
      expect(result.code).toBe('NETWORK_ERROR')
    })
  })

  describe('online, fallback / unknown errors', () => {
    it('returns REFRESH_FAILED for unknown error messages', () => {
      const result = mapHttpErrorToAuthError(
        new Error('Something went wrong'), true
      )
      expect(result.code).toBe('REFRESH_FAILED')
      expect(result.message).toBe(AUTH_ERROR_MESSAGES.REFRESH_FAILED)
    })

    it('returns REFRESH_FAILED for empty error message', () => {
      const result = mapHttpErrorToAuthError(new Error(), true)
      expect(result.code).toBe('REFRESH_FAILED')
    })
  })

  describe('edge cases for error parameter', () => {
    it('handles null error when online', () => {
      const result = mapHttpErrorToAuthError(null, true)
      expect(result.code).toBe('REFRESH_FAILED')
      expect(result.isOffline).toBeUndefined()
    })

    it('handles undefined error when online', () => {
      const result = mapHttpErrorToAuthError(undefined, true)
      expect(result.code).toBe('REFRESH_FAILED')
    })

    it('handles string as error', () => {
      const result = mapHttpErrorToAuthError('just a string', true)
      expect(result.code).toBe('REFRESH_FAILED')
    })

    it('handles numeric error', () => {
      const result = mapHttpErrorToAuthError(500, true)
      expect(result.code).toBe('REFRESH_FAILED')
    })
  })

  describe('AUTH_ERROR_MESSAGES', () => {
    it('defines a message for every AuthErrorCode', () => {
      const codes = [
        'TOKEN_EXPIRED',
        'TOKEN_INVALID',
        'TOKEN_REVOKED',
        'REFRESH_FAILED',
        'NETWORK_ERROR',
        'SESSION_NOT_FOUND',
        'TIMEOUT',
      ] as const

      for (const code of codes) {
        expect(AUTH_ERROR_MESSAGES[code]).toBeDefined()
        expect(AUTH_ERROR_MESSAGES[code].length).toBeGreaterThan(0)
      }
    })

    it('all messages are in Spanish', () => {
      const messages = Object.values(AUTH_ERROR_MESSAGES)
      for (const msg of messages) {
        expect(msg).toMatch(/[a-záéíóúñ]/i)
      }
    })
  })
})
