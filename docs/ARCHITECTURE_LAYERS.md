# Arquitectura de Capas - PWA Amauta

## Visión General

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                      PRESENTATION LAYER (UI)                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │
│  │   Pages     │  │ Components  │  │   Hooks     │            │
│  │ - Login    │  │ - Button   │  │ - useAuth  │            │
│  │ - Dashboard│  │ - Form     │  │ - useLogout│            │
│  │ - Profile │  │ - Card    │  │ - useOffline│            │
│  └──────────────┘  └──────────────┘  └──────────────┘            │
│                                                                 │
└─────────────────────────────┬───────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    STATE MANAGEMENT LAYER                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌────────────────────────┐  ┌──────────────────────────────┐   │
│  │      Zustand           │  │     TanStack Query          │   │
│  │  (Runtime State)       │  │     (Server State)           │   │
│  │                       │  │                             │   │
│  │ - user                │  │ - queries: session         │   │
│  │ - isAuthenticated     │  │ - queries: dashboard      │   │
│  │ - hasHydrated        │  │ - queries: progress       │   │
│  │ - selectedStudentId   │  │ - mutations: addChild    │   │
│  │                       │  │ - mutations: update      │   │
│  │ ⚡ Memoria (no       │  │ ⚡ Cache + background     │   │
│  │    persiste)         │  │    fetch               │   │
│  └────────────────────────┘  └──────────────────────────────┘   │
│                                                                 │
└─────────────────────────────┬───────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    PERSISTENCE LAYER                             │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    Dexie (IndexedDB)                        │  │
│  │                    =============================               │  │
│  │                                                         │  │
│  │  amauta-auth (v2)         amauta-offline-queue (v1)          │  │
│  │  ├─ tokens              │  ├─ mutations                   │  │
│  │  │  - accessToken       │  │   - type: addChild             │  │
│  │  │  - refreshToken     │  │   - payload: {...}            │  │
│  │  │  - expiresAt       │  │   - priority: 1|2|3           │  │
│  │  │                    │  │   - status: pending          │  │
│  │  ├─ users              │  ├─ retryCount: 0-3            │  │
│  │  │  - AuthUser          │  │   - endpoint: /api/...        │  │
│  │  │  - name             │  └──────────────────────────────┘  │
│  │  │  - email            │                                    │
│  │  │  - role             │                                   │
│  │  └─ preferences       │                                   │
│  │     - selectedStudent │                                   │
│  │                     │                                   │
│  │                     │  📦 Cola de mutations offline    │
│  └────────────────────────┘                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Flujo de Capas: Login

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  LOGIN - Flujo Completo de Capas                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────┐                                                  │
│  │  UI Layer   │                                                  │
│  │ LoginPage   │                                                  │
│  └─────┬──────┘                                                  │
│        │ usuarioingresa credenciales                                  │
│        ▼                                                          │
│  ┌──────��───────────────────────────────────────────────────────┐  │
│  │  State: TanStack Query - useMutation                         │  │
│  │  mutationFn: login(credentials)                            │  │
│  └─────┬──────────────────────────────────────────────────────┘  │
│        │                                                            │
│        │ POST /api/auth/login                                   │
│        ▼                                                            │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Adapter Layer (Adapter Pattern)                          │  │
│  │  authAdapter.login() → /api/auth/login                   │  │
│  └─────┬──────────────────────────────────────────────────────┘  │
│        │                                                            │
│        │ HTTP POST                                                │
│        ▼                                                            │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  HTTP Client                                           │  │
│  │  fetch('/api/auth/login', {...})                       │  │
│  └─────┬──────────────────────────────────────────────────────┘  │
│        │                                                            │
│        │ Si API Online: respuesta                               │
│        │ Si API Offline: error                                  │
│        ▼                                                            │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Persistence: Dexie - auth-db.ts                         │  │
│  │                                                          │  │
│  │  saveAuthData()                                          │  │
│  │  ├── tokens.put({ accessToken, refreshToken, ... })   │  │
│  │  └── users.put({ user })                                │  │
│  │                                                          │  │
│  │  IndexedDB: amauta-auth                                 │  │
│  │  ├─ tokens: { accessToken, expiresAt }                  │  │
│  │  └─ users:  { name, email, role }                     │  │
│  └─────┬──────────────────────────────────────────────────────┘  │
│        │                                                            │
│        ▼                                                            │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  State: Zustand - auth-store.ts                        │  │
│  │                                                          │  │
│  │  setUser(user)           ��� user: AuthUser           │  │
│  │  setAuthenticated(true) → isAuthenticated: true    │  │
│  │                                                          │  │
│  │  ⚡ MEMORIA: se pierde al cerrar pestaña              │  │
│  └─────┬──────────────────────────────────────────────────────┘  │
│        │                                                            │
│        ▼                                                            │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  TanStack Query - cache                                  │  │
│  │                                                          │  │
│  │  queryClient.setQueryData(authKeys.session, user)       │  │
│  │                                                          │  │
│  │  ⚡ MEMORIA: se regenera al abrir app                  │  │
│  └──────────────────────────────────────────────────────┘  │
│        │                                                            │
│        ▼                                                            │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  UI Layer: Redirect                                       │  │
│  │  navigate('/parent/dashboard')                         │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
└���────────────────────────────────────────────────────────────────────────────┘
```

---

## Flujo de Capas: App Iniciando (Hydratación)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  APP INICIA - Flujo de Hidratación                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. MOUNT - Zustand inicia                                      │
│  ┌─────────────────────────────────────────────────────────┐        │
│  │ useAuthStore = create()                               │        │
│  │ ├── hasHydrated: false                               │        │
│  │ ├── isVerifying: true                              │        │
│  │ ├── user: null                                     │        │
│  │ └── isAuthenticated: false                          │        │
│  └─────────────────────────────────────────────────────────┘        │
│                        │                                          │
│  2. EFFECT - useAuthInitializer                              │
│  ┌─────────────────────────────────────────────────────────┐        │
│  │ useEffect(() => { hydrateFromStorage() }, [])           │        │
│  └─────────────────────────────────────────────────────────┘        │
│                        │                                          │
│  3. PERSISTENCE - Leer Dexie                                  │
│  ┌─────────────────────────────────────────────────────────┐        │
│  │ checkAuthValidity()                                 │        │
│  │ └── IndexedDB: tokens.get("amauta-tokens")          │        │
│  │     └── verifica expiresAt > now                     │        │
│  └─────────────────────────────────────────────────────────┘        │
│                        │                                          │
│  4. LOAD - Cargar desde Dexie                                │
│  ┌─────────────────────────────────────────────────────────┐        │
│  │ loadAuthFromStorage()                              │        │
│  │ └── IndexedDB: users.get("amauta-user")          │        │
│  └─────────────────────────────────────────────────────────┘        │
│                        │                                          │
│  5. STATE - Actualizar Zustand                               │
│  ┌─────────────────────────────────────────────────────────┐        │
│  │ set({ hasHydrated: true, isVerifying: false, ... })    │        │
│  └─────────────────────────────────────────────────────────┘        │
│                        │                                          │
│  6. UI - Render final                                       │
│  ┌─────────────────────────────────────────────────────────┐        │
│  │ AuthInitializer detecta hasHydrated = true           │        │
│  │ └── renderiza App con datos                         │        │
│  └─────────────────────────────────────────────────────────┘        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Flujo de Capas: Mutation Offline

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  MUTATION OFFLINE - Flujo Completo                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. EFECTO - Usuario hace acción                                │
│  ┌─────────────────────────────────────────────────────────┐        │
│  │ useOfflineMutation({ type: "addChild" })               │        │
│  │ mutate({ name: "Juan", email: "juan@email.com" })     │        │
│  └─────────────────────────────────────────────────────────┘        │
│                        │                                          │
│  2. DETECT - ¿Online?                                         │
│  ┌─────────────────────────────────────────────────────────┐        │
│  │ isOnline() → navigator.onLine                        │        │
│  │ Si true: → ejecutar directamente                    │        │
│  │ Si false: → encolar                       │        │
│  └─────────────────────────────────────────────────────────┘        │
│                        │                                          │
│  3. ENQUEUE - Guardar en Dexie                                 │
│  ┌─────────────────────────────────────────────────────────┐        │
│  │ enqueueMutation(type, payload, endpoint, priority)      │        │
│  │                                                         │        │
│  │ IndexedDB: amauta-offline-queue                      │        │
│  │ mutations.put({                                    │        │
│  │   id: "mut_1713792345678_abc",                    │        │
│  │   type: "addChild",                              │        │
│  │   payload: { name, email },                      │        │
│  │   endpoint: "/parents/par_001/children",       │        │
│  │   method: "POST",                              │        │
│  │   priority: 2,                                │        │
│  │   status: "pending"                            │        │
│  │   createdAt: 1713792345678                    │        │
│  │ })                                             │        │
│  └─────────────────────────────────────────────────────────┘        │
│                        │                                          │
│  4. UI - Feedback                                            │
│  ┌─────────────────────────────────────────────────────────┐        │
│  │ useOfflineMutation retorna isQueued: true              │        │
│  │ onQueued(mutationId) → toast "Guardado offline"     │        │
│  └─────────────────────────────────────────────────────────┘        │
│                        │                                          │
│  5. SYNC - Cuando vuelve online                                │
│  ┌─────────────────────────────────────────────────────────┐        │
│  │ window.addEventListener("online", handleOnline)    │        │
│  │                                                         │        │
│  │ Trigger: ConnectionStatus detecta online            │        │
│  │ → triggerSync() → processQueue()                  │        │
│  └─────────────────────────────────────────────────────────┘        │
│                        │                                          │
│  6. PROCESAR - Por prioridad                                  │
│  ┌─────────────────────────────────────────────────────────┐        │
│  │ getQueuedMutationsByPriority()                      │        │
│  │ .sortBy("priority")                               │        │
│  │                                                         │        │
│  │ FOR mutation:                                      │        │
│  │   1. executeMutation() → HTTP POST                │        │
│  │   2. Success → removeMutation()                 │        │
│  │   3. Fail → incrementRetryCount()              │        │
│  │   4. Exhausted → status: "failed"              │        │
│  └─────────────────────────────────────────────────────────┘        │
│                        │                                          │
│  7. CACHE - Invalidar queries                                 │
│  ┌─────────────────────────────────────���─���─────────────────┐        │
│  │ queryClient.invalidateQueries()                 │        │
│  │ → TanStack Query re-fetc data                   │        │
│  └─────────────────────────────────────────────────────────┘        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Resumen: Cuándo Usar Cada Capa

| Capa | Cuándo Usar | Persistencia | Ejemplo |
|------|-------------|--------------|---------|
| **Zustand** | Estado runtime de UI | ❌ Memoria | user, isAuthenticated, selectedStudentId |
| **TanStack Query** | Datos del servidor | ❌ Memoria (cache) | session, dashboard, progress |
| **Dexie - auth** | Tokens y usuario | ✅ IndexedDB | accessToken, AuthUser |
| **Dexie - queue** | Mutations offline | ✅ IndexedDB | addChild, updateProgress |
| **localStorage** | Preferencias pequeñas | ✅ localStorage | (no usado para auth) |

---

## Data Flow Resumen

```
USUARIO (UI)
    │
    ▼
COMPONENT (React)
    │
    ├──► useOfflineMutation() ──► TanStack Query useMutation()
    │                              │
    │                              ▼
    │                        OFFLINE?
    │                        │
    │             SÍ          NO
    │             │           │
    │             ▼           ▼
    │         ENCOLA      HTTP POST
    │             │           │
    │             ▼           ▼
    │         DEXIE       HTTP Client
    │    (offline-queue)     │
    │                         ▼
    │                    API Server
    │
    ├─ useAuth() ──────────► Zustand (store)
    │
    ├─ useQuery() ────────► TanStack Query (cache)
    │
    └─ useMutation() ────► TanStack Query (mutate)


INDEXEDDB (Dexie)
    │
    ├── amauta-auth (tokens + user + preferences)
    │
    └── amauta-offline-queue (mutations pendientes)
```