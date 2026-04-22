# Fase 4: Offline Mutations + Background Sync

## Fecha de Implementación
21/04/2026

## Resumen

Se implementó soporte offline para mutations (operaciones de escritura) en la PWA Amauta. Las mutations ahora se encolan cuando no hay conexión y se sincronizan automáticamente cuando la red vuelve.

---

## Decisiones Técnicas y Justificación

### 1. Mutations Offline

| Decisión | Opción Elegida | Justificación |
|---------|---------------|---------------|
| ¿Qué mutations necesitan offline? | **Todas** | Simplicidad - no hay que discernir cuál necesita offline |

**Por qué todas:**
- Cualquier mutation puede ser importante para el usuario
- Evita complejidad de tener que configurar cada endpoint
- El usuario puede hacer logout offline sin problemas

---

### 2. Retry Attempts

| Decisión | Opción Elegida | Justificación |
|----------|---------------|---------------|
| Retry attempts | **3 max** | Suficiente para recover de errores transitorios sin saturar el servidor |

**Por qué 3:**
- 1er retry: error de red transitorio
- 2do retry: servidor ocupado
- 3er retry: error persistente
- Más de 3: probablemente error real que necesita intervención manual

---

### 3. Estrategia de Conflicto

| Decisión | Opción Elegida | Justificación |
|----------|---------------|---------------|
| Estrategia de conflicto | **Last-write-wins (LWW)** | Simple, suficiente para datos que cambian en un dispositivo |

**Por qué Last-write-wins:**
- **Simple de implementar**: Solo comparar timestamps
- **Suficiente para Amauta**: Los datos (progreso, ejercicios) típicamente se modifican desde un dispositivo a la vez
- **Menor fricción**: No requiere intervención del usuario

**Alternativas consideradas:**
- **Merge automático**: Más complejo, requiere lógica específica por tipo de dato
- **Prompt al usuario**: Más control pero genera fricción en la UX

```typescript
// Ejemplo: Si el usuario modifica progreso offline mientras el servidor tiene datos más nuevos
// Local: nivel 3更新时间 14:00
// Server: nivel 5更新时间 15:00
// Resultado: Gana servidor (Last-write-wins porque 15:00 > 14:00)
```

---

### 4. Prioridad de Mutations

| Decisión | Opción Elegida | Justificación |
|----------|---------------|---------------|
| Prioridad | **Sí** | Mejor UX cuando hay muchas operaciones |

**Por qué con prioridad:**
- Las mutations críticas (auth) se procesan primero
- Datos importantes (progreso) no esperan a operaciones menores (preferencias)
- Mejor percepción de velocidad por parte del usuario

**Categorías de Prioridad:**

| Prioridad | Tipo | Mutaciones |
|----------|------|------------|
| **Alta (1)** | Auth crítico | login, logout, register |
| **Media (2)** | Datos importantes | addChild, updateProgress |
| **Baja (3)** | Preferencias | updateProfile, updatePreferences |

---

## Arquitectura

### Base de Datos: Offline Queue (Dexie)

```
amauta-offline-queue (v1)
└── mutations
    ├── id: string (UUID)
    ├── type: MutationType
    ├── payload: any
    ├── endpoint: string
    ├── method: POST|PUT|PATCH|DELETE
    ├── priority: 1|2|3
    ├── retryCount: number
    ├── status: pending|syncing|done|failed
    ├── createdAt: number
    ├── lastAttemptAt: number|null
    ├── errorMessage: string|null
    └── result: any|null
```

### Flujo de Mutation Offline

```
Usuario hace mutation (offline)
    │
    ▼
Detectar navigator.onLine
    │
    ▼ (offline)
Guardar en cola Dexie
    │
    ▼
Mostrar toast "Guardado offline"
    │
    ▼ (cuando vuelve online)
Background Sync detecta red
    │
    ▼
Procesar cola por prioridad (1→2→3)
    │
    ▼
Mutation exitosa → remover de cola → actualizar cache
    │
    ▼ (si falla)
Retry con exponential backoff (1s, 2s, 4s)
    │
    ▼ (después de 3 fallos)
Marcar como failed → notificar usuario
```

### Exponential Backoff

```typescript
// Delay entre retries
attempt 0 → 1s
attempt 1 → 2s  
attempt 2 → 4s
// Máximo: 30s
```

---

## Archivos Creados

| Archivo | Descripción |
|---------|-------------|
| `src/lib/api/storage/offline-queue.ts` | Funciones Dexie para la cola de mutations |
| `src/lib/sync/retry.ts` | Lógica de retry con exponential backoff |
| `src/lib/sync/conflict.ts` | Resolvedor de conflictos Last-write-wins |
| `src/lib/sync/queue-manager.ts` | Lógica principal de la cola |
| `src/lib/sync/background-sync.ts` | Handler de background sync |
| `src/lib/sync/useOfflineMutation.ts` | Hook para mutations offline |

---

## Uso del Hook useOfflineMutation

```typescript
import { useOfflineMutation } from "@/lib/sync/useOfflineMutation";

// Ejemplo: Agregar hijo desde panel de padre
const { mutate, isOnline, isQueued, pendingCount, error, retry } = useOfflineMutation({
  type: "addChild",
  endpoint: "/parents/{parentId}/children",
  method: "POST",
  onQueued: (mutationId) => {
    toast.success("Hijo agregado. Se sincronizará cuando haya conexión.");
  },
});

// En el componente
const handleAddChild = () => {
  mutate({ name: "Nuevo hijo", email: "hijo@email.com" });
};

// isOnline = true → mutation se ejecuta directamente
// isOnline = false → mutation se encola
// isQueued = true → mutation está en cola esperando sync
// pendingCount = número de mutations pendientes
```

---

## Hooks Disponibles

### useOfflineMutation

```typescript
interface UseOfflineMutationResult {
  mutate: (payload: unknown) => void;
  mutateAsync: (payload: unknown) => Promise<{...}>;
  isPending: boolean;
  isOnline: boolean;
  isQueued: boolean;
  pendingCount: number;
  error: Error | null;
  retry: () => Promise<void>;
}
```

### usePendingMutations

```typescript
// Para mostrar estado en UI
const { pendingCount, isSyncing } = usePendingMutations();
```

---

## Funciones Exportadas

### queue-manager.ts

```typescript
// Verificar estado
isOnline() → boolean
getQueueState() → { isOnline, isSyncing, pendingCount }
getPendingMutationsCount() → number

// Control manual de cola
processQueue() → { processed, successful, failed, conflicts }
queueMutation(type, payload, endpoint, method) → { online, queued, mutationId }
triggerSync() → Promise<void>
retryFailedMutations() → Promise<void>
clearQueue() → Promise<void>
```

### background-sync.ts

```typescript
// Inicialización
initBackgroundSync({ intervalMs?, autoSync? }) → Promise<void>
startBackgroundSync({ intervalMs?, autoSync? }) → { intervalMs, autoSync }
stopBackgroundSync() → void
getSyncStatus() → { isRunning, hasInterval }

// Eventos
onSyncEvent((event) => void) → () => void
onSyncChange((count) => void) → () => void

// Tipos
type SyncEventType = "sync:started" | "sync:completed" | "sync:failed" | "sync:online" | "sync:offline"
type SyncEvent = { type: SyncEventType; timestamp: number; data?: {...} }
```

---

## Configuración

### Valores por Defecto

```typescript
const MAX_RETRY_ATTEMPTS = 3;
const INITIAL_RETRY_DELAY_MS = 1000;
const MAX_RETRY_DELAY_MS = 30000;
const DEFAULT_SYNC_INTERVAL_MS = 30000;
```

### Personalización

Se pueden inicializar con opciones personalizadas:

```typescript
// En main.tsx o App.tsx
import { initBackgroundSync } from "@/lib/sync/background-sync";

initBackgroundSync({
  intervalMs: 60000,  // cada 60 segundos
  autoSync: true,     // sync automático al volver online
});
```

---

## Testing

### Escenario 1: Mutation Offline

1. Ponerse offline (DevTools → Network → Offline)
2. Hacer mutation (ej: agregar hijo)
3. Verificar que se guarda en IndexedDB
4. Volver online
5. Verificar que se sincroniza automáticamente

### Escenario 2: Múltiples Mutations

1. Estar offline
2. Hacer varias mutations (prioridades mix)
3. Volver online
4. Verificar orden de procesamiento (alta → media → baja)

### Escenario 3: Retry Failed

1. Hacer mutation offline
2._forzar error en servidor (simular)
3. Verificar retry con backoff
4. Verificar después de 3 fallos se marca como failed

### Verificar en DevTools

```
IndexedDB > amauta-offline-queue > mutations
{
  "id": "mut_1713792345678_abc123",
  "type": "addChild",
  "payload": {...},
  "status": "pending",
  "priority": 2,
  "retryCount": 0
}
```

---

## Notas

- Las mutations de auth (login, logout, register) tienen prioridad alta
- El background sync usa setInterval, no Service Worker Background Sync API (mayor compatibilidad)
- Si el usuario cierra la pestaña mientras hay pending mutations, se sincronizan al abrir de nuevo
- conflict.ts está preparado para otras estrategias si se necesitan en el futuro

---

## Siguiente Fase (Fase 5)

- UI de indicadores offline en la app
- Panel de estado de sincronización
- Notificaciones cuando sync completa o falla
- Limpieza automática de mutations antiguas