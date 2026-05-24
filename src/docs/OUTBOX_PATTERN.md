# Patrón Outbox - PWA Amauta (Actualizado)

> ⚠️ **Este documento ha sido actualizado para reflejar el sistema actual.**
> Para la documentación definitiva del sistema de cola offline, ver:
> [`OFFLINE_QUEUE_SYSTEM.md`](./OFFLINE_QUEUE_SYSTEM.md)

## Tabla de Contenidos

1. [Resumen](#resumen)
2. [El Problema](#el-problema)
3. [La Solución: Patrón Outbox](#la-solución-patrón-outbox)
4. [Arquitectura en Amauta](#arquitectura-en-amauta)
5. [Hook Principal: useSafeMutation](#hook-principal-usesafemutation)
6. [Configuración de Sync](#configuración-de-sync)
7. [Retry y Error Handling](#retry-y-error-handling)
8. [Debugging](#debugging)

---

## Resumen

El **Patrón Outbox** es una técnica para garantizar que ninguna operación (mutation) se pierda cuando el usuario está offline. Esencial para PWAs que funcionan sin conexión.

```
┌─────────────────────────────────────────────────────────────────┐
│              FUERA DE LÍNEA = OPERACIONES LOCALES              │
│                                                                  │
│  Usuario → mutation → Dexie (outbox) → sync() cuando hay red    │
└─────────────────────────────────────────────────────────────────┘
```

---

## El Problema

### Sin Outbox: Two-Phase Commit Problem

```
┌─────────────────────────────────────────────────────────────────┐
│  ESCENARIO: Usuario agrega hijo sin internet                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Usuario hace clic en "Agregar Hijo"                          │
│     │                                                          │
│     ▼                                                          │
│  2. App intenta enviar al servidor                              │
│     │                                                          │
│     ▼                                                          │
│  3. ✗ FALLA: Sin conexión                                     │
│     │                                                          │
│     ▼                                                          │
│  4. ERROR: La operación se PIERDE                              │
│                                                                  │
│  RESULTADO: Frustración del usuario + posible inconsistencia     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## La Solución: Patrón Outbox

```
┌─────────────────────────────────────────────────────────────────┐
│  CON OUTBOX: Operación Garantizada                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Usuario hace clic en "Agregar Hijo"                         │
│     │                                                          │
│     ▼                                                          │
│  2. ✓ GUARDAR EN OUTBOX (Dexie)                               │
│     │                                                          │
│     ▼                                                          │
│  3. ✓ RETORNAR ÉXITO al usuario                              │
│     (UI muestra "Guardado offline")                            │
│     │                                                          │
│     ▼                                                          │
│  4. background-sync detecta conexión                            │
│     │                                                          │
│     ▼                                                          │
│  5. ✓ ENVIAR AL SERVIDOR                                    │
│     │                                                          │
│     ▼                                                          │
│  6. Éxito: eliminar del outbox                             │
│     Error: retry o marcar como fallido                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Arquitectura en Amauta

### Base de Datos

Tabla `mutations` dentro de `amauta-db` (DB unificada Dexie). Schema completo en `src/lib/api/storage/db.ts`.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | string | UUID único (`mut_` + timestamp + random) |
| `type` | MutationType | login, register, logout, submitAnswer, addChild, updateProgress, updateProfile, updatePreferences |
| `payload` | unknown | Datos a enviar al servidor |
| `endpoint` | string | Ruta API (`/students/.../next-exercise`) |
| `method` | string | POST, PUT, PATCH, DELETE |
| `priority` | number | 1 (alta), 2 (media), 3 (baja) |
| `retryCount` | number | 0-3 |
| `status` | string | pending, syncing, done, failed |
| `createdAt` | number | Timestamp de creación |
| `lastAttemptAt` | number\|null | Último intento de sync |
| `errorMessage` | string\|null | Mensaje de error si falló |
| `result` | unknown\|null | Respuesta del servidor si ok |

### Archivos Involucrados

| Archivo | Responsabilidad |
|---------|---------------|
| `src/lib/api/storage/db.ts` | Schema Dexie unificado (`amauta-db`) |
| `src/lib/api/storage/offline-queue.ts` | CRUD de mutations |
| `src/lib/sync/queue-manager.ts` | Lógica de cola + ejecución HTTP |
| `src/lib/sync/background-sync.ts` | Sync automático (online/offline + intervalo) |
| `src/lib/sync/useSafeMutation.ts` | **Hook React único** (reemplaza `useOfflineMutation`) |
| `src/lib/sync/retry.ts` | Exponential backoff |
| `src/lib/sync/conflict.ts` | Resolución de conflictos |

---

## Hook Principal: useSafeMutation

**`useOfflineMutation` fue eliminado en Fase 3.** El hook actual es `useSafeMutation`.

```typescript
import { useSafeMutation } from "@/lib/sync/useSafeMutation";

const { mutate, isPending } = useSafeMutation({
  mutationFn: (payload) => apiCall(payload),
  queryKey: ["my-query-key"],
  optimisticUpdate: (old) => ({ ...old, _submitted: true }),
  tentativeOnly: true,
  offline: {
    type: "addChild",
    endpoint: "/api/parents/{parentId}/children",
    method: "POST",
  },
});
```

Ver [`OFFLINE_QUEUE_SYSTEM.md`](./OFFLINE_QUEUE_SYSTEM.md) para la documentación completa del hook.

---

## Configuración de Sync

### Inicialización Automática

En `src/App.tsx`:

```typescript
useEffect(() => {
  initBackgroundSync({ intervalMs: 30000, autoSync: true });
}, []);
```

### Valores por Defecto

- Intervalo: 30 segundos
- Auto-sync al reconectar: true
- Máximo de reintentos: 3
- Delay inicial: 1 segundo (exponential backoff ×2)

---

## Retry y Error Handling

### Exponential Backoff

```
Intento 1: 1 segundo
Intento 2: 2 segundos
Intento 3: 4 segundos
Después de 3 → status = "failed"
```

### Errores Comunes

| Error | Causa | Solución |
|-------|------|---------|
| NetworkError | Sin conexión | Auto-retry al reconectar |
| 401 Unauthorized | Token expired | Refresh token + retry |
| 409 Conflict | Conflicto de datos | Last-write-wins |
| 500 Server Error | Error del servidor | Retry automático |

---

## Debugging

```javascript
// Ver mutations en cola
import { db } from "@/lib/api/storage/db";
await db.mutations.where({ status: "pending" }).toArray();

// Estado del sync
import { getQueueState } from "@/lib/sync/queue-manager";
await getQueueState();

// Forzar sync
import { triggerSync } from "@/lib/sync/queue-manager";
await triggerSync();
```

---

## Ver También

- [`OFFLINE_QUEUE_SYSTEM.md`](./OFFLINE_QUEUE_SYSTEM.md) — **Documentación definitiva del sistema de cola offline**
- [`DEXIE_INDEXEDDB_GUIDE.md`](./DEXIE_INDEXEDDB_GUIDE.md) — Guía de Dexie/IndexedDB
- [`ARCHITECTURE_LAYERS.md`](./ARCHITECTURE_LAYERS.md) — Capas de la aplicación