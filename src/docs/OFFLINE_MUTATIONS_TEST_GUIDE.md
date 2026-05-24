# Guía de Prueba — Offline Mutations (Actualizada)

> ⚠️ **Documento actualizado.** Para la referencia definitiva, ver
> [`OFFLINE_QUEUE_SYSTEM.md`](./OFFLINE_QUEUE_SYSTEM.md).
>
> Cambios desde la versión original:
> - El hook a testear ahora es `useSafeMutation` (no `useOfflineMutation`)
> - La DB de cola es `amauta-db` (tabla `mutations`), no `amauta-offline-queue`
> - ConnectionStatus usa `useOfflineMode`, no `usePendingMutations`

## Prerrequisitos

1. Abrir la aplicación en Chrome/Edge
2. Abrir DevTools (F12)
3. Ir a la pestaña **Application**

---

## Estructura de Datos en el Navegador

```
IndexedDB
└── amauta-db
    └── mutations (EntityTable)
        ├── id: string           → "mut_1713792345678_abc123"
        ├── type: MutationType   → "submitAnswer" | "addChild" | etc
        ├── payload: unknown     → datos a enviar
        ├── endpoint: string     → "/api/..."
        ├── method: string       → "POST" | "PUT" | etc
        ├── priority: number     → 1 (alta), 2 (media), 3 (baja)
        ├── retryCount: number   → 0-3
        ├── status: string       → "pending" | "syncing" | "done" | "failed"
        └── createdAt: number    → timestamp
```

---

## Test 1: Verificar que Mutation se Encola Offline

**Pasos:**
1. DevTools → Network → Throttling → **Offline**
2. Responder un ejercicio o hacer una mutation
3. Verificar en Application → IndexedDB → `amauta-db` → `mutations`

**Esperado:**
- ✅ La mutation se guarda con `status: "pending"`
- ✅ `retryCount: 0`

---

## Test 2: Verificar Sincronización Automática

**Pasos:**
1. Tener mutations pendientes (de Test 1)
2. DevTools → Network → Throttling → **No throttling**
3. Observar que la mutation se procesa automáticamente

**Esperado:**
- ✅ Si exitosa: mutation eliminada de la cola
- ✅ Si falla: `status: "failed"`, `retryCount` se incrementa

---

## Test 3: Verificar Retry con Exponential Backoff

**Pasos:**
1. Ponerse offline
2. Hacer una mutation
3. Volver online (forzar error modificando endpoint si es necesario)
4. Observar retryCount en IndexedDB

**Esperado:**
- ✅ `retryCount` aumenta hasta 3
- ✅ Delay: 1s → 2s → 4s
- ✅ Después de 3 fallos: `status: "failed"`

---

## Test 4: Verificar Prioridad

**Pasos:**
1. Ponerse offline
2. Hacer mutations de diferentes prioridades (alta, media, baja)
3. Volver online
4. Verificar orden de procesamiento

**Esperado:**
- ✅ Prioridad 1 primero, luego 2, luego 3

---

## Cómo Diagnosticar Errores

### Error: Mutation no se encola
- Verificar que el componente usa `useSafeMutation` con `offline` config
- Verificar `navigator.onLine` es `false`

### Error: Sync no inicia
- Verificar que `initBackgroundSync` se llama en `App.tsx`
- En consola: `import { getQueueState } from "@/lib/sync/queue-manager"; await getQueueState();`

### Error: Mutations siempre fallan
- Revisar `errorMessage` en la mutation dentro de IndexedDB
- Verificar que el endpoint es correcto

---

## Consola — Comandos de Diagnóstico

```javascript
// Ver mutations pendientes
import { db } from "@/lib/api/storage/db";
await db.mutations.where({ status: "pending" }).toArray();

// Estado del sync
import { getQueueState } from "@/lib/sync/queue-manager";
await getQueueState();

// Forzar sync manual
import { triggerSync } from "@/lib/sync/queue-manager";
await triggerSync();

// Limpiar cola
import { clearQueue } from "@/lib/sync/queue-manager";
await clearQueue();
```

---

## Referencias

- [`OFFLINE_QUEUE_SYSTEM.md`](./OFFLINE_QUEUE_SYSTEM.md) — Documentación definitiva
- [`OUTBOX_PATTERN.md`](./OUTBOX_PATTERN.md) — Patrón outbox
