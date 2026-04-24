# Patrón Outbox - PWA Amauta

## Tabla de Contenidos

1. [Resumen](#resumen)
2. [El Problema](#el-problema)
3. [La Solución: Patrón Outbox](#la-solución-patrón-outbox)
4. [Arquitectura en Amauta](#arquitectura-en-amauta)
5. [API de Funciones](#api-de-funciones)
6. [Uso en Componentes](#uso-en-componentes)
7. [Hooks Disponibles](#hooks-disponibles)
8. [Configuración de Sync](#configuración-de-sync)
9. [Retry y Error Handling](#retry-y-error-handling)
10. [Debugging](#debugging)

---

## Resumen

El **Patrón Outbox** es una técnica para garantizar que ninguna operación (mutation) se pierda cuando el usuario está offline. Esencial para PWAs que funcionan sin conexión.

```
┌─────────────────────────────────────────────────────────────────┐
│              FUERA DE LÍNEA = OPERACIONES LOCALES              │
│                                                                  │
│  Usuario → mutation → Dexie (outbox) →.sync() cuando hay red    │
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

### Por qué ocurre

- HTTP solo funciona online
- Sin conexión = request fallida
- No hay forma de "guardar" la operación para después
- El usuario quizás ni sabe que falló

---

## La Solución: Patrón Outbox

### Concepto

1. **Guardar localmente** antes de enviar al servidor
2. **Retornar éxito** al usuario inmediatamente
3. **Procesar en background** cuando haya conexión

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
│  4. background-sync() detecta conexión                     │
│     │                                                          │
│     ▼                                                          │
│  5. ✓ ENVIAR AL SERVIDOR                                    │
│     │                                                          │
│     ▼                                                          │
│  6. Éxito: eliminar del outbox                             │
│     Error: retry o marcar como fallido                         │
│                                                                  │
│  VENTAJA: Usuario siempre ve feedback instantáneo            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Arquitectura en Amauta

### Base de Datos

```
┌─────────────────────────────────────────────────────────────────┐
│         IndexedDB: amauta-db (unificada)                       │
│                    mutations table                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Table: mutations                                             │
│  ┌─────────────────────────────────────────────────────┐        │
│  │ Campo          │ Tipo              │ Descripción    │        │
│  ├─────────────────────────────────────────────────────┤        │
│  │ id            │ string            │ UUID único      │        │
│  │ type         │ string           │ addChild, etc. │        │
│  │ payload      │ unknown          │ Datos          │        │
│  │ endpoint    │ string           │ /api/parents/..│        │
│  │ method      │ string           │ POST, PUT...    │        │
│  │ priority    │ number (1-3)    │ 1=alta, 3=baja│        │
│  │ retryCount  │ number          │ 0-3           │        │
│  │ status     │ string           │ pending/syncing/│        │
│  │             │                 │ done/failed     │        │
│  │ createdAt   │ number          │ timestamp     │        │
│  │ lastAttemptAt│ number|null   │ timestamp    │        │
│  │ errorMessage│ string|null  │ mensaje error│        │
│  │ result     │ unknown|null │ respuesta    │        │
│  └─────────────────────────────────────────────────────┘        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Archivos Involucrados

| Archivo | Responsabilidad |
|---------|---------------|
| `src/lib/api/storage/db.ts` | Definición de schema |
| `src/lib/api/storage/offline-queue.ts` | Funciones CRUD de mutations |
| `src/lib/sync/queue-manager.ts` | Lógica de procesar cola |
| `src/lib/sync/background-sync.ts` | Sync automático |
| `src/lib/sync/useOfflineMutation.ts` | Hook para componentes |
| `src/lib/sync/retry.ts` | Exponential backoff |
| `src/lib/sync/conflict.ts` | Resolución de conflictos |

---

## API de Funciones

### offline-queue.ts

```typescript
import {
  enqueueMutation,
  getQueuedMutations,
  getQueuedMutationsByStatus,
  getQueuedMutationsByPriority,
  updateMutationStatus,
  removeMutation,
  clearAllMutations,
  getMutationCount,
} from "@/lib/api/storage/offline-queue";

// Encolar una mutation
await enqueueMutation({
  type: "addChild",
  payload: { name: "Juan", email: "juan@..." },
  endpoint: "/parents/par_001/children",
  method: "POST",
  priority: 2,  // Media
});

// Obtener todas pendientes
const pending = await getQueuedMutations();

// Obtener por status
const pending = await getQueuedMutationsByStatus("pending");
const syncing = await getQueuedMutationsByStatus("syncing");

// Actualizar status
await updateMutationStatus("mut_123", "syncing");
await updateMutationStatus("mut_123", "failed", { errorMessage: "Error..." });

// Eliminar mutation
await removeMutation("mut_123");

// Contar
const count = await getMutationCount();
```

### queue-manager.ts

```typescript
import {
  queueMutation,
  processQueue,
  triggerSync,
  getQueueState,
  isOnline,
} from "@/lib/sync/queue-manager";

// Encolar (detecta online/offline automáticamente)
await queueMutation({
  type: "addChild",
  payload: { name: "Juan" },
  endpoint: "/parents/parent/children",
  method: "POST",
});

// Procesar cola manualmente
await processQueue();

// Forzar sync
await triggerSync();

// Ver estado
const state = await getQueueState();
/*
{
  pendingCount: number,
  syncingCount: number,
  failedCount: number,
  isOnline: boolean,
  lastSyncAt: number | null
}
*/

// Verificar online
if (isOnline()) {
  // procesar cola
}
```

---

## Uso en Componentes

### Ejemplo: Agregar Hijo

```typescript
import { useOfflineMutation } from "@/lib/sync/useOfflineMutation";

function AddChildForm() {
  const { mutate, isOnline, isQueued, pendingCount, error, retry } = useOfflineMutation({
    type: "addChild",
    endpoint: "/parents/{parentId}/children",
    method: "POST",
    onQueued: (mutationId) => {
      toast.success("Guardado offline");
    },
    onSuccess: (result) => {
      toast.success("Hijo registrado");
    },
    onError: (err) => {
      toast.error("Error al registrar");
    },
  });

  const handleSubmit = (data: { name: string; email: string }) => {
    mutate({
      name: data.name,
      email: data.email,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="name" />
      <button type="submit">Agregar</button>
      
      {/* Estado offline */}
      {!isOnline && (
        <span className="text-orange-500">
          Sin conexión - guardado offline
        </span>
      )}
      
      {/* Errores */}
      {error && <span className="text-red-500">{error.message}</span>}
    </form>
  );
}
```

---

## Hooks Disponibles

### useOfflineMutation

Hook principal para crear mutations que soporten offline.

```typescript
import { useOfflineMutation } from "@/lib/sync/useOfflineMutation";

interface UseOfflineMutationOptions {
  type: string;              // Identificador de mutation
  endpoint: string;        // Endpoint API (puede usar {param})
  method: "POST" | "PUT" | "PATCH" | "DELETE";
  priority?: 1 | 2 | 3;   // Prioridad (default: 2)
  onQueued?: (mutationId: string) => void;
  onSuccess?: (result: unknown) => void;
  onError?: (error: Error) => void;
}

interface UseOfflineMutationResult {
  mutate: (payload: unknown) => void;  // Función para ejecutar
  mutateAsync: (payload: unknown) => Promise<unknown>;
  isOnline: boolean;
  isQueued: boolean;
  pendingCount: number;
  error: Error | null;
  retry: (mutationId?: string) => Promise<void>;
  cancel: (mutationId?: string) => Promise<void>;
  reset: () => Promise<void>;
}

const {
  mutate,
  mutateAsync,
  isOnline,
  isQueued,
  pendingCount,
  error,
  retry,
  cancel,
  reset,
} = useOfflineMutation({
  type: "addChild",
  endpoint: "/parents/{parentId}/children",
  method: "POST",
  priority: 2,
  onQueued: () => toast.success("Guardado offline"),
  onSuccess: () => toast.success("Registrado"),
});
```

### usePendingMutations

Hook para mostrar estado de la cola.

```typescript
import { usePendingMutations } from "@/lib/sync/useOfflineMutation";

function ConnectionStatus() {
  const { pendingCount, isOnline, isSyncing, triggerSync } = usePendingMutations();

  return (
    <div className="flex items-center gap-2">
      {!isOnline && <span className="text-orange-500">Offline</span>}
      {isOnline && isSyncing && <span className="text-blue-500">Sincronizando...</span>}
      {pendingCount > 0 && (
        <span>{pendingCount} operaciones pendientes</span>
      )}
      <button onClick={triggerSync}>Sincronizar</button>
    </div>
  );
}
```

---

## Configuración de Sync

### Inicialización Automática

En `App.tsx` o `main.tsx`:

```typescript
import { initBackgroundSync } from "@/lib/sync/background-sync";

initBackgroundSync({
  intervalMs: 30000,    // cada 30 segundos
  autoSync: true,      // procesar al detectar online
});

// También disponibles:
// - syncOnOnline: true (sync al recuper conexión)
// - syncOnVisibilityChange: true (sync al cambiartab)
```

### Configuración por defecto

```typescript
const DEFAULT_CONFIG = {
  intervalMs: 30000,           // 30 segundos
  autoSync: true,              // Sync automático
  syncOnOnline: true,         // Sync al recuperar conexión
  syncOnVisibilityChange: true, // Sync al cambiar tab
  maxRetries: 3,              // Intentos máximos
  retryDelayMs: 1000,        // Delay inicial (backoff)
};
```

---

## Retry y Error Handling

### Exponential Backoff

Si una mutation falla:

```
Intento 1: 1 segundo   delay
Intento 2: 2 segundos delay  
Intento 3: 4 segundos delay
```

Despues de 3 intentos -> status = "failed"

### Manejo de Errores

```typescript
// Mutation marcada como failed
await updateMutationStatus("mut_123", "failed", {
  errorMessage: "Token expirado",
});

// Opciones:
// 1. Retry manual
await retry("mut_123");

// 2. Cancelar
await cancel("mut_123");

// 3. Eliminar
await removeMutation("mut_123");
```

### Errores Comunes

| Error | Causa | Solución |
|-------|------|---------|
| NetworkError | Sin conexión | Auto-retry cuando haya red |
| 401 Unauthorized | Token expired | Refresh token + retry |
| 409 Conflict | Conflicto de datos |last-write-wins |
| 500 Server Error | Error del servidor | Retry automático |

---

## Debugging

### Console del navegador

```javascript
// Ver mutations en cola
const db = await import('/src/lib/api/storage/db.js').then(m => m.db);
await db.mutations.toArray();

// Estado del sync
import { getQueueState } from '/src/lib/sync/queue-manager.js';
await getQueueState();

// Forzar sync
import { triggerSync } from '/src/lib/sync/queue-manager.js';
await triggerSync();
```

### Chrome DevTools

1. **Application** → IndexedDB → amauta-db → mutations
2. **Network** → filtrar por API calls
3. **Console** → filtrar errores

---

## Ver Também

- [DEXIE_INDEXEDDB_GUIDE.md](./DEXIE_INDEXEDDB_GUIDE.md) - Guía completa de Dexie/IndexedDB
- [PHASE4_FLOW.md](./PHASE4_FLOW.md) - Diagramas de flujo
- [PHASE4_TEST_GUIDE.md](./PHASE4_TEST_GUIDE.md) - Guía de testing
- [ARCHITECTURE_LAYERS.md](./ARCHITECTURE_LAYERS.md) - Capas de la aplicación