# Amauta — Plataforma Educativa Interactiva PWA

**Amauta** es una Progressive Web App educativa diseñada para niños, construida con un enfoque offline-first. La aplicación permite a estudiantes, padres y docentes interactuar con contenido educativo (ejercicios, lecciones, juegos) incluso sin conexión a internet, sincronizando automáticamente los datos cuando la conectividad se restablece.

---

## Características PWA

| Característica | Implementación |
|---|---|
| **Instalable** | Web App Manifest con `display: standalone`, iconos `any` + `maskable`, shortcuts |
| **Offline-first** | Service Worker con precaching del App Shell (37+ entries) + runtime caching |
| **Navegación SPA offline** | NavigationRoute con StaleWhileRevalidate + PrecacheFallbackPlugin |
| **Caching inteligente** | 5 caches diferentes según tipo de recurso |
| **Actualización controlada** | `registerType: 'prompt'` — el usuario decide cuándo actualizar |
| **Sincronización en background** | App-level outbox con cola de mutaciones en Dexie + sync automático |

### Estrategias de Caching

| Tipo | Estrategia | Cache |
|---|---|---|
| App Shell (HTML, JS, CSS) | CacheFirst (precache) | `workbox-precache-v2` |
| Navegación SPA | StaleWhileRevalidate + PrecacheFallback | `navigation-cache-v1` |
| Imágenes | CacheFirst (30 días, 300 max) | `images-cache-v1` |
| API GET | NetworkFirst (5s timeout) | `api-get-cache-v1` |
| Scripts/CSS externos | StaleWhileRevalidate | `static-resources-v1` |
| API POST | NetworkOnly (sin plugins) | Cola offline a nivel app |

---

## Patrones Arquitectónicos

### Domain-Driven Design (DDD) con Capas Hexagonales

Cada feature sigue una estructura con separación estricta de responsabilidades:

```
src/features/[dominio]/
  domain/             — Tipos puros, schemas Zod, errores (sin dependencias de framework)
  infrastructure/     — Adaptadores: Dexie, servicios HTTP, mappers
  hooks/              — Hooks React que orquestan infraestructura + store
  presentation/       — Componentes, páginas, store Zustand
  queries/            — Funciones de fetching para TanStack Query
```

### Gestión de Estado en Tres Capas

```
IndexedDB (Dexie)   ────>   Zustand   ────>   TanStack Query
(source of truth)          (estado runtime)   (server cache)
     │                           │                    │
tokens, users,             isAuthenticated,     exercises, lessons,
preferences,               user, hasHydrated,   students, progress
mutations,                 isOfflineMode,
exercises, lessons,        selectedStudentId
progress, students
```

### Patrón Outbox (Cola Offline)

Las mutaciones offline siguen el patrón outbox a nivel de aplicación:

1. `useSafeMutation` intenta ejecutar la mutación vía HTTP
2. Si falla o no hay conexión, encola en Dexie (tabla `mutations`)
3. `background-sync` procesa la cola con prioridad, retry exponencial (max 3), y resolución last-write-wins

**Prioridad de mutaciones:**
- Alta (1): login, logout, register, submitAnswer
- Media (2): addChild, updateProgress
- Baja (3): updateProfile, updatePreferences

### App Shell + Hydration

```
App mount → AuthInitializer → hydrate Zustand desde Dexie → QueryInitializer → precarga React Query desde Dexie → UI lista
```

### Route Guards

Rutas protegidas con `RequireAuth` y `RequireRole` usando React Router `RouteObject`:

```
/dashboard/student  → RequireAuth + RequireRole('student')
/dashboard/parent   → RequireAuth + RequireRole('parent')
/login              → PublicRoute (redirige si autenticado)
```

### Manejo de Errores

- `ErrorBoundary` con fallbacks diferenciados (student, parent, generic)
- Códigos de error específicos para auth (`TOKEN_EXPIRED`, `REFRESH_FAILED`, `SESSION_NOT_FOUND`)
- Modo offline automático cuando falla refresh pero hay sesión local
- Logging de errores en localStorage (preparado para Sentry)

---

## Tecnologías

### Core

| Tecnología | Versión | Propósito |
|---|---|---|
| React | 19 | UI framework |
| TypeScript | ~5.9 | Tipado estático |
| Vite | 7 | Build tool y dev server |
| Tailwind CSS | 4.2 | Utility-first styling |
| shadcn/ui | — | Componentes UI reutilizables |

### Estado y Datos

| Tecnología | Propósito |
|---|---|
| Zustand | Estado cliente (auth session, UI flags) |
| TanStack Query | Cache de servidor (ejercicios, lecciones, estudiantes) |
| Dexie | IndexedDB como fuente de verdad offline |
| Zod | Schemas de validación runtime |

### PWA

| Tecnología | Propósito |
|---|---|
| vite-plugin-pwa | Integración PWA con Vite |
| Workbox | Service Worker (precaching, routing, estrategias) |
| workbox-window | Comunicación UI ↔ Service Worker |

### Routing y Formularios

| Tecnología | Propósito |
|---|---|
| React Router 7 | SPA routing con guards |
| React Hook Form | Formularios performantes |
| Zod + @hookform/resolvers | Validación de formularios |

### Testing (pendiente de configuración)

| Tecnología | Propósito |
|---|---|
| Vitest | Test runner |
| Testing Library | Testing de componentes |

---

## Cómo Probar la Aplicación

### Desarrollo

```bash
pnpm dev        # Inicia dev server en http://localhost:5173
```

En desarrollo, el Service Worker **no está activo** (`devOptions.enabled: false`). El manifest y el service worker solo funcionan en producción. Las peticiones usan datos mock.

### Producción (local)

```bash
pnpm build      # tsc -b && vite build (genera dist/)
pnpm preview    # Sirve build en http://localhost:4173
```

En `pnpm preview`, el Service Worker se registra, las estrategias de caching se activan, y el manifest es detectado por el navegador.

### Probar funcionalidad offline

1. `pnpm build && pnpm preview`
2. DevTools → Application → Service Workers → verificar "activated and running"
3. Navegar a rutas (ej: `/dashboard/student`)
4. DevTools → Network → marcar "Offline"
5. Recargar → la app debe cargar desde precache

### Probar cola offline de mutaciones

1. Abrir DevTools → Application → IndexedDB → `amauta-db` → `mutations`
2. Poner el navegador offline
3. Realizar una acción que genere mutación (ej: enviar respuesta de ejercicio)
4. Verificar que aparece en la tabla `mutations`
5. Volver online → verificar que la cola se vacía

---

## Diferencia entre Desarrollo y Producción

### Service Worker

| Aspecto | Desarrollo (`pnpm dev`) | Producción (`pnpm build + preview`) |
|---|---|---|
| SW activo | No (`devOptions.enabled: false`) | Sí |
| Registro | No se ejecuta | Se registra en `main.tsx` |
| Precaching | No aplica | 37+ entries cacheadas |
| Runtime caching | No aplica | 5 caches activos |
| Navegación offline | No disponible | Sí, con fallback a precache |
| Actualizaciones | No aplica | Detecta cambios, prompt al usuario |

### Manifest

| Aspecto | Desarrollo | Producción |
|---|---|---|
| Manifest | No se sirve | Se genera en `dist/manifest.webmanifest` |
| Instalación PWA | No disponible | Botón "Instalar" en navegador |
| Iconos | Sirve desde `public/` | Precacheados por SW |
| Shortcuts | No aplica | Accesibles desde menú contextual |

### Datos

| Aspecto | Desarrollo | Producción |
|---|---|---|
| API | Mock data (sin backend) | Backend real configurable vía `.env` |
| Cache API | No se crea `api-get-cache-v1` | Se crea al hacer requests GET |
| Imágenes | Sin cache | `images-cache-v1` activo |
| Mutaciones offline | Igual (Dexie + queue) | Igual |

### Por qué el SW no se activa en desarrollo

Con `devOptions.enabled: false`, vite-plugin-pwa no inyecta el registro del SW en desarrollo. Esto evita problemas de caché que interferirían con el HMR (Hot Module Replacement) de Vite. Para pruebas de SW, siempre usar `pnpm build && pnpm preview`.

---

## Scripts

```bash
pnpm dev        # Desarrollo con HMR
pnpm build      # TypeScript check + build producción
pnpm preview    # Preview producción local
pnpm lint       # ESLint
pnpm test       # Vitest (requiere configuración)
```

---

## Licencia

Proyecto educativo privado — Amauta.
