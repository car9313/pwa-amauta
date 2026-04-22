# Cambios de Autenticación Offline - Fase 1 y 2

## Resumen

Se implementó soporte offline para autenticación en una PWA de aprendizaje para niños, utilizando IndexedDB (Dexie) para persistencia de tokens y React Query con persistencia.

## Objetivos

1. **Auth offline**: Que los niños puedan usar la app sin conexión
2. **Refresh token**: Auto-renovación de access token
3. **React Query cache**: Queries persistidas entre sesiones
4. **Transición suave**: Mocks → API real sin cambios de código

---

## Archivos Creados

### 1. `src/lib/api/storage/auth-db.ts`

**Por qué**: IndexedDB tiene mayor capacidad que localStorage (~50MB vs ~5MB), necesario para datos de niños, imágenes de lecciones, etc.

```typescript
// Estructura de IndexedDB
interface TokenData {
  id: string;           // "amauta-tokens"
  accessToken: string;
  refreshToken: string;
  expiresAt: number;   // timestamp
  createdAt: number;
}

interface StoredUser {
  id: string;         // "amauta-user"
  user: AuthUser;
  tenantId: string;
  storedAt: number;
}
```

### 2. `src/features/auth/infrastructure/auth-storage.ts`

**Por qué**: Abstraer la lógica de storage del resto de la aplicación. Cambio futuro de storage solo requiere cambiar este archivo.

```typescript
export async function saveAuthResponse(response: AuthResponse)
export async function getAccessToken(): Promise<string | null>
export async function getRefreshToken(): Promise<string | null>
export async function loadAuthFromStorage()
export async function checkAuthValidity()
export async function clearAuth()
export async function updateAccess(access, expiresIn)
```

### 3. `src/lib/api/refresh.ts`

**Por qué**: Lógica centralizada de refresh token. Si el backend devuelve 401, el HTTP client automáticamente intenta refresh.

```typescript
export async function refreshAccessToken(): Promise<RefreshResponse>
```

### 4. `src/lib/api/storage/query-cache.ts` (reservado)

**Por qué**: Preparado para futura migración a IndexedDB. Por ahora usamos localStorage por compatibilidad con `createSyncStoragePersister`.

### 5. `src/lib/api/index.ts`

**Por qué**: Punto único de exportación para `lib/api`. Facilita imports en la app.

---

## Archivos Modificados

### 1. `src/main.tsx`

**Cambio**: QueryClientProvider simple (sin persistencia)

**Por qué**: El cache de React Query en localStorage tiene límite (~5MB) y los datos API cambian frecuentemente (stale). Simplificado para evitar complejidad innecesaria.

```tsx
// Después (simplificado)
<QueryClientProvider client={queryClient}>
```

### 2. `src/features/auth/presentation/store/auth-store.ts`

**Cambio**: 
- Eliminada persistencia zustand (no persistía bien con async)
- Agregado método `hydrateFromStorage()` que lee de IndexedDB
- `clearSession()` ahora limpia IndexedDB

**Por qué**: Zustand con persist solo soporta localStorage (síncrono). IndexedDB es asíncrono, requiere hydrate manual.

### 3. `src/features/auth/hooks/useAuthInitializer.ts`

**Cambio**: 
- Antes: Llamaba a `authAdapter.me()` para verificar token
- Después: Lee directamente de IndexedDB con `checkAuthValidity()`

**Por qué**: En offline, no podemos llamar al servidor. Confiamos en datos locales si el token no ha expirado.

```typescript
// Antes (requiere red)
const user = await authAdapter.me();
setUser(user);

// Después (信任 offline)
const isValid = await checkAuthValidity();
if (isValid) {
  await hydrateFromStorage(); // Lee de IndexedDB
}
```

### 4. `src/features/auth/infraestructure/mappers/adapter.ts`

**Cambio**:
- `login()` y `register()` ahora llaman a `saveAuthResponse()`
- `logout()` ahora llama a `clearAuth()`
- `getToken()` lee de IndexedDB en vez de localStorage

**Por qué**: Centralizar toda escritura de tokens en IndexedDB.

### 5. `src/features/auth/domain/types.ts`

**Cambio**: Agregado `refresh` y `expiresIn` al schema

```typescript
export const authResponseSchema = z.object({
  user: authUserSchema,
  token: z.string(),
  refresh: z.string().optional(),    // NUEVO
  expiresIn: z.number().optional(), // NUEVO
  tenantId: z.string().optional(),
});
```

**Por qué**: El backend devolverá refresh token para auto-renovación.

### 6. `src/lib/http/client.ts`

**Cambio**: Agregado intercept de 401 → refresh

**Por qué**: Si el token expira, intentamos refresh automáticamente sin cerrar sesión.

```typescript
if (response.status === 401) {
  const refreshed = await this.tryRefreshToken();
  if (refreshed) {
    return this.request<T>(endpoint, options);
  }
}
```

---

## Decisiones Técnicas

### 1. IndexedDB vs localStorage (tokens)

| Factor | localStorage | IndexedDB |
|--------|-------------|-----------|
| Capacidad | ~5MB | 50MB+ |
| Síncrono | Sí (bloquea UI) | No |
| Niños + imágenes | Se satura | OK |
| **Decisión** | ❌ | ✅ IndexedDB |

### 2. Refresh Token en Body (no cookie)

**Decisión**: El refresh token viene en el body de la response.

```json
{
  "access": "eyJ...",
  "refresh": "def...",
  "expiresIn": 900
}
```

**Por qué**:
- IndexedDB accesible desde cliente
- httpOnly cookies NO accesibles desde Service Worker
- Más control para PWA offline

### 3. React Query Persist (localStorage por ahora)

**Decisión temporal**: Usar localStorage para cache de queries.

```typescript
const persister = createSyncStoragePersister({
  storage: window.localStorage,
});
```

**Por qué**: `createSyncStoragePersister` de TanStack solo soporta storage síncrono. IndexedDB requiere adapter personalizado (reservado para Fase 3).

--- 

## Notas para Futuro

1. **Migrar query cache a IndexedDB**: Cuando孩子们 tengan muchas lecciones descargadas, needed migrate a Dexie para evitar límite de localStorage.

2. **Background Sync**: Para mutations offline (guardar progreso), implementar cola en IndexedDB + sync cuando online.

3. **Encrypt tokens**: Considerar encryptar refresh token en IndexedDB para mayor seguridad.

4. **Service Worker**: El SW actual ya soporta BACKGROUND SYNC para POSTs offline. Verificar que `/auth/refresh` no se encole.

---

## Actualización: Simplificación de AuthSession (FASE 1)

### Fecha: 21/04/2026

### Cambio
Simplificando el AuthSession almacenado en Dexie para eliminar redundancia:
- Eliminado `tenantId` separado de StoredUser (ya está dentro del objeto user)
- Mantenido `expiresAt` como timestamp absoluto (mejor que expiresIn relativo)
- AuthSession ahora contiene: accessToken, refreshToken, expiresAt, user, storedAt

### Archivos modificados
- `auth-db.ts`: 
  - Eliminado campo `tenantId` de `StoredUser` interface
  - Eliminado parámetro `tenantId` de `saveAuthData()`
  - Eliminado guardado de `tenantId` en transacción

- `auth-storage.ts`:
  - Eliminado uso de `tenantId` en `saveAuthResponse()`
  - Simplificado `loadAuthFromStorage()` para no esperar tenantId

### Antes del cambio (AuthSession)
```typescript
// Antes - Redundante
interface StoredUser {
  id: string;
  user: AuthUser;
  tenantId: string;     // ← Redundante con user.tenantId
  storedAt: number;
}
```

### Después del cambio (AuthSession)
```typescript
// Ahora - Sin redundancia
interface StoredUser {
  id: string;
  user: AuthUser;       // Contiene tenantId dentro
  storedAt: number;
}
```

---

## Actualización: selectedStudentId en Dexie (100% Source of Truth)

### Fecha: 21/04/2026

### Cambio
Moved `selectedStudentId` from localStorage (Zustand persist) to Dexie for consistent offline support.

### Por qué
- Mantener 100% Dexie como fuente de verdad para datos de autenticación
- Eliminar dependencia de localStorage para estado de auth

### Archivos modificados
- `src/lib/api/storage/auth-db.ts`:
  - Agregado `UserPreferences` interface
  - Actualizado version de DB a 2
  - Agregadas funciones: `saveSelectedStudentId`, `getSelectedStudentId`, `clearSelectedStudentId`

- `src/features/auth/infrastructure/auth-storage.ts`:
  - Expuestas nuevas funciones a través del AuthStorage interface

- `src/features/auth/presentation/store/auth-store.ts`:
  - Removido middleware `persist` de Zustand
  - `hydrateFromStorage()` ahora carga selectedStudentId desde Dexie
  - `selectStudent()` y `clearSelectedStudent()` escriben a Dexie
  - `clearSession()` también limpia selectedStudentId de Dexie
  - `hasHydrated` ahora se establece correctamente después de hydration

### Estructura en Dexie (v2)
```
amauta-auth
├── tokens (v1)
│   └── amauta-tokens
├── users (v1)
│   └── amauta-user
└── preferences (v2)    ← NUEVO
    └── user-preferences  ← selectedStudentId
```

### Beneficios
- selectedStudentId persiste offline correctamente
- Estado de auth 100% en Dexie
- Sin dependencia de localStorage para auth

---

## Actualización: Fase 3 - TanStack Query como Capa de Sincronización

### Fecha: 21/04/2026

### Cambio
Implementamos TanStack Query como capa de sincronización con Dexie como fuente de verdad.

### Archivos nuevos
- `src/features/auth/queries/auth-api.ts` - Funciones para interactuar con API
- `src/features/auth/queries/use-session.ts` - Hook de sesión con TanStack Query + Dexie

### Flujo de autenticación

```
┌─────────────────────────────────────────────────────────────┐
│  LOGIN - Flujo con TanStack Query + Dexie                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. UI llama useLogin().mutate()                         │
│            │                                                │
│            ▼                                                │
│  2. TanStack Query ejecuta mutation                       │
│            │                                                │
│            ▼                                                │
│  3. authAdapter.login() → API response                   │
│            │                                                │
│            ▼                                                │
│  4. saveAuthResponse() → Guardar en Dexie               │
│            │                                                │
│            ▼                                                │
│  5. Zustand.setUser() + queryClient.setQueryData()      │
│            │                                                │
│            ▼                                                │
│  6. UI se actualiza (navegación)                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  APP INICIA - Sesión offline                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. useAuthInitializer() ejecuta                          │
│            │                                                │
│            ▼                                                │
│  2. checkAuthValidity() → Lee de Dexie                  │
│            │                                                │
│            ▼                                                │
│  3. loadAuthFromStorage() → Recupera user               │
│            │                                                │
│            ▼                                                │
│  4. Zustand.setUser() + queryClient.setQueryData()      │
│            │                                                │
│            ▼                                                │
│  5. UI lista (sin llamada API)                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Keys de React Query actualizadas
```typescript
export const authKeys = {
  all: ["auth"] as const,
  session: () => [...authKeys.all, "session"] as const,
  refresh: () => [...authKeys.all, "refresh"] as const,
  // ... otras keys
};
```

### Beneficios de esta arquitectura
- **Offline-first**: La sesión se lee primero de Dexie
- **Sincronización**: TanStack Query maneja el cache y sync
- **Sin flicker**: La hidratación ocurre antes del primer render
- **Manejo de errores**: Si el refresh falla, se maneja gracefully

---

## Actualización: Fix hasHydrated + Simplificación main.ts

### Fecha: 21/04/2026

### Problema
La app se quedaba en "Verificando sesión..." porque:
- Se eliminó el middleware `persist` de Zustand
- `hasHydrated` nunca se establecía en `true`
- La lógica estaba invertida (esperaba hasHydrated=true para empezar)

### Solución

1. **`auth-store.ts`**:
   - `hydrateFromStorage()` ahora establece `hasHydrated: true` al final en TODAS las ramas
   - También establece `isVerifying: false`
   - Sin debug logs (código limpio)

2. **`useAuthInitializer.ts`**:
   - Lógica corregida: llama a `hydrateFromStorage()` cuando `hasHydrated = false`
   - Código simplificado
   - Remueve variables no usadas

3. **`main.tsx`**:
   - Removido `PersistQueryClientProvider` y `createSyncStoragePersister`
   - Ahora usa `QueryClientProvider` simple
   - El cache de queries NO se persiste entre sesiones
   - `query-cache.ts` queda reservado para futuro uso

### Flujo Corregido

```
App inicia
    │
    ▼
hasHydrated = false, isVerifying = true
    │
    ▼
useAuthInitializer detecta hasHydrated = false
    │
    ▼
Llama hydrateFromStorage()
    │
    ▼
Carga desde Dexie → actualiza estado
    │
    ▼
hasHydrated = true, isVerifying = false ✓
    │
    ▼
UI muestra contenido real
```

### Por qué NO persistir React Query Cache

1. **Límite de localStorage**: ~5MB vs 50MB+ de IndexedDB
2. **Datos stale**: Las queries de API cambian frecuentemente
3. **Complejidad**: PersistQueryClientProvider requiere sync storage
4. **Mejor UX**: Queries se revalidan automáticamente al abrir

### Archivos modificados
- `auth-store.ts`: Fix `hydrateFromStorage()`
- `useAuthInitializer.ts`: Lógica corregida
- `main.tsx`: Simplificado a `QueryClientProvider`

---

## Actualización: Fase 4 - Offline Mutations + Background Sync

### Fecha: 21/04/2026

### Cambio
Se implementó soporte offline para mutations (operaciones de escritura). Las mutations ahora se encolan cuando no hay conexión y se sincronizan automáticamente cuando la red vuelve.

### Decisiones Técnicas

| Decisión | Opción | Justificación |
|---------|-------|------------|
| Mutations offline | **Todas** | Simplicidad - no hay que discernir cuál necesita offline |
| Retry attempts | **3 max** | Suficiente para recover de errores transitorios sin saturar |
| Estrategia de conflicto | **Last-write-wins** | Simple, suficiente para datos de un dispositivo |
| Prioridad | **Sí** | Mejor UX cuando hay muchas operaciones |

### Por qué estas decisiones:

- **Todas las mutations**: Cualquier mutation puede ser importante. Evita complejidad de configurar cada endpoint.
- **3 retry**: 1er retry = error transitorio, 2do = ocupado, 3ero = error real. Más de 3 satura.
- **Last-write-wins**: En Amauta, datos (progreso, ejercicios) se modifican desde un dispositivo a la vez. No hay multi-device sync.
- **Con prioridad**: Auth crítico primero (alta), datos importantes (media), preferencias (baja).

### Priority de Mutations

| Prioridad | Tipo | Mutaciones |
|----------|------|-----------|
| **Alta (1)** | Auth crítico | login, logout, register |
| **Media (2)** | Datos importantes | addChild, updateProgress |
| **Baja (3)** | Preferencias | updateProfile, updatePreferences |

### Exponential Backoff

```typescript
// Delay entre retries
attempt 0 → 1s
attempt 1 → 2s
attempt 2 → 4s
// Máximo: 30s
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
Retry con exponential backoff
    │
    ▼ (después de 3 fallos)
Marcar como failed → notificar usuario
```

### Archivos nuevos

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

### Uso del Hook

```typescript
import { useOfflineMutation } from "@/lib/sync/useOfflineMutation";

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

### Hooks Disponibles

- **useOfflineMutation**: Para mutations que necesitan soporte offline
- **usePendingMutations**: Para mostrar estado de cola en UI

### Funciones Exportadas

```typescript
// queue-manager.ts
isOnline() → boolean
getQueueState() → { isOnline, isSyncing, pendingCount }
getPendingMutationsCount() → number
processQueue() → { processed, successful, failed, conflicts }
queueMutation(type, payload, endpoint, method) → { online, queued, mutationId }
triggerSync() → Promise<void>
clearQueue() → Promise<void>

// background-sync.ts
initBackgroundSync({ intervalMs?, autoSync? }) → Promise<void>
startBackgroundSync({ intervalMs?, autoSync? }) → {...}
stopBackgroundSync() → void
onSyncEvent((event) => void) → () => void
```

### Documentación adicional
- `docs/PHASE4_PLAN.md` - Documentación completa de Fase 4