# Offline Mutations — Flujo y Arquitectura (Actualizado)

> ⚠️ **Documento actualizado.** Para la referencia definitiva, ver
> [`OFFLINE_QUEUE_SYSTEM.md`](./OFFLINE_QUEUE_SYSTEM.md).
>
> Cambios principales desde la versión original:
> - `useOfflineMutation` → **eliminado**, reemplazado por `useSafeMutation`
> - `ConnectionStatus` ya no tiene `triggerSync()` (lo maneja `background-sync.ts`)
> - DB de cola: `amauta-db` (tabla `mutations`), no `amauta-offline-queue`

## Arquitectura General

```
┌───────────────────────────────────────────────────────────────────────────┐
│                    PWA Amauta - Offline Mutations                         │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │                    COMPONENTES (UI)                               │    │
│  │  ┌──────────────┐  ┌──────────────────────────────┐              │    │
│  │  │ Componente   │  │ ConnectionStatus            │              │    │
│  │  │ (useSafe     │  │ - isOnline                   │              │    │
│  │  │  Mutation)   │  │ - lastAuthError              │              │    │
│  │  └──────┬───────┘  └──────────────────────────────┘              │    │
│  │         │                                                        │    │
│  │         ▼                                                        │    │
│  │  ┌────────────────────────────────────────────────────────────┐  │    │
│  │  │              useSafeMutation (hook)                        │  │    │
│  │  │  - mutationFn → HTTP call                                  │  │    │
│  │  │  - optimisticUpdate → feedback instantáneo                │  │    │
│  │  │  - offline: { type, endpoint, method } → queueMutation()  │  │    │
│  │  │  - tentativeOnly → sin score falso                        │  │    │
│  │  └─────────────────────┬──────────────────────────────────────┘  │    │
│  └────────────────────────┼──────────────────────────────────────────┘    │
│                           │                                              │
└───────────────────────────┼──────────────────────────────────────────────┘
                            │
                            ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                    CAPA DE SINCRONIZACIÓN                                 │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │          background-sync.ts                                       │    │
│  │  initBackgroundSync({ intervalMs: 30000, autoSync: true })       │    │
│  │       │                                                          │    │
│  │       ├──► setInterval cada 30s                                  │    │
│  │       ├──► Eventos online/offline                                │    │
│  │       └──► Al mount: procesa cola si hay pendientes             │    │
│  └────────────────────────────────┬─────────────────────────────────┘    │
│                                   │                                      │
│                                   ▼                                      │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │                 queue-manager.ts                                  │    │
│  │                                                                   │    │
│  │  isOnline() → navigator.onLine                                    │    │
│  │  queueMutation() → online: HTTP / offline: Dexie                 │    │
│  │  processQueue() → getQueuedMutationsByPriority()                 │    │
│  │       │                                                          │    │
│  │       ▼                                                          │    │
│  │  ┌──────────────────────────────────┐                            │    │
│  │  │ FOR each mutation (por prioridad)│                            │    │
│  │  │  1. executeMutation() → HTTP     │                            │    │
│  │  │  2. Success? → removeMutation() │                            │    │
│  │  │  3. Fail? → incrementRetryCount │                            │    │
│  │  │  4. Exhausted? → status: failed │                            │    │
│  │  └──────────────────────────────────┘                            │    │
│  └──────────────────────────────────────────────────────────────────┘    │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                    PERSISTENCIA (Dexie)                                   │
│                                                                           │
│  IndexedDB: amauta-db                                                     │
│  ┌──────────────────────────────────────────────────────────────┐        │
│  │  mutations (EntityTable)                                      │        │
│  │  ──────────────────────────────────────────────────────────  │        │
│  │  id: string (PK), type: MutationType, payload: unknown        │        │
│  │  endpoint: string, method: string, priority: 1|2|3           │        │
│  │  retryCount: number, status: string, createdAt: number        │        │
│  └──────────────────────────────────────────────────────────────┘        │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
```

---

## Inicialización

```typescript
// En src/App.tsx
useEffect(() => {
  initBackgroundSync({ intervalMs: 30000, autoSync: true });
}, []);
```

---

## Dónde se Usa

1. **`useSafeMutation`** — Hook único para mutations con soporte offline
2. **`ConnectionStatus`** — Banner offline en `AmautaLayout`
3. **`UpdateToast`** — Notificación de nueva versión en `App.tsx`
4. **`initBackgroundSync`** — En `App.tsx` (procesa cola automáticamente)

---

## Referencias

- [`OFFLINE_QUEUE_SYSTEM.md`](./OFFLINE_QUEUE_SYSTEM.md) — Documentación definitiva del sistema
- [`OUTBOX_PATTERN.md`](./OUTBOX_PATTERN.md) — Patrón outbox (actualizado)
