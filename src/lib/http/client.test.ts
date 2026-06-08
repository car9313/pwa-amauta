import { describe, it, expect } from 'vitest'
import { isHttpError, getHttpErrorCode, HttpError } from './client'

describe('HttpError', () => {
  it('creates an error with correct properties', () => {
    const error = new HttpError('Not found', 404, 'TOKEN_INVALID', false)
    expect(error.message).toBe('Not found')
    expect(error.statusCode).toBe(404)
    expect(error.code).toBe('TOKEN_INVALID')
    expect(error.isOffline).toBe(false)
    expect(error.name).toBe('HttpError')
  })

  it('defaults isOffline to false', () => {
    const error = new HttpError('Unauthorized', 401, 'TOKEN_EXPIRED')
    expect(error.isOffline).toBe(false)
  })
})

describe('isHttpError', () => {
  it('returns true for HttpError instances', () => {
    const error = new HttpError('test', 500, 'TOKEN_EXPIRED')
    expect(isHttpError(error)).toBe(true)
  })

  it('returns false for regular Error', () => {
    expect(isHttpError(new Error('test'))).toBe(false)
  })

  it('returns false for null', () => {
    expect(isHttpError(null)).toBe(false)
  })

  it('returns false for plain objects', () => {
    expect(isHttpError({ message: 'test' })).toBe(false)
  })

  it('returns false for strings', () => {
    expect(isHttpError('error')).toBe(false)
  })
})

describe('getHttpErrorCode', () => {
  it('returns the error code for HttpError', () => {
    const error = new HttpError('test', 401, 'TOKEN_EXPIRED')
    expect(getHttpErrorCode(error)).toBe('TOKEN_EXPIRED')
  })

  it('returns null for regular Error', () => {
    expect(getHttpErrorCode(new Error('test'))).toBe(null)
  })

  it('returns null for null', () => {
    expect(getHttpErrorCode(null)).toBe(null)
  })

  it('returns null for non-error values', () => {
    expect(getHttpErrorCode('error')).toBe(null)
    expect(getHttpErrorCode(42)).toBe(null)
    expect(getHttpErrorCode({})).toBe(null)
  })
})
