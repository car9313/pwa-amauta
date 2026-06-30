# Plan de Internacionalización — Amauta PWA

> **Propósito**: Sistema de i18n offline-first para múltiples variantes del español latinoamericano.
> **Estado**: 🔴 No iniciado
> **Documentos relacionados**: `src/docs/README.md`, `src/docs/offline/SERVICE_WORKER.md`

---

## Arquitectura General

```
┌──────────────────────────────────────────────────────────────────────┐
│ BUNDLE (siempre disponible en precache)     │ DEXIE (cache offline) │
├─────────────────────────────────────────────┼────────────────────────┤
│ es-LA (latino neutro - DEFAULT)             │ es-MX, es-AR, es-CL,  │
│ - auth.json   (login/register)             │ es-CO, es-PE, ...     │
│ - common.json (botones, genéricos)         │                        │
│ - navigation.json                           │ Descargados en el      │
│ - errors.json                               │ PRIMER LOGIN (online)  │
│ - role.json                                 │                        │
│                                             │ Próximas visitas:      │
│ Usado para SPLASH + LOGIN (pre-auth)        │ leídos de Dexie,       │
│ y como fallback offline.                    │ cero HTTP.             │
└─────────────────────────────────────────────┴────────────────────────┘
```

### Flujo de Inicialización

```
1. App mount
   ├── i18next.init() con es-LA embebido (bundle)
   │   ├── auth.json       ← mínimo necesario para login
   │   ├── common.json
   │   ├── navigation.json
   │   ├── errors.json
   │   ├── role.json
   │   └── common.json
   │
   ├── LocaleInitializer (NO blocking):
   │   ├── Lee preferencia de Dexie (locale-preference + version)
   │   ├── Si existe y version coincide → addResourceBundle + changeLanguage
   │   ├── Si existe y version NO coincide → marca stale (no cambia idioma)
   │   ├── Escucha cambios en AuthStore (isAuthenticated + hasHydrated)
   │   └── Si NO hay preferencia → es-LA (default)
   │
   ├── AuthInitializer hidrata sesión
   └── App renderiza

2. Primer login exitoso (ONLINE)
   ├── LocaleInitializer detecta: hasHydrated=true, isAuthenticated=true
   ├── Dispara geo-detección (ipapi.co, timeout 5s)
   │   ├── Éxito → mapToLocale (PE → es-PE, MX → es-MX, ...)
   │   └── Falla → navigator.language como fallback
   ├── Si locale resuelto ≠ es-LA:
   │   ├── Fetch /locales/{locale}/translation.json
   │   ├── Guarda en Dexie { id, data, version, cachedAt }
   │   ├── i18next.addResourceBundle(locale, "translation", data)
   │   └── i18next.changeLanguage(locale)
   └── Locale queda cacheado para siempre

3. Visitas siguientes (OFFLINE)
   ├── i18next.init() con es-LA embebido
   ├── LocaleInitializer lee Dexie
   │   ├── Encuentra locale cacheado
   │   ├── addResourceBundle + changeLanguage
   │   └── Cero llamadas HTTP
   └── App renderiza en locale regional
```

### Reglas de Negocio

| Regla | Descripción |
|-------|-------------|
| **Idioma fijo en sesión** | El locale se resuelve en login y NO cambia automáticamente jamás. |
| **Sin cambios en medio de lección** | Cualquier cambio manual de idioma requiere que no haya lección activa. |
| **Versionado** | Constante `LOCALE_VERSION` en código. Sin SW involucrado. |
| **Prioridad de resolución** | Preferencia Dexie > Geo-detección cacheada > Navigator.language > es-LA |
| **es-LA** | Español latino neutro, embebido en bundle, 100% offline. |

---

## Fases de Implementación

### Leyenda

- `⬜` = Pendiente
- `🟡` = En progreso
- `✅` = Completado

---

### FASE 0 — Modelo de Dominio

> **Objetivo**: Definir tipos, configuración y constantes del sistema de idiomas.
> **Archivos**: `src/features/locale/domain/`

| # | Tarea | Estado | Archivos | Esfuerzo |
|---|-------|--------|----------|----------|
| 0.1 | Crear `locale.types.ts` — tipos `LocaleId`, `LocaleInfo`, `GeoResult`, `CacheableLocale` | ⬜ | `domain/locale.types.ts` | 15 min |
| 0.2 | Crear `locale.config.ts` — lista de locales soportados con metadata | ⬜ | `domain/locale.config.ts` | 15 min |
| 0.3 | Crear `locale.constants.ts` — `DEFAULT_LOCALE`, `LOCALE_VERSION`, `IPAPI_TIMEOUT_MS` | ⬜ | `domain/locale.constants.ts` | 10 min |
| 0.4 | Crear `locale.errors.ts` — códigos de error del sistema de locale | ⬜ | `domain/locale.errors.ts` | 10 min |

**Criterio de aceptación**: Los tipos son importables desde `@/features/locale/domain/`.

---

### FASE 1 — Infraestructura

> **Objetivo**: Implementar los servicios de sistema: i18n config, geo-detección, persistencia.
> **Archivos**: `src/features/locale/infrastructure/`, `src/lib/api/storage/db.ts`

| # | Tarea | Estado | Archivos | Esfuerzo |
|---|-------|--------|----------|----------|
| 1.1 | Crear estructura de carpetas `src/features/locale/` completa | ⬜ | — | 5 min |
| 1.2 | Agregar `locale` a tabla `preferences` en `db.ts` (v2 DB schema) | ⬜ | `lib/api/storage/db.ts` | 10 min |
| 1.3 | Crear `locale-persistence.ts` — CRUD de locale en Dexie (save, get, clear, getVersion) | ⬜ | `infrastructure/locale-persistence.ts` | 20 min |
| 1.4 | Crear `geo-detection.service.ts` — llamada a ipapi.co con timeout + mapeo a LocaleId | ⬜ | `infrastructure/geo-detection.service.ts` | 30 min |
| 1.5 | Crear archivos JSON de traducción embebidos para es-LA (11 namespaces) | ⬜ | `infrastructure/resources/es-LA/*.json` | 45 min |
| 1.6 | Crear `i18n.ts` — configuración de i18next con resources embebidos + http-backend | ⬜ | `infrastructure/i18n.ts` | 30 min |
| 1.7 | Crear declaración de tipos para i18next (`types.d.ts`) | ⬜ | `infrastructure/types.d.ts` | 15 min |

**Criterio de aceptación**: i18next se inicializa con es-LA desde el bundle sin llamadas HTTP.

---

### FASE 2 — Store y Hooks

> **Objetivo**: Estado global del locale y hooks reutilizables.
> **Archivos**: `src/features/locale/store/`, `src/features/locale/hooks/`

| # | Tarea | Estado | Archivos | Esfuerzo |
|---|-------|--------|----------|----------|
| 2.1 | Crear `locale-store.ts` — Zustand store: `resolvedLocale`, `isReady`, `userPreference`, acciones | ⬜ | `store/locale-store.ts` | 30 min |
| 2.2 | Crear `useLanguage.ts` — hook principal: `{ t, locale, setPreference, availableLocales, isReady }` | ⬜ | `hooks/useLanguage.ts` | 20 min |
| 2.3 | Crear `useLocale.ts` — hook de utilidades regionales: formatNumber, formatDate | ⬜ | `hooks/useLocale.ts` | 15 min |
| 2.4 | Crear `locale-utils.ts` — `resolveLocale()`, `isLocaleSupported()`, `localeComparator()` | ⬜ | `utils/locale-utils.ts` | 20 min |

**Criterio de aceptación**: `useLanguage()` retorna el locale resuelto y función `t` tipada.

---

### FASE 3 — LocaleInitializer + Integración en App

> **Objetivo**: Componente que inicializa el sistema y lo conecta con auth.
> **Archivos**: `src/features/locale/components/`, `src/main.tsx`

| # | Tarea | Estado | Archivos | Esfuerzo |
|---|-------|--------|----------|----------|
| 3.1 | Crear `LocaleInitializer.tsx` — NO blocking, renderiza hijos inmediato | ⬜ | `components/LocaleInitializer.tsx` | 45 min |
| 3.2 | Implementar lógica post-auth: escucha `isAuthenticated + hasHydrated` → geo-detect + cachear | ⬜ | `components/LocaleInitializer.tsx` | 30 min |
| 3.3 | Implementar versionado: comparar `LOCALE_VERSION` con versión cacheada en Dexie | ⬜ | `components/LocaleInitializer.tsx` | 15 min |
| 3.4 | Integrar `LocaleInitializer` en `main.tsx` (antes de `AuthInitializer`) | ⬜ | `main.tsx` | 10 min |
| 3.5 | Agregar patrón `/locales/*` al SW (static-resources-v1 con CacheFirst) | ⬜ | `sw.ts` | 15 min |

**Criterio de aceptación**: App inicia sin bloqueo, es-LA visible inmediatamente. Tras login, se cachea locale regional.

---

### FASE 4 — Archivos de Traducción Completos

> **Objetivo**: Crear TODOS los archivos JSON de traducción para todos los namespaces.
> **Archivos**: `src/features/locale/infrastructure/resources/es-LA/*.json`

| # | Namespace | Claves aprox | Estado | Esfuerzo |
|---|-----------|-------------|--------|----------|
| 4.1 | `common.json` — botones genéricos: cargando, reintentar, volver, cerrar, guardar, etc. | ~15 | ⬜ | 15 min |
| 4.2 | `auth.json` — login, register, validación, errores de auth | ~45 | ⬜ | 30 min |
| 4.3 | `navigation.json` — menú, sidebar, breadcrumbs, roles | ~20 | ⬜ | 15 min |
| 4.4 | `dashboard.json` — student, parent, teacher dashboards | ~60 | ⬜ | 40 min |
| 4.5 | `lessons.json` — lesson page, feedback page, pasos | ~35 | ⬜ | 25 min |
| 4.6 | `exercises.json` — tipos de ejercicio, feedback, hints | ~25 | ⬜ | 20 min |
| 4.7 | `games.json` — memoria, quiz, timed challenge, resultados | ~45 | ⬜ | 30 min |
| 4.8 | `practice.json` — práctica libre | ~20 | ⬜ | 15 min |
| 4.9 | `progress.json` — nivel, logros, materias | ~12 | ⬜ | 10 min |
| 4.10 | `role.json` — selección de rol | ~8 | ⬜ | 10 min |
| 4.11 | `errors.json` — FallbackUI, ConnectionStatus, UpdateToast, errores genéricos | ~40 | ⬜ | 30 min |

**Total claves**: ~325
**Esfuerzo total**: ~4 horas
**Peso total comprimido**: ~15 KB

**Criterio de aceptación**: Todos los namespaces existen, son válidos JSON, cubren todos los textos del inventario.

---

### FASE 5 — Migración: Auth + Navigation

> **Objetivo**: Reemplazar textos hardcodeados por `t()` en auth y navigation.
> **Primera fase de migración porque login/register son la puerta de entrada.**

| # | Archivo | Namespace | Claves a migrar | Estado | Esfuerzo |
|---|---------|-----------|----------------|--------|----------|
| 5.1 | `login-page.tsx` | `auth` | título, subtítulo, labels, placeholders, botones, errores, links | ⬜ | 20 min |
| 5.2 | `register-page.tsx` | `auth` | título, subtítulo, labels, placeholders, botones, errores, links | ⬜ | 20 min |
| 5.3 | `auth-error.ts` | `auth` | 8 mensajes de error + fallback | ⬜ | 10 min |
| 5.4 | `login-form.types.ts` | `auth` | 2 validaciones | ⬜ | 5 min |
| 5.5 | `register-form.types.ts` | `auth` | 5 validaciones | ⬜ | 5 min |
| 5.6 | `FormErrorBanner.tsx` | `auth` | botón "Reintentar" | ⬜ | 5 min |
| 5.7 | `PublicConnectionBanner.tsx` | `auth` | mensaje offline | ⬜ | 5 min |
| 5.8 | `AuthInitializer.tsx` | `common` | "Verificando sesión...", "Cargando datos..." | ⬜ | 5 min |
| 5.9 | `sidebar-nav.tsx` | `navigation` | "Cerrar sesión", alt logo, aria-labels | ⬜ | 10 min |
| 5.10 | `nav-items.ts` | `navigation` | 7 labels de navegación | ⬜ | 5 min |
| 5.11 | `app-menu-sheet.tsx` | `navigation` | título, botones, aria-labels | ⬜ | 10 min |
| 5.12 | `navigation-menu.tsx` | `navigation` | menu, roles, logout | ⬜ | 10 min |
| 5.13 | `navigation.config.ts` | `navigation` | labels de navegación | ⬜ | 5 min |
| 5.14 | `breadcrumb.tsx` | `navigation` | 9 route labels + "Inicio" | ⬜ | 5 min |
| 5.15 | `app-header.tsx` | `navigation` | alt logo, aria-label | ⬜ | 5 min |
| 5.16 | `amauta-layout.tsx` | `navigation` | role fallback strings | ⬜ | 5 min |

**Criterio de aceptación**: Login y register funcionan sin texto hardcodeado.
**Depende de**: FASE 4 (namespaces auth, navigation, common completos)

---

### FASE 6 — Migración: Dashboard

> **Objetivo**: Migrar textos de los 3 dashboards.

| # | Archivo | Namespace | Estado | Esfuerzo |
|---|---------|-----------|--------|----------|
| 6.1 | `student-dashboard-page.tsx` | `dashboard` | ⬜ | 25 min |
| 6.2 | `parent-dashboard-page.tsx` | `dashboard` | ⬜ | 20 min |
| 6.3 | `teacher-dashboard-page.tsx` | `dashboard` | ⬜ | 20 min |
| 6.4 | `agenda-item.tsx` | `dashboard` | ⬜ | 5 min |
| 6.5 | `user-profile-card.tsx` | `dashboard` | ⬜ | 5 min |
| 6.6 | `student-progress-panel.tsx` | `dashboard` | ⬜ | 10 min |
| 6.7 | `parent-metrics-grid.tsx` | `dashboard` | ⬜ | 10 min |

**Criterio de aceptación**: Los 3 dashboards renderizan sin texto hardcodeado.
**Depende de**: FASE 4 (dashboard.json completo)

---

### FASE 7 — Migración: Lessons + Practice + Progress

> **Objetivo**: Migrar textos del flujo educativo principal.

| # | Archivo | Namespace | Estado | Esfuerzo |
|---|---------|-----------|--------|----------|
| 7.1 | `lesson-page.tsx` | `lessons` | ⬜ | 25 min |
| 7.2 | `feedback-page.tsx` | `lessons` | ⬜ | 20 min |
| 7.3 | `practice-page.tsx` | `practice` | ⬜ | 20 min |
| 7.4 | `level-screen.tsx` | `progress` | ⬜ | 10 min |

**Criterio de aceptación**: Lecciones, práctica y progreso renderizan sin texto hardcodeado.
**Depende de**: FASE 4 (lessons.json, practice.json, progress.json completos)

---

### FASE 8 — Migración: Games + Role

> **Objetivo**: Migrar textos de juegos y selección de rol.

| # | Archivo | Namespace | Estado | Esfuerzo |
|---|---------|-----------|--------|----------|
| 8.1 | `games-page.tsx` | `games` | ⬜ | 15 min |
| 8.2 | `game-card.tsx` | `games` | ⬜ | 5 min |
| 8.3 | `game-header.tsx` | `games` | ⬜ | 5 min |
| 8.4 | `game-result.tsx` | `games` | ⬜ | 10 min |
| 8.5 | `quiz-game.tsx` | `games` | ⬜ | 10 min |
| 8.6 | `memory-board.tsx` | `games` | ⬜ | 10 min |
| 8.7 | `timed-challenge.tsx` | `games` | ⬜ | 10 min |
| 8.8 | `game-config.ts` | `games` | ⬜ | 10 min |
| 8.9 | `role-selection-page.tsx` | `role` | ⬜ | 5 min |
| 8.10 | `role-card.tsx` | `role` | ⬜ | 5 min |

**Criterio de aceptación**: Juegos y role selection renderizan sin texto hardcodeado.
**Depende de**: FASE 4 (games.json, role.json completos)

---

### FASE 9 — Migración: Errors + PWA + Amauta DS

> **Objetivo**: Migrar textos de errores, componentes offline y design system.

| # | Archivo | Namespace | Estado | Esfuerzo |
|---|---------|-----------|--------|----------|
| 9.1 | `FallbackUI.tsx` | `errors` | ⬜ | 20 min |
| 9.2 | `ErrorBoundary.tsx` | `errors` | ⬜ | 5 min |
| 9.3 | `ConnectionStatus.tsx` | `errors` | ⬜ | 10 min |
| 9.4 | `UpdateToast.tsx` | `errors` | ⬜ | 10 min |
| 9.5 | `DownloadLesson.tsx` | `errors` | ⬜ | 10 min |
| 9.6 | `error.types.ts` | `errors` | ⬜ | 5 min |
| 9.7 | `amauta-error-state.tsx` | `common` | ⬜ | 5 min |
| 9.8 | `amauta-loading-state.tsx` | `common` | ⬜ | 5 min |
| 9.9 | `amauta-progress.tsx` | `common` | ⬜ | 5 min |
| 9.10 | `amauta-reveal.tsx` | `common` | ⬜ | 5 min |
| 9.11 | `feedback-overlay.tsx` | `common` | ⬜ | 5 min |
| 9.12 | `dialog.tsx` | `common` | "Close" → "Cerrar" | ⬜ | 2 min |
| 9.13 | `sheet.tsx` | `common` | "Close" → "Cerrar" | ⬜ | 2 min |

**Criterio de aceptación**: ErrorBoundary, ConnectionStatus, UpdateToast, DownloadLesson renderizan sin texto hardcodeado.
**Depende de**: FASE 4 (errors.json, common.json completos)

---

### FASE 10 — Pruebas

> **Objetivo**: Tests unitarios y de integración del sistema de locale.

| # | Tarea | Estado | Archivos | Esfuerzo |
|---|-------|--------|----------|----------|
| 10.1 | Test: `locale-persistence` — CRUD en Dexie | ⬜ | `locale-persistence.test.ts` | 15 min |
| 10.2 | Test: `geo-detection.service` — mapeo de códigos, timeout, fallback | ⬜ | `geo-detection.service.test.ts` | 20 min |
| 10.3 | Test: `locale-store` — resolución de locale (prioridad) | ⬜ | `locale-store.test.ts` | 15 min |
| 10.4 | Test: `LocaleInitializer` — flujo completo (mock geo + dexie) | ⬜ | `LocaleInitializer.test.tsx` | 25 min |
| 10.5 | Test: `locale.config` — validez de config | ⬜ | `locale.config.test.ts` | 10 min |

**Criterio de aceptación**: Todos los tests pasan. Cobertura >90% del dominio locale.

---

### FASE 11 — LanguageSwitcher (UI Settings)

> **Objetivo**: Componente para que el usuario cambie manualmente el idioma.
> **Nota**: Puede diferirse a un sprint futuro sin afectar la migración.

| # | Tarea | Estado | Esfuerzo |
|---|-------|--------|----------|
| 11.1 | Crear `LanguageSwitcher.tsx` — selector con banderas + nombres | ⬜ | 30 min |
| 11.2 | Implementar guarda: bloquear cambio si hay lección activa | ⬜ | 15 min |
| 11.3 | Integrar en settings/pantalla de perfil | ⬜ | 15 min |
| 11.4 | Persistir preferencia en Dexie al cambiar | ⬜ | 10 min |

**Criterio de aceptación**: Usuario cambia idioma desde settings. No se cambia si hay lección activa.

---

### FASE 12 — Variantes Regionales (Post-MVP)

> **Objetivo**: Generar archivos de traducción para variantes regionales.
> **Nota**: Esta fase se activa cuando se requiera soporte para una región específica.

| # | Variante | Diferencias vs es-LA | Estado | Esfuerzo |
|---|----------|---------------------|--------|----------|
| 12.1 | `es-MX` (México) | ~20-30 claves | ⬜ | 30 min |
| 12.2 | `es-AR` (Argentina) | ~20-30 claves | ⬜ | 30 min |
| 12.3 | `es-CL` (Chile) | ~15-25 claves | ⬜ | 30 min |
| 12.4 | `es-CO` (Colombia) | ~15-25 claves | ⬜ | 30 min |
| 12.5 | `es-PE` (Perú) | ~10-20 claves | ⬜ | 30 min |

**Proceso por variante**:
1. Copiar `es-LA/` → `{variante}/`
2. Modificar solo las claves que cambian léxicamente
3. Agregar a `locale.config.ts`
4. Versionar en git

---

## Resumen de Esfuerzo Total

| Fase | Descripción | Archivos | Esfuerzo estimado |
|------|-------------|----------|-------------------|
| 0 | Modelo de dominio | 4 | ~50 min |
| 1 | Infraestructura | 7 | ~2.5 hr |
| 2 | Store y hooks | 4 | ~1.5 hr |
| 3 | LocaleInitializer + integración | 3 | ~1.5 hr |
| 4 | Archivos JSON de traducción | 11 | ~4 hr |
| 5 | Migración Auth + Navigation | 16 | ~2.5 hr |
| 6 | Migración Dashboard | 7 | ~1.5 hr |
| 7 | Migración Lessons + Practice + Progress | 4 | ~1.5 hr |
| 8 | Migración Games + Role | 10 | ~1.5 hr |
| 9 | Migración Errors + PWA + DS | 13 | ~1.5 hr |
| 10 | Pruebas | 5 | ~1.5 hr |
| 11 | LanguageSwitcher (opcional) | 3 | ~1 hr |
| 12 | Variantes regionales (post-MVP) | ~5 variantes | ~2.5 hr |
| | **TOTAL (MVP, Fases 0-10)** | **~74 archivos** | **~20 hr** |

---

## Dependencias entre Fases

```
FASE 0 (domain types)
  │
  ▼
FASE 1 (infrastructure) ──────────────────────────────────────┐
  │                                                            │
  ▼                                                            │
FASE 2 (store + hooks)                                         │
  │                                                            │
  ▼                                                            │
FASE 3 (LocaleInitializer + main.tsx + SW)                     │
  │                                                            │
  ▼                                                            ▼
FASE 4 (JSON files) ──────────► FASES 5-9 (migración UI) ──► FASE 10 (tests)
                                                              │
                                                              ▼
                                                       FASE 11 (LanguageSwitcher)
                                                              │
                                                              ▼
                                                       FASE 12 (variantes)
```

**Secuencia recomendada**:
1. FASE 0 → FASE 1 → FASE 2 → FASE 3 (sistema funcionando con es-LA)
2. FASE 4 (todos los JSON listos)
3. FASES 5 → 6 → 7 → 8 → 9 (en cualquier orden, no tienen dependencias entre sí)
4. FASE 10 (tests)
5. FASE 11 (LanguageSwitcher, opcional)
6. FASE 12 (variantes, post-MVP)

---

## Notas Técnicas

### Nombrado de Locales
Usamos código ISO `es-LA`, `es-MX`, `es-AR`, etc. (estándar actual de i18next y BCP 47).

### Tamaño de Archivos
- es-LA completo: ~15 KB comprimido en bundle
- Variante regional completa: ~15 KB, descarga única
- Caché en Dexie: indizado por `id (LocaleId)`, incluye `version` y `cachedAt`

### Sin APIs Externas en Runtime
Las traducciones se escriben manualmente. Las variantes regionales solo modifican las claves que difieren léxicamente del es-LA. No hay llamadas a DeepL/Claude/Google Translate en producción.

### Integración con Service Worker
Los archivos `/locales/*` se agregan a `static-resources-v1` con estrategia `CacheFirst`. `es-LA` ya está en precache por estar embebido en el bundle. Las variantes regionales se cachean en el SW al ser descargadas.

### Seguridad: Geo-detección con ipapi.co
- Llamada única, en el primer login
- Timeout de 5 segundos (si falla, se usa `navigator.language` como fallback)
- Sin datos sensibles: solo se envía IP pública
- Resultado cacheado en Dexie — no se repite la llamada
- ipapi.co tiene capa gratuita de 1000 requests/día (suficiente para MVP)
