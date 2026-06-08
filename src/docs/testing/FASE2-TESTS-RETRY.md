# Fase 2: Tests de `retry.ts` — Unidades Puras

## Objetivo

Escribir los primeros tests de la aplicación. Elegimos `src/lib/sync/retry.ts` porque tiene funciones **puras**: entran datos, salen datos, sin efectos secundarios, sin React, sin async. Ideales para aprender.

---

## ¿Qué es una función pura?

Una función pura:
- Dada la misma entrada, **siempre** devuelve la misma salida
- No modifica nada fuera de la función (no hay side effects)

```typescript
// ✅ PURA: siempre devuelve lo mismo para los mismos inputs
function getRetryDelay(attempt: number): number {
  return Math.min(1000 * 2 ** attempt, 30000)
}

// ❌ IMPURA: depende de algo externo
let counter = 0
function nextId() {
  return counter++  // cada llamada devuelve algo diferente
}
```

Las funciones puras son las más fáciles de testear porque no necesitás preparar nada — solo llamás la función y verificás el resultado.

---

## Las 4 funciones que testeamos

### 1. `getRetryDelay(attempt)`

**Lógica:** Implementa exponential backoff. El tiempo de espera crece exponencialmente con cada intento.

```
delays = 1000ms × 2^attempt
attempt 0 → 1000ms × 1 =  1000ms
attempt 1 → 1000ms × 2 =  2000ms
attempt 2 → 1000ms × 4 =  4000ms
attempt 3 → 1000ms × 8 =  8000ms
attempt 4 → 1000ms × 16 = 16000ms
attempt 5 → 1000ms × 32 = 32000ms → pero el límite es 30000ms, así que devuelve 30000
```

**Tests escritos:**

```typescript
it('returns 1000ms for attempt 0 (2^0 * 1000)', () => {
  expect(getRetryDelay(0)).toBe(1000)
})

it(`caps at ${MAX_RETRY_DELAY_MS}ms (attempt 5 would be 32000 without cap)`, () => {
  expect(getRetryDelay(5)).toBe(MAX_RETRY_DELAY_MS)
})
```

**Conceptos nuevos:**
- `expect(valor).toBe(esperado)` — el matcher más básico. Usa `===` para comparar
- La prueba documenta el comportamiento esperado: "con attempt 5, devuelve 30000 porque está capado"

### 2. `shouldRetry(attempt, maxAttempts)`

**Lógica:** Retorna `true` si `attempt < maxAttempts`.

```typescript
it('returns false when attempt equals maxAttempts (3)', () => {
  expect(shouldRetry(3)).toBe(false)  // attempt 3, default max es 3 → 3 < 3 es false
})
```

**Conceptos nuevos:**
- **Valores por defecto**: cuando no pasás `maxAttempts`, usa 3
- Múltiples asserts en un mismo test (para `custom maxAttempts` probamos 4 casos)

### 3. `formatRetryDelay(attempt)`

**Lógica:** Convierte milisegundos a texto legible.

```
1000ms  → "1s"
30000ms → "30s"
60000ms → "1m"    (no se alcanza con la config por defecto)
```

Esta función llama internamente a `getRetryDelay`. Estamos probando la combinación de ambas.

**Conceptos nuevos:**
- **Tests de integración chica**: aunque queremos probar `formatRetryDelay`, indirectamente también estamos probando que `getRetryDelay` funciona

### 4. `isRetryableError(error)`

**Lógica:** Determina si un error se puede reintentar.

```typescript
it('returns true when message includes "network"', () => {
  const error = new Error('Network error: connection lost')
  expect(isRetryableError(error)).toBe(true)
})

it('returns false for non-retryable errors', () => {
  const error = new Error('Invalid credentials')
  expect(isRetryableError(error)).toBe(false)
})
```

**Conceptos nuevos:**
- **Crear errores manualmente**: `new Error('mensaje')` para simular diferentes escenarios
- **Casos borde**: `null`, `undefined`, objetos que no son Error
- **Case insensitive**: el error `ECONNRESET` en mayúsculas se detecta aunque el mensaje real venga en minúsculas

---

## Estructura del archivo de test

```
src/lib/sync/
├── retry.ts        ← El código original (sin cambios)
└── retry.test.ts   ← El test (NUEVO)
```

Usamos `describe` para agrupar tests relacionados y `it` para cada caso individual:

```typescript
import { describe, it, expect } from 'vitest'  // solo si globals: false

describe('getRetryDelay', () => {     // ← Grupo: todos los tests de esta función
  it('returns 1000ms for attempt 0', () => {  // ← Test individual
    expect(getRetryDelay(0)).toBe(1000)
  })
  // más tests...
})
```

**Regla de oro:** cada `it` debe probar **una sola cosa**. Si el test falla, sabés exactamente qué salió mal.

---

## Cómo correr los tests

```bash
# Todos los tests
pnpm test:run

# Solo este archivo en particular
pnpm test -- src/lib/sync/retry.test.ts

# Modo watch (se queda escuchando cambios)
pnpm test src/lib/sync/retry.test.ts --watch
```

## Salida esperada

```
 ✓ src/lib/sync/retry.test.ts (30 tests) 4ms

 Test Files  1 passed (1)
      Tests  30 passed (30)
```

---

## Conceptos clave para principiantes

### 1. `describe` e `it`

```typescript
describe('getRetryDelay', () => {
  it('hace algo específico', () => {
    // test
  })
})
```

- `describe` es un **contenedor** que agrupa tests. No afecta la ejecución, solo organiza
- `it` es cada **test individual**. Su nombre debe describir QUÉ debería pasar
- Cuando un test falla, leés el nombre del `describe` + el `it` y sabés qué se rompió

### 2. `expect` y matchers

```typescript
expect(getRetryDelay(0)).toBe(1000)
```

- `expect( valor_real )` envuelve el valor que querés verificar
- `.toBe( valor_esperado )` es un "matcher" — verifica que sea igual

Matchers comunes:
| Matcher | Para qué sirve |
|---------|---------------|
| `toBe(x)` | Compara valores primitivos (números, strings, booleanos) |
| `toEqual(x)` | Compara objetos/arrays por valor |
| `toBe(true/false)` | Para booleanos |
| `toBeNull()` | Para null |
| `toBeUndefined()` | Para undefined |

### 3. El patrón AAA (Arrange, Act, Assert)

```
// Arrange: preparar los datos
const error = new Error('Network error')

// Act: ejecutar la función
const result = isRetryableError(error)

// Assert: verificar el resultado
expect(result).toBe(true)
```

En tests simples, Arrange y Act suelen estar en la misma línea.

### 4. ¿Por qué tests tan detallados?

Parece repetitivo tener tests para attempt 0, 1, 2, 3, 4, 5. Pero:

- Documentan el comportamiento exacto de la función (son documentación viva)
- Si alguien cambia la fórmula sin querer (ej: `2 ** (attempt + 1)`), los tests fallan
- Cada test es independiente — si uno falla, los otros siguen dando información

---

## Resumen de la Fase 2

```
Archivos creados:
├── src/lib/sync/retry.test.ts    ← 30 tests para 4 funciones
└── src/docs/testing/
    └── FASE2-TESTS-RETRY.md      ← Esta documentación
```

| Función | Tests | ¿Qué cubrimos? |
|---------|-------|----------------|
| `getRetryDelay` | 7 | Exponential backoff, cap a 30s |
| `shouldRetry` | 7 | Límite de intentos, custom max, default |
| `formatRetryDelay` | 6 | Formato legible para humanos |
| `isRetryableError` | 10 | Keywords, case insensitive, null, objetos |

Todos los tests pasan ✅ — 30/30 en 4ms.
