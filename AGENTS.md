# AGENTS.md - Amauta

## Stack
- React 19 + TypeScript ~5.9 + Vite 7
- Tailwind CSS 4.2 + shadcn/ui
- Zustand (estado), TanStack Query (data fetching)
- React Router 7, React Hook Form + Zod
- Dexie (IndexedDB), Workbox (PWA)
- Vitest 4 (installed but NOT configured)

## Commands
```bash
pnpm dev        # dev server
pnpm build      # tsc -b && vite build
pnpm lint       # eslint .
pnpm preview    # production preview
```

## ⚠️ Testing
- **NOT configured**: no vitest.config.ts, no test scripts in package.json
- vitest is installed but requires setup to run tests

## Required Conventions
- **Always use `import type`** for type-only imports
- **Named exports only** - no default exports for components
- **Function declarations** for components, arrow functions for utilities
- **_NO emojis** in code, **NO unnecessary comments**
- Use `@/` alias for imports from `src/`

### Import Order
1. External libraries
2. UI components (`@/components/ui`)
3. Utilities (`@/lib`)
4. Domain modules
5. Type imports (`import type`)

### Zustand Stores
```typescript
// ✅ Individual selectors
const user = useAuthStore((state) => state.user);

// ❌ Object destructuring
const { user } = useAuthStore((state) => state);
```

## Architecture
- **Feature-based DDD**: `src/features/[domain]/`
- Each feature: `application/`, `components/`, `domain/`, `hooks/`, `infrastructure/`, `pages/`, `store/`, `utils/`
- Routes use React Router `RouteObject` with guards (`RequireAuth`, `RequireRole`)

## Entry Points
- App: `src/App.tsx`
- Main: `src/main.tsx`
- Styles: `src/index.css` (Tailwind + global)
- PWA Service Worker: `src/sw.ts`

## Documentación de Arquitectura

⚠️ **ANTES de hacer cambios en autenticación o persistencia, leer:**

1. `docs/ARCHITECTURE_LAYERS.md` - Flujo completo de capas de la aplicación
2. `docs/DEXIE_INDEXEDDB_GUIDE.md` - Guía completa de Dexie/IndexedDB
3. `docs/OUTBOX_PATTERN.md` - Patrón outbox para mutations offline
4. `docs/PERSISTENCE_DEXIE.md` - Persistencia general (complementario)
5. `docs/API_CONTRACT.md` - Contrato de API con el backend

⚠️ **IMPORTANTE**: Si necesitas información sobre **persistencia de datos**:
- **Dexie**, **IndexedDB** → Leer `docs/DEXIE_INDEXEDDB_GUIDE.md`
- **Outbox**, **mutation offline**, **cola de sync** → Leer `docs/OUTBOX_PATTERN.md`

---

## Flujo de Inicialización de la App

### Capas de Hydratación

```
┌─────────────────────────────────────────────────────┐
│ 1. App Mount                                      │
 │    ↓                                             │
 │ 2. QueryClient se crea (vacío)                   │
 │    ↓                                             │
 │ 3. AuthInitializer ──► AuthStore (Dexie)       │
 │    ├── Verifica sesión                          │
 │    ├── hasHydrated = true                      │
 │    └── user → queryClient.setQueryData()       │
 │    ↓                                             │
 │ 4. QueryInitializer ──► QueryClient (Dexie) │
 │    ├── Lee exercises, lessons, students        │
 │    ├── setQueryData() con datos                  │
 │    └── hasHydrated = true                     │
 │    ↓                                             │
 │ 5. App lista para renderizar                   │
 └─────────────────────────────────────────────────────┘
```

### Diferencia entre Auth y Query

| Aspecto | AuthInitializer | QueryInitializer |
|---------|---------------|-------------------|
| **Qué hydratea** | Tokens, user, preferences | Exercises, lessons, students |
| **Dónde guarda** | Zustand (memoria) | React Query (cache) |
| **Fuente** | Dexie (tokens, users, preferences) | Dexie (exercises, lessons, students) |
| **Pattern** | Hydratación store | Precarga a cache |

## Documentación de Auth

⚠️ **ANTES de hacer cambios en autenticación, leer estos documentos:**

1. `docs/AUTH_FLOW.md` - Flujos de autenticación (login, logout, refresh, offline)
2. `docs/AUTH_CHANGES.md` - Historial de cambios y decisiones técnicas
3. `docs/PERSISTENCE_TEST_GUIDE.md` - Guía de pruebas y debugging

### Arquitectura de Auth Actual

```
┌─────────────────────────────────────────────────────┐
│ Dexie (amauta-db v1) - Fuente de verdad            │
│ ├── tokens     → accessToken, refreshToken         │
│ ├── users      → AuthUser                       │
│ ├── preferences → selectedStudentId              │
│ └── mutations  → Cola offline (outbox)           │
└─────────────────────────────────────────────────────┘
                    ↓ hydrate
┌─────────────────────────────────────────────────────┐
│ Zustand Store (memoria) - Estado runtime          │
│ ├── user, isAuthenticated, hasHydrated          │
│ ├── isVerifying, selectedStudentId              │
│ └── hasHydrated se establece en hydrateFromStorage│
└─────────────────────────────────────────────────────┘
                            ↓ + precarga
┌─────────────────────────────────────────────────────┐
│ React Query (QueryClient) - Cache                 │
│ ├── exercises: [...]                           │
│ ├── lessons: [...]                              │
│ ├── students: [...]                           │
│ └── se precarga desde Dexie al inicio            │
└─────────────────────────────────────────────────────┘
```

### Flujo de Inicialización (Actual)

```
1. App mount → hasHydrated = false, isVerifying = true
2. useAuthInitializer detecta hasHydrated = false
3. hydrateFromStorage() → AuthStore (tokens, user, preferences)
4. QueryInitializer → React Query (exercises, lessons, students)
5. Ambos hydratados → UI muestra contenido real
```

### Storage de selectedStudentId

- **Antes**: localStorage (Zustand persist)
- **Ahora**: Dexie preferences table (v2)
- **Función**: `saveSelectedStudentId()`, `getSelectedStudentId()`, `clearSelectedStudentId()`
- **Sincronización**: Se guarda en Dexie al seleccionar, se carga en hydration

---

## Fase 4: Offline Mutations + Background Sync

⚠️ **ANTES de implementar mutations offline, leer**: `docs/PHASE4_PLAN.md`

⚠️ **PARA PROBAR**, leer: `docs/PHASE4_TEST_GUIDE.md`

⚠️ **PARA VER DIAGRAMAS**, leer: `docs/PHASE4_FLOW.md`

### Integración Actual

| Componente | Archivo | Estado |
|------------|---------|--------|
| **Hook useOfflineMutation** | `src/lib/sync/useOfflineMutation.ts` | ✅ Usado en components |
| **Hook usePendingMutations** | `src/lib/sync/useOfflineMutation.ts` | ✅ Usado en ConnectionStatus |
| **ConnectionStatus** | `src/components/pwa/ConnectionStatus.tsx` | ✅ Integrado |
| **Init Background Sync** | `src/lib/sync/background-sync.ts` | Listo para usar |

### Cómo Usar useOfflineMutation

```typescript
import { useOfflineMutation } from "@/lib/sync/useOfflineMutation";

const { mutate, isOnline, isQueued, pendingCount, error, retry } = useOfflineMutation({
  type: "addChild",
  endpoint: "/parents/{parentId}/children",
  method: "POST",
  onQueued: (mutationId) => {
    toast.success("Guardado offline");
  },
});

// En el UI
<button onClick={() => mutate({ name: "Nuevo", email: "x@x.com" })}>
  Agregar
</button>
```

### Inicialización (Recomendado en App.tsx)

```typescript
import { initBackgroundSync } from "@/lib/sync/background-sync";

initBackgroundSync({
  intervalMs: 30000,  // cada 30 segundos
  autoSync: true,
});
```

### Decisiones Técnicas

| Decisión | Opción | Justificación |
|---------|-------|------------|
| Mutations offline | Todas | Simplicidad - no hay que discernir cuál necesita offline |
| Retry attempts | 3 max | Suficiente para recover de errores transitorios |
| Estrategia de conflicto | Last-write-wins | Simple, suficiente para datos de un dispositivo |
| Prioridad | Sí | Mejor UX cuando hay muchas operaciones |

### Priority de Mutations

| Prioridad | Mutaciones |
|----------|----------|
| Alta (1) | login, logout, register |
| Media (2) | addChild, updateProgress |
| Baja (3) | updateProfile, updatePreferences |

### Archivos Creados

```
src/lib/
├── api/storage/
│   └── offline-queue.ts        # Cola de mutations en Dexie
└── sync/
    ├── retry.ts                    # Exponential backoff
    ├── conflict.ts                # Last-write-wins resolver
    ├── queue-manager.ts          # Lógica de cola
    ├── background-sync.ts         # Background sync handler
    └── useOfflineMutation.ts     # Hook para mutations
```

### Uso

```typescript
import { useOfflineMutation } from "@/lib/sync/useOfflineMutation";

const { mutate, isOnline, isQueued, pendingCount, error, retry } = useOfflineMutation({
  type: "addChild",
  endpoint: "/parents/{parentId}/children",
  method: "POST",
});
```

### Hooks Disponibles

- **useOfflineMutation**: Para mutations que necesitan soporte offline
- **usePendingMutations**: Para mostrar estado de cola en UI