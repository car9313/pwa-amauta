# Caches del Service Worker - Explicacion Detallada

## Vision general

El Service Worker de Amauta utiliza 5 caches en Cache Storage. Cada cache tiene una estrategia, un proposito y condiciones especificas para crearse.

## Tabla completa de caches

| Cache | Estrategia | Se crea al... | Contenido tipico |
|-------|------------|---------------|------------------|
| `workbox-precache-v2` | Precaching (CacheFirst) | Instalar el SW | index.html, JS, CSS, iconos, manifest (37+ entries ~740KB) |
| `navigation-cache-v1` | StaleWhileRevalidate | Navegar a cualquier ruta SPA | Respuestas HTML de cada ruta (`/dashboard/student`, `/lessons/1`, etc.) |
| `images-cache-v1` | CacheFirst | Cargar la 1ra imagen | Imagenes (avatar, iconos, contenido) max 300 entries, 30 dias |
| `api-get-cache-v1` | NetworkFirst (5s timeout) | Hacer un GET a la API real | Respuestas JSON de `/v1/students/{id}/dashboard`, etc. |
| `static-resources-v1` | StaleWhileRevalidate | Cargar asset NO precacheados | Scripts, CSS, fonts de CDNs externos |

## workbox-precache-v2

Este cache lo crea Workbox automaticamente durante el `install` del SW.

```typescript
precacheAndRoute(self.__WB_MANIFEST || [])
```

`self.__WB_MANIFEST` es inyectado por Vite durante el build con todos los assets generados. Actualmente tiene **37+ entries** (~740 KB) que incluyen:

- `index.html`
- Todos los chunks de JS code-splitted (dashboard, lessons, games, practice, login, register, etc.)
- `index.css` (Tailwind compilado)
- `workbox-window.prod.es5.js`
- Iconos del manifest
- `manifest.webmanifest`
- `robots.txt`

Siempre aparece (a menos que el SW no este instalado correctamente).

## navigation-cache-v1

Se crea al navegar a cualquier ruta SPA. Usa `StaleWhileRevalidate`:

```typescript
new NavigationRoute(
  new StaleWhileRevalidate({
    cacheName: 'navigation-cache-v1',
    plugins: [new PrecacheFallbackPlugin({ fallbackURL: '/index.html' })]
  })
)
```

**Comportamiento offline**: si la ruta no esta en cache (primera vez offline), el `PrecacheFallbackPlugin` sirve `/index.html` desde `workbox-precache-v2`. React Router luego hidrata la ruta correcta en cliente.

**Por que se crea inmediatamente**: Al navegar a cualquier ruta (ej: `/dashboard/student`), el SW intercepta la navigation request y la guarda en este cache. Basta con visitar una ruta una vez para que aparezca.

## images-cache-v1

Se crea al cargar la primera imagen en la pagina. Usa `CacheFirst` con expiracion:

```typescript
new CacheFirst({
  cacheName: 'images-cache-v1',
  plugins: [
    new ExpirationPlugin({ maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 30 }),
    new CacheableResponsePlugin({ statuses: [0, 200] })
  ]
})
```

- **Maximo**: 300 imagenes
- **Expiracion**: 30 dias desde que se cacheo
- **Match**: `request.destination === 'image'` (cubre cualquier imagen: `<img>`, CSS `background-image`, etc.)

## api-get-cache-v1 - No aparece actualmente

**Cache NO se crea** porque la app usa mock data (no hay `.env` con `VITE_API_BASE_URL` configurado).

### Condiciones para que aparezca

1. Tener un `.env` con `VITE_API_BASE_URL` apuntando al backend real
2. Hacer requests GET a endpoints que matcheen alguno de estos patrones:

```typescript
url.pathname.startsWith('/api/')        // futuro proxy Vite
url.pathname.startsWith('/v1/')         // URLs absolutas al backend
url.hostname.endsWith('.amauta.axentra.io') // cualquier entorno
```

### Cuando si estara disponible

| Entorno | URL | Pathname | Match? |
|---------|-----|----------|--------|
| Desarrollo (proxy) | `/api/exercises` | `/api/exercises` | `/api/` ✅ |
| Dev backend | `https://api-dev.amauta.axentra.io/v1/auth/me` | `/v1/auth/me` | `/v1/` ✅ |
| Staging backend | `https://api-staging.amauta.axentra.io/v1/parents/...` | `/v1/parents/...` | `/v1/` ✅ |
| Produccion backend | `https://api.amauta.axentra.io/v1/students/...` | `/v1/students/...` | `/v1/` + hostname ✅ |

### Impacto de que no se cree ahora

Ninguno. Como los datos son mock, no se pierde funcionalidad. Cuando se conecte el backend real, este cache se poblara automaticamente.

## static-resources-v1 - No aparece actualmente

**Cache NO se crea** porque todos los JS y CSS ya estan en `workbox-precache-v2`.

### Por que no se crea

Workbox tiene un orden de precedencia para las rutas:

```
1. Precache routes (precacheAndRoute)
2. Runtime routes (registerRoute) en orden de registro
```

Cuando un asset (ej: `assets/index-BLhH6v8H.js`) esta en el precache, Workbox lo sirve desde ahi sin evaluar las runtime routes. Como el build de Vite genera todos los JS/CSS con hash y `injectManifest` los incluye en el precache, **nunca llegan a la ruta runtime** `static-resources-v1`.

### Cuando se usaria este cache

Solo si la app carga un script, CSS o font **desde un origen externo** (CDN) que no este en el precache. Por ejemplo:

```html
<script src="https://cdn.example.com/sdk.js"></script>
<link href="https://fonts.googleapis.com/css2?family=Open+Sans" rel="stylesheet">
```

En ese caso, el SW interceptaria la request y la serviria via `StaleWhileRevalidate` desde `static-resources-v1`.

### Es un bug?

**No.** No es un bug. Es el comportamiento esperado. El precache cubre todos los assets de la app, y solo los assets externos no precacheados activarian este cache runtime.

## Como verificar el estado de cada cache

En Chrome DevTools:

1. Abrir DevTools (F12)
2. Ir a **Application > Cache Storage**
3. Expandir cada cache para ver sus entries
4. Para ver contenido de un entry: click en el entry, luego en "View" (Response)

## Resumen

```
Estado actual de caches:
  workbox-precache-v2  ✅ 37+ entries (siempre presente)
  navigation-cache-v1  ✅ creado al navegar (siempre presente)
  images-cache-v1      ✅ creado al cargar imagen (siempre presente si hay imagenes)
  api-get-cache-v1     ❌ pendiente de backend real
  static-resources-v1  ❌ no necesario (precache cubre todos los assets)
```
