# Persistencia y Almacenamiento - PWA Amauta

> **IMPORTANTE**: Para nueva documentación, ver:
> - [DEXIE_INDEXEDDB_GUIDE.md](./DEXIE_INDEXEDDB_GUIDE.md) - Guía completa de uso
> - [OUTBOX_PATTERN.md](./OUTBOX_PATTERN.md) - Patrón outbox

## Resumen de Tecnologías de Almacenamiento

| Tecnología | Tipo | Uso | Capacidad | Persistencia |
|------------|------|-----|-----------|-------------|
| **Zustand** | Estado | Runtime UI | - | ❌ Memoria |
| **TanStack Query** | Cache | Datos API | - | ❌ Memoria |
| **Dexie** | Base de datos | Auth + Queue | ~50MB+ | ✅ IndexedDB |
| **IndexedDB** | Storage nativo | Alternativa | ~50MB+ | ✅ Storage |

---

## IndexedDB: Base de Datos Nativos vs Dexie

### IndexedDB Nativo (Vanilla JS)

```javascript
// Acceso directo a IndexedDB
const request = indexedDB.open("MiDB", 1);

request.onupgradeneeded = (event) => {
  const db = event.target.result;
  db.createObjectStore("usuarios", { keyPath: "id" });
};

request.onsuccess = (event) => {
  const db = event.target.result;
  // operaciones...
};
```

**Ventajas:**
- Sin dependencias adicionales
- Control total

**Desventajas:**
- API compleja y verbosa
- Sin type safety
- Manejo manual de transacciones

---

### Dexie (Wrapper de IndexedDB)

```typescript
// Dexie - más simple y con tipos
import Dexie, { EntityTable } from "dexie";

interface User {
  id: string;
  name: string;
  email: string;
}

interface MyDB extends Dexie {
  users: EntityTable<User, "id">;
}

const db = new Dexie("MiDB") as MyDB;
db.version(1).stores({
  users: "id, name, email"  // índices
});

// Uso simple
await db.users.put({ id: "1", name: "Juan", email: "juan@email.com" });
const users = await db.users.toArray();
```

**Ventajas:**
- API intuitiva y fluida
- TypeScript support
- Transactions simples
-Queries poderosas

**Desventajas:**
- Dependencia adicional
- Overhead mínimo

**Nuestra elección:** ✅ Dexie

---

## Base de Datos en Amauta

### 1. amauta-auth (Auth - Tokens y Usuario)

```
┌─────────────────────────────────────────────────────────────────────┐
│               IndexedDB: amauta-auth (v2)                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  Database: amauta-auth                                              │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │ TABLE: tokens                                                │    │
│  ├── id: "amauta-tokens" (primary key)                        │    │
│  ├── accessToken: string                                      │    │
│  ├── refreshToken: string                                   │    │
│  ├── expiresAt: number (timestamp)                       │    │
│  └── createdAt: number                                    │    │
│  └─────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ TABLE: users                                               │    │
│  ├── id: "amauta-user" (primary key)                       │    │
│  ├── user: AuthUser {                                     │    │
│  │     name, email, role, tenantId, ...                   │    │
│  │ }                                                        │    │
│  └── storedAt: number                                      │    │
│  └─────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ TABLE: preferences (v2)                                  │    │
│  ├── id: "user-preferences" (primary key)            │    │
│  └── selectedStudentId: string | ""                   │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                                    │
└─────────────────────────────────────────────────────────────┘
```

**Uso:**
- Sesión de usuario (login/logout)
- Tokens de acceso
- Información del usuario
- Student seleccionado

---

### 2. amauta-offline-queue (Mutations Offline)

```
┌─────────────────────────────────────────────────────────────────────┐
│           IndexedDB: amauta-offline-queue (v1)                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  Database: amauta-offline-queue                                     │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │ TABLE: mutations                                             │    │
│  ├── id: "mut_timestamp_hash" (primary key)                │    │
│  ├── type: string ("addChild", "updateProgress", ...)   │    │
│  ├── payload: unknown (datos de la operación)       │    │
│  ├── endpoint: string ("/api/parents/...")           │    │
│  ├── method: "POST" | "PUT" | "PATCH" | "DELETE"   │    │
│  ├── priority: 1 | 2 | 3 (alta | media | baja)     │    │
│  ├── retryCount: number (0-3)                      │    │
│  ├── status: string                                │    │
│  │     "pending" | "syncing" | "done" | "failed"   │    │
│  ├── createdAt: number (timestamp)               │    │
│  ├── lastAttemptAt: number | null                 │    │
│  ├── errorMessage: string | null                 │    │
│  └── result: unknown | null                       │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                                    │
└─────────────────────────────────────────────────────────────┘
```

**Uso:**
- Cola de mutations offline
- Retry con exponential backoff
- Prioridad de procesamiento

---

## Comparación con otros存储

### TanStack Query (Cache en Memoria)

```
┌─────────────────────────────────────────────────────────────────────┐
│                  TanStack Query - React Query                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  QueryClient (en memoria)                                         │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │ queries: Map<QueryKey, QueryState>                        │    │
│  │                                                           │    │
│  │ [auth, session]: {                                     │    │
│  │   status: 'success',                                   │    │
│  │   data: { user: {...} },                               │    │
│  │   fetchStatus: 'idle'                                  │    │
│  │ }                                                      │    │
│  │                                                           │    │
│  │ [auth, parent, par_001]: {                             │    │
│  │   status: 'success',                                   │    │
│  │   data: { parent: {...}, children: [...] },          │    │
│  │ }                                                      │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                                    │
│  Características:                                                  │
│  - ✅ Cache automático de queries                               │
│  - ✅ Background refetch                                      │
│  - ✅ Retry automático                                       │
│  - ✅ Deduplicación de requests                                │
│  - ❌ Se pierde al cerrar pestaña                            │
│  - ❌ No persiste entre sesiones                             │
└─────────────────────────────────────────────────────────────────────┘
```

**Cuándo usar TanStack Query:**
- Datos del servidor que cambian frecuentemente
- Queries que necesitan cache y deduplicación
- Situaciones donde offline no es crítico

**Cuándo NO usar TanStack Query:**
- Tokens de autenticación (usar Dexie)
- Datos que deben persistir offline (usar Dexie)

---

### Zustand (Estado Runtime)

```
┌─────────────────────────────────────────────────────────────────────┐
│                      Zustand Store                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  authStore (en memoria)                                            │
│  ┌───────────────────��─��───────────────────────────────────────┐    │
│  │ state: {                                                 │    │
│  │   isAuthenticated: boolean,                            │    │
│  │   user: AuthUser | null,                                 │    │
│  │   hasHydrated: boolean,                                 │    │
│  │   selectedStudentId: string | null,                      │    │
│  │   isVerifying: boolean                                   │    │
│  │ }                                                        │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                                    │
│  Métodos:                                                           │
│  - setUser(user)           → actualiza usuario                   │
│  - setAuthenticated(bool) → cambia estado auth                │
│  - hydrateFromStorage()   → carga desde Dexie                    │
│  - clearSession()          → limpia todo                          │
│                                                                    │
│  Características:                                                  │
│  - ✅ Reactivo (suscribciones)                                  │
│  - ✅ Simple y performante                                      │
│  - ❌ Se pierde al cerrar pestaña                            │
│  - ❌ No persiste (sin middleware)                           │
└─────────────────────────────────────────────────────────────────────┘
```

**Cuándo usar Zustand:**
- Estado de UI que no necesita persistir
- Flags y configuraciones runtime
- Estado temporal (loading, errors)

**Cuándo NO usar Zustand:**
- Tokens y credenciales (usar Dexie)
- Datos que deben persistir offline (usar Dexie)

---

## Outbox Pattern en Amauta

El patrón **Outbox** es una técnica para garantizar operaciones atomic en sistemas distribuidos:

### Sin Outbox (Problemático)

```
┌─────────────────────────────────────────────────────────────────────┐
│  SIN OUTBOX - TWO PHASE COMMIT PROBLEM                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  1. Usuario hace mutation                                        │
│     │                                                            │
│     ▼                                                            │
│  2. API mutation succeeds                                       │
│     │                                                            │
│     ▼                                                            │
│  3. Send to server ──► ✗ FALLA (offline)                       │
│     │                                                            │
│     ▼                                                            │
│  4. ERROR: mutation guardada local se pierde                   │
│     │                                                            │
│     ▼                                                            │
│  PROBLEMA: inconsistencia entre DB local y servidor             │
│                                                                    │
└─────────────────────────────────────────────────────────────────────┘
```

### Con Outbox (Solución)

```
┌─────────────────────────────────────────────────────────────────────┐
│  CON OUTBOX - PATTERN IMPLEMENTADO                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  1. Usuario hace mutation                                        │
│     │                                                            │
│     ▼                                                            │
│  2. GUARDAR EN OUTBOX (Dexie)                                     │
│     │                                                            │
│     ▼                                                            │
│  3.mutation encolada = status: "pending"                       │
│     │                                                            │
│     ▼                                                            │
│  4. Return éxito al usuario (no espera servidor)               │
│     │                                                            │
│     ▼                                                            │
│  5. BACKGROUND SYNC                                             │
│     │ (cuando hay conexión)                                      │
│     ▼                                                            │
│  6. processQueue() lee del outbox                              │
│     │                                                            │
│     ▼                                                            │
│  7. ENVIAR AL SERVER                                            │
│     │                                                            │
│     ▼                                                            │
│  8. SUCCESS: marcar "done" → remover del outbox                │
│     FALLA: retry o marcar "failed"                              │
│                                                                    │
│  VENTAJA: Garantiza que ninguna mutation se pierde              │
│                                                                    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Implementación Outbox en Amauta

```
┌─────────────────────────────────────────────────────────────────────┐
│           Outbox Implementation - Files                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  src/lib/api/storage/offline-queue.ts                           │
│  ├── Dexie: amauta-offline-queue                             │
│  ├── Table: mutations (cola de operaciones)              │
│  └── Métodos:                                                │
│       ├── enqueueMutation()  → guardar en cola            │
│       ├── getQueuedMutations() → obtener pendientes     │
│       ├── updateMutationStatus() → cambiar estado       │
│       └── removeMutation() → eliminar después de éxito │
│                                                                    │
│  src/lib/sync/queue-manager.ts                              │
│  ├── queueMutation() → detecta online/offline          │
│  ├── processQueue() → procesa la cola                  │
│  ├── triggerSync() → inicia sync manual              │
│  └── getQueueState() → estado actual                │
│                                                                    │
│  src/lib/sync/useOfflineMutation.ts                     │
│  ├── useOfflineMutation() → hook para mutations       │
│  ├── usePendingMutations() → estado de cola         │
│  └── Retorna: isQueued, pendingCount, error, retry │
│                                                                    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Resumen: Cuándo Usar Qué

| Escenario | Tecnología | Persistencia | Razón |
|-----------|-------------|--------------|--------|
| **Tokens de acceso** | Dexie | ✅ IndexedDB | Seguridad y persistencia offline |
| **Usuario logueado** | Dexie + Zustand | ✅ + ❌ | Hydratación al inicio |
| **selectedStudentId** | Dexie | ✅ IndexedDB | Persistir selección |
| **Mutations offline** | Dexie (outbox) | ✅ IndexedDB | Cola confiable |
| **Datos de API** | TanStack Query | ❌ Memoria | Cache y re-fetch |
| **UI state** | Zustand | ❌ Memoria | Estado runtime |
| **Preferencias UI** | Zustand | ❌ Memoria | No necesita persistir |

---

## Diagrama de Decisión

```
¿Necesitas guardar datos offline?
│
├── SÍ ──► ¿Son tokens/credenciales?
│   │
│   ├── SÍ ──► Dexie: amauta-auth (tokens, users, preferences)
│   │
│   └── NO ──► ¿Son mutations/escrituras?
│       │
│       ├── SÍ ──► Dexie: amauta-offline-queue (outbox)
│       │
│       └── NO ──► ¿Son datos del servidor?
│           │
│           └── SÍ ──► TanStack Query (cache en memoria)
│
│
└── NO ──► ¿Es estado de UI?
    │
    └── SÍ ──► Zustand (memoria)
```

---

## Ejemplo Práctico: Agregar Hijo

```
┌─────────────────────────────────────────────────────────────────────┐
│  Ejemplo: Padre agrega hijo (offline)                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  1. UI llama: mutate({ name: "Juan", email: "juan@..." })        │
│                                                                    │
│  2. Hook useOfflineMutation detecta: navigator.onLine = false    │
│                                                                    │
│  3. Guarda en Dexie (outbox):                                    │
│     amauta-offline-queue.mutations.put({                        │
│       id: "mut_1713792345678_abc",                              │
│       type: "addChild",                                          │
│       payload: { name: "Juan", email: "juan@..." },          │
│       endpoint: "/parents/par_001/children",                 │
│       method: "POST",                                           │
│       priority: 2,                                            │
│       status: "pending",                                        │
│       createdAt: 1713792345678                                 │
│     })                                                          │
│                                                                    │
│  4. UI muestra: "Guardado offline"                               │
│                                                                    │
│  5. Más tarde, navigator.onLine = true                           │
│                                                                    │
│  6. Background Sync detecta y procesa:                          │
│     processQueue() → HTTP POST /parents/par_001/children      │
│                                                                    │
│  7. Éxito: mutation eliminada del outbox,                        │
│     queryClient.invalidateQueries()                              │
│                                                                    │
│  8. UI actualiza con nuevos datos                                │
│                                                                    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Documentación Actualizada

Para información más detallada y actualizada, ver:

| Documento | Descripción |
|-----------|------------|
| [DEXIE_INDEXEDDB_GUIDE.md](./DEXIE_INDEXEDDB_GUIDE.md) | Guía completa de Dexie/IndexedDB |
| [OUTBOX_PATTERN.md](./OUTBOX_PATTERN.md) | Patrón outbox para mutations offline |