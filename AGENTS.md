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

---

## Service Worker (PWA)

⚠️ **ANTES de hacer cambios en el Service Worker, leer**: `docs/SERVICE_WORKER.md`

### Arquitectura de Caching

```
┌────────────────────────────────────────────────────────────────────┐
│ Cache Storage                                                     │
├──────────────────┬───────────────────┬──────────────────────────┤
│ precache-v2      │ navigation-cache  │ runtime caches            │
│ (12 entries)     │ -v1               │ - images-cache-v1         │
│                  │                   │ - api-get-cache-v1         │
│ - index.html     │ NavigationRoute   │ - static-resources-v1     │
│ - app JS/CSS     │ (StaleWhileReval)  │                           │
│ - iconos         │ + PrecacheFallback │                           │
└──────────────────┴───────────────────┴──────────────────────────┘
```

### Estrategias de Caching

| Tipo | Estrategia | Offline Support |
|------|------------|----------------|
| App Shell (precache) | CacheFirst | Total |
| **Navegación SPA** | StaleWhileRevalidate + PrecacheFallbackPlugin | Total |
| API GET | NetworkFirst (5s timeout) | Partial |
| Imágenes | CacheFirst | Total |
| Scripts/CSS/Fonts | StaleWhileRevalidate | Total |
| API POST | NetworkOnly + BackgroundSync | Cola offline |

### Por Qué StaleWhileRevalidate para Navegación

**Decisión**: Para educación infantil, "rápido y siempre disponible" > "datos siempre frescos".

| Comportamiento | Online | Offline |
|---------------|--------|---------|
| Primera request | Sirve cache, actualiza en background | Sirve index.html del precache |
| Requests siguientes | Instantáneo (cache actualizado) | Cache disponible |
| F5 en cualquier ruta | NavigationRoute sirve index.html | PrecacheFallbackPlugin sirve index.html |

### Registro del SW

```typescript
// src/main.tsx
if ('serviceWorker' in navigator) {
  registerServiceWorker()
}
```

### Testing Offline

1. `pnpm build && pnpm preview`
2. DevTools → Application → Service Workers
3. Navegar a una ruta (ej: `/dashboard/student`)
4. Marcar "Offline"
5. F5 → La app debe cargar desde precache

---

## Documentación de Arquitectura

⚠️ **ANTES de hacer cambios en autenticación o persistencia, leer:**

1. `docs/ARCHITECTURE_LAYERS.md` - Flujo completo de capas de la aplicación
2. `docs/DEXIE_INDEXEDDB_GUIDE.md` - Guía completa de Dexie/IndexedDB
3. `docs/OUTBOX_PATTERN.md` - Patrón outbox para mutations offline
4. `docs/PERSISTENCE_DEXIE.md` - Persistencia general (complementario)
5. `docs/API_CONTRACT.md` - Contrato de API con el backend
6. `docs/ERROR_HANDLING.md` - Manejo de errores y edge cases

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
│ ├── isVerifying, selectedStudentId           │
│ ├── isOfflineMode                          ← NUEVO │
│ └── lastAuthError                         ← NUEVO │
└─────────────────────────────────────────────────────┘
                            ↓ + precarga
┌─────────────────────────────────────────────────────┐
│ React Query (QueryClient) - Cache                 │
│ ├── exercises: [...]                           │
│ ├── lessons: [...]                              │
│ └── students: [...]                             │
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

⚠️ **ANTES de implementar mutations offline, leer**: `docs/OFFLINE_MUTATIONS_PLAN.md`

⚠️ **PARA PROBAR**, leer: `docs/OFFLINE_MUTATIONS_TEST_GUIDE.md`

⚠️ **PARA VER DIAGRAMAS**, leer: `docs/OFFLINE_MUTATIONS_FLOW.md`

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

---

## Fase 7: Errores y Edge Cases

### Documentación

⚠️ **ANTES de hacer cambios en manejo de errores, leer**: `docs/ERROR_HANDLING.md`

### Códigos de Error

```typescript
// src/features/auth/domain/auth-error.ts
export type AuthErrorCode =
  | "TOKEN_EXPIRED"      // Token expiró
  | "TOKEN_INVALID"      // Token no válido
  | "TOKEN_REVOKED"     // Token fue revocado por seguridad
  | "REFRESH_FAILED"    // No se pudo refresh
  | "NETWORK_ERROR"   // Sin conexión
  | "SESSION_NOT_FOUND"; // No hay sesión
```

### Edge Cases Implementados

| Edge Case | Manejo |
|----------|-------|
| **Refresh fail + hay sesión offline** | Mantiene sesión, offlineMode = true, acceso read-only |
| **Refresh fail + no hay sesión** | clearSession(), redirigir a /login |
| **Token revocado** | clearSession() forzado, "Sesión cerrada por seguridad" |
| **Outbox overflow** | MAX_OUTBOX_SIZE = 50, trim oldest when needed |

### Componentes de Error

| Componente | Archivo | Propósito |
|-----------|--------|----------|
| **ErrorBoundary** | `src/components/error/ErrorBoundary.tsx` | Clase para capturar errores |
| **StudentFallback** | `src/components/error/FallbackUI.tsx` | Fallback amigable para niños |
| **ParentFallback** | `src/components/error/FallbackUI.tsx` | Fallback profesional para padres |
| **GenericFallback** | `src/components/error/FallbackUI.tsx` | Fallback genérico |
| **ConnectionStatus** | `src/components/pwa/ConnectionStatus.tsx` | Banner offline |

### Fallback Types

```tsx
import { ErrorBoundary } from "@/components/error";

// Fallback para niño
<ErrorBoundary fallbackType="student">
  <Content />
</ErrorBoundary>

// Fallback para padre
<ErrorBoundary fallbackType="parent">
  <Content />
</ErrorBoundary>

// Fallback genérico
<ErrorBoundary>
  <Content />
</ErrorBoundary>
```

### Hook useOfflineMode

```tsx
import { useOfflineMode } from "@/features/auth/hooks/useOfflineMode";

function MyScreen() {
  const { isOnline, isOfflineMode, errorMessage } = useOfflineMode();

  if (isOfflineMode) {
    return <div>Modo offline: {errorMessage}</div>;
  }

  return <Content />;
}
```

### Manejo de Errores en HTTP

```tsx
import { isHttpError, getHttpErrorCode } from "@/lib/http/client";

const mutation = useMutation({
  mutationFn: doSomething,
  onError: (error) => {
    if (isHttpError(error)) {
      const code = getHttpErrorCode(error);
      console.log("Error code:", code);
    }
  },
});
```

### Error Logging

- `logError(error, context)` - Guarda en localStorage
- `getErrorLogs()` - Recupera logs
- `getErrorLogsGrouped()` - Agrupa por mensaje
- Preparado para integración con Sentry futuro

### Errores NO Capturados por ErrorBoundary

| Tipo | Capturado? | Cómo Manejar |
|------|------------|-------------|
| Errores en render | ✅ Sí | ErrorBoundary |
| Errores en useEffect | ⚠️ Solo thown | try-catch manual |
| Errores async | ❌ No | try-catch obligatorio |
| Errores en event handlers | ❌ No | try-catch obligatorio |

---

## Referencias

| Tema | Documento |
|------|---------|
| Service Worker PWA | `docs/SERVICE_WORKER.md` |
| Errores y Edge Cases | `docs/ERROR_HANDLING.md` |
| Auth Flow | `docs/AUTH_FLOW.md` |
| Outbox Pattern | `docs/OUTBOX_PATTERN.md` |
| Dexie Guide | `docs/DEXIE_INDEXEDDB_GUIDE.md` |