# Estrategias de Resolución de Conflictos en Amauta

## ¿Qué es un conflicto?

Imaginá que un niño resuelve ejercicios **sin conexión a internet** (offline). Sus respuestas se guardan en una cola local (IndexedDB). Cuando vuelve a estar online, esas respuestas se envían al servidor.

Pero... ¿qué pasa si mientras estaba offline:

1. El mismo ejercicio **ya fue respondido** en otro dispositivo?
2. **Otro proceso** (ej: el padre desde su celular) modificó los mismos datos?
3. El servidor devuelve un error porque los datos locales están **desactualizados**?

Ahí nace un **conflicto**: los datos locales (lo que guardó el niño en su dispositivo) y los datos del servidor (lo que el backend tiene como verdad) **no coinciden**. Hay que decidir cuál usar.

---

## Las 4 estrategias de resolución

Todas están definidas en `src/lib/sync/conflict.ts`.

### 1. `"last-write-wins"` (gana el último que escribió) — **ESTRATEGIA POR DEFECTO**

```
LOCALTIME >= SERVERTIME → se queda el dato LOCAL
LOCALTIME <  SERVERTIME → se queda el dato del SERVIDOR
```

**Código** (`conflict.ts:16-35`):

```typescript
export function lastWriteWins(local, server, localTimestamp, serverTimestamp) {
  if (localTimestamp >= serverTimestamp) {
    return { data: local, source: "local", reason: "..." }
  }
  return { data: server, source: "server", reason: "..." }
}
```

**Ejemplo real:**

| Quién | Dato | Timestamp |
|-------|------|-----------|
| Local (niño offline) | `score: 10` | 12:05 hs |
| Servidor | `score: 20` | 11:30 hs |

→ **Gana local** porque 12:05 > 11:30. El servidor acepta `score: 10`. El progreso del niño no se pierde.

| Quién | Dato | Timestamp |
|-------|------|-----------|
| Local (niño offline) | `score: 10` | 11:00 hs |
| Servidor | `score: 20` | 12:05 hs |

→ **Gana servidor** porque 12:05 > 11:00. El dato local se descarta y se reemplaza con `score: 20`.

**¿Cuándo se usa?** Es la estrategia por defecto (`DEFAULT_STRATEGY`, línea 112) y se aplica cuando no se especifica otra. También es el **fallback** si se pasa una estrategia desconocida (líneas 102-108).

---

### 2. `"server-wins"` (siempre gana el servidor)

**Código** (`conflict.ts:37-43`):

```typescript
export function serverWins(_local, server) {
  return {
    data: server,
    source: "server",
    reason: "Server data always wins (server-wins strategy)"
  }
}
```

**Ejemplo real:**

| Quién | Dato |
|-------|------|
| Local (niño offline) | `role: "student"` |
| Servidor | `role: "parent"` |

→ **Gana servidor**. El rol del usuario **nunca** puede cambiarse desde el cliente. Aunque el niño envíe datos locales, el servidor impone su versión.

**¿Cuándo se usa?** Para datos que el servidor controla de forma absoluta: roles de usuario, permisos, configuraciones de seguridad.

---

### 3. `"client-wins"` (siempre gana el cliente)

**Código** (`conflict.ts:45-51`):

```typescript
export function clientWins(local, _server) {
  return {
    data: local,
    source: "local",
    reason: "Local data always wins (client-wins strategy)"
  }
}
```

**Ejemplo real:**

| Quién | Dato |
|-------|------|
| Local (niño offline) | `preferences: { theme: "dark" }` |
| Servidor | `preferences: { theme: "light" }` |

→ **Gana local**. La preferencia de tema del niño es personal y debe respetarse.

**¿Cuándo se usa?** Para preferencias del usuario, configuraciones locales, datos que son "propiedad" del cliente.

---

### 4. `"merge"` (mezclar ambos)

**Código** (`conflict.ts:95-100` dentro de `resolveConflict`):

```typescript
case "merge":
  return {
    data: { ...server, ...local },  // local sobreescribe server
    source: "merged",
    reason: "Merged local and server data"
  }
```

**Ejemplo real:**

```typescript
// Datos locales (niño offline)
const local = {
  score: 10,
  name: "Mario",
  meta: { level: 2, lives: 3 }
}

// Datos del servidor
const server = {
  score: 20,
  name: "Server",
  meta: { level: 5, world: 3, lives: 1 }
}

// Resultado del merge:
{ score: 10, name: "Mario", meta: { level: 2, lives: 3, world: 3 } }
//  score: 10  ← local gana (sobrescribe 20)
//  name: "Mario"  ← local gana
//  meta: { level: 2, lives: 3, world: 3 }  ← spread: primero server, luego local sobreescribe
```

**¿Cuándo se usa?** Para datos que quieren conservarse de ambos lados: progreso que se acumula, metadata que se mezcla.

---

## Tabla comparativa rápida

| Estrategia | Gana | Úsalo cuando... |
|-----------|------|----------------|
| `last-write-wins` | El más reciente | Caso general, es el **default** |
| `server-wins` | Servidor siempre | Datos críticos que controla el backend (roles, permisos) |
| `client-wins` | Cliente siempre | Preferencias del usuario, datos locales |
| `merge` | Ambos (local sobreescribe en spread) | Datos acumulativos que querés conservar de ambas fuentes |

---

## ¿Dónde se resuelven los conflictos en la aplicación?

### Las funciones están en `src/lib/sync/conflict.ts`

| Función | Líneas | ¿Qué hace? |
|---------|--------|-----------|
| `lastWriteWins()` | 24-43 | Compara timestamps, gana el más reciente |
| `serverWins()` | 45-51 | Siempre devuelve server |
| `clientWins()` | 53-60 | Siempre devuelve local |
| `mergeNumbers()` | 62-64 | Suma dos números |
| `mergeObjects()` | 66-83 | Merge de una clave específica |
| `resolveConflict()` | 85-119 | **Despachador**: elige la estrategia según el parámetro |
| `hasConflict()` | 123-125 | Compara si dos datos son diferentes (vía JSON.stringify) |
| `withTimestamps()` | 132-137 | Agrega timestamp a un objeto |
| `getTimestamp()` | 139-141 | Lee el timestamp de un objeto |
| `resolveMutationConflict()` | 162-186 | **NUEVO**: orquesta la resolución según el tipo de mutación, usando `MUTATION_STRATEGY` |

### `MUTATION_STRATEGY` — Mapa de estrategia por tipo de mutación

```typescript
export const MUTATION_STRATEGY: Record<string, ConflictStrategy> = {
  login: "server-wins",
  register: "server-wins",
  logout: "server-wins",
  addChild: "server-wins",
  submitAnswer: "server-wins",
  updateProgress: "merge",
  updateProfile: "last-write-wins",
  updatePreferences: "last-write-wins",
};
```

Cada tipo de mutación tiene una estrategia distinta según la naturaleza del dato:
- **`server-wins`** para auth y submits: el servidor es la autoridad (asigna IDs, computa scores)
- **`merge`** para `updateProgress`: los contadores se acumulan, no se sobrescriben
- **`last-write-wins`** para perfil/preferencias: el cambio más reciente debe prevalecer

### Flujo integrado en `queue-manager.ts` — RESOLUCIÓN CONECTADA

```
1. queueManager.processQueue()  ← se ejecuta cada 30s o al reconectar
         │
2. getQueuedMutationsByPriority()  ← obtiene las mutaciones pendientes
         │
3. for each mutation:
         │
4. executeMutation(mutation)  ← envía al servidor vía HTTP
         │
    ┌────┴────┐
    ✅ Éxito  ❌ Error → incrementRetryCount
    │                           │
    ▼                     ┌──────┴──────┐
    resolveMutationConflict  quedan    pasó límite
    (type, payload,           │            │
     response, createdAt)   esperar    marca como
    │                      reintentar  "failed"
    ├── no-conflict → removeMutation
    ├── conflict → resolveConflict(estrategia)
    │                ├── last-write-wins
    │                ├── server-wins
    │                ├── client-wins
    │                └── merge
    │                │
    │                ▼
    │           resolved.data → updateMutationStatus("done")
    │           removeMutation
    │
    conflicts++ (si source !== "no-conflict")
```

### Tambien en `queueMutation()` — path inline (online)

Cuando una mutación se ejecuta directamente por estar online, `queueMutation()` también aplica `resolveMutationConflict()` contra la respuesta del servidor:

```typescript
// queue-manager.ts ~línea 175
const resolved = resolveMutationConflict(type, payload, data, Date.now());
return { online: true, queued: false, data: resolved.resolved };
```

### Estado actual: ✅ RESOLUCIÓN DE CONFLICTOS CONECTADA

A partir de **junio 2026**, `conflict.ts` ya está conectado al `queue-manager.ts` en **dos puntos**:

| Punto | Ubicación | Cuándo se ejecuta |
|-------|-----------|-------------------|
| `processQueue()` | `queue-manager.ts:100-113` | Después de cada mutación exitosa de la cola offline |
| `queueMutation()` | `queue-manager.ts:175-182` | Después de cada llamada HTTP inline exitosa |

**¿Qué pasa con mock data (sin backend real)?**
- `hasConflict()` rara vez detecta conflictos porque el mock devuelve lo mismo que se envió
- El código de resolución está presente y correcto, pero no se activa
- Cuando el backend real devuelva `__serverTimestamp` + HTTP 409, la resolución empieza a funcionar automáticamente sin cambios en el frontend

**Próximo paso (backend):**
- Implementar `__serverTimestamp` en respuestas exitosas
- Implementar HTTP 409 Conflict con `serverData`
- Contrato detallado en [`BACKEND_CONFLICT_RESOLUTION.md`](../core/BACKEND_CONFLICT_RESOLUTION.md)

---

## Ejemplos visuales de cada estrategia

### `last-write-wins` — El más común

```typescript
// Niño responde ejercicio a las 14:30, punto de partida del servidor a las 14:00
lastWriteWins({ answer: "15/8" }, { answer: "3/4" }, 14:30, 14:00)
// → source: "local", data: { answer: "15/8" }

// Niño responde a las 14:00, pero servidor ya tenía update a las 14:30
lastWriteWins({ answer: "15/8" }, { answer: "3/4" }, 14:00, 14:30)
// → source: "server", data: { answer: "3/4" }
```

### `mergeNumbers` dentro de `mergeObjects`

```typescript
mergeObjects(
  { points: 10, completed: true },
  { points: 20, completed: true },
  "points"       // ← miramos la clave "points"
)
// → 30  (suma: 10 + 20 = 30, el niño no pierde puntos acumulados)
```

Este es el caso más común de merge: **puntos de experiencia que se acumulan**. El niño ganó 10 puntos offline y el servidor ya tenía registrados 20. En vez de elegir uno u otro, se **suman** → 30.

---

## ¿Por qué existen estas estrategias?

| Problema | Estrategia | Explicación |
|----------|-----------|-------------|
| Dos respuestas al mismo ejercicio | `last-write-wins` | La más reciente es la válida |
| El rol del usuario cambió en el backend | `server-wins` | El servidor es autoridad en permisos |
| El niño cambió su avatar/theme | `client-wins` | Las preferencias son personales |
| Puntos acumulados en ambos lados | `merge` (suma) | Nadie pierde progreso |
| Metadatos de perfil | `merge` (spread) | Se conserva información de ambas versiones |

---

## Archivos involucrados

| Archivo | Rol |
|---------|-----|
| `src/lib/sync/conflict.ts` | Define las 4 estrategias + `resolveMutationConflict()` + `MUTATION_STRATEGY` map |
| `src/lib/sync/queue-manager.ts` | Orquesta la sincronización con conflicto resolution integrado |
| `src/lib/sync/conflict.test.ts` | Tests de todas las funciones (43 tests, incluyendo 9 de `resolveMutationConflict`) |
| `src/lib/sync/queue-manager.test.ts` | Tests de integración con mocks (8 tests, cubre ambos paths de resolución) |
| `src/lib/sync/retry.ts` | Reintentos con exponential backoff (usado por queue-manager) |
| `src/docs/core/BACKEND_CONFLICT_RESOLUTION.md` | Contrato con el backend: timestamps, HTTP 409, estrategias por endpoint |
