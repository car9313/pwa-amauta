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

**Total: 12 entries (~670 KB)**

### 2. Runtime Caching

| Tipo | Estrategia | Cache Name | Comportamiento |
|------|------------|------------|----------------|
| **Images** | CacheFirst | `images-cache-v1` | Rápido, 300 entries máx, 30 días expiry |
| **API GET** | NetworkFirst | `api-get-cache-v1` | 5s timeout, fallback a cache |
| **Scripts/CSS/Fonts** | StaleWhileRevalidate | `static-resources-v1` | Rápido + background refresh |
| **API POST** | NetworkOnly | (BackgroundSync) | Cola offline con retry automático |
| **Navegación SPA** | StaleWhileRevalidate + PrecacheFallback | `navigation-cache-v1` | Offline-first routing |

### 3. Background Sync

Las mutaciones POST que fallan offline se encolan en `amauta-outbox-queue` y se procesan cuando vuelve la conectividad.

```typescript
const bgSyncPlugin = new BackgroundSyncPlugin('amauta-outbox-queue', {
  maxRetentionTime: 24 * 60 // 24 horas
})
```

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

## Diagrama de Flujo - Background Sync (Mutations Offline)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     BACKGROUND SYNC FLOW                                    │
└─────────────────────────────────────────────────────────────────────────────┘

    USUARIO EN MODO OFFLINE HACE SUBMIT
                    │
                    ▼
    ┌───────────────────────────────────┐
    │   HTTP POST /api/...              │
    │   (Registro de progreso, etc.)   │
    └──────────────┬────────────────────┘
                   │
                   ▼
    ┌───────────────────────────────────┐
    │   NetworkOnly + bgSyncPlugin    │
    │   request.mode === 'navigate' ? NO│
    └──────────────┬────────────────────┘
                   │
                   ▼
    ┌───────────────────────────────────┐
    │   Fetch FALLA (offline)           │
    │   → Request encolado en          │
    │     amauta-outbox-queue (Dexie)   │
    └──────────────┬────────────────────┘
                   │
                   ▼
    ┌───────────────────────────────────┐
    │   UI Muestra "Guardado offline"  │
    │   User puede continuar usando app │
    └──────────────┬────────────────────┘
                   │
                   │
    ════════════════════════════════════
         USUARIO RECUPERA CONEXIÓN
    ════════════════════════════════════
                   │
                   ▼
    ┌───────────────────────────────────┐
    │   Background Sync Trigger         │
    │   (browser.event 'sync')         │
    │   tag: "workbox-background-sync:  │
    │        amauta-outbox-queue"       │
    └──────────────┬────────────────────┘
                   │
                   ▼
    ┌───────────────────────────────────┐
    │   SW procesa cola (FIFO)         │
    │   ┌─────────────────────────┐    │
    │   │ 1. Dequeue oldest       │    │
    │   │ 2. POST al servidor     │    │
    │   │ 3. Success? → delete    │    │
    │   │ 4. Fail? → requeue      │    │
    │   │    (max 3 intentos)    │    │
    │   └─────────────────────────┘    │
    └──────────────┬────────────────────┘
                   │
                   ▼
    ┌───────────────────────────────────┐
    │   Mutación sincronizada           │
    │   UI puede invalidar queries      │
    └───────────────────────────────────┘
```

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
  registerType: 'prompt',  // Usuario decide cuándo actualizar
  strategies: 'injectManifest',  // SW custom en src/sw.ts
  srcDir: 'src',
  filename: 'sw.ts',
  includeAssets: ['favicon.ico', 'robots.txt', 'icons/*.png'],
  
  manifest: {
    name: 'Amauta',
    short_name: 'Amauta',
    display: 'standalone',
    // ... iconos y shortcuts
  },

  devOptions: {
    enabled: false,  // SW solo en producción
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
              │  Sync Events    │◄──── Background sync
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

### Background Sync No Funciona

1. Verificar que `amauta-outbox-queue` existe en Cache Storage
2. En DevTools → Application → Background Sync, verificar que hay pending syncs
3. Revisar consola del SW para errores de sync

---

## Referencias

- [Workbox Documentation](https://developer.chrome.com/docs/workbox/)
- [vite-plugin-pwa](https://vite-pwa.dev/)
- [MDN Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)

---

## Historial de Cambios

| Fecha | Cambio | Razón |
|-------|--------|-------|
| 2026-04-24 | Agregado NavigationRoute con PrecacheFallbackPlugin | Fix offline refresh en rutas SPA |
| 2026-04-24 | Migrado a StaleWhileRevalidate para navegación | Balance entre speed y freshness |
| 2026-04-24 | Implementado BackgroundSync para POSTs offline | Cola de mutaciones confiable |