# Documentación de Amauta PWA

> **🗺️ ¿Buscando qué hacer ahora?** Ve directo a [`ROADMAP.md`](./planificacion/ROADMAP.md) — prioridades, tareas y próximo sprints.

## Orden Recomendado de Lectura

Para entender la aplicación desde la arquitectura general hasta los detalles específicos, sigue este orden:

### Nivel 0 — Visión General (empezar aquí)

| # | Documento | Qué explica |
|---|-----------|-------------|
| 1 | **[`VISION_GENERAL.md`](./vision/VISION_GENERAL.md)** | Visión general de Amauta en lenguaje natural: roles, funcionamiento online/offline, flujo del usuario. |

### Nivel 1 — Fundamentos

| # | Documento | Qué explica |
|---|-----------|-------------|
| 2 | [`ARCHITECTURE_LAYERS.md`](./fundamentos/ARCHITECTURE_LAYERS.md) | Capas de la app: UI → Zustand → TanStack Query → Dexie. Flujo de login, hydratación, mutations offline. |
| 3 | [`DEXIE_INDEXEDDB_GUIDE.md`](./fundamentos/DEXIE_INDEXEDDB_GUIDE.md) | Base de datos IndexedDB: tablas, esquemas, operaciones CRUD. |
| 4 | [`PERSISTENCE_DEXIE.md`](./fundamentos/PERSISTENCE_DEXIE.md) | Persistencia general: auth, tokens, usuarios, preferencias. |

### Nivel 2 — Features Core

| # | Documento | Qué explica |
|---|-----------|-------------|
| 5 | [`AUTH_FLOW.md`](./core/AUTH_FLOW.md) | Flujo de autenticación: login, logout, refresh, offline mode. |
| 6 | [`AUTH_CHANGES.md`](./core/AUTH_CHANGES.md) | Historial de cambios y decisiones técnicas de auth. |
| 7 | [`API_CONTRACT.md`](./core/API_CONTRACT.md) | Contrato de API con el backend: endpoints, request/response. |
| 8 | [`BACKEND_CONFLICT_RESOLUTION.md`](./core/BACKEND_CONFLICT_RESOLUTION.md) | Contrato de conflict resolution para el backend: timestamps, HTTP 409, estrategias por endpoint. |

### Nivel 3 — Offline & Sincronización

| # | Documento | Qué explica |
|---|-----------|-------------|
| 9 | **[`OFFLINE_QUEUE_SYSTEM.md`](./offline/OFFLINE_QUEUE_SYSTEM.md)** | Sistema de cola offline actual: app-level outbox con Dexie + queue-manager + background-sync + useSafeMutation. |
| 10 | [`OUTBOX_PATTERN.md`](./offline/OUTBOX_PATTERN.md) | Patrón outbox (actualizado). Concepto general + referencias al sistema actual. |
| 11 | [`SERVICE_WORKER.md`](./offline/SERVICE_WORKER.md) | Service Worker: precaching, runtime caching, navegación SPA, patrones de matching API. Sin manejo de cola offline (ver punto 9). |
| 11b | [`MANIFEST.md`](./offline/MANIFEST.md) | Web App Manifest: campos clave, iconos (any vs maskable), shortcuts, troubleshooting. |
| 11c | [`CACHES_EXPLAINED.md`](./offline/CACHES_EXPLAINED.md) | Explicación detallada de cada cache del SW: por qué se crean (o no), condiciones, impacto. |

### Nivel 4 — Historial / Contexto de Implementación

| # | Documento | Qué explica |
|---|-----------|-------------|
| 12 | [`FASE3-MUTACIONES-UNIFICADAS.md`](./historial/FASE3-MUTACIONES-UNIFICADAS.md) | Historial de la migración de `useOfflineMutation` → `useSafeMutation`. |
| 13 | [`OFFLINE_MUTATIONS_PLAN.md`](./historial/OFFLINE_MUTATIONS_PLAN.md) | Plan original de offline mutations (histórico). |
| 14 | [`OFFLINE_MUTATIONS_FLOW.md`](./historial/OFFLINE_MUTATIONS_FLOW.md) | Diagramas de flujo originales (actualizados). |
| 15 | [`OFFLINE_MUTATIONS_TEST_GUIDE.md`](./historial/OFFLINE_MUTATIONS_TEST_GUIDE.md) | Guía de testing offline (actualizada). |

### Nivel 5 — Errores y Edge Cases

| # | Documento | Qué explica |
|---|-----------|-------------|
| 16 | [`ERROR_HANDLING.md`](./errores/ERROR_HANDLING.md) | Manejo de errores: ErrorBoundary, códigos de error, flujos de fallback. |
| 17 | [`ERROR_HANDLING_TEST_GUIDE.md`](./errores/ERROR_HANDLING_TEST_GUIDE.md) | Testing de manejo de errores. |

### Nivel 6 — Planificación y Seguimiento

| # | Documento | Qué explica |
|---|-----------|-------------|
| 18 | [`ROADMAP.md`](./planificacion/ROADMAP.md) | Prioridades, tareas y próximos sprints. |
| 19 | [`PLAN.md`](./planificacion/PLAN.md) | Plan de trabajo por fases con estado actual. |
| 20 | [`TODOS.md`](./planificacion/TODOS.md) | Implementaciones pendientes y su estado. |

---

## Resumen por Tema

### Sistema de Cola Offline (Estado Actual)

```
Componente (useSafeMutation)
    │
    ▼
queueMutation() ──► online? ──► HTTP directo
    │                              │
    ▼                              ▼
offline? ──► Dexie (mutations) ──► background-sync ──► processQueue
```

**Archivos clave:**
- `src/lib/sync/useSafeMutation.ts` — Hook único para mutations
- `src/lib/sync/queue-manager.ts` — Lógica de cola + ejecución HTTP
- `src/lib/sync/background-sync.ts` — Sync automático
- `src/lib/api/storage/offline-queue.ts` — CRUD de mutations en Dexie
- `src/lib/api/storage/db.ts` — Schema Dexie (tabla `mutations`)

### Service Worker (Estado Actual)

Solo caching. Sin manejo de cola offline.

| Estrategia | Cache |
|------------|-------|
| CacheFirst | images-cache-v1 |
| NetworkFirst (5s) | api-get-cache-v1 |
| StaleWhileRevalidate | static-resources-v1 |
| NetworkOnly | API POST (sin plugins) |
| StaleWhileRevalidate + PrecacheFallback | navigation-cache-v1 |

### UI Integrada

| Componente | Ubicación | Propósito |
|-----------|-----------|-----------|
| `ConnectionStatus` | `AmautaLayout` | Banner offline |
| `UpdateToast` | `App.tsx` | Notificación de actualización |
| `DownloadLesson` | `LessonPage` | Descarga de assets offline |
| `ErrorBoundary` | `App.tsx` + `AmautaLayout` | Captura de errores |

---

## Leyenda

- **🆕 Nuevo/Actualizado** — Documento creado o actualizado para reflejar el estado actual
- **📜 Histórico** — Documento que describe decisiones pasadas; puede contener referencias obsoletas
