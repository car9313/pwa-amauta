# Sistema de Cola Offline — App-Level Outbox

## Visión General

Amauta maneja mutations offline mediante un **sistema de outbox a nivel de aplicación (app-level)**. Cuando el usuario realiza una operación de escritura sin conexión, los datos se guardan en IndexedDB (Dexie) y se sincronizan automáticamente cuando la red se restaura.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          FLUJO DE MUTACIÓN                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Usuario → useSafeMutation.mutate(payload)                                  │
│                    │                                                        │
│                    ▼                                                        │
│         ┌─────────────────────┐                                             │
│         │ ¿navigator.onLine?  │                                             │
│         └─────┬─────────┬────┘                                             │
│               │         │                                                   │
│          ONLINE       OFFLINE                                               │
│               │         │                                                   │
│               ▼         ▼                                                   │
│         ┌────────┐ ┌──────────┐                                            │
│         │ HTTP   │ │ Encolar  │                                            │
│         │ directo│ │ en Dexie │                                            │
│         └───┬────┘ └────┬─────┘                                            │
│             │           │                                                  │
│             ▼           ▼                                                  │
│      ┌──────────┐ ┌──────────┐                                             │
│      │ Retornar  │ │ Retornar │                                            │
│      │ data     │ │ QUEUED_  │                                            │
│      │ real     │ │ OFFLINE  │                                            │
│      └──────────┘ └──────────┘                                             │
│                        │                                                  │
│                        ▼ (cuando hay red)                                 │
│               ┌────────────────┐                                           │
│               │ background-    │                                           │
│               │ sync.ts detecta│                                           │
│               │ online + cola  │                                           │
│               │ → processQueue │                                           │
│               └────────────────┘                                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Arquitectura

```
┌──────────────────────────────────────────────────────────────────────┐
│                        COMPONENTES (UI)                              │
│  ┌──────────────────────┐  ┌──────────────────────┐                 │
│  │   Componente         │  │   ConnectionStatus   │                 │
│  │   (ej: LessonPage)   │  │   (banner offline)   │                 │
│  └────────┬─────────────┘  └──────────────────────┘                 │
│           │                                                         │
│           ▼                                                         │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │              useSafeMutation (hook)                         │   │
│  │  - mutationFn: HTTP call                                    │   │
│  │  - optimisticUpdate: feedback instantáneo                   │   │
│  │  - offline: { type, endpoint, method } → queueMutation()    │   │
│  │  - tentativeOnly: muestra "enviado" sin score falso         │   │
│  └─────────────────────────┬───────────────────────────────────┘   │
└────────────────────────────┼───────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────────┐
│                     CAPA DE SINCRONIZACIÓN                          │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │              queue-manager.ts                                │   │
│  │  - isOnline() → navigator.onLine                            │   │
│  │  - queueMutation(type, payload, endpoint, method)           │   │
│  │      → online: ejecuta HTTP directo                         │   │
│  │      → online + HTTP fail: encola para retry                │   │
│  │      → offline: encola en Dexie                             │   │
│  │  - processQueue() → procesa cola por prioridad              │
│  │      + resolución de conflictos por tipo                    │   │
│  │  - triggerSync() → force sync si hay pendientes             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │              background-sync.ts                              │   │
│  │  - initBackgroundSync({ intervalMs, autoSync })             │   │
│  │  - startBackgroundSync() → setInterval + event listeners    │   │
│  │  - Escucha eventos 'online'/'offline'                       │   │
│  │  - Llama a processQueue() cuando hay red + pendientes       │   │
│  └─────────────────────────────────────────────────────────────┘   │
└────────────────────────────┼───────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────────┐
│                      PERSISTENCIA (Dexie)                           │
│                                                                     │
│  IndexedDB: amauta-db                                               │
│  ┌──────────────────────────────────────────────────────────┐      │
│  │  Table: mutations                                        │      │
│  │  ┌─────────────────────┬──────────────┬──────────────┐  │      │
│  │  │ Campo               │ Tipo         │ Indexado?    │  │      │
│  │  ├─────────────────────┼──────────────┼──────────────┤  │      │
│  │  │ id                  │ string       │ PK           │  │      │
│  │  │ type               │ string       │ Sí           │  │      │
│  │  │ payload            │ unknown      │ No           │  │      │
│  │  │ endpoint           │ string       │ No           │  │      │
│  │  │ method             │ string       │ No           │  │      │
│  │  │ priority           │ number       │ Sí           │  │      │
│  │  │ retryCount         │ number       │ No           │  │      │
│  │  │ status             │ string       │ Sí           │  │      │
│  │  │ createdAt          │ number       │ Sí           │  │      │
│  │  │ lastAttemptAt      │ number|null  │ No           │  │      │
│  │  │ errorMessage       │ string|null  │ No           │  │      │
│  │  │ result             │ unknown|null │ No           │  │      │
│  │  └─────────────────────┴──────────────┴──────────────┘  │      │
│  └──────────────────────────────────────────────────────────┘      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Archivos del Sistema

| Archivo | Rol | Exporta |
|---------|-----|---------|
| `src/lib/api/storage/db.ts` | Schema Dexie unificado (`amauta-db`), define tabla `mutations` | `db`, `QueuedMutation` |
| `src/lib/api/storage/offline-queue.ts` | CRUD de mutations en Dexie | `enqueueMutation`, `getQueuedMutationsByPriority`, `updateMutationStatus`, `removeMutation`, `getPendingCount`, `incrementRetryCount` |
| `src/lib/sync/queue-manager.ts` | Lógica de cola, ejecución HTTP, procesamiento por prioridad + conflict resolution | `queueMutation`, `processQueue`, `triggerSync`, `getQueueState`, `isOnline`, `clearQueue` |
| `src/lib/sync/background-sync.ts` | Inicialización automática, listeners online/offline, intervalo | `initBackgroundSync`, `startBackgroundSync`, `stopBackgroundSync`, `onSyncEvent` |
| `src/lib/sync/useSafeMutation.ts` | Hook React unificado (reemplaza useOfflineMutation) | `useSafeMutation` |
| `src/lib/sync/retry.ts` | Exponential backoff, límites | `shouldRetry`, `getRetryDelay`, `waitWithRetry` |
| `src/lib/sync/conflict.ts` | Estrategias de resolución de conflictos + `resolveMutationConflict()` | `lastWriteWins`, `resolveConflict`, `serverWins`, `clientWins`, `resolveMutationConflict`, `MUTATION_STRATEGY` |
| `src/lib/auth/http-client.ts` | Cliente HTTP centralizado con auth y refresh | `httpClient` (usado por queue-manager para ejecutar HTTP) |

---

## Tipos de Mutación y Prioridades

`src/lib/api/storage/offline-queue.ts`:

```typescript
export type MutationType =
  | "login"         // Prioridad 1 (Alta)
  | "register"      // Prioridad 1 (Alta)
  | "logout"        // Prioridad 1 (Alta)
  | "submitAnswer"  // Prioridad 1 (Alta) — respuesta de ejercicio
  | "addChild"      // Prioridad 2 (Media)
  | "updateProgress"// Prioridad 2 (Media)
  | "updateProfile" // Prioridad 3 (Baja)
  | "updatePreferences"; // Prioridad 3 (Baja)
```

| Prioridad | Valor | Mutaciones |
|-----------|-------|------------|
| Alta | 1 | login, register, logout, submitAnswer |
| Media | 2 | addChild, updateProgress |
| Baja | 3 | updateProfile, updatePreferences |

---

## Flujo Detallado

### 1. Online: Mutación vía HTTP

1. Componente llama `useSafeMutation.mutate(payload)`
2. `useSafeMutation` aplica `optimisticUpdate` al cache local (feedback instantáneo)
3. `mutationFn` se ejecuta → si hay red ejecuta HTTP directo
4. `onSettled`: si `tentativeOnly` es false, invalida query para refrescar datos reales
5. **Si HTTP falla:** la mutación se encola en Dexie para retry automático

### 2. Offline: Mutación se encola

1. Componente llama `useSafeMutation.mutate(payload)`
2. `useSafeMutation` aplica `optimisticUpdate` al cache local
3. `mutationFn` detecta `!navigator.onLine` + `offline` config
4. Llama a `queueManager.queueMutation()` → `offlineQueue.enqueueMutation()`
5. Mutation guardada en Dexie con `status: "pending"`
6. Hook retorna símbolo `QUEUED_OFFLINE` (componente puede mostrar "Guardado offline")
7. `onSettled` detecta `QUEUED_OFFLINE` y **no** invalida queries (datos falsos)

### 3. Reconexión: Sincronización automática

1. `background-sync.ts` escucha evento `online` de `window`
2. `handleOnline()` → verifica si hay mutations pendientes
3. Si hay pendientes → `triggerSync()` → `processQueue()`
4. El intervalo de 30s también ejecuta `processQueue()` si hay cola + online
5. `processQueue()` ordena mutations por prioridad (1 → 2 → 3)
6. Por cada mutation: ejecuta HTTP, si éxito aplica `resolveMutationConflict()` (compara payload vs respuesta del servidor, resuelve según `MUTATION_STRATEGY`), si falla incrementa retryCount
7. Si hay conflicto detectado: incrementa contador `conflicts` en el resultado de `processQueue()`, actualiza `mutation.result` con el dato resuelto
8. Después de 3 fallos → `status: "failed"`

### 4. Retry con Exponential Backoff

```
Intento 0: espera 1s    → si falla → retryCount = 1
Intento 1: espera 2s    → si falla → retryCount = 2
Intento 2: espera 4s    → si falla → retryCount = 3
Intento 3: no reintenta → status = "failed"
```

Fórmula: `delay = min(1000 * 2^attempt, 30000)`

---

## useSafeMutation (Hook Principal)

`src/lib/sync/useSafeMutation.ts`

### Interfaz

```typescript
interface UseSafeMutationOptions<TData, TPayload> {
  mutationFn: (payload: TPayload) => Promise<TData>;
  queryKey: readonly unknown[] | ((payload: TPayload) => readonly unknown[]);
  optimisticUpdate?: (oldData: unknown, payload: TPayload) => unknown;
  offline?: {
    type: MutationType;
    endpoint: string | ((payload: TPayload) => string);
    method: "POST" | "PUT" | "PATCH" | "DELETE";
  };
  tentativeOnly?: boolean;
}
```

### Comportamiento

| Opción | Efecto |
|--------|--------|
| `mutationFn` | Función HTTP que se ejecuta cuando hay conexión |
| `queryKey` | Clave de TanStack Query para optimistic update + invalidación. Puede ser función para claves dinámicas. |
| `optimisticUpdate` | Transforma el cache local inmediatamente. Si es `undefined`, no hay optimistic update. |
| `offline` | Configuración para encolar en Dexie cuando no hay red. Si es `undefined`, la mutación falla offline. |
| `tentativeOnly` | `true` = solo marca como "enviado" sin modificar datos reales. `false` = aplica optimisticUpdate completo. |

### Uso

```typescript
import { useSafeMutation } from "@/lib/sync/useSafeMutation";

const { mutate, isPending } = useSafeMutation({
  mutationFn: (payload) => submitAnswer(studentId, payload),
  queryKey: exerciseKeys.next(studentId),
  tentativeOnly: true,
  optimisticUpdate: (old) => ({ ...old, _submitted: true }),
  offline: {
    type: "submitAnswer",
    endpoint: `/students/${studentId}/exercises/${exerciseId}/submit`,
    method: "POST",
  },
});
```

---

## Inicialización

En `src/App.tsx`:

```typescript
useEffect(() => {
  initBackgroundSync({ intervalMs: 30000, autoSync: true });
}, []);
```

Esto activa:
- Listener `online` → procesa cola automáticamente al reconectar
- Intervalo cada 30s → procesa cola si hay pendientes
- Procesamiento inicial al mount si hay mutations pendientes + conexión

---

## Integración con el Service Worker

El **Service Worker** NO maneja la cola offline. Su rol es exclusivamente caching:

| Ruta | Estrategia | Cache |
|------|------------|-------|
| Imágenes | CacheFirst | `images-cache-v1` |
| API GET | NetworkFirst (5s timeout) | `api-get-cache-v1` |
| Scripts/CSS/Fonts | StaleWhileRevalidate | `static-resources-v1` |
| API POST | NetworkOnly (sin plugins) | — |
| Navegación SPA | StaleWhileRevalidate + PrecacheFallback | `navigation-cache-v1` |

**API POST usa `NetworkOnly` sin `BackgroundSyncPlugin`.** El sistema de cola es 100% app-level (Dexie + queue-manager). Esto evita doble encolado.

---

## UI de Estado

### ConnectionStatus

Renderizado en `AmautaLayout`. Muestra banner ámbar fijo en el top cuando:
- No hay conexión a internet
- Hay un error de autenticación (`lastAuthError`)

### UpdateToast

Renderizado en `App.tsx`. Aparece cuando hay una nueva versión del SW:
- Listener `app:show-update-toast` (disparado por `sw:need-refresh`)
- Botón "Actualizar ahora" → llama `triggerUpdate()` → `skipWaiting` → recarga

---

## Debugging

### Consola del navegador

```javascript
// Ver mutations en cola
const { db } = await import("/src/lib/api/storage/db.js");
await db.mutations.where({ status: "pending" }).toArray();

// Estado del sync
import { getQueueState } from "/src/lib/sync/queue-manager.js";
await getQueueState();

// Forzar sync manual
import { triggerSync } from "/src/lib/sync/queue-manager.js";
await triggerSync();
```

### DevTools

1. **Application** → IndexedDB → `amauta-db` → `mutations`
2. **Network** → filtrar por API calls
3. **Console** → filtrar errores de sync

---

## Diferencias con Implementaciones Anteriores

| Aspecto | Sistema Anterior | Sistema Actual |
|---------|-----------------|----------------|
| DB de cola | `amauta-offline-queue` (DB separada) | `amauta-db.mutations` (tabla en DB unificada) |
| Hook principal | `useOfflineMutation` | `useSafeMutation` |
| Service Worker | `BackgroundSyncPlugin` encolaba POSTs | `NetworkOnly` sin plugin |
| Listener sync en SW | Presente | Eliminado (no hay sync nativo) |
| `onMutate` sin offline | `queueMutation()` no ejecutaba HTTP | `queueMutation()` ejecuta HTTP si hay red |
| Feedback offline | Toast + `isQueued: true` | `QUEUED_OFFLINE` symbol |
| Optimistic updates | No existían | `optimisticUpdate` + `tentativeOnly` |
