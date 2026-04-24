# Autenticación Offline - Arquitectura y flujos

## Visión General

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        PWA Amauta - Flujo Offline                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐     ┌──────────────┐     ┌─────────────────────────────┐  │
│  │   Usuario  │────▶│  Login Page  │────▶│      authAdapter.login()     │  │
│  │  (niño)   │     │  (login)     │     │                             │  │
│  └─────────────┘     └──────────────┘     └─────────────────────────────┘  │
│                                                    │                      │
│                                                    ▼                      │
│                                          ┌──────────────────────┐        │
│                                          │   IndexedDB (Dexie)  │        │
│                                          │  ┌───────────────┐   │        │
│                                          │  │ accessToken  │──┼─┬───▶┐  │
│                                          │  │ refreshToken │  │ │    │  │
│                                          │  │ expiresAt   │  │ │    │  │
│                                          │  └───────────────┘  │ │    │  │
│                                          │  ┌───────────────┐   │ │    ▼  │
│                                          │  │ user         │───┘ │     │  │
│                                          │  │ tenantId     │     │     │  │
│                                          │  └───────────────┘     │     │  │
│                                          └──────────────────────┘      │  │
│                                                   │                    │  │
│                                                   ▼                    │  │
│                                          ┌──────────────────────┐      │  │
│                                          │   Zustand Store     │      │  │
│                                          │  - user             │◀─────┘  │
│                                          │  - tenantId         │         │
│                                          │  - isAuthenticated │         │
│                                          └──────────────────────┘      │
│                                                                             │
└─────────────��───────────────────────────────────────────────────────────────┘
```

---

## Flujo 1: Login (Online)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  LOGIN - Usuario abre app por primera vez (con internet)                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  User          LoginForm          authAdapter      IndexedDB    Zustand      │
│  │                   │                  │               │              │        │
│  │──────────▶        │                  │               │              │        │
│  │  Ingresa          │                  │               │              │        │
│  │  credenciales     │                  │               │              │        │
│  │◀──────────       │                  │               │              │        │
│  │                   │                  │               │              │        │
│  │                   │─── login() ────▶│               │              │        │
│  │                   │  {email, pass}  │               │              │        │
│  │                   │                 │               │              │        │
│  │                   │                 │── save ──────▶│              │        │
│  │                   │                 │ AuthResponse  │ tokens +      │        │
│  │                   │                 │               │ user         │        │
│  │                   │◀── result ─────│               │              │        │
│  │                   │                 │               │              │        │
│  │                   │                 │               │     setUser │        │
│  │                   │                 │               │◀──────────│        │
│  │                   │                 │               │              │        │
│  │◀───────────────────────────────────────────────────────────────│        │
│  │  Redirigir a Dashboard                                              │
│  │                                                                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Código

```typescript
// useAuth.ts - useLogin hook
const mutation = useMutation({
  mutationFn: (credentials) => login(credentials),
  onSuccess: (result) => {
    // authAdapter.login() → saveAuthResponse() → IndexedDB
    setAuthenticated(true);
    setUser(result.user, result.tenantId);
    redirectToDashboard(navigate, result.user.role);
  },
});
```

---

## Flujo 2: App Iniciada (Offline o Online)

```
┌─────────────────────────────────────────────────────────────────────���───────┐
│  INICIO - Usuario abre la app (tiene token guardado)            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                             │
│  App Init    useAuthInitializer   IndexedDB    Zustand      │
│  │                  │                │             │          │
│  │                  │                │    hasHydrated         │
│  │                  │                │    = false              │
│  │                  │                │             │          │
│  │                  │── checked ────▶│             │          │
│  │                  │ isAuthenticated?             │             │          │
│  │                  │                │             │          │
│  │                  │◀── false ─────│             │    setVerifying
│  │                  │ (token existe │             │◀──────────   (false)
│  │                  │  + válido)    │             │             │
│  │                  │                │             │             │
│  │                  │── hydrate ──▶│             │             │
│  │                  │ fromStorage  │ user +      │             │
│  │                  │             │ tenantId    │             │
│  │                  │             │        setUser +     │
│  │                  │             │        tenantId      │
│  │                  │             │◀─────────────────│
│  │                  │                │             │          │
│  │                  │◀─ done ─────│             │          │
│  │                  │                │             │          │
│  │                  │                            │  setVerifying
│  │                  │                            │◀──────── (false)
│  │                  │                │             │
│  │◀───────────────────────────────────│── isVerifying
│  │                  │                │     = false        │
│  │                  │                │             │          │
│  └──────────────────┴────────────────┴─────────────┘
│  
│  Resultado: Usuario logueado SIN hacer petición a servidor
```

### Código

```typescript
// useAuthInitializer.ts
useEffect(() => {
  if (!hasHydrated) return;
  
  const init = async () => {
    // Confiamos en datos locales si el token no ha expirado
    const isValid = await checkAuthValidity();
    
    if (isValid) {
      await hydrateFromStorage(); // Carga user + tenantId en Zustand
    } else {
      await clearSession();
      navigate('/login');
    }
  };
  
  init();
}, [hasHydrated, isAuthenticated]);
```

**Importante**: Este flujo permite que la app funcione completamente offline en el inicio.

---

## Flujo 3: Request con Token Expirado (Refresh)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  REQUEST - access token expired + online                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                             │
│  Component      HTTP Client      Server      IndexedDB        │
│  │                   │            │             │           │
│  │  useQuery         │            │             │           │
│  │  fetch           │            │             │           │
│  │◀──────────      │            │             │           │
│  │                 │            │             │           │
│  │                 │── request ──▶│             │           │
│  │                 │  /api/...   │             │           │
│  │                 │            │             │           │
│  │                 │◀── 401 ────│             │           │
│  │                 │ (unauthorized)             │           │
│  │                 │            │             │           │
│  │                 │── refresh ──▶│             │           │
│  │                 │ AccessToken │             │           │
│  │                 │            │             │           │
│  │                 │◀─ tokens ─│             │           │
│  │                 │            │             │           │
│  │                 │            │  updateAccess│        │
│  │                 │            │◀────────────│        │
│  │                 │            │             │           │
│  │                 │── retry ──▶│             │           │
│  │                 │ request   │             │           │
│  │                 │            │             │           │
│  │                 │◀── 200 ───│             │           │
│  │                 │            │             │           │
│  │◀──────────────────────────────────────────────│
│  │  Datos recibidos                              │
│  │                 │            │             │           │
└───────────────────────────────────────────────────────────┘
```

### Código

```typescript
// http/client.ts
async request<T>(endpoint, options) {
  const response = await fetch(...);
  
  if (response.status === 401) {
    // Intentar refresh
    const refreshed = await this.tryRefreshToken();
    if (refreshed) {
      // Reintentar request original
      return this.request<T>(endpoint, options);
    }
  }
  
  if (!response.ok) {
    throw new Error(...);
  }
  
  return response.json();
}
```

---

## Flujo 4: Logout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  LOGOUT - Usuario cierra sesión                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                             │
│  Component      authAdapter      clearAuth    Zustand      │
│  │                   │                │             │          │
│  │  Click logout     │                │             │          │
│  │                  ���                │             │          │
│  │                  │── logout() ──▶│             │          │
│  │                  │                │             │          │
│  │                  │                │── clear ──▶│          │
│  │                  │                │ IndexedDB   │          │
│  │                  │                │             │          │
│  │                  │                │        clearSession          │
│  │                  │                │◀────────────│          │
│  │                  │                │             │          │
│  │                  │◀── done ───│             │          │
│  │                  │                │             │          │
│  │────────────────────────────────────────────────────────│
│  │               navigate('/login')              │
│  │                                             │
└─────────────────────────────────────────────┘
```

---

## Persistencia de React Query (Cache)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  REACT QUERY CACHE - En memoria (NO persistido)                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────────────┐          │
│  │  QueryClient Cache (en memoria)                             │          │
│  │  - Se mantiene mientras la pestaña esté abierta            │          │
│  │  - Se limpia al hacer logout (queryClient.clear())          │          │
│  │  - Se revalida según staleTime configurado                 │          │
│  └─────────────────────────────────────────────────────────────┘          │
│                                                             │
│  Nota: Se simplificó main.ts - se usa QueryClientProvider         │
│  simple (sin persistencia). Las queries se revalidan al abrir.      │
└─────────────────────────────────────────────────────────────────────────┘
```

### Beneficios del Cache

- **Dashboard offline**: El padre puede ver progreso de hijos
- **Lecciones offline**: Si hay queries cached de ejercicios
- **Rápido al abrir**: Sin esperar respuesta API

---

## Diagrama de Estados

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    Estados de Auth                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                 │
│                     ┌──────────────────┐                        │
│                     │   NO AUTH        │                        │
│                     │ (no token en DB)  │                        │
│                     └────────┬─────────┘                        │
│                              │                                   │
│                              │ login()                           │
│                              ▼                                   │
│                     ┌──────────────────┐                        │
│            ┌───────▶│   AUTH OK        │                        │
│            │        │ (user en store)  │                        │
│            │        └────────┬─────────┘                        │
│            │                 │                                │
│  checkAuthValidity()        │ setUser() +                      │
│  + hydrateFromStorage()     │ clearSession                   │
│            │              │                 │    logout()                 │
│            │              │                 ▼                         │
│            │              │        ┌───────────────��─��┐          │
│            │              │        │   LOGOUT          │◀──────────┘
│            │              │        │ ( limpiar todo  )│          
│            │              │        └──────────────────┘          
│            │              │                                     
│            └──────┬───────┘                                  
│                 │                                          
│         Token expirado                                       
│         + 401 → refresh                                    
│                 │                                          
│                 ▼                                          
│        ┌──────────────────┐                              
│        │  REFRESHING     │                              
│        │ (renew token)  │                              
│        └──────┬─────────┘                              
│                 │                                    
│         refresh OK                                    
│                 │                                    
│                 ▼                                    
│        ┌──────────────────┐                              
│        │  AUTH OK        │────────────────────┘
│        │ (token nuevo) │                              
│        └──────────────────┘                              
└─────────────────────────────────────────────────────────────────┘
```

---

## Service Worker y Offline

```
┌─────────────────────────────────────────────────────────────────────────┐
│              Service Worker Background Sync               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                  │
│  POST /api/auth/logout (offline)                    │
│         │                                        │
│         ▼                                        │
│  ┌──────────────────────────────────┐          │
│  │  Background Sync Queue          │          │
│  │  (workbox-background-sync)       │          │
│  │  - maxRetentionTime: 24h        │          │
│  └──────────────┬───────────────────┘          │
│                 │                              │
│  navigator.onLine = true                  │
│                 │                              │
│                 ▼                              │
│  ┌──────────────────────────────────┐          │
│  │  Sync automático (browser)       │          │
│  │  POST /api/auth/logout            │          │
│  └──────────────────────────────────┘          │
│                                                  │
└──────────────────────────────────────────────────┘
```

**Nota**: El service worker ya tiene configurado Background Sync para POSTs offline. `/api/auth/*` usa NetworkFirst strategy.

---

## Resumen de Flujos

| Flujo | Online | Offline | Explicación |
|-------|-------|--------|-----------|
| Login | ✅ | N/A | Nuevo usuario |
| Inicio app | ✅ | ✅ | Trust token guardado |
| Request normal | ✅ | Falls, usa cache | Si no cache, error |
| Token exp | ✅ refresh | Usa cache | Si no cache, error |
| Logout | ✅ | ✅ encolar | Background sync |

---

## Siguiente

Para Fase 3:
- Migrar queries de ejercicios a useQuery
- Agregar offline queue para mutations (guardar progreso)
- Migrar query cache a IndexedDB