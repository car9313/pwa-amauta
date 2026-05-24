# Plan de Offline Mutations (Histórico)

> ⚠️ **Documento histórico.** Para la documentación actual del sistema de cola offline,
> ver [`OFFLINE_QUEUE_SYSTEM.md`](./OFFLINE_QUEUE_SYSTEM.md).
>
> Cambios relevantes desde este plan:
> - El hook `useOfflineMutation` fue **eliminado** en Fase 3. Reemplazado por `useSafeMutation`.
> - La cola vive en `amauta-db` (tabla `mutations`), no en `amauta-offline-queue` (DB separada).
> - `submitAnswer` es prioridad 1 (alta) — agregado tras el plan inicial.
> - Fase 5 (UI offline, ConnectionStatus, UpdateToast, initBackgroundSync) ya fue ejecutada.

## Fecha de Implementación
21/04/2026

## Resumen

Se implementó soporte offline para mutations (operaciones de escritura) en la PWA Amauta. Las mutations ahora se encolan cuando no hay conexión y se sincronizan automáticamente cuando la red vuelve.

---

## Decisiones Técnicas y Justificación

### 1. Mutations Offline

| Decisión | Opción Elegida | Justificación |
|---------|---------------|---------------|
| ¿Qué mutations necesitan offline? | **Todas** | Simplicidad |

### 2. Retry Attempts

| Decisión | Opción Elegida | Justificación |
|----------|---------------|---------------|
| Retry attempts | **3 max** | Suficiente para errores transitorios sin saturar el servidor |

### 3. Estrategia de Conflicto

| Decisión | Opción Elegida | Justificación |
|----------|---------------|---------------|
| Estrategia de conflicto | **Last-write-wins (LWW)** | Simple, suficiente para un solo dispositivo |

### 4. Prioridad de Mutations

| Prioridad | Valor | Mutaciones |
|-----------|-------|------------|
| Alta | 1 | login, logout, register, **submitAnswer** |
| Media | 2 | addChild, updateProgress |
| Baja | 3 | updateProfile, updatePreferences |

---

## Arquitectura

### Estado Actual

- **DB:** `amauta-db` (unificada), tabla `mutations`
- **Hook principal:** `useSafeMutation` (reemplaza `useOfflineMutation`)
- **Sync:** `background-sync.ts` + `queue-manager.ts`
- **Service Worker:** Solo caching, sin `BackgroundSyncPlugin`
- **UI:** `ConnectionStatus` en layout, `UpdateToast` en App, `initBackgroundSync` en App.tsx

### Flujo de Mutation Offline

```
Usuario → useSafeMutation.mutate()
  ├── Online → HTTP directo (+ optimisticUpdate)
  ├── Online + HTTP fail → encola en Dexie (retry automático)
  └── Offline → encola en Dexie → sync al reconectar
```

### Exponential Backoff

```
Intento 0 → 1s  |  Intento 1 → 2s  |  Intento 2 → 4s  |  Máximo: 30s
```

---

## Archivos

| Archivo | Estado |
|---------|--------|
| `src/lib/sync/useSafeMutation.ts` | **Nuevo** (reemplaza `useOfflineMutation`) |
| `src/lib/sync/useOfflineMutation.ts` | **Eliminado** (Fase 3) |
| `src/lib/sync/queue-manager.ts` | Modificado: queueMutation ejecuta HTTP cuando online |
| `src/lib/sync/background-sync.ts` | Sin cambios |
| `src/lib/api/storage/offline-queue.ts` | Agregado `submitAnswer` a MutationType |
| `src/sw.ts` | Eliminado `BackgroundSyncPlugin` |

---

## Notas

- El background sync usa `setInterval` + evento `online`, no Service Worker Background Sync API (mayor compatibilidad cross-browser)
- Si el usuario cierra la pestaña mientras hay pending mutations, `initBackgroundSync` las procesa al abrir de nuevo
- `conflict.ts` está preparado para otras estrategias si se necesitan en el futuro

---

## Referencias

- [`OFFLINE_QUEUE_SYSTEM.md`](./OFFLINE_QUEUE_SYSTEM.md) — Documentación definitiva del sistema actual
- [`FASE3-MUTACIONES-UNIFICADAS.md`](./FASE3-MUTACIONES-UNIFICADAS.md) — Detalle de la migración de hooks