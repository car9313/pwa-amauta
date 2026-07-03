# Guía de Prueba - Persistencia Offline Amauta

## Visión General de Almacenamiento

| Storage | Contenido | Acceso |
|---------|-----------|--------|
| **IndexedDB (Dexie)** | Tokens, User, selectedStudentId, Preferences | Async, Fuente de verdad |
| **localStorage** | Ninguno para auth (simplificado) | - |
| **Zustand (memoria)** | user, isAuthenticated, hasHydrated, isVerifying | Runtime state |

---

## Estructura de Datos en el Navegador

### 1. IndexedDB (Dexie) - `amauta-auth` (v2)

Abre DevTools → Application → IndexedDB

```
IndexedDB
├── amauta-auth (v2)
│   ├── tokens (EntityTable)
│   │   ├── id: "amauta-tokens"
│   │   ├── accessToken: string
│   │   ├── refreshToken: string
│   │   ├── expiresAt: number (timestamp)
│   │   └── createdAt: number
│   │
│   ├── users (EntityTable)
│   │   ├── id: "amauta-user"
│   │   ├── user: AuthUser
│   │   │   ├── name: string
│   │   │   ├── email: string
│   │   │   ├── role: "student" | "parent" | "teacher"
│   │   │   ├── tenantId: string
│   │   │   └── ... (según rol)
│   │   └── storedAt: number
│   │
│   └── preferences (EntityTable)     ← NUEVO v2
│       ├── id: "user-preferences"
│       ├── selectedStudentId: string | ""
│       └── updatedAt: number
```

### 2. localStorage

```
localStorage
└── (vacío para auth - simplificado)
```
IndexedDB
└── amauta-auth
    ├── tokens (EntityTable)
    │   ├── id: "amauta-tokens"
    │   ├── accessToken: string
    │   ├── refreshToken: string
    │   ├── expiresAt: number (timestamp)
    │   └── createdAt: number
    │
    └── users (EntityTable)
        ├── id: "amauta-user"
        ├── user: AuthUser
        │   ├── name: string
        │   ├── email: string
        │   ├── role: "student" | "parent" | "teacher"
        │   ├── tenantId: string
        │   └── ... (según rol)
        └── storedAt: number
```

### 2. IndexedDB (Dexie) - `amauta-query-cache`

```
IndexedDB
└── amauta-query-cache
    └── cache (EntityTable)
        ├── id: "react-query-cache"
        └── data: string (JSON stringified PersistedClient)
```

### 3. localStorage

```
localStorage
├── amauta-auth-ui        # Zustand persist (solo selectedStudentId)
│   └── {"state":{"selectedStudentId":"..."}}
│
└── tanstack-query-cache # React Query persist
    └── {...}
```

---

## Cómo Probar la Aplicación

### Prerrequisitos

1. Abrir la aplicación en Chrome/Edge
2. Abrir DevTools (F12)
3. Ir a la pestaña **Application**

---

### Test 1: Login y Verificar IndexedDB

**Pasos:**
1. Ir a `/login`
2. Ingresar credenciales (mock):
   - `parent@amauta.com` / `123456`
   - `student@amauta.com` / `123456`
   - `teacher@amauta.com` / `123456`
3. Hacer login exitoso

**Verificar en DevTools:**
```
IndexedDB > amauta-auth > users
{
  "id": "amauta-user",
  "user": {
    "name": "Ana María",
    "email": "parent@amauta.com",
    "role": "parent",
    "tenantId": "tenant_001",
    "children": [...]
  }
}

IndexedDB > amauta-auth > tokens
{
  "id": "amauta-tokens",
  "accessToken": "mock_access_...",
  "refreshToken": "mock_refresh_...",
  "expiresAt": 1742812345678,
  "createdAt": 1742811445678
}
```

---

### Test 2: Verificar localStorage (Zustand)

**Pasos:**
1. Después del login
2. Seleccionar un hijo (si es parent)
3. Verificar localStorage

**Verificar en DevTools:**
```
localStorage > amauta-auth-ui
{
  "state": {
    "selectedStudentId": "stu_001"  // ← Esto es lo único que persiste Zustand
  }
}
```

**Nota:** El estado de `user` y `isAuthenticated` NO se guarda en localStorage. Solo existe en memoria (Zustand).

---

### Test 3: Verificar offline (Cerrar y Abrir)

**Pasos:**
1. Hacer login exitoso
2. **Cerrar la pestaña del navegador**
3. **Abrir nueva pestaña** (o refrescar)
4. Ir a la app

**Verificar:**
- La app debería cargar mostrando el usuario logueado **SIN** pedir login de nuevo
- Esto es porque `useAuthInitializer` lee de IndexedDB

```
Si todo funciona bien:
✓ App carga rápido (sin llamada API)
✓ Usuario visible en la UI
✓ Navegación funciona
```

**Si no funciona:**
- Verificar en IndexedDB que existe el usuario
- Verificar que `expiresAt` no ha pasado

---

### Test 4: Verificar TanStack Query Cache (localStorage)

**Pasos:**
1. Hacer login
2. Navegar a una página que haga queries (dashboard, ejercicios)
3. Verificar que las queries se guardan

**Verificar en DevTools:**
```
localStorage > tanstack-query-cache
{
  "clientState": {
    "queries": [
      {
        "queryKey": ["auth", "session"],
        "data": {...}
      },
      {
        "queryKey": ["auth", "parent", "par_001", "tenant_001"],
        "data": {...}
      }
    ]
  }
}
```

---

### Test 5: Simular Offline

**Pasos:**
1. Hacer login exitoso
2. En DevTools → Network → Throttling → **Offline**
3. **Refrescar la página**

**Verificar:**
- La app debería cargar con los datos de IndexedDB
- Si hay datos cacheados de queries anteriores, deberían verse
- Si no hay datos, debería mostrar mensaje de "offline" o similar

---

### Test 6: Logout y Verificar Limpieza

**Pasos:**
1. Hacer login
2. Hacer logout

**Verificar en DevTools después del logout:**
```
IndexedDB > amauta-auth > tokens  →  No existe (borrado)
IndexedDB > amauta-auth > users  →  No existe (borrado)
localStorage > amauta-auth-ui  →  {"state":{"selectedStudentId":null}}
```

---

## Cómo Funciona el Logout

### Flujo de Ejecución

```
┌─────────────────────────────────────────────────────────────┐
│  LOGOUT - Flujo Completo                                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Usuario hace click en "Logout"                        │
│            │                                                 │
│            ▼                                                 │
│  2. useLogout().mutate() → authAdapter.logout()         │
│            │                                                 │
│            ▼                                                 │
│  3. authAdapter.logout() → Intenta POST /auth/logout     │
│     (si online) o simplemente continua                    │
│            │                                                 │
│            ▼                                                 │
│  4. clearAuth() → Borra tokens y user de Dexie         │
│     - authDb.tokens.delete("amauta-tokens")             │
│     - authDb.users.delete("amauta-user")                 │
│            │                                                 │
│            ▼                                                 │
│  5. Zustand.clearSession() → Limpia estado en memoria  │
│     - user: null                                          │
│     - isAuthenticated: false                              │
│     - selectedStudentId: null                             │
│            │                                                 │
│            ▼                                                 │
│  6. queryClient.clear() → Limpia cache de React Query │
│            │                                                 │
│            ▼                                                 │
│  7. navigate("/login") → Redirige a login              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Código del Logout

```typescript
// useLogout hook (useAuth.ts)
const logoutMutation = useMutation({
  mutationFn: () => logout(),
  onSuccess: async () => {
    // 1. Limpiar Dexie (dentro de authAdapter.logout)
    // 2. Limpiar estado Zustand
    setAuthenticated(false);
    setUser(null);

    // 3. Limpiar React Query cache
    await queryClient.clear();
    queryClient.setQueryData(authKeys.session(), null);

    // 4. Redirigir
    navigate("/login", { replace: true });
  },
  onError: async () => {
    // También limpiar aunque falle la llamada API
    setAuthenticated(false);
    setUser(null);
    await queryClient.clear();
    queryClient.setQueryData(authKeys.session(), null);
    navigate("/login", { replace: true });
  },
});
```

**Nota:** `clearAuth()` se llama dentro de `authAdapter.logout()` (línea 262 en adapter.ts), no en el hook. El hook solo limpia Zustand y React Query.

### Diferentes Escenarios de Logout

| Escenario | Comportamiento |
|----------|---------------|
| **Logout normal (online)** | Borra Dexie + API call + Redirect |
| **Logout offline** | Borra Dexie + Redirect (sin API) |
| **Logout con error API** | Igual que offline - Borra todo + Redirect |
| **Cerrar pestaña** | No hace logout - sesión sigue en Dexie |

### Escenario Offline - Detalle Completo

El logout funciona correctamente en offline porque:

```
┌─────────────────────────────────────────────────────────────┐
│  LOGOUT OFFLINE - Flujo Detallado                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Usuario hace click en "Logout"                        │
│            │                                                 │
│            ▼                                                 │
│  2. useLogout().mutate()                                   │
│            │                                                 │
│            ▼                                                 │
│  3. logout() → authAdapter.logout()                       │
│            │                                                 │
│            ▼                                                 │
│  4. Mock Adapter (USE_MOCKS = true):                      │
│     ┌─────────────────────────────────────────────────┐     │
│     │  async logout() {                             │     │
│     │    await delay(300);  // Simula llamada API   │     │
│     │    await clearAuth();  // ← Borra Dexie      │     │
│     │  }                                            │     │
│     └─────────────────────────────────────────────────┘     │
│            │                                                 │
│            ▼                                                 │
│  5. clearAuth() → clearAuthData() → authDb.transaction() │
│     ┌─────────────────────────────────────────────────┐     │
│     │  await authDb.tokens.delete("amauta-tokens")  │     │
│     │  await authDb.users.delete("amauta-user")     │     │
│     └─────────────────────────────────────────────────┘     │
│            │                                                 │
│            ▼                                                 │
│  6. useLogout onSuccess:                                  │
│     - clearSession() → (ya está limpio, no pasa nada)       │
│     - queryClient.clear() → Limpia cache queries          │
│     - navigate("/login") → Redirect                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Con API Real:**
```
┌─────────────────────────────────────────────────────────────┐
│  LOGOUT CON API REAL - Flujo Detallado                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. logout() → authAdapter.logout()                       │
│            │                                                 │
│            ▼                                                 │
│  2. Real Adapter:                                        │
│     ┌─────────────────────────────────────────────────┐     │
│     │  async logout() {                             │     │
│     │    try {                                      │     │
│     │      await httpClient.request("/auth/logout") │     │
│     │    } finally {                                │     │
│     │      await clearAuth();  // ← SIEMPRE corre   │     │
│     │    }                                        │     │
│     │  }                                            │     │
│     └─────────────────────────────────────────────────┘     │
│                                                             │
│  3. Si ONLINE → Intenta POST /auth/logout                 │
│     Si OFFLINE → El request falla (fetch error)         │
│            │                                                 │
│            ▼ (finally siempre se ejecuta)                 │
│  4. clearAuth() → Borra todo de Dexie                     │
│     ┌─────────────────────────────────────────────────┐     │
│     │  // No importa si la llamada API falló        │     │
│     │  // La sesión local se borra igual            │     │
│     └─────────────────────────────────────────────────┘     │
│            │                                                 │
│            ▼                                                 │
│  5. Redirect a /login                                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Por qué funciona offline:**
- El `try/finally` asegura que `clearAuth()` siempre se ejecuta
- Aunque `httpClient.request("/auth/logout")` falle por offline
- La limpieza de Dexie ocurre de todas formas

### Qué Sucede en Cada Paso (Código Optimizado)

| Paso | IndexedDB | localStorage | Memoria Zustand |
|------|-----------|-------------|------------------|
| 1. Click logout | ✅ tokens + user | ✅ | ✅ user |
| 2. mutationFn() → authAdapter.logout() | ✅ | ✅ | ✅ |
| 3. Mock: clearAuth() dentro de adapter | ❌ Borra tokens + user | ✅ | ✅ |
| 4. onSuccess: setAuthenticated(false) | ❌ (ya limpio) | ✅ | ❌ user → null |
| 5. onSuccess: setUser(null) | ❌ (ya limpio) | ✅ | ❌ user → null |
| 6. queryClient.clear() | ❌ | ❌ Limpia cache | ✅ |
| 7. navigate("/login") | ❌ | ✅ | ⚠️ Redirect |

**Importante:** `clearAuth()` se ejecuta DENTRO de `authAdapter.logout()`, NO en el hook. El hook solo limpia Zustand y React Query. Esto evita duplicación.

### Verificación en DevTools (Offline)

1. **Antes de poner offline:**
   - IndexedDB tiene tokens + user
   - localStorage tiene cache

2. **Poner offline (DevTools → Network → Offline)**

3. **Hacer logout**

4. **Verificar inmediatamente después:**
```
IndexedDB > amauta-auth:
├── tokens → {} (eliminado)
└── users → {} (eliminado)

localStorage:
├── amauta-auth-ui → {"state":{"selectedStudentId":null}}
└── tanstack-query-cache → {} (eliminado)
```

**Resultado esperado:**
- ✅ El logout funciona sin red
- ✅ Los datos se borran completamente
- ✅ La app redirige a /login

### Qué Se Limpia y Qué No

| Storage | Durante Logout | Después de Cerrar Pestaña |
|---------|---------------|--------------------------|
| **IndexedDB - tokens** | ❌ Eliminado | ✅ Persiste |
| **IndexedDB - users** | ❌ Eliminado | ✅ Persiste |
| **localStorage - Zustand** | ✅ selectedStudentId = null | ⚠️ Puede persistir |
| **localStorage - Query Cache** | ❌ Eliminado | ✅ Persiste |
| **Zustand (memoria)** | ❌ Todo null | ❌ Todo se pierde |

### Estado Después de Logout

```
IndexedDB (amauta-auth):
├── tokens: {}        ← Eliminado
└── users: {}        ← Eliminado

localStorage:
├── amauta-auth-ui: {"state":{"selectedStudentId":null}}  ← Limpiado
└── tanstack-query-cache: {}  ← Limpiado por queryClient.clear()

Zustand (memoria):
├── user: null
├── isAuthenticated: false
└── selectedStudentId: null
```

### Verificar Logout en DevTools

1. **Antes del logout:**
   - IndexedDB: `amauta-tokens` y `amauta-user` existen
   - localStorage: `amauta-auth-ui` tiene datos

2. **Después del logout:**
   - IndexedDB: Las tablas están vacías (o los registros eliminados)
   - localStorage: `amauta-auth-ui` = `{"state":{"selectedStudentId":null}}`
   - La app redirige a `/login`

### Simular Logout Offline

**Pasos:**
1. Login exitoso
2. DevTools → Network → **Offline**
3. Hacer logout
4. Verificar que se limpió todo en IndexedDB

**Esperado:**
- El logout funciona aunque no haya red
- Los datos de sesión se borran de todas formas
- La app redirige a login

---

## Errores Comunes y Cómo Diagnosticarlos

### Error: "No token stored" al hacer login

**Causa:** El mock no está guardando correctamente

**Diagnosticar:**
1. Verificar `authDb.tokens.get()` en consola:
```javascript
// En DevTools > Console
await window.indexedDB.databases()
// o
const db = await open("amauta-auth")
const tokens = await db.tokens.get("amauta-tokens")
console.log(tokens)
```

### Error: App pide login después de refrescar

**Causa:** La sesión expiró o no se guardó

**Diagnosticar:**
1. Verificar `expiresAt` en tokens:
```javascript
// Si expiresAt < Date.now(), el token expiró
console.log("Expires:", new Date(token.expiresAt))
console.log("Now:", Date.now())
```

### Error: Flicker al cargar

**Causa:** La hidratación ocurre después del render

**Diagnosticar:**
1. Abrir DevTools → Performance
2. Grabar carga de la página
3. Verificar que no hay doble render de AuthInitializer

---

## Consola - Comandos de Diagnóstico

### Verificar Dexie directamente

```javascript
// Abrir Dexie en consola
const db = await Dexie.wait("amauta-auth")
const tokens = await db.tokens.get("amauta-tokens")
const user = await db.users.get("amauta-user")
console.log("Tokens:", tokens)
console.log("User:", user)
```

### Verificar localStorage

```javascript
// Zustand
console.log(JSON.parse(localStorage.getItem("amauta-auth-ui") || "{}"))

// TanStack Query
console.log(JSON.parse(localStorage.getItem("tanstack-query-cache") || "{}"))
```

### Verificar Refresh Token

```javascript
// Si expiresAt está cerca de expirar
const token = await db.tokens.get("amauta-tokens")
const timeLeft = token.expiresAt - Date.now()
console.log("Minutos restantes:", Math.floor(timeLeft / 60000))
```

---

## Resumen de lo que Debería Pasar

| Acción | IndexedDB | localStorage | Zustand (memoria) |
|--------|----------|-------------|-------------------|
| Login exitoso | ✅ tokens + user | - | ✅ user |
| Refrescar (online) | ✅ | ✅ query cache | ✅ |
| Refrescar (offline) | ✅ tokens + user | ✅ query cache | ✅ user |
| Seleccionar hijo | - | ✅ selectedStudentId | ✅ |
| Logout | ❌ Borra todo | Limpia cache | ❌ Limpia |
| Cerrar pestaña | ✅ Persiste | ✅ Persiste | ❌ Se pierde |

---

## Notas Técnicas

### Por qué Dexie para Auth?

- **Capacidad**: ~50MB vs ~5MB de localStorage
- **Rendimiento**: Async no bloquea UI
- **Complejidad**: Soporta transacciones, índices

### Por qué localStorage para React Query?

- `PersistQueryClientProvider` requiere storage síncrono
- En el futuro se puede migrar a Dexie si el cache crece mucho

### Flujo de Hidratación

```
1. App.mount() → <AuthInitializer>
2. Zustand.hydrate() → partialize: selectedStudentId
3. onRehydrateStorage → setHydrated(true)
4. useAuthInitializer → detecta hasHydrated = true
5. checkAuthValidity() → lee de Dexie
6. Si válido → setUser() + queryClient.setQueryData()
7. UI renderiza con usuario
```

---

## Siguientes Pasos

Si necesitas depurar más:

1. **Limpiar todo**: En DevTools → Application → Clear storage
2. **Verificar Service Worker**: En DevTools → Application → Service Workers
3. **Verificar PWA**: En DevTools → Application → Manifest