# Plan de Internacionalización — Amauta PWA (v2)

> **Propósito**: Sistema de i18n offline-first para múltiples variantes del español latinoamericano.
> **Estado**: 🟡 En progreso (Fase 0 ✅ · Fase 1 parcialmente completada — ver `I18N_FIXES_F0_F1.md`)
> **Documentos relacionados**: `src/docs/README.md`, `src/docs/offline/SERVICE_WORKER.md`, `I18N_FIXES_F0_F1.md`

---

## Decisiones de Arquitectura

### ¿Traducciones locales o traducción automática en runtime?

**Traducciones locales escritas manualmente. Sin excepciones.**

Las razones son estructurales para este proyecto:

- La geo-detección solo sirve para *seleccionar* qué archivo JSON ya escrito se activa, nunca para generar traducciones en el momento.
- Traducción automática (DeepL, Google Translate) en runtime rompe el requisito offline-first: si no hay conexión, no hay traducción.
- Amauta es una app educativa para niños de 3–9 años. La calidad y el registro del texto deben estar bajo control total del equipo. Una mala traducción automática en un ejercicio confunde a un niño de 5 años.
- Costo y latencia en producción son inaceptables para el modelo de negocio.

### ¿`i18next-http-backend` o resources embebidos?

**Resources embebidos para `es-LA`. Carga manual desde Dexie para variantes regionales. Sin `i18next-http-backend`.**

`i18next-http-backend` hace fetches automáticos cuando el idioma activo cambia. Combinado con la carga manual vía `addResourceBundle`, produce race conditions donde el resultado depende de qué llegue primero. Toda la orquestación de carga vive en `LocaleInitializer`, que tiene control explícito. El plugin no aporta nada y quita control.

> ⚠️ Si `i18next-http-backend` está instalado en tu `i18n.ts` actual, ver `I18N_FIXES_F0_F1.md` → Fix 3.

### ¿Segmentación de Dexie por `userId`?

**Sí. Clave compuesta `${userId}:${localeId}`.**

Amauta opera en tablets escolares compartidas donde múltiples usuarios (estudiantes, padres, profesores) usan el mismo dispositivo. Sin segmentación por usuario, el locale de María queda cacheado cuando Juan inicia sesión. Con segmentación, cada usuario tiene su cache independiente y el cambio de sesión es offline-safe.

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
│                                             │ Segmentados por        │
│ Usado para SPLASH + LOGIN (pre-auth)        │ userId. Próximas       │
│ y como fallback offline.                    │ visitas: cero HTTP.    │
└─────────────────────────────────────────────┴────────────────────────┘
```

### Flujo de Inicialización

```
1. App mount
   ├── i18next.init() con es-LA embebido (bundle, sin http-backend)
   │   ├── auth.json
   │   ├── common.json
   │   ├── navigation.json
   │   ├── errors.json
   │   └── role.json
   │
   ├── LocaleInitializer (NO blocking):
   │   ├── Espera AuthStore: hasHydrated=true
   │   ├── Si isAuthenticated=true → lee Dexie con userId actual
   │   │   ├── Existe y version coincide con LOCALE_VERSIONS[localeId] → addResourceBundle + changeLanguage
   │   │   ├── Existe y version NO coincide → marca stale, dispara re-fetch
   │   │   └── No existe → dispara geo-detección
   │   └── Si NO isAuthenticated → mantiene es-LA
   │
   ├── AuthInitializer hidrata sesión
   └── App renderiza

2. Primer login exitoso (ONLINE obligatorio)
   ├── LocaleInitializer detecta: hasHydrated=true, isAuthenticated=true
   ├── Lee Dexie con userId → no hay entrada → dispara geo-detección
   ├── geo-detection.service: ipapi.co con timeout 5s
   │   ├── Éxito (200) → mapToLocale (PE→es-PE, MX→es-MX, ...)
   │   ├── Fallo 429 (rate limit) → { success: false, reason: 'rate_limited' }
   │   ├── Fallo red / timeout → { success: false, reason: 'timeout' | 'network_error' }
   │   └── País no mapeado → { success: false, reason: 'unmapped_country' }
   ├── Si success=false → fallback: navigator.language → es-LA
   ├── Si locale resuelto ≠ es-LA:
   │   ├── Fetch /locales/{locale}/translation.json
   │   ├── Guarda en Dexie { id: `${userId}:${localeId}`, userId, localeId, data, version, cachedAt }
   │   ├── i18next.addResourceBundle(locale, "translation", data)
   │   └── i18next.changeLanguage(locale)
   └── Locale queda cacheado por userId

3. Visitas siguientes (OFFLINE posible)
   ├── i18next.init() con es-LA embebido
   ├── LocaleInitializer lee Dexie con userId
   │   ├── Encuentra entrada del usuario actual
   │   ├── Compara version con LOCALE_VERSIONS[localeId]
   │   ├── Si coincide → addResourceBundle + changeLanguage
   │   └── Si stale → mantiene es-LA hasta próxima sesión online
   └── App renderiza en locale regional del usuario

4. Logout
   └── NO limpiar locale de Dexie — el cache queda indexado por userId
       El siguiente usuario que inicie sesión tendrá su propio cache.
```

### Reglas de Negocio

| Regla | Descripción |
|-------|-------------|
| **Idioma fijo en sesión** | El locale se resuelve en login y NO cambia automáticamente jamás en esa sesión. |
| **Sin cambios en medio de lección** | Cualquier cambio manual de idioma requiere que no haya lección activa. |
| **Versionado por locale** | `LOCALE_VERSIONS: Record<LocaleId, string>`. Cada variante tiene su propia versión independiente. |
| **Prioridad de resolución** | Dexie (userId) > Geo-detección > Navigator.language > es-LA |
| **es-LA** | Español latino neutro, embebido en bundle, 100% offline, fallback universal. |
| **Sin http-backend** | Toda la carga de variantes es orquestada por `LocaleInitializer`, nunca automática. |
| **Segmentación por userId** | Dexie usa clave `${userId}:${localeId}`. Múltiples usuarios en el mismo dispositivo son independientes. |
| **Geo-detección robusta** | El servicio retorna `GeoResult` tipado. Cualquier `success: false` garantiza fallback a `navigator.language`. |
| **Traducciones manuales** | Sin APIs de traducción automática en runtime. Los JSON son escritos por el equipo y versionados en git. |

---

## Fases de Implementación

### Leyenda

- `⬜` = Pendiente
- `🟡` = En progreso / requiere ajuste (ver `I18N_FIXES_F0_F1.md`)
- `✅` = Completado y verificado

---

### FASE 0 — Modelo de Dominio ✅ (con ajustes pendientes)

> **Objetivo**: Definir tipos, configuración y constantes del sistema de idiomas.
> **Archivos**: `src/features/locale/domain/`
> **Estado global**: Implementado. Requiere ajustes en `locale.constants.ts` y `locale.types.ts` — ver `I18N_FIXES_F0_F1.md`.

| # | Tarea | Estado | Archivos | Esfuerzo |
|---|-------|--------|----------|----------|
| 0.1 | `locale.types.ts` — tipos `LocaleId`, `LocaleInfo`, `GeoResult`, `CacheableLocale` | 🟡 | `domain/locale.types.ts` | 10 min (ajuste) |
| 0.2 | `locale.config.ts` — lista de locales soportados con metadata | ✅ | `domain/locale.config.ts` | — |
| 0.3 | `locale.constants.ts` — `DEFAULT_LOCALE`, `LOCALE_VERSIONS` (Record por locale), `IPAPI_TIMEOUT_MS` | 🟡 | `domain/locale.constants.ts` | 10 min (ajuste) |
| 0.4 | `locale.errors.ts` — códigos de error del sistema de locale | ✅ | `domain/locale.errors.ts` | — |

**Criterio de aceptación**: Los tipos son importables desde `@/features/locale/domain/`. `LOCALE_VERSIONS` es un `Record<LocaleId, string>`, no una constante global. `CacheableLocale` incluye campo `userId`.

---

### FASE 1 — Infraestructura 🟡 (con ajustes pendientes)

> **Objetivo**: Implementar los servicios de sistema: i18n config, geo-detección, persistencia.
> **Archivos**: `src/features/locale/infrastructure/`, `src/lib/api/storage/db.ts`
> **Estado global**: Implementado. Requiere 3 ajustes críticos — ver `I18N_FIXES_F0_F1.md`.

| # | Tarea | Estado | Archivos | Esfuerzo |
|---|-------|--------|----------|----------|
| 1.1 | Estructura de carpetas `src/features/locale/` completa | ✅ | — | — |
| 1.2 | `locale` en tabla `preferences` en `db.ts` (schema Dexie) | ✅ | `lib/api/storage/db.ts` | — |
| 1.3 | `locale-persistence.ts` — CRUD con clave `${userId}:${localeId}` | 🟡 | `infrastructure/locale-persistence.ts` | 20 min (ajuste) |
| 1.4 | `geo-detection.service.ts` — retorna `GeoResult` tipado, maneja 429 explícitamente | 🟡 | `infrastructure/geo-detection.service.ts` | 15 min (ajuste) |
| 1.5 | JSONs de traducción para es-LA — basados en inventario de textos hardcodeados | 🟡 | `infrastructure/resources/es-LA/*.json` | Ver nota* |
| 1.6 | `i18n.ts` — resources embebidos únicamente, sin `i18next-http-backend` | 🟡 | `infrastructure/i18n.ts` | 20 min (ajuste crítico) |
| 1.7 | `types.d.ts` — declaración de tipos para i18next | ✅ | `infrastructure/types.d.ts` | — |

> *Nota 1.5: Los JSONs de es-LA deben escribirse **después** de hacer un inventario de textos hardcodeados en el código. Ver proceso en sección "Proceso para Fase 1.5" más abajo.

**Criterio de aceptación**: i18next se inicializa con es-LA desde el bundle sin llamadas HTTP. `locale-persistence.ts` lee y escribe con clave compuesta `userId:localeId`. `geo-detection.service.ts` retorna `GeoResult` para todos los casos de fallo.

---

### Proceso para Fase 1.5 — Inventario antes de escribir los JSON

> ⚠️ No escribir los JSON de memoria. Primero extraer los textos que realmente existen.

**Por cada namespace, ejecutar en terminal:**

```bash
# Buscar strings de UI hardcodeados (mayúscula inicial, más de 3 chars)
grep -rEn '"[A-ZÁÉÍÓÚ][a-záéíóúA-Z ]{3,}"' src/features/{namespace}/ --include="*.tsx" --include="*.ts"
grep -rEn "'[A-ZÁÉÍÓÚ][a-záéíóúA-Z ]{3,}'" src/features/{namespace}/ --include="*.tsx" --include="*.ts"
```

**Proceso completo:**
1. Listar archivos del namespace (ya definidos en Fases 5-9)
2. Grep de strings hardcodeados en esos archivos
3. Agrupar strings → definir claves JSON
4. Escribir el JSON con las claves reales encontradas
5. Verificar cobertura: ningún string sin clave asignada

Esto garantiza que las claves del JSON coincidan exactamente con lo que los componentes necesitan. Evita el retrabajo de descubrir claves faltantes durante la migración (Fases 5-9).

---

### FASE 2 — Store y Hooks

> **Objetivo**: Estado global del locale y hooks reutilizables.
> **Archivos**: `src/features/locale/store/`, `src/features/locale/hooks/`
> **Depende de**: FASE 0 y FASE 1 completadas y verificadas.

| # | Tarea | Estado | Archivos | Esfuerzo |
|---|-------|--------|----------|----------|
| 2.1 | `locale-store.ts` — Zustand store: `resolvedLocale`, `isReady`, `userPreference`, acciones incluyendo `resolveAndCacheLocale(userId)` | ⬜ | `store/locale-store.ts` | 35 min |
| 2.2 | `useLanguage.ts` — hook principal: `{ t, locale, setPreference, availableLocales, isReady }` | ⬜ | `hooks/useLanguage.ts` | 20 min |
| 2.3 | `useLocale.ts` — hook de utilidades regionales: `formatNumber`, `formatDate` | ⬜ | `hooks/useLocale.ts` | 15 min |
| 2.4 | `locale-utils.ts` — `resolveLocale()`, `isLocaleSupported()`, `getLocaleFromNavigator()` | ⬜ | `utils/locale-utils.ts` | 20 min |

> **Nota 2.1**: La acción `resolveAndCacheLocale(userId)` centraliza toda la lógica de orquestación (leer Dexie → geo-detección → fallback → persistir → changeLanguage). `LocaleInitializer` en Fase 3 simplemente la llama; no contiene lógica de negocio propia.

**Criterio de aceptación**: `useLanguage()` retorna el locale resuelto y función `t` tipada. El store expone `resolveAndCacheLocale(userId)` como acción pública.

---

### FASE 3 — LocaleInitializer + Integración en App

> **Objetivo**: Componente orquestador que conecta auth con el sistema de locale.
> **Archivos**: `src/features/locale/components/`, `src/main.tsx`
> **Depende de**: FASE 2 completada.

| # | Tarea | Estado | Archivos | Esfuerzo |
|---|-------|--------|----------|----------|
| 3.1 | `LocaleInitializer.tsx` — NO blocking, renderiza hijos inmediatamente | ⬜ | `components/LocaleInitializer.tsx` | 20 min |
| 3.2 | Lógica post-auth: escucha `isAuthenticated + hasHydrated + userId` → llama `resolveAndCacheLocale(userId)` del store | ⬜ | `components/LocaleInitializer.tsx` | 20 min |
| 3.3 | Versionado: la validación de versión ocurre dentro de `resolveAndCacheLocale` usando `LOCALE_VERSIONS[localeId]` | ⬜ | `store/locale-store.ts` | 10 min |
| 3.4 | Integrar `LocaleInitializer` en `main.tsx` (wrappea la app, antes de `AuthInitializer`) | ⬜ | `main.tsx` | 10 min |
| 3.5 | Agregar patrón `/locales/*` al SW (estrategia `CacheFirst` en `static-resources-v1`) | ⬜ | `sw.ts` | 15 min |

**Criterio de aceptación**: App inicia sin bloqueo, es-LA visible inmediatamente. Tras login, se resuelve y cachea locale regional por `userId`. `LocaleInitializer` no contiene lógica de negocio: solo observa el store y delega.

---

### FASE 4 — Archivos de Traducción Completos ✅

> **Objetivo**: Crear TODOS los archivos JSON de traducción para todos los namespaces de es-LA.
> **Estado**: Los 11 archivos JSON existen en `src/features/locale/infrastructure/resources/es-LA/` con todas las claves necesarias para Fase 5.
> **Prerequisito**: Completar inventario de textos hardcodeados (ver proceso en Fase 1.5).
> **Archivos**: `src/features/locale/infrastructure/resources/es-LA/*.json`

| # | Namespace | Claves aprox | Estado | Esfuerzo |
|---|-----------|-------------|--------|----------|
| 4.1 | `common.json` — botones genéricos: cargando, reintentar, volver, cerrar, guardar, etc. | ~15 | ✅ | 15 min |
| 4.2 | `auth.json` — login, register, validación, errores de auth | ~45 | ✅ | 30 min |
| 4.3 | `navigation.json` — menú, sidebar, breadcrumbs, roles | ~20 | ✅ | 15 min |
| 4.4 | `dashboard.json` — student, parent, teacher dashboards | ~60 | ✅ | 40 min |
| 4.5 | `lessons.json` — lesson page, feedback page, pasos | ~35 | ✅ | 25 min |
| 4.6 | `exercises.json` — tipos de ejercicio, feedback, hints | ~25 | ✅ | 20 min |
| 4.7 | `games.json` — memoria, quiz, timed challenge, resultados | ~45 | ✅ | 30 min |
| 4.8 | `practice.json` — práctica libre | ~20 | ✅ | 15 min |
| 4.9 | `progress.json` — nivel, logros, materias | ~12 | ✅ | 10 min |
| 4.10 | `role.json` — selección de rol | ~8 | ✅ | 10 min |
| 4.11 | `errors.json` — FallbackUI, ConnectionStatus, UpdateToast, errores genéricos | ~40 | ✅ | 30 min |

**Total claves estimadas**: ~325 (ajustar tras inventario real)
**Esfuerzo total**: ~4 horas
**Peso total comprimido**: ~15 KB

**Criterio de aceptación**: Todos los namespaces existen, son JSON válido, y cubren el 100% de los textos encontrados en el inventario. Cero claves inventadas sin respaldo en código real.

---

### FASE 5 — Migración: Auth + Navigation ✅

> **Objetivo**: Reemplazar textos hardcodeados por `t()` en auth y navigation.
> **Primera fase de migración porque login/register son la puerta de entrada.**
> **Depende de**: FASE 4 (namespaces auth, navigation, common completos)

| # | Archivo | Namespace | Claves a migrar | Estado | Esfuerzo |
|---|---------|-----------|----------------|--------|----------|
| 5.1 | `login-page.tsx` | `auth` | título, subtítulo, labels, placeholders, botones, errores, links | ✅ | 20 min |
| 5.2 | `register-page.tsx` | `auth` | título, subtítulo, labels, placeholders, botones, errores, links | ✅ | 20 min |
| 5.3 | `auth-error.ts` | `auth` | 8 mensajes de error + fallback | ✅ | 10 min |
| 5.4 | `login-form.types.ts` | `auth` | 2 validaciones | ✅ | 5 min |
| 5.5 | `register-form.types.ts` | `auth` | 5 validaciones | ✅ | 5 min |
| 5.6 | `FormErrorBanner.tsx` | `auth` | botón "Reintentar" | ✅ | 5 min |
| 5.7 | `PublicConnectionBanner.tsx` | `auth` | mensaje offline | ✅ | 5 min |
| 5.8 | `AuthInitializer.tsx` | `common` | "Verificando sesión...", "Cargando datos..." | ✅ | 5 min |
| 5.9 | `sidebar-nav.tsx` | `navigation` | "Cerrar sesión", alt logo, aria-labels | ✅ | 10 min |
| 5.10 | `nav-items.ts` | `navigation` | 7 labels de navegación | ✅ | 5 min |
| 5.11 | `app-menu-sheet.tsx` | `navigation` | título, botones, aria-labels | ✅ | 10 min |
| 5.12 | `navigation-menu.tsx` | `navigation` | menu, roles, logout | ✅ | 10 min |
| 5.13 | `navigation.config.ts` | `navigation` | labels de navegación | ✅ | 5 min |
| 5.14 | `breadcrumb.tsx` | `navigation` | 9 route labels + "Inicio" | ✅ | 5 min |
| 5.15 | `app-header.tsx` | `navigation` | alt logo, aria-label | ✅ | 5 min |
| 5.16 | `amauta-layout.tsx` | `navigation` | role fallback strings | ✅ | 5 min |

**Criterio de aceptación**: Login y register funcionan sin texto hardcodeado. ✅

---

### FASE 6 — Migración: Dashboard

> **Objetivo**: Migrar textos de los 3 dashboards.
> **Depende de**: FASE 4 (dashboard.json completo)

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

---

### FASE 7 — Migración: Lessons + Practice + Progress

> **Objetivo**: Migrar textos del flujo educativo principal.
> **Depende de**: FASE 4 (lessons.json, practice.json, progress.json completos)

| # | Archivo | Namespace | Estado | Esfuerzo |
|---|---------|-----------|--------|----------|
| 7.1 | `lesson-page.tsx` | `lessons` | ⬜ | 25 min |
| 7.2 | `feedback-page.tsx` | `lessons` | ⬜ | 20 min |
| 7.3 | `practice-page.tsx` | `practice` | ⬜ | 20 min |
| 7.4 | `level-screen.tsx` | `progress` | ⬜ | 10 min |

**Criterio de aceptación**: Lecciones, práctica y progreso renderizan sin texto hardcodeado.

---

### FASE 8 — Migración: Games + Role

> **Objetivo**: Migrar textos de juegos y selección de rol.
> **Depende de**: FASE 4 (games.json, role.json completos)

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

---

### FASE 9 — Migración: Errors + PWA + Amauta DS

> **Objetivo**: Migrar textos de errores, componentes offline y design system.
> **Depende de**: FASE 4 (errors.json, common.json completos)

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
| 9.12 | `dialog.tsx` | `common` | "Close" → `t('common:close')` | ⬜ | 2 min |
| 9.13 | `sheet.tsx` | `common` | "Close" → `t('common:close')` | ⬜ | 2 min |

**Criterio de aceptación**: ErrorBoundary, ConnectionStatus, UpdateToast, DownloadLesson renderizan sin texto hardcodeado.

---

### FASE 10 — Pruebas

> **Objetivo**: Tests unitarios y de integración del sistema de locale.

| # | Tarea | Estado | Archivos | Esfuerzo |
|---|-------|--------|----------|----------|
| 10.1 | Test: `locale-persistence` — CRUD en Dexie con clave `userId:localeId`, aislamiento entre usuarios | ⬜ | `locale-persistence.test.ts` | 20 min |
| 10.2 | Test: `geo-detection.service` — éxito, timeout, 429, 500, país no mapeado, JSON malformado | ⬜ | `geo-detection.service.test.ts` | 25 min |
| 10.3 | Test: `locale-store` — cadena de prioridad completa (Dexie→Geo→Navigator→es-LA) | ⬜ | `locale-store.test.ts` | 15 min |
| 10.4 | Test: `LocaleInitializer` — flujo completo (mock geo + dexie), cambio de usuario | ⬜ | `LocaleInitializer.test.tsx` | 30 min |
| 10.5 | Test: `locale.config` — validez de config, todos los locales tienen LOCALE_VERSIONS entry | ⬜ | `locale.config.test.ts` | 10 min |

**Criterio de aceptación**: Todos los tests pasan. Cobertura >90% del dominio locale. El test 10.2 cubre **explícitamente** el caso 429. El test 10.4 verifica aislamiento entre usuarios distintos en el mismo dispositivo.

---

### FASE 11 — LanguageSwitcher (UI Settings)

> **Objetivo**: Componente para que el usuario cambie manualmente el idioma.
> **Nota**: Puede diferirse a un sprint futuro sin afectar la migración.

| # | Tarea | Estado | Esfuerzo |
|---|-------|--------|----------|
| 11.1 | `LanguageSwitcher.tsx` — selector con nombres de idioma (sin banderas: accesibilidad) | ⬜ | 30 min |
| 11.2 | Guarda: bloquear cambio si hay lección activa | ⬜ | 15 min |
| 11.3 | Integrar en settings/pantalla de perfil | ⬜ | 15 min |
| 11.4 | Persistir preferencia en Dexie con clave `${userId}:${localeId}` al cambiar | ⬜ | 10 min |

**Criterio de aceptación**: Usuario cambia idioma desde settings. No se cambia si hay lección activa. La preferencia sobrevive a un cierre de app.

---

### FASE 12 — Variantes Regionales (Post-MVP)

> **Objetivo**: Generar archivos de traducción para variantes regionales.
> **Nota**: Esta fase se activa cuando haya usuarios reales en una región específica. No antes.

| # | Variante | Diferencias vs es-LA | Estado | Esfuerzo |
|---|----------|---------------------|--------|----------|
| 12.1 | `es-MX` (México) | ~20-30 claves | ⬜ | 30 min |
| 12.2 | `es-AR` (Argentina) | ~20-30 claves | ⬜ | 30 min |
| 12.3 | `es-CL` (Chile) | ~15-25 claves | ⬜ | 30 min |
| 12.4 | `es-CO` (Colombia) | ~15-25 claves | ⬜ | 30 min |
| 12.5 | `es-PE` (Perú) | ~10-20 claves | ⬜ | 30 min |

**Proceso por variante**:
1. Copiar `es-LA/` → `{variante}/`
2. Modificar solo las claves que difieren léxicamente
3. Agregar a `locale.config.ts` y a `LOCALE_VERSIONS` en `locale.constants.ts`
4. Versionar en git con tag descriptivo

---

## Resumen de Esfuerzo

| Fase | Descripción | Estado | Esfuerzo estimado |
|------|-------------|--------|-------------------|
| 0 | Modelo de dominio | 🟡 Ajuste | ~20 min |
| 1 | Infraestructura | 🟡 Ajuste | ~55 min (ajustes) + inventario |
| 2 | Store y hooks | ⬜ | ~1.5 hr |
| 3 | LocaleInitializer + integración | ⬜ | ~1.25 hr |
| 4 | Archivos JSON (post-inventario) | ✅ | ~4 hr |
| 5 | Migración Auth + Navigation | ✅ | ~2.5 hr |
| 6 | Migración Dashboard | ⬜ | ~1.5 hr |
| 7 | Migración Lessons + Practice + Progress | ⬜ | ~1.25 hr |
| 8 | Migración Games + Role | ⬜ | ~1.5 hr |
| 9 | Migración Errors + PWA + DS | ⬜ | ~1.5 hr |
| 10 | Pruebas | ⬜ | ~1.75 hr |
| 11 | LanguageSwitcher (opcional) | ⬜ | ~1.25 hr |
| 12 | Variantes regionales (post-MVP) | ⬜ | ~2.5 hr |
| | **TOTAL MVP (Fases 0-10)** | | **~18 hr** |

---

## Dependencias entre Fases

```
FASE 0 (domain types — ajuste LOCALE_VERSIONS + CacheableLocale con userId)
  │
  ▼
FASE 1 (infrastructure — ajuste i18n.ts + locale-persistence + geo-detection)
  │
  ▼
FASE 2 (store + hooks — resolveAndCacheLocale centraliza la orquestación)
  │
  ▼
FASE 3 (LocaleInitializer — solo delega al store, + SW config)
  │
  ▼
FASE 4 (JSON files — post inventario de hardcoded strings)
  │
  ▼
FASES 5 → 6 → 7 → 8 → 9 (migración UI — independientes entre sí)
  │
  ▼
FASE 10 (tests)
  │
  ▼
FASE 11 (LanguageSwitcher, opcional)
  │
  ▼
FASE 12 (variantes regionales, post-MVP)
```

**Secuencia recomendada**:
1. Aplicar todos los fixes de `I18N_FIXES_F0_F1.md` antes de continuar
2. FASE 2 → FASE 3 (sistema funcionando end-to-end con es-LA)
3. Inventario de textos → FASE 4 (JSON completos)
4. FASES 5-9 en cualquier orden (no hay dependencias entre sí)
5. FASE 10 (tests)
6. FASE 11 si entra en el sprint
7. FASE 12 cuando haya usuarios reales en regiones específicas

---

## Notas Técnicas

### Nombrado de Locales
Código ISO `es-LA`, `es-MX`, `es-AR`, etc. (estándar BCP 47, compatible con i18next).

### Tamaño de Archivos
- es-LA completo: ~15 KB comprimido (en bundle)
- Variante regional: ~15 KB, descarga única, cacheada en Dexie por `userId`
- Schema Dexie: `{ id: "${userId}:${localeId}", userId, localeId, data, version, cachedAt }`

### Sin APIs Externas en Runtime
Las traducciones se escriben manualmente y se versionan en git. Sin llamadas a DeepL/Google Translate en producción. La única API externa es `ipapi.co` para geo-detección, y es una llamada única por usuario, con fallback robusto.

### Integración con Service Worker
Los archivos `/locales/*` se agregan a `static-resources-v1` con estrategia `CacheFirst`. `es-LA` está en precache por estar embebido en el bundle. Las variantes regionales se gestionan exclusivamente por Dexie, no por el SW.

### Seguridad: Geo-detección con ipapi.co
- Llamada única, en el primer login online
- Timeout: 5 segundos
- Manejo explícito de 429 (rate limit), errores HTTP, y países no mapeados
- Sin datos sensibles: solo se envía IP pública
- Capa gratuita: 1000 requests/día — suficiente para beta, monitorear en escala
- Si el servicio falla por cualquier razón: fallback garantizado a `navigator.language` → `es-LA`

### Logout y cambio de usuario
El locale NO se limpia en logout. Cada entrada en Dexie está indexada por `userId`. Al iniciar sesión un usuario diferente, `LocaleInitializer` lee Dexie con el nuevo `userId` y encuentra (o no) su propio cache, completamente independiente del usuario anterior.
