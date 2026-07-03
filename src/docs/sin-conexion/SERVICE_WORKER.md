# Service Worker - Amauta PWA

## Resumen Ejecutivo

El Service Worker (SW) es el núcleo de las capacidades offline de Amauta. Permite que la aplicación funcione sin conexión a internet, mejorando significativamente la experiencia en dispositivos móviles para niños.

## Arquitectura General

```
┌─────────────────────────────────────────────────────────────────┐
│                        NAVEGADOR                                │
│  ┌─────────────┐    ┌─────────────┐    ┌──────────────────┐   │
│  │  Página     │    │ Service     │    │ Cache Storage    │   │
│  │  Web        │───▶│ Worker      │───▶│                  │   │
│  │  (React)    │◀───│             │◀───│ - precache-v2    │   │
│  └─────────────┘    └─────────────┘    │ - navigation    │   │
│        ▲                 ▲              │ - images-cache  │   │
│        │                 │              │ - api-get-cache │   │
│        │                 │              │ - static-res    │   │
│        │          ┌──────┴──────┐       └──────────────────┘   │
│        │          │             │                              │
│        └──────────┘             └──────────────────────────────┘
│                      Network                                          │
└─────────────────────────────────────────────────────────────────┘
```

## Componentes del Service Worker

### 1. Precaching (App Shell)

El App Shell es la estructura mínima de la aplicación que se cachea durante la instalación.

```typescript
precacheAndRoute(self.__WB_MANIFEST || [])
cleanupOutdatedCaches()
```

**Archivos precacheados en build:**
- `index.html` - Punto de entrada SPA
- `assets/index-*.js` - Bundle principal de React
- `assets/index-*.css` - Estilos
- `workbox-window.prod.es5.js` - Utilidad de registro
- Iconos del manifest
- `manifest.webmanifest`

**Total: 37+ entries (~740 KB)** — incrementó por code-splitting de Vite (chunks por ruta: dashboard, lessons, games, practice, etc.)

### 2. Runtime Caching

| Tipo | Estrategia | Cache Name | Comportamiento |
|------|------------|------------|----------------|
| **Images** | CacheFirst | `images-cache-v1` | Rápido, 300 entries máx, 30 días expiry |
| **API GET** | NetworkFirst | `api-get-cache-v1` | 5s timeout, fallback a cache |
| **Scripts/CSS/Fonts** | StaleWhileRevalidate | `static-resources-v1` | Rápido + background refresh |
| **API POST** | NetworkOnly | (BackgroundSync) | Cola offline con retry automático |
| **Navegación SPA** | StaleWhileRevalidate + PrecacheFallback | `navigation-cache-v1` | Offline-first routing |

### 3. Matching de Rutas API

El route de API GET usa NetworkFirst y debe coincidir con las URLs reales del backend.

**Backend real** (cuando esté configurado):
```
VITE_API_BASE_URL=https://api-dev.amauta.axentra.io
VITE_API_VERSION=v1
URL final: https://api-dev.amauta.axentra.io/v1/auth/login
```

**Patrones soportados en `sw.ts:69-76`:**
```typescript
({ url, request }) => request.method === 'GET' && (
  url.pathname.startsWith('/api/')       // futuro proxy Vite
  url.pathname.startsWith('/v1/')        // URLs absolutas al backend
  url.hostname.endsWith('.amauta.axentra.io') // cualquier entorno
)
```

Esto cubre:
- `dev`: `api-dev.amauta.axentra.io`
- `staging`: `api-staging.amauta.axentra.io`
- `prod`: `api.amauta.axentra.io`
- Proxy local: `/api/...`

### 4. Caches que no aparecen en desarrollo (con mocks)

Actualmente la app usa **mock data** (no hay `.env` con `VITE_API_BASE_URL`). Esto afecta qué caches se crean:

| Cache | ¿Aparece? | Motivo |
|-------|-----------|--------|
| `workbox-precache-v2` | ✅ Sí | Se crea al instalar el SW (37+ entries precacheadas) |
| `navigation-cache-v1` | ✅ Sí | Se crea al navegar a cualquier ruta SPA |
| `images-cache-v1` | ✅ Sí | Se crea al cargar la primera imagen |
| `api-get-cache-v1` | ❌ No | No hay requests reales a API (todo es mock). Se poblará cuando exista backend real |
| `static-resources-v1` | ❌ No | Todos los JS/CSS ya están en `workbox-precache-v2`. Workbox resuelve del precache antes de evaluar runtime routes. Este cache solo se usaría para assets externos no precacheados (CDN) |

> Ver [`CACHES_EXPLAINED.md`](./CACHES_EXPLAINED.md) para más detalle.

### 5. Background Sync (App-Level Outbox)

> ⚠️ **El Service Worker NO maneja la cola offline.**
> Ver [`OFFLINE_QUEUE_SYSTEM.md`](./OFFLINE_QUEUE_SYSTEM.md) para el sistema actual.

Las mutaciones POST se manejan mediante **app-level outbox** (Dexie + queue-manager + background-sync).
El SW solo usa `NetworkOnly` para POSTs — no hay `BackgroundSyncPlugin` ni doble encolado.

### 6. Catch Handler Global (safety net)

> Añadido en 2026-06-30 para evitar errores `no-response` de Workbox.

Cuando una estrategia runtime (ej: `NetworkFirst` para API GET) no puede resolver una request porque **la red falló y no hay respuesta en cache**, Workbox lanza un error `no-response` que resulta en `net::ERR_FAILED` y unhandled promise rejection en el SW.

`setCatchHandler` captura todos los casos no resueltos por las rutas runtime y devuelve una respuesta HTTP controlada:

```typescript
setCatchHandler(async ({ request }) => {
  const isApiRequest =
    request.url.includes('.amauta.axentra.io') ||
    request.url.includes('/api/') ||
    request.url.includes('/v1/')

  if (isApiRequest) {
    return new Response(JSON.stringify({
      error: 'service_unavailable',
      message: 'No se pudo conectar con el servidor'
    }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  return Response.error()
})
```

**Comportamiento:**

| Escenario | Antes | Después |
|-----------|-------|---------|
| API no disponible + sin cache | `no-response` → `net::ERR_FAILED` | Response 502 JSON |
| App-level fetch catch | Promesa rechazada (catch needed) | HTTP error manejable por `HttpClient` |

---

## Estrategia de Caching para Navegación SPA

### Problema Original

En una SPA, las rutas como `/dashboard/student` no son archivos físicos en el servidor. Cuando el usuario hace F5:

1. El navegador pide `GET /dashboard/student`
2. Sin Service Worker → el servidor retorna 404
3. Offline → ERR_INTERNET_DISCONNECTED

### Solución Implementada

```typescript
registerRoute(
  new NavigationRoute(
    new StaleWhileRevalidate({
      cacheName: 'navigation-cache-v1',
      plugins: [
        new PrecacheFallbackPlugin({
          fallbackURL: '/index.html'
        }),
        new CacheableResponsePlugin({ statuses: [0, 200] })
      ]
    })
  )
)
```

### Por Qué Esta Estrategia

| Criterio | StaleWhileRevalidate + PrecacheFallback | Otras opciones |
|----------|----------------------------------------|----------------|
| **Offline-first** | Sí - sirve cache instantáneo | CacheFirst no actualiza |
| **Frescura online** | Actualiza en background mientras sirve cache | NetworkFirst bloquea |
| **Experiencia infantil** | Sin "loading spinners" | StaleWhileRevalidate es óptimo |
| **Resiliencia offline** | Fallback automático a precache | Sin fallback = error |

**Decisión**: Para educación infantil, "rápido y siempre disponible" > "datos siempre frescos". Los niños no tolerate pantallas de carga ni errores.

---

## Diagrama de Flujo - Request de Navegación

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SERVICE WORKER FLOW                                 │
└─────────────────────────────────────────────────────────────────────────────┘

    USUARIO PRESIONA F5 EN /dashboard/student
                    │
                    ▼
    ┌───────────────────────────────────┐
    │   SW INTERCEPTA REQUEST           │
    │   (mode: navigate)                │
    └──────────────┬────────────────────┘
                   │
                   ▼
    ┌───────────────────────────────────┐
    │   NavigationRoute MATCH?          │
    │   (Sí, siempre para navegación)   │
    └──────────────┬────────────────────┘
                   │
                   ▼
    ┌───────────────────────────────────┐
    │   StaleWhileRevalidate.handle()   │
    │                                    │
    │   ┌─────────────────────────────┐ │
    │   │ 1. Check cache "navigation" │ │
    │   └──────────────┬──────────────┘ │
    │                   │                │
    │                   ▼                │
    │   ┌─────────────────────────────┐ │
    │   │ Cache HIT?                  │ │
    │   └──────────────┬──────────────┘ │
    └───────────────────┼───────────────┘
                        │
          ┌─────────────┴─────────────┐
          │                           │
          ▼                           ▼
    ┌─────────────┐           ┌─────────────┐
    │    SÍ       │           │     NO      │
    │  (serve)    │           │  (fetch)    │
    └──────┬──────┘           └──────┬──────┘
           │                         │
           │                         ▼
           │                ┌─────────────────┐
           │                │ Network Request │
           │                └────────┬────────┘
           │                         │
           │            ┌─────────────┴─────────────┐
           │            │                           │
           │            ▼                           ▼
           │     ┌─────────────┐           ┌─────────────┐
           │     │  SUCCESS    │           │   FAILURE   │
           │     │ (serve +    │           │  (offline)  │
           │     │  cache)     │           └──────┬──────┘
           │     └─────────────┘                  │
           │                                       ▼
           │                            ┌─────────────────────┐
           │                            │ PrecacheFallbackPlugin│
           │                            │ serve /index.html    │
           │                            │ (from precache-v2)   │
           │                            └─────────────────────┘
           │                                       │
           ▼                                       ▼
    ┌─────────────────────────────────────────────────────┐
    │              RESPONSE AL NAVEGADOR                  │
    │   React Router recibe index.html y renderiza        │
    │   la ruta correcta (/dashboard/student) en cliente  │
    └─────────────────────────────────────────────────────┘
```

---

## Diagrama de Flujo — Mutaciones Offline (App-Level)

> El manejo de mutations offline se realiza completamente a nivel de aplicación.
> Ver [`OFFLINE_QUEUE_SYSTEM.md`](./OFFLINE_QUEUE_SYSTEM.md) para el diagrama actualizado.

---

## Registro del Service Worker

El SW se registra en `main.tsx`:

```typescript
if ('serviceWorker' in navigator) {
  registerServiceWorker()
}
```

El módulo `serviceWorkerRegistration.ts` usa `virtual:pwa-register` (inyectado por vite-plugin-pwa):

```typescript
export function registerServiceWorker() {
  updateFn = registerSW({
    onNeedRefresh() {
      window.dispatchEvent(new CustomEvent('sw:need-refresh'))
    },
    onOfflineReady() {
      window.dispatchEvent(new CustomEvent('sw:offline-ready'))
    }
  })
}
```

---

## Configuración en vite.config.ts

```typescript
VitePWA({
  registerType: 'prompt',     // Usuario decide cuándo actualizar
  strategies: 'injectManifest', // SW custom en src/sw.ts
  srcDir: 'src',
  filename: 'sw.ts',
  includeAssets: ['robots.txt', 'icons/*.png', 'icons/*.webp', 'icons/maskable-*.png'],

  manifest: {
    id: '/',                  // Identificador único de la PWA
    name: 'Amauta',
    short_name: 'Amauta',
    display: 'standalone',
    // ... iconos, shortcuts (ver MANIFEST.md)
  },

  devOptions: {
    enabled: false,   // SW solo en producción
    type: 'module'
  }
})
```

---

## Ciclo de Vida del Service Worker

```
    ┌─────────┐
    │ DOWNLOAD│──► Install
    └─────────┘        │
                       ▼
              ┌─────────────────┐
              │  1. precache()  │──► index.html, JS, CSS, iconos
              │  2. skipWaiting? │──► NO (controlamos desde UI)
              └────────┬────────┘
                       │ Activate
                       ▼
              ┌─────────────────┐
              │ 1. clients.claim()│──► Toma control inmediatamente
              │ 2. cleanup old   │──► Borra caches obsoletos
              │    caches       │
              └────────┬────────┘
                       │ Idle
                       ▼
              ┌─────────────────┐
              │  Fetch Events   │◄──── Intercepta requests
              │  Message Events │◄──── Comunic. con UI
               │  Message Events │◄──── Comunic. con UI
              └─────────────────┘
```

---

## Consideraciones para Educación Infantil

### Lo Que Priorizamos

| Factor | Decisión | Razón |
|--------|----------|-------|
| **Tiempo de carga offline** | Instantáneo (cache) | Niños pierden atención con delays |
| **Resiliencia** | Fallback a precache | La app nunca "rompe" |
| **Continuidad** | Sin loading spinners visibles | Flujo contínuo de aprendizaje |
| **Background sync** | Cola automática | No interrumpe gameplay |

### Lo Que NO Priorizamos

- Frescura inmediata de datos (menos crítico para contenido educativo estático)
- Optimización extrema de red (el precache mitiga esto)
- Precisión de caching de API (datos volátiles no son frecuentes)

---

## Troubleshooting

### Service Worker No Aparece en DevTools

1. Verificar que estás en `pnpm preview` (no `pnpm dev`)
2. Abrir DevTools → Application → Service Workers
3. Verificar que dice "Status: Activated and is running"

### Offline Refresh Falla

1. Verificar que el SW está activated
2. Ir a Application → Cache Storage → verificar que `precache-v2` tiene entries
3. En la consola del SW, verificar que no hay errores `no-response`

### Error `no-response` en API requests

Este error ocurre cuando el SW intercepta una request a la API con `NetworkFirst`, la red falla y no hay respuesta en cache.

**Causas posibles:**
- El backend no está disponible (en desarrollo, staging, o produccion caido)
- `VITE_USE_MOCK=false` pero la API no existe
- Primera request a un endpoint (cache vacio)

**Solución:** El `setCatchHandler` global (sección 6) captura estos casos y devuelve un 502 JSON en vez de lanzar `no-response`. Si el error persiste, verificar:
1. Que el SW compilado incluya el `setCatchHandler` (revisar `sw.ts`)
2. Que la estrategia `NetworkFirst` tenga `networkTimeoutSeconds` adecuado
3. En desarrollo con mocks: `VITE_USE_MOCK=true` en `.env.production`

### Mutaciones Offline No Sincronizan

1. Verificar que `initBackgroundSync()` se llama en `App.tsx`
2. Application → IndexedDB → `amauta-db` → `mutations` → verificar mutations pendientes
3. Ver [`OFFLINE_QUEUE_SYSTEM.md`](./OFFLINE_QUEUE_SYSTEM.md) para debugging del sistema de cola

---

## Referencias

- [Workbox Documentation](https://developer.chrome.com/docs/workbox/)
- [vite-plugin-pwa](https://vite-pwa.dev/)
- [MDN Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [`OFFLINE_QUEUE_SYSTEM.md`](./OFFLINE_QUEUE_SYSTEM.md) — Sistema de cola offline (app-level outbox)

---

## Historial de Cambios

| Fecha | Cambio | Razón |
|-------|--------|-------|
| 2026-04-24 | Agregado NavigationRoute con PrecacheFallbackPlugin | Fix offline refresh en rutas SPA |
| 2026-04-24 | Migrado a StaleWhileRevalidate para navegación | Balance entre speed y freshness |
| 2026-04-24 | Implementado BackgroundSync para POSTs offline | Cola de mutaciones confiable
| 2026-05-24 | Eliminado BackgroundSyncPlugin del SW | Evitar doble encolado con app-level outbox
| 2026-05-24 | Eliminado listener sync nativo del SW | No hay registration.sync.register() en la app
| 2026-05-24 | Agregado ConnectionStatus, UpdateToast, initBackgroundSync | Integración PWA completa |
| 2026-06-06 | Actualizado patrón API route: soporta `/api/`, `/v1/`, `*.amauta.axentra.io` | URLs reales del backend son absolutas a `axentra.io/v1/...`, no relativas a `/api/` |
| 2026-06-06 | Actualizado total precache: 12 → 37+ entries | Code-splitting de Vite incrementó los chunks |
| 2026-06-06 | Agregada sección "Caches que no aparecen en desarrollo" | Explica por qué `api-get-cache-v1` y `static-resources-v1` no se crean con mocks |
| 2026-06-06 | Agregado `id: '/'` al manifest | Elimina warning de Chrome "id is not specified" |
| 2026-06-06 | Actualizado `includeAssets` en snippet de ejemplo | Incluye `icons/*.webp` y `icons/maskable-*.png` |
| 2026-06-30 | Agregado `setCatchHandler` global | Evita error `no-response` cuando API no disponible + sin cache |
| 2026-06-30 | `VITE_USE_MOCK=true` en `.env.production` | Backend no implementado, usar mocks en preview |