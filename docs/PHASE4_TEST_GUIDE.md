# Guía de Prueba - Fase 4: Offline Mutations

## Visión General

Esta guía describe cómo probar que las mutations offline funcionan correctamente en la PWA Amauta.

---

## Prerrequisitos

1. Abrir la aplicación en Chrome/Edge
2. Abrir DevTools (F12)
3. Ir a la pestaña **Application**

---

## Estructura de Datos en el Navegador

### IndexedDB - Offline Queue

```
IndexedDB
└── amauta-offline-queue
    └── mutations (EntityTable)
        ├── id: string
        ├── type: MutationType
        ├── payload: any
        ├── endpoint: string
        ├── method: string
        ├── priority: number (1=alta, 2=media, 3=baja)
        ├── retryCount: number
        ├── status: "pending" | "syncing" | "done" | "failed"
        ├── createdAt: number
        ├── lastAttemptAt: number | null
        ├── errorMessage: string | null
        └── result: any | null
```

---

## Test 1: Verificar que Mutation se Encola Offline

### Pasos:

1. **Ponerse offline:**
   - DevTools → Network → Throttling → **Offline**

2. **Hacer una mutation:**
   - Si eres padre, intentar agregar un hijo
   - O intentar actualizar progreso de ejercicio

3. **Verificar en DevTools:**
   ```
   IndexedDB > amauta-offline-queue > mutations
   {
     "id": "mut_1713792345678_abc123",
     "type": "addChild",
     "payload": {...},
     "endpoint": "/parents/par_001/children",
     "method": "POST",
     "priority": 2,
     "retryCount": 0,
     "status": "pending",
     "createdAt": 1713792345678
   }
   ```

**Esperado:**
- ✅ La mutation se guarda en IndexedDB
- ✅ status = "pending"
- ✅ retryCount = 0

---

## Test 2: Verificar Sincronización Automática

### Pasos:

1. **Tener mutations pendientes (de Test 1)**

2. **Volver online:**
   - DevTools → Network → Throttling → **No throttling**

3. **Observar sincronización:**
   - La mutation debería cambiar de status
   - DevTools → IndexedDB debería mostrar el cambio

4. **Verificar en DevTools después de sync:**
   ```
   IndexedDB > amauta-offline-queue > mutations
   // Si exitoso: registro eliminado
   // Si falla: status = "failed", retryCount > 0
   ```

**Esperado:**
- ✅ La mutation se procesa automáticamente
- ✅ Si exitosa: se elimina de la cola
- ✅ Si falla: status = "failed", retryCount aumenta

---

## Test 3: Verificar Retry con Exponential Backoff

### Pasos:

1. **Ponerse offline**

2. **Hacer una mutation**

3. **Forzar error:**
   - Volver online
   - Mockuedeberíafallar (o puedes modificar el endpoint)

4. **Observar retry:**
   - Revisar mutations en IndexedDB
   - retryCount debería aumentar

5. **Verificar timing:**
   ```
   IndexedDB > amauta-offline-queue > mutations
   {
     "retryCount": 1,
     "lastAttemptAt": 1713792400000  ~1s después
   }
   
   // Después de 2do intento:
   {
     "retryCount": 2,
     "lastAttemptAt": 1713792402000  ~2s después
   }
   
   // Después de 3er intento:
   {
     "retryCount": 3,
     "lastAttemptAt": 1713792406000  ~4s después
   }
   ```

**Esperado:**
- ✅ retryCount aumenta hasta 3
- ✅ Delay aumenta: 1s → 2s → 4s
- ✅ Después de 3 fallos: status = "failed"

---

## Test 4: Verificar Prioridad

### Pasos:

1. **Ponerse offline**

2. **Hacer múltiples mutations de diferentes prioridades:**
   - logout (prioridad 1, alta)
   - addChild (prioridad 2, media)
   - updatePreferences (prioridad 3, baja)

3. **Verificar orden en IndexedDB:**
   ```
   IndexedDB > amauta-offline-queue > mutations
   [
     { "type": "logout", "priority": 1 },
     { "type": "addChild", "priority": 2 },
     { "type": "updatePreferences", "priority": 3 }
   ]
   ```

4. **Volver online**

5. **Verificar orden de procesamiento:**
   - logout primero
   - luego addChild
   -最后 updatePreferences

**Esperado:**
- ✅ Las mutations de prioridad alta se procesan primero
- ✅ Orden correcto: 1 → 2 → 3

---

## Test 5: UI - useOfflineMutation Hook

### Pasos:

1. **Agregar console.log temporal para verificar estado:**

```typescript
// En tu componente
const { mutate, isOnline, isQueued, pendingCount, error } = useOfflineMutation({
  type: "addChild",
  endpoint: "/parents/{parentId}/children",
});

console.log("isOnline:", isOnline);
console.log("isQueued:", isQueued);
console.log("pendingCount:", pendingCount);
```

2. **Probar offline:**
   - Ponerse offline
   - Llamar mutate()
   - Verificar console: isOnline = false, isQueued = true, pendingCount = 1

3. **Probar online:**
   - Volver online
   - Verificar console: isOnline = true, pendingCount = 0

**Esperado:**
- ✅ isOnline refleja estado real de red
- ✅ isQueued = true cuando está en cola
- ✅ pendingCount muestra número correcto

---

## Cómo Diagnosticar Errores

### Error: Mutation no se encola

**Causa:** Código no usa useOfflineMutation

**Diagnosticar:**
- Verificar que el componente importa useOfflineMutation
- Verificar que mutation se hace a través de mutate()

### Error: Sync no inicia

**Causa:** Background sync no inicializado

**Diagnosticar:**
```javascript
// En consola
import { getSyncStatus } from "@/lib/sync/background-sync";
console.log(getSyncStatus());
// { isRunning: false, hasInterval: false }
```

**Solución:** Llamar initBackgroundSync() en App.tsx o main.tsx

### Error: Mutations siempre fallan

**Causa:** Endpoint incorrecto o servidor no responde

**Diagnosticar:**
```javascript
// En DevTools > Console
const db = await Dexie.open("amauta-offline-queue");
const mutations = await db.mutations.toArray();
console.log(mutations.map(m => m.errorMessage));
```

---

## Consola - Comandos de Diagnóstico

### Verificar estado de cola

```javascript
// Ver Mutations pendientes
import { getPendingMutationsCount } from "@/lib/sync/queue-manager";
await getPendingMutationsCount(); // number

// Ver estado completo
import { getQueueState } from "@/lib/sync/queue-manager";
await getQueueState();
// { isOnline: true, isSyncing: false, pendingCount: 0 }
```

### Ver IndexedDB directamente

```javascript
const db = await Dexie.open("amauta-offline-queue");
const mutations = await db.mutations.toArray();
console.log(mutations);
```

### Forzar sync manual

```javascript
import { triggerSync } from "@/lib/sync/queue-manager";
await triggerSync();
```

### Limpiar cola

```javascript
import { clearQueue } from "@/lib/sync/queue-manager";
await clearQueue();
```

### Ver eventos de sync

```javascript
import { onSyncEvent } from "@/lib/sync/background-sync";

onSyncEvent((event) => {
  console.log("Sync Event:", event.type, event.data);
});
```

---

## Casos de Prueba

### Escenario 1: Padre agrega hijo desde campo (offline)

| Paso | Acción | Esperado |
|------|--------|--------|
| 1 | Ponerse offline | - |
| 2 | Click "Agregar hijo" | Toast: "Guardado offline" |
| 3 | Ver IndexedDB | Mutation en cola |
| 4 | Volver online | Sync automático |
| 5 | Ver resultado | Mutation procesada |

### Escenario 2: Niño termina ejercicio (offline)

| Paso | Acción | Esperado |
|------|--------|--------|
| 1 | Ponerse offline | - |
| 2 | Terminar ejercicio | Toast: "Guardado offline" |
| 3 | Ver IndexedDB | Mutation updateProgress |
| 4 | Volver online | Sync automático |
| 5 | Ver progreso | Actualizado |

### Escenario 3: Múltiples dispositivos (conflicto)

| Paso | Acción | Esperado |
|------|--------|--------|
| 1 | Dispositivo A: modificar (offline) | En cola |
| 2 | Dispositivo B: modificar (online) | En servidor |
| 3 | Dispositivo A: volver online | Sync automático |
| 4 | Conflict detection | Last-write-wins aplica |
| 5 | Ver resultado | Gana timestamp más nuevo |

### Escenario 4: Error persistente

| Paso | Acción | Esperado |
|------|--------|--------|
| 1 | Mutation offline | En cola |
| 2 | Server devuelve error | Primer retry |
| 3 | Segundo intento | Segundo retry (2s) |
| 4 | Tercer intento | Tercer retry (4s) |
| 5 | Cuarto intento | Marcar como failed |

---

## Resumen de lo que Debería Pasar

| Escenario | IndexedDB | UI | Sync |
|----------|-----------|-----|-----|
| Mutation online | Directo | - | No necesita |
| Mutation offline | ✅ En cola | Toast "offline" | Auto al volver online |
| Retry failed | retryCount++ | - | Exponential backoff |
| Sync completo | Eliminado | - | - |
| Error final | status=failed | Notificación | - |

---

## Notas

- El hook useOfflineMutation automáticamentedetecta online/offline
- No requiere configuración adicional si se usa el hook
- El background sync corre cada 30 segundos por defecto
- Las mutations de prioridad alta se procesan primero