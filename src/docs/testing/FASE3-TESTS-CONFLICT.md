# Fase 3: Tests de `conflict.ts` — Resolución de Conflictos

## Objetivo

Testear el sistema de resolución de conflictos. Cuando una mutación offline se sincroniza, puede haber diferencias entre lo que guardó el cliente (local) y lo que está en el servidor (server). Estas funciones deciden qué datos usar.

---

## Las 9 funciones que testeamos

### 1. `lastWriteWins(local, server, localTimestamp, serverTimestamp)`

**Lógica:** Gana el dato con el timestamp más reciente.

```
localTimestamp >= serverTimestamp → gana local
localTimestamp <  serverTimestamp → gana server
```

**Novedad en estos tests:**

```typescript
it('returns local when local timestamp is newer', () => {
  const result = lastWriteWins(local, server, 2000, 1000)
  expect(result.data).toEqual(local)    // ← toEqual, no toBe
  expect(result.source).toBe('local')
  expect(result.reason).toContain('newer')  // ← toContain para strings parciales
})
```

| Matcher nuevo | ¿Qué hace? |
|--------------|------------|
| `toEqual(obj)` | Compara objetos por **valor** (no por referencia). `toBe` usa `===` que falla con objetos aunque tengan el mismo contenido |
| `toContain('texto')` | Verifica que un string contenga ese substring. Útil cuando el texto exacto incluye fechas dinámicas |

### 2. `serverWins(local, server)` — Siempre gana el servidor

```typescript
it('ignora completamente el dato local', () => {
  const result = serverWins({ mine: true }, { server: true })
  expect(result.data).toEqual({ server: true })
  expect(result.source).toBe('server')
})
```

### 3. `clientWins(local, server)` — Siempre gana el cliente

```typescript
it('ignora completamente el dato del servidor', () => {
  const result = clientWins({ local: true }, { server: true })
  expect(result.data).toEqual({ local: true })
  expect(result.source).toBe('local')
})
```

### 4. `mergeNumbers(local, server)` — Suma simple

```typescript
it('adds local and server numbers', () => {
  expect(mergeNumbers(10, 20)).toBe(30)     // 10 + 20
  expect(mergeNumbers(-5, 3)).toBe(-2)      // números negativos
  expect(mergeNumbers(1.5, 2.5)).toBe(4)    // decimales
})
```

### 5. `mergeObjects(local, server, key)` — Merge por clave

Dependiendo del tipo de valor en la clave:

| Tipo | Estrategia | Ejemplo |
|------|-----------|---------|
| Número | Suma (`local + server`) | `score: 10 + 20 = 30` |
| Objeto | Spread: `{...server, ...local}` | `{b:99, c:3, a:1}` |
| Otro | `local ?? server` | string, boolean, etc. |

```typescript
it('merges object values by spreading', () => {
  const local = { meta: { a: 1, b: 2 } }
  const server = { meta: { b: 99, c: 3 } }
  const result = mergeObjects(local, server, 'meta')
  expect(result).toEqual({ b: 2, c: 3, a: 1 })
  // local sobrescribe server: b pasa de 99 → 2
})
```

### 6. `resolveConflict(strategy, data)` — El despachador

Toma una estrategia y los datos, y llama a la función correspondiente.

```typescript
const data = {
  local: { x: 1 }, server: { x: 2 },
  localTimestamp: 2000, serverTimestamp: 1000,
}

resolveConflict('last-write-wins', data)  // → { x: 1 }, source: 'local'
resolveConflict('server-wins', data)      // → { x: 2 }, source: 'server'
resolveConflict('client-wins', data)      // → { x: 1 }, source: 'local'
resolveConflict('merge', data)            // → { x: 1 }, source: 'merged'
resolveConflict('unknown', data)          // → cae a default: last-write-wins
```

**Novedad:** El `merge` hace un spread `{...server, ...local}`, donde **local sobrescribe a server**.

### 7. `hasConflict(local, server)` — Compara con JSON

```typescript
it('detects that [1,2] differs from [2,1]', () => {
  expect(hasConflict([1, 2], [2, 1])).toBe(true)
  // JSON.stringify([1,2]) = "[1,2]"
  // JSON.stringify([2,1]) = "[2,1]"
  // Son diferentes → hay conflicto
})
```

### 8. `withTimestamps(data, timestamp)` — Agrega timestamp

```typescript
it('does not mutate the original object', () => {
  const original = { name: 'test' }
  const result = withTimestamps(original, 12345)
  expect(original).not.toHaveProperty('__localTimestamp')  // ← toHaveProperty
  expect(result.__localTimestamp).toBe(12345)
})
```

| Matcher nuevo | ¿Qué hace? |
|--------------|------------|
| `toHaveProperty('prop')` | Verifica que un objeto tenga esa propiedad |
| `.not.` | Invierte el matcher. `expect(x).not.toBe(y)` significa "x NO es y" |

### 9. `getTimestamp(data)` — Lee o genera timestamp

```typescript
it('returns current time when __localTimestamp is missing', () => {
  const before = Date.now()
  const result = getTimestamp({})
  const after = Date.now()
  expect(result).toBeGreaterThanOrEqual(before)
  expect(result).toBeLessThanOrEqual(after)
})
```

| Matcher nuevo | ¿Qué hace? |
|--------------|------------|
| `toBeGreaterThanOrEqual(x)` | Resultado >= x |
| `toBeLessThanOrEqual(x)` | Resultado <= x |

Esto se llama **pinning**: no sabemos exactamente qué valor va a devolver `Date.now()`, pero sabemos que tiene que estar entre `before` y `after`.

---

## Conceptos nuevos en esta fase

### 1. `toEqual` vs `toBe`

```typescript
const a = { x: 1 }
const b = { x: 1 }

expect(a).toBe(b)    // ❌ FALLA — son diferentes objetos en memoria
expect(a).toEqual(b) // ✅ PASA — tienen el mismo contenido
```

- `toBe` usa `Object.is()` (como `===`)
- `toEqual` hace una comparación profunda ("deep equality") — revisa cada propiedad

### 2. Verificar strings parciales con `toContain`

Cuando un mensaje incluye datos dinámicos (fechas, IDs), no podés saber el texto exacto:

```typescript
// El mensaje real es:
// "Local data (2024-01-01T00:00:00.000Z) is newer than server (2023-01-01T00:00:00.000Z)"

// No podés saber la fecha exacta, pero sabés que contiene "newer":
expect(result.reason).toContain('newer')  // ✅
expect(result.reason).toBe('...')         // ❌ falla porque la fecha cambia cada vez
```

### 3. `not` — Invertir matchers

Cualquier matcher se puede invertir con `.not`:

```typescript
expect(original).not.toHaveProperty('__localTimestamp')  // la propiedad NO existe
expect(hasConflict({a:1}, {a:1})).not.toBe(true)         // NO es true
```

### 4. Rango de valores con timestamps

Para valores no-determinísticos como `Date.now()`, verificamos que estén en un rango:

```typescript
const before = Date.now()
const result = getTimestamp({})
const after = Date.now()
expect(result).toBeGreaterThanOrEqual(before)
expect(result).toBeLessThanOrEqual(after)
```

Esto es más confiable que mockear `Date.now()` para un test simple.

---

## Resumen de la Fase 3

```
Archivos creados:
├── src/lib/sync/conflict.test.ts    ← 34 tests para 9 funciones
└── src/docs/testing/
    └── FASE3-TESTS-CONFLICT.md      ← Esta documentación
```

| Función | Tests | Conceptos nuevos |
|---------|-------|-----------------|
| `lastWriteWins` | 4 | `toEqual`, `toContain` |
| `serverWins` | 2 | Objetos como datos de prueba |
| `clientWins` | 2 | Null como valor válido |
| `mergeNumbers` | 4 | Negativos, decimales |
| `mergeObjects` | 5 | Spread merge, tipos mixtos |
| `resolveConflict` | 5 | Dispatcher, fallback default |
| `hasConflict` | 6 | JSON.stringify, arrays |
| `withTimestamps` | 3 | `toHaveProperty`, `.not` |
| `getTimestamp` | 3 | `toBeGreaterThanOrEqual`, rango |

**Total acumulado: 64 tests | 2 archivos | 100% passing**

---

### Cómo correr

```bash
# Todos los tests (retry + conflict ahora)
pnpm test:run

# Solo conflict
pnpm test -- src/lib/sync/conflict.test.ts
```
