# Offline Mutations - Flujo y Arquitectura

## Arquitectura General

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PWA Amauta - Offline Mutations                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    COMPONENTES (UI)                              │   │
│  │  ┌─────────────────┐  ┌──────────────────────────────────┐   │   │
│  │  │ useOffline      │  │ ConnectionStatus                 │   │   │
│  │  │ Mutation()     │  │ - isOnline/isSyncing/pending     │   │   │
│  │  │ - mutate()     │  │ - triggerSync()              │   │   │
│  │  │ - isQueued     │  │ - UI: wifi status + count     │   │   │
│  │  └────────┬──────┘  └────────────────┬───────────────────┘   │   │
│  │           │                         │                          │   │
│  │           │          ┌──────────────┴──────────────┐            │   │
│  │           │         │                          │            │   │
│  │           ▼         ▼                          ▼            │   │
│  │  ┌────────────────────────────────────────────────────────────┐  │   │
│  │  │              TanStack Query (React)                       │  │   │
│  │  │  queryClient.invalidateQueries() on sync complete        │  │   │
│  │  └────────────────────────────────────────────────────────────┘  │   │
│  │                         │                                    │   │
│  └─────────────────────────┼──────────────────────────────────────────┘   │
│                            │                                         │
└────────────────────────────┼─────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    CAPA DE SINCRONIZACIÓN                              │
├────────────────────────────────────────────────��────────────────────────────┤
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │          background-sync.ts (Inicialización Automática)             │  │
│  │                                                                  │  │
│  │  initBackgroundSync({ intervalMs: 30000, autoSync: true })        │  │
│  │       │                                                            │  │
│  │       ├──► setInterval cada 30s (configurable)                    │  │
│  │       │                                                            │  │
│  │       └──► Event Listeners: online / offline                     │  │
│  │                                                                  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                            │                                         │
│                            ▼                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                 queue-manager.ts                                   │  │
│  │                                                                  │  │
│  │  isOnline() ──────────────► navigator.onLine                     │  │
│  │                                                                  │  │
│  │  queueMutation() ────────► enqueueMutation() ──► Dexie         │  │
│  │                                                                  │  │
│  │  processQueue() ─────────► getQueuedMutationsByPriority()         │  │
│  │       │                          │                                 │  │
│  │       │                          ▼                                 │  │
│  │       │               ┌──────────────────────┐                  │  │
│  │       │               │ FOR each mutation    │                  │  │
│  │       │               │  1. Execute HTTP    │                  │  │
│  │       │               │  2. Success? → rm  │                  │  │
│  │       │               │  3. Fail? → retry  │                  │  │
│  │       │               │  4. Retry exhausted │                  │  │
│  │       │               │     → failed status  │                  │  │
│  │       │               └──────────────────────┘                  │  │
│  │                                                                  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                            │                                         │
└────────────────────────────┼─────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────��──────────────────────────────────────────────────────────┐
│                    PERSISTENCIA (Dexie)                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  IndexedDB: amauta-offline-queue (v1)                                  │
│  ┌──────────────────────────────────────────────────────────────┐         │
│  │  mutations (EntityTable)                               │         │
│  │  ───────────────────────────────────────────────────  │         │
│  │  id: string (UUID)           ← Primary Key            │         │
│  │  type: MutationType         ← login|register|...    │         │
│  │  payload: unknown            ← Data a enviar           │         │
│  │  endpoint: string           ← /api/parents/...       │         │
│  │  method: string             ← POST|PUT|PATCH|DELETE │         │
│  │  priority: 1|2|3            ← Alta|Media|Baja     │         │
│  │  retryCount: number        ← Intentos (max 3)       │         │
│  │  status: string             ← pending|syncing|... │         │
│  │  createdAt: number          ← Timestamp            │         │
│  │  lastAttemptAt: number|null ← Retry timestamp       │         │
│  │  errorMessage: string|null  ← Error si falla       │         │
│  │  result: unknown|null       ← Response si ok      │         │
│  └──────────────────────────────────────────────────────────────┘         │
│                                                                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Flujo 1: Mutation Online (Happy Path)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  MUTATION ONLINE - Flujo Normal                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Usuario          UI              queueManager         Servidor         │
│    │               │                  │                │                │
│    │  mutate()    │                  │                │                │
│    │─────────────▶│                  │                │                │
│    │              │                  │                │                │
│    │              │ queueMutation()  │                │                │
│    │              │─────────────────▶│                │                │
│    │              │                  │                │                │
│    │              │ isOnline() = true │                │                │
│    │              │◀─────────────────│                │                │
│    │              │                  │                │                │
│    │              │  returns { online: true, queued: false }            │
│    │◀─────────────│                  │                │                │
│    │              │                  │                │                │
│    │              │     HTTP POST    │                │                │
│    │              │───────────────────────────────────────────────▶│ │
│    │              │                  │                │                │
│    │              │                  │◀────────────── 200 OK              │
│    │              │                  │                │                │
│    │              │◀───────────────│ invalidateQueries()           │
│    │◀─────────────│                  │                │                │
│    │              │                  │                │                │
│    │  ✅ Listo!   │                  │                │                │
│    │◀─────────────│                  │                │                │
│                                                                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Flujo 2: Mutation Offline + Sync

```
┌────────────────────────────────��────────────────────────────────────────────┐
│  MUTATION OFFLINE + SYNC AUTO - Flujo Completo                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. OFFLINE - Mutation se encola                                     │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                      │
│  Usuario          UI              queueManager         IndexedDB     │
│    │               │                  │                │                │
│    │  mutate()    │                  │                │                │
│    │─────────────▶│                  │                │                │
│    │              │                  │                │                │
│    │              │ queueMutation()  │                │                │
│    │              │─────────────────▶│                │                │
│    │              │                  │                │                │
│    │              │ isOnline() = false│                │                │
│    │              │◀─────────────────│                │                │
│    │              │                  │                │                │
│    │              │ enqueueMutation(type, payload, endpoint)         │
│    │              │                  │─────────────────▶│                │
│    │              │                  │                │                │
│    │              │   { online: false, queued: true, mutationId }│
│    │◀─────────────│                  │                │                │
│    │              │                  │                │                │
│    │  Toast: "Guardado offline"    │                │                │
│    │◀─────────────│                  │                │                │
│                                                                      │
│  2. ONLINE DETECTED - Background Sync                               │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                      │
│  window.addEventListener("online", ...)                            │
│    │                                                               │
│    ▼                                                               │
│  ConnectionStatus.detecta online                                 │
│    │                                                               │
│    ▼                                                               │
│  triggerSync()                                                    │
│    │                                                               │
│    ▼                                                               │
│  processQueue()                                                   │
│    │                                                               │
│    ▼                                                               │
│  getQueuedMutationsByPriority()  ──► Orden: 1→2→3              │
│    │                                                               │
│    ▼                                                               │
│  ┌──────────────────────────────────────────────┐                 │
│  │  FOR each mutation (por prioridad)           │                 │
│  │                                            │                 │
│  │  1. executeMutation() → HTTP POST         │                 │
│  │  2. Success? → updateStatus("done")        │                 │
│  │                   → removeMutation()      │                 │
│  │  3. Fail? → incrementRetryCount()        │                 │
│  │        → shouldRetry? → wait + retry      │                 │
│  │        → exhausted? → updateStatus("failed")             │
│  └──────────────────────────────────────────────┘                 │
│    │                                                               │
│    ▼                                                               │
│  queryClient.invalidateQueries()                                 │
│    │                                                               │
│    ▼                                                               │
│  UI actualiza con nuevos datos                                    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Flujo 3: Retry con Exponential Backoff

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  RETRY CON EXPONENTIAL BACKOFF                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Mutation falla                                                      │
│    │                                                               │
│    ▼                                                               │
│  incrementRetryCount()                                              │
│    │                                                               │
│    ▼                                                               │
│  retryCount = 1 ──► getRetryDelay(1) = 1000ms ──► wait 1s            │
│    │                                                               │
│    ▼                                                               │
│  retryCount = 2 ──► getRetryDelay(2) = 2000ms ──► wait 2s            │
│    │                                                               │
│    ▼                                                               │
│  retryCount = 3 ──► getRetryDelay(3) = 4000ms ──► wait 4s            │
│    │                                                               │
│    ▼                                                               │
│  retryCount = 4 (exceeded maxAttempts=3)                            │
│    │                                                               │
│    ▼                                                               │
│  updateStatus("failed")                                              │
│    │                                                               │
│    ▼                                                               │
│  UI muestra error al usuario                                       │
│                                                                      │
│  Formula: delay = min(1000 * 2^attempt, 30000)                        │
│  - attempt 0: 1s                                                    │
│  - attempt 1: 2s                                                    │
│  - attempt 2: 4s                                                    │
│  - max: 30s                                                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Flujo 4: Prioridad de Mutations

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  PROCESAMIENTO POR PRIORIDAD                                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Cola contiene mutations de diferentes prioridades:                  │
│  ┌─────────────────────────────────────────┐                          │
│  │ { type: "logout",         priority: 1 } │  ← Alta                  │
│  │ { type: "addChild",       priority: 2 }  │  ← Media                 │
│  │ { type: "updateProgress", priority: 2 } │  ← Media                 │
│  │ { type: "updateProfile",  priority: 3 } │  ← Baja                 │
│  └─────────────────────────────────────────┘                          │
│                            │                                           │
│                            ▼                                           │
│  getQueuedMutationsByPriority()  ──► .sortBy("priority")             │
│                            │                                           │
│                            ▼                                           │
│  ┌─────────────────────────────────────────┐                          │
│  │ ORDEN DE PROCESAMIENTO:                  │                          │
│  │                                          │                          │
│  │ 1. logout (priority: 1) - Auth           │                          │
│  │ 2. addChild (priority: 2) - Datos        │                          │
│  │ 3. updateProgress (priority: 2)         │                          │
│  │ 4. updateProfile (priority: 3)          │                          │
│  └─────────────────────────────────────────┘                          │
│                                                                      │
│                          │                                           │
│                          ▼                                           │
│  processQueue() procesa en orden                                      │
│                                                                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Hook: useOfflineMutation

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  useOfflineMutation - Cómo Usarlo                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  import { useOfflineMutation } from "@/lib/sync/useOfflineMutation"  │
│                                                                      │
│  // En tu componente                                                 │
│  const {                                                             │
│    mutate,           // Función para ejecutar la mutation             │
│    mutateAsync,     // Versión async                                 │
│    isPending,      // Mutation en progreso                            │
│    isOnline,      // Estado de red                                  │
│    isQueued,      // Mutation guardada en cola                       │
│    pendingCount,  // Total de mutations pendientes                │
│    error,         // Error si falla                                │
│    retry,         // Función para reintentar manualmente           │
│  } = useOfflineMutation({                                            │
│    type: "addChild",                   // Tipo de mutation         │
│    endpoint: "/parents/par_001/children",  // Endpoint API          │
│    method: "POST",                      // Método HTTP             │
│    onQueued: (mutationId) => {           // Callback al encolar      │
│      toast.success("Guardado offline");                          │
│    },                                                            │
│  });                                                              │
│                                                                      │
│  // En el UI                                                         │
│  return (                                                           │
│    <button onClick={() => mutate({ name: "Nuevo", email: "x@y.com" })}│
│      disabled={isPending}                                            │
│    >                                                                │
│      {isPending ? "Guardando..." : "Agregar"}                         │
│    </button>                                                        │
│  )                                                                  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Hook: usePendingMutations (UI de Estado)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  usePendingMutations - Estado de la Cola                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  import { usePendingMutations } from "@/lib/sync/useOfflineMutation" │
│                                                                      │
│  const { pendingCount, isSyncing } = usePendingMutations();           │
│                                                                      │
│  // Mostrar en UI                                                     │
│  return (                                                             │
│    <div>                                                             │
│      {pendingCount > 0 && (                                          │
│        <span>{pendingCount} operaciones pendientes</span>           │
│      )}                                                              │
│      {isSyncing && <span>Sincronizando...</span>}                   │
│    </div>                                                            │
│  )                                                                  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Resumen de Componentes

| Componente | Archivo | Descripción |
|------------|---------|-------------|
| **Hook principal** | `useOfflineMutation.ts` | wrap mutations con soporte offline |
| **Hook estado** | `useOfflineMutation.ts` | `usePendingMutations()` para UI |
| **UI status** | `ConnectionStatus.tsx` | muestra estado online/offline/sync |
| **Queue logic** | `queue-manager.ts` | lógica principal de cola |
| **Background sync** | `background-sync.ts` | inicialización auto |
| **Dexie storage** | `offline-queue.ts` | persistencia de cola |
| **Retry** | `retry.ts` | exponential backoff |
| **Conflict** | `conflict.ts` | last-write-wins |

---

## Inicialización

```typescript
// En App.tsx o main.tsx (una sola vez)
import { initBackgroundSync } from "@/lib/sync/background-sync";

initBackgroundSync({
  intervalMs: 30000,  //Cada 30 segundos
  autoSync: true,     //Sincronizar automáticamente
});
```

---

## Dónde se Usa

1. **ConnectionStatus.tsx** - Componente de UI (ya integrado)
2. **useOfflineMutation** - Para mutations que necesitan offline support
3. **initBackgroundSync** - EnApp.tsx (recomendado) para auto-sync