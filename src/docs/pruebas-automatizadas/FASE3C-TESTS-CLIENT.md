# Fase 3c: Tests de `client.ts` — HttpClient y Error Handling

## ¿Qué es esto?

`src/lib/http/client.ts` define el `HttpClient`, que es el cliente HTTP oficial de la app. Tiene:

- **`HttpClient` class**: hace requests con autenticación, refresh de tokens, manejo de errores
- **`HttpError` class**: error tipado con código, statusCode, y flag offline
- **`isHttpError(error)`**: type guard que verifica si un error es `HttpError`
- **`getHttpErrorCode(error)`**: extrae el código de error si es HttpError

## ¿Qué testeamos y qué no?

### Testeamos (funciones puras):

| Función | Tests | ¿Qué hace? |
|---------|-------|-----------|
| `HttpError` constructor | 2 | Crea error con propiedades correctas |
| `isHttpError(error)` | 5 | Type guard — distingue HttpError de otros errores |
| `getHttpErrorCode(error)` | 5 | Extrae código o devuelve null |

### NO testeamos (funciones impuras):

| Función | ¿Por qué no? |
|---------|-------------|
| `HttpClient.request()` | Usa `fetch`, `navigator.onLine`, `getAccessToken()` — requiere mock complejo |
| `HttpClient.tryRefreshToken()` | Idem + refresh token |
| `configureHttpClient()` | Mutación de estado global |
| `getHttpClient()` | Depende de estado global |

## `isHttpError` — qué es un type guard

```typescript
// Esto es un type guard:
export function isHttpError(error: unknown): error is HttpError {
  return error instanceof HttpError
}
```

El `error is HttpError` en el return le dice a TypeScript: "si esta función devuelve true, a partir de acá tratá `error` como `HttpError`":

```typescript
if (isHttpError(error)) {
  // TypeScript SABE que error es HttpError aquí
  console.log(error.statusCode)  // ✅ tipado correcto
  console.log(error.code)        // ✅ tipado correcto
}
```

## `getHttpErrorCode` — extracción segura

```typescript
export function getHttpErrorCode(error: unknown): AuthErrorCode | null {
  if (isHttpError(error)) {
    return error.code
  }
  return null
}
```

Siempre devuelve algo seguro: el código si es HttpError, o `null` si no lo es. Nunca tira error.

## Los tests

### HttpError

```typescript
it('creates an error with correct properties', () => {
  const error = new HttpError('Not found', 404, 'TOKEN_INVALID', false)
  expect(error.message).toBe('Not found')
  expect(error.statusCode).toBe(404)
  expect(error.code).toBe('TOKEN_INVALID')
  expect(error.isOffline).toBe(false)
  expect(error.name).toBe('HttpError')  // name lo setea el constructor
})
```

### isHttpError — casos borde

```typescript
isHttpError(new HttpError('test', 500, 'TOKEN_EXPIRED'))  // → true
isHttpError(new Error('test'))                              // → false
isHttpError(null)                                           // → false
isHttpError({ message: 'test' })                            // → false
isHttpError('error')                                        // → false
```

### getHttpErrorCode — casos borde

```typescript
getHttpErrorCode(new HttpError('test', 401, 'TOKEN_EXPIRED'))  // → 'TOKEN_EXPIRED'
getHttpErrorCode(new Error('test'))                             // → null
getHttpErrorCode(null)                                          // → null
getHttpErrorCode(42)                                            // → null
getHttpErrorCode({})                                            // → null
```

## Concepto nuevo: `instanceof`

`isHttpError` usa `error instanceof HttpError` para determinar si un error fue creado con `new HttpError(...)`.

```typescript
class HttpError extends Error { ... }

new HttpError('x', 400, 'x') instanceof HttpError   // → true
new Error('x') instanceof HttpError                   // → false
new HttpError('x', 400, 'x') instanceof Error         // → true (hereda de Error)
```

`instanceof` revisa toda la cadena de prototipos. Como `HttpError extends Error`, una instancia de HttpError es también instancia de Error.

## Resumen

| Archivo | Tests | Conceptos nuevos |
|---------|-------|-----------------|
| `src/lib/http/client.test.ts` | **11 tests** | Type guards (`error is HttpError`), `instanceof`, extracción segura con null |

**Acumulado: 102 tests | 4 archivos | 100% passing**

### Cómo correr

```bash
pnpm test -- src/lib/http/client.test.ts
pnpm test -- src/lib/query/keys.test.ts
```
