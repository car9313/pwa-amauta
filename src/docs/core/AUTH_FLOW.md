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
| Login | ✅ | Banner claro, no se traba | Mensaje offline, espera reconexión |
| Inicio app | ✅ | ✅ Con sesión recordada | Si token válido, entra directo |
| Request normal | ✅ | Falls, usa cache | Si no cache, error |
| Token exp | ✅ refresh | Usa cache | Si no cache, error |
| Logout | ✅ | ✅ encolar | Background sync |

---

## Flujo 5: Login con problemas de red (post-fix)

Este flujo cubre los casos donde el usuario intenta hacer login pero la red falla, está lenta, o no existe. Antes del fix, el botón "Validando..." quedaba girando infinitamente.

### 5.1 Detección offline

```
┌────────────────────────────────────────────────────────────────────┐
│  Usuario hace clic en "Entrar" mientras está sin internet     │
├────────────────────────────────────────────────────────────────────┤
│                                                                  │
│  LoginPage        useLogin         mockAdapter      HttpError     │
│  │                    │                │               │         │
│  │─ onSubmit() ────▶│               │               │         │
│  │                    │─ mutate() ──▶│               │         │
│  │                    │  + withTimeout(8s)         │         │
│  │                    │               │               │         │
│  │                    │               │─ assertOnline│         │
│  │                    │               │  OrThrow()  │         │
│  │                    │               │               │         │
│  │                    │               │   if !navigator.onLine  │
│  │                    │               │     throw HttpError(   │
│  │                    │               │       "Sin internet", │
│  │                    │               │       NETWORK_ERROR)  │
│  │                    │               │               │         │
│  │                    │◀─ throws ──│               │         │
│  │                    │               │               │         │
│  │                    │─ toAuthError()              │         │
│  │                    │  + mapHttpErrorToAuthError  │         │
│  │                    │  → AuthError                │         │
│  │                    │               │               │         │
│  │  FormErrorBanner ◀│               │               │         │
│  │  "Sin internet..."  │               │               │         │
│  │                    │               │               │         │
│  │  isLoading=false  │               │               │         │
│  │  (spinner se detiene)              │               │         │
│                                                                  │
└────────────────────────────────────────────────────────────────────┘
```

### 5.2 Timeout de red (8 segundos)

Si la red existe pero es muy lenta, `withTimeout` rechaza con `TimeoutError` después de 8 segundos:

```
useLogin.mutationFn
  └─ withTimeout(login(credentials), 8_000, "La conexión está muy lenta...")
       └─ Promise.race
            ├─ login() real (puede tardar 30+ segundos)
            └─ setTimeout 8s → reject(new TimeoutError(msg))
                  ↓
            mapHttpErrorToAuthError(TimeoutError, navigator.onLine)
                  ↓
            AuthError { code: "TIMEOUT", message: "...", isOffline: true }
```

### 5.3 UX resultante

| Estado | Banner | Botón submit | Campo password |
|---|---|---|---|
| Online + idle | (ninguno) | "Entrar" habilitado | (ninguno) |
| Online + loading | (ninguno) | "Conectando..." spinner | (ninguno) |
| Online + credenciales inválidas | (ninguno) | "Entrar" habilitado | "No encontramos tu cuenta. ¿Está bien escrito tu correo?" |
| Online + timeout 8s | Banner con icono + "Reintentar" | "Entrar" habilitado | (ninguno) |
| Offline | Banner top + banner global en `PublicLayout` | "Sin internet" deshabilitado | (ninguno) |
| Offline + sesión recordada | "¡Hola de nuevo, [nombre]! Vuelve a tener internet para jugar." | "Sin internet" deshabilitado | (ninguno) |

### 5.4 Componentes

| Componente | Responsabilidad |
|---|---|
| `useOnlineStatus()` | Hook que escucha eventos `online`/`offline` del browser |
| `PublicConnectionBanner` | Banner amber en `PublicLayout` (visible en `/login` y `/register`) |
| `FormErrorBanner` | Banner específico arriba del form con icono según código de error + botón "Reintentar" |
| `useLogin` / `useRegister` | Aplican `withTimeout(8_000)`, mapean errores a `AuthError`, exponen `error: AuthError` |
| `withTimeout` / `TimeoutError` | Utility en `lib/async/withTimeout.ts` |

### 5.5 Códigos de error relevantes

| Código | Cuándo se produce | Mensaje | Banner | Campo |
|---|---|---|---|---|
| `NETWORK_ERROR` | `!navigator.onLine` o `fetch` falla | "Sin conexión a internet..." | Sí (con retry) | — |
| `TIMEOUT` | `withTimeout` rechaza a los 8s | "La conexión está muy lenta. Inténtalo de nuevo." | Sí (con retry) | — |
| `REFRESH_FAILED` | Error genérico post-auth | "No pudimos renovar tu sesión..." | Sí (con retry) | — |
| `TOKEN_INVALID` / `TOKEN_REVOKED` | 401/403 con credenciales inválidas | "No encontramos tu cuenta. ¿Está bien escrito tu correo?" | No | password |
| `SESSION_NOT_FOUND` | Sin token en storage | "Tu sesión fue cerrada. Inicia sesión de nuevo." | No | password |

---

## Decisión: ¿Por qué Amauta NO permite login offline con credenciales nuevas?

**Decisión actual:** El login offline real (verificar credenciales contra un cache local sin contactar al servidor) **NO está implementado** ni soportado.

### Estado actual (lo que SÍ funciona)

- ✅ **Sesión activa + offline** = funciona (token en Dexie, `useAuthInitializer` lo levanta)
- ✅ **Sin sesión + offline** = banner claro, botón deshabilitado, mensaje cálido. Espera reconexión.
- ✅ **"Hola de nuevo, [nombre]"** si hay sesión cacheada (solo informativo, no re-loguea)
- ❌ **NO se cachean credenciales** (ni email ni password)
- ❌ **NO se permite verificar password offline**

### Razones de la decisión

1. **El bug original NO era sobre login offline real** — era sobre el spinner infinito del login online. El fix actual resuelve eso sin agregar complejidad.

2. **El 95% del valor offline ya está cubierto** en Amauta:
   - Sesión activa persiste 15 min + refresh automático
   - Lecciones descargadas (DownloadLesson + Service Worker)
   - Outbox de mutaciones (useSafeMutation → queue-manager → background-sync)
   - El caso de re-login sin internet es raro para la audiencia objetivo (educación infantil, mismo dispositivo, sesiones largas).

3. **Riesgo de seguridad vs. beneficio marginal: desfavorable.**
   - Hash de password en IndexedDB es accesible vía XSS o DevTools.
   - Lógica divergente servidor↔cliente es fuente de bugs sutiles.
   - No se invalida si backend cambia el password o el padre desactiva al niño desde otro dispositivo.

4. **Alineado con práctica de la industria** — Notion, Google Docs, Trello, X (Twitter): ninguno permite login offline con credenciales nuevas.

### Las 3 opciones evaluadas

#### Opción A: Mantener el plan actual (Recomendado, IMPLEMENTADO)

- **Lo que hay**: Banner offline claro, NO se traba el spinner, "Hola de nuevo" informativo, botón deshabilitado si offline.
- **Lo que NO hay**: Login real offline con credenciales cacheadas.
- **Pros**: Simple, seguro, alineado con industria, audiencia no lo necesita.
- **Contras**: Usuario sin internet y sin sesión válida no puede entrar (puede esperar o pedir WiFi).

#### Opción B: Agregar "Remember device" con verificación local (DESCARTADO)

- **Qué cambiaría**:
  - Guardar `email + passwordHash` en Dexie la primera vez que el usuario hace login exitosamente.
  - En login form, si email matchea uno cacheado Y `!navigator.onLine`, permitir submit y verificar hash localmente.
  - Si verifica, generar un "offline session" (token Dexie-only, sin tocar backend).
  - Cache expira en 30-90 días o al hacer logout manual.
- **Pros**: Cubre el caso de borde de re-login en zona sin internet.
- **Contras**:
  - ~1-2 días más de desarrollo + tests de seguridad
  - Hash de password en IndexedDB (XSS risk)
  - Lógica divergente servidor↔cliente
  - No se invalida si backend cambia el password
  - Para la audiencia Amauta, el caso es raro

#### Opción C: Híbrido — Pre-fill email + verificación solo online (FUTURO)

- **Qué cambiaría**: Cachear solo el email (NO el password) del último usuario. Pre-rellenar el campo email, pero requerir internet para verificar password.
- **Pros**: Reduce fricción sin comprometer seguridad. UX más cálida para niños que olvidan su email.
- **Contras**: Si el padre quiere "empezar de cero", debe borrar email del navegador.
- **Implementación**: ~2 horas adicionales al plan actual.

### Por qué A fue elegida (resumen)

1. El bug original NO es sobre login offline — es sobre el spinner infinito. El plan actual resuelve eso sin agregar complejidad.
2. El 95% del valor offline ya está en Amauta. Login offline real es el 5% restante para un caso raro.
3. Riesgo de seguridad vs. beneficio marginal: desfavorable.
4. Si en el futuro se necesita, se puede agregar como feature independiente con análisis de seguridad dedicado (Argon2 en vez de SHA, expiration policy, etc.).

Pero si en el futuro se quiere ir un paso más allá sin comprometer seguridad, **Opción C (pre-fill email)** es un buen middle ground: niños que olvidan su email lo ven pre-rellenado, pero el password siempre se verifica online.

---

## Siguiente

Para Fase 3:
- Migrar queries de ejercicios a useQuery
- Agregar offline queue para mutations (guardar progreso)
- Migrar query cache a IndexedDB

---

## Siguiente

Para Fase 3:
- Migrar queries de ejercicios a useQuery
- Agregar offline queue para mutations (guardar progreso)
- Migrar query cache a IndexedDB