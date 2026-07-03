# Fase 4: Tests de `auth-error.ts` — Mapeo de Errores de Autenticación

## ¿Qué es esto?

`src/features/auth/domain/auth-error.ts` define cómo la app interpreta los errores HTTP relacionados con autenticación. La función principal `mapHttpErrorToAuthError(error, isOnline)` toma un error crudo y lo convierte en un error tipado con código, mensaje amigable, y flag offline.

## La función principal: `mapHttpErrorToAuthError`

### Árbol de decisión

```
mapHttpErrorToAuthError(error, isOnline)

├── ¿isOnline = false?
│   └── → NETWORK_ERROR (isOffline: true)
│
├── ¿message incluye "401" o "unauthorized"?
│   ├── ¿incluye "revoked" o "invalid"?
│   │   └── → TOKEN_REVOKED
│   └── no
│       └── → TOKEN_INVALID
│
├── ¿message incluye "403"?
│   └── → TOKEN_REVOKED
│
├── ¿message incluye "network" o "fetch"? (case insensitive)
│   └── → NETWORK_ERROR (isOffline: true)
│
└── ninguna de las anteriores
    └── → REFRESH_FAILED
```

### Los 6 códigos de error

| Código | ¿Cuándo ocurre? | Mensaje |
|--------|----------------|---------|
| `TOKEN_EXPIRED` | (definido pero no mapeado actualmente) | "Tu sesión expiró..." |
| `TOKEN_INVALID` | 401 sin "revoked"/"invalid" | "Tu sesión no es válida..." |
| `TOKEN_REVOKED` | 403, o 401 con "revoked"/"invalid" | "Tu sesión fue cerrada por seguridad..." |
| `REFRESH_FAILED` | Error desconocido (catch-all) | "No pudimos renovar tu sesión..." |
| `NETWORK_ERROR` | Sin conexión o error de red | "Sin conexión a internet..." |
| `SESSION_NOT_FOUND` | (definido pero no mapeado actualmente) | "No encontramos tu sesión..." |

## Estructura de los tests

### 1. Modo offline — `isOnline = false`

```typescript
it('returns NETWORK_ERROR with isOffline true regardless of error message', () => {
  const result = mapHttpErrorToAuthError(new Error('anything'), false)
  expect(result.code).toBe('NETWORK_ERROR')
  expect(result.isOffline).toBe(true)
})
```

**Clave:** cuando `isOnline = false`, la función **no mira el mensaje de error**. Siempre devuelve NETWORK_ERROR. Esto es correcto porque si no hay conexión, el error real no importa.

### 2. 401 / Unauthorized

```typescript
it('returns TOKEN_REVOKED when 401 includes "revoked"', () => {
  const result = mapHttpErrorToAuthError(new Error('401 Token has been revoked'), true)
  expect(result.code).toBe('TOKEN_REVOKED')
})
```

**Importante:** hay **dos niveles** de chequeo dentro de 401:
- Si el mensaje incluye "revoked" o "invalid" → TOKEN_REVOKED (más grave)
- Si no → TOKEN_INVALID

```typescript
// TOKEN_INVALID (caso simple)
"401 Unauthorized"                → TOKEN_INVALID
"Unauthorized"                    → TOKEN_INVALID

// TOKEN_REVOKED (casos agravados)
"401 Token has been revoked"      → TOKEN_REVOKED
"Unauthorized: token is invalid"  → TOKEN_REVOKED
```

### 3. 403 Forbidden

```typescript
it('returns TOKEN_REVOKED for 403 status', () => {
  const result = mapHttpErrorToAuthError(new Error('403 Forbidden'), true)
  expect(result.code).toBe('TOKEN_REVOKED')
})
```

403 siempre es TOKEN_REVOKED. No hay sub-chequeos.

### 4. Network / fetch errors

```typescript
it('returns NETWORK_ERROR when message includes "Network"', () => {
  const result = mapHttpErrorToAuthError(new Error('Network error: connection lost'), true)
  expect(result.code).toBe('NETWORK_ERROR')
  expect(result.isOffline).toBe(true)
})
```

**Bug encontrado y corregido:** Originalmente la función usaba `message.includes("Network")` (con N mayúscula), pero los errores reales pueden venir como `"network timeout"` en minúscula. Se corrigió a `.toLowerCase().includes("network")`.

### 5. Fallback / errores desconocidos

```typescript
it('returns REFRESH_FAILED for unknown error messages', () => {
  const result = mapHttpErrorToAuthError(new Error('Something went wrong'), true)
  expect(result.code).toBe('REFRESH_FAILED')
})
```

Cualquier error que no encaje en las categorías anteriores → REFRESH_FAILED (catch-all).

### 6. Casos borde — valores no-Error

```typescript
mapHttpErrorToAuthError(null, true)        // → REFRESH_FAILED
mapHttpErrorToAuthError(undefined, true)   // → REFRESH_FAILED
mapHttpErrorToAuthError("just a string", true) // → REFRESH_FAILED
mapHttpErrorToAuthError(500, true)          // → REFRESH_FAILED
```

La función maneja cualquier tipo de entrada usando `error instanceof Error ? error.message : "Error desconocido"`.

### 7. AUTH_ERROR_MESSAGES

```typescript
it('defines a message for every AuthErrorCode', () => {
  const codes = ['TOKEN_EXPIRED', 'TOKEN_INVALID', ...]
  for (const code of codes) {
    expect(AUTH_ERROR_MESSAGES[code]).toBeDefined()
    expect(AUTH_ERROR_MESSAGES[code].length).toBeGreaterThan(0)
  }
})
```

Verificamos que todos los códigos tengan su mensaje correspondiente y que los mensajes no estén vacíos.

## Conceptos nuevos

### 1. `isOffline: true` — flag vs código

NETWORK_ERROR se marca con `isOffline: true`. Los otros códigos no tienen esta propiedad (`isOffline` es `undefined`). Esto permite que quien recibe el error sepa si puede intentar reconectar:

```typescript
expect(result.isOffline).toBe(true)       // NETWORK_ERROR
expect(result.isOffline).toBeUndefined()  // TOKEN_INVALID, TOKEN_REVOKED, etc.
```

### 2. El orden de las condiciones importa

En la función, el chequeo de `!isOnline` es **el primero**. Si estás offline, no importa qué error haya sido — todo es NETWORK_ERROR.

Luego, 401/403 se chequean **antes** que Network/fetch. Esto significa que `"401 Network error"` daría TOKEN_INVALID, no NETWORK_ERROR. ¿Está bien? Sí, porque si el servidor responde con 401, hubo conexión — no es un error de red.

### 3. Bug real encontrado

```diff
- if (message.includes("Network") || message.includes("fetch")) {
+ if (message.toLowerCase().includes("network") || message.toLowerCase().includes("fetch")) {
```

La versión original no funcionaba con `"network timeout"` en minúscula (caso común). El test lo detectó y se corrigió.

## Resumen

| Archivo | Tests | Bug encontrado |
|---------|-------|---------------|
| `src/features/auth/domain/auth-error.test.ts` | **20 tests** | `"Network"` no detectaba `"network"` en minúscula (corregido) |

**Acumulado: 122 tests | 5 archivos | 100% passing**

### Cómo correr

```bash
pnpm test -- src/features/auth/domain/auth-error.test.ts
pnpm test:run
```
