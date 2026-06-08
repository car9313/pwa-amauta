import { describe, it, expect } from 'vitest'
import {
  getRetryDelay,
  shouldRetry,
  formatRetryDelay,
  isRetryableError,
  MAX_RETRY_DELAY_MS,
} from './retry'

describe('getRetryDelay', () => {
  it('returns 1000ms for attempt 0 (2^0 * 1000)', () => {
    expect(getRetryDelay(0)).toBe(1000)
  })

  it('returns 2000ms for attempt 1 (2^1 * 1000)', () => {
    expect(getRetryDelay(1)).toBe(2000)
  })

  it('returns 4000ms for attempt 2 (2^2 * 1000)', () => {
    expect(getRetryDelay(2)).toBe(4000)
  })

  it('returns 8000ms for attempt 3 (2^3 * 1000)', () => {
    expect(getRetryDelay(3)).toBe(8000)
  })

  it('returns 16000ms for attempt 4 (2^4 * 1000)', () => {
    expect(getRetryDelay(4)).toBe(16000)
  })

  it(`caps at ${MAX_RETRY_DELAY_MS}ms (attempt 5 would be 32000 without cap)`, () => {
    expect(getRetryDelay(5)).toBe(MAX_RETRY_DELAY_MS)
  })

  it('keeps returning cap for higher attempts', () => {
    expect(getRetryDelay(10)).toBe(MAX_RETRY_DELAY_MS)
    expect(getRetryDelay(100)).toBe(MAX_RETRY_DELAY_MS)
  })
})

describe('shouldRetry', () => {
  it('returns true for attempt 0 (first retry allowed)', () => {
    expect(shouldRetry(0)).toBe(true)
  })

  it('returns true for attempt 1', () => {
    expect(shouldRetry(1)).toBe(true)
  })

  it('returns true for attempt 2', () => {
    expect(shouldRetry(2)).toBe(true)
  })

  it('returns false when attempt equals maxAttempts (3)', () => {
    expect(shouldRetry(3)).toBe(false)
  })

  it('returns false when attempt exceeds maxAttempts', () => {
    expect(shouldRetry(5)).toBe(false)
  })

  it('respects custom maxAttempts', () => {
    expect(shouldRetry(0, 1)).toBe(true)
    expect(shouldRetry(1, 1)).toBe(false)
    expect(shouldRetry(0, 5)).toBe(true)
    expect(shouldRetry(5, 5)).toBe(false)
  })

  it('uses default maxAttempts of 3 when not specified', () => {
    expect(shouldRetry(0)).toBe(true)
    expect(shouldRetry(3)).toBe(false)
  })
})

describe('formatRetryDelay', () => {
  it('formats 1000ms as "1s"', () => {
    expect(formatRetryDelay(0)).toBe('1s')
  })

  it('formats 2000ms as "2s"', () => {
    expect(formatRetryDelay(1)).toBe('2s')
  })

  it('formats 4000ms as "4s"', () => {
    expect(formatRetryDelay(2)).toBe('4s')
  })

  it('formats 8000ms as "8s"', () => {
    expect(formatRetryDelay(3)).toBe('8s')
  })

  it('formats 16000ms as "16s"', () => {
    expect(formatRetryDelay(4)).toBe('16s')
  })

  it('formats capped delay as "30s"', () => {
    expect(formatRetryDelay(5)).toBe('30s')
  })
})

describe('isRetryableError', () => {
  it('returns false for null', () => {
    expect(isRetryableError(null)).toBe(false)
  })

  it('returns false for undefined', () => {
    expect(isRetryableError(undefined)).toBe(false)
  })

  it('returns true when message includes "network"', () => {
    const error = new Error('Network error: connection lost')
    expect(isRetryableError(error)).toBe(true)
  })

  it('returns true when message includes "timeout"', () => {
    const error = new Error('Request timeout after 30s')
    expect(isRetryableError(error)).toBe(true)
  })

  it('returns true when message includes "fetch"', () => {
    const error = new Error('Failed to fetch')
    expect(isRetryableError(error)).toBe(true)
  })

  it('returns true when message includes "ECONNRESET" (case insensitive)', () => {
    const error = new Error('econnreset')
    expect(isRetryableError(error)).toBe(true)
  })

  it('returns true when message includes "ENETUNREACH"', () => {
    const error = new Error('ENETUNREACH: network unreachable')
    expect(isRetryableError(error)).toBe(true)
  })

  it('returns false for non-retryable errors', () => {
    const error = new Error('Invalid credentials')
    expect(isRetryableError(error)).toBe(false)
  })

  it('returns true for non-Error objects', () => {
    expect(isRetryableError('some string')).toBe(true)
    expect(isRetryableError(42)).toBe(true)
    expect(isRetryableError({ code: 500 })).toBe(true)
  })

  it('returns false for empty error message', () => {
    const error = new Error()
    expect(isRetryableError(error)).toBe(false)
  })
})
