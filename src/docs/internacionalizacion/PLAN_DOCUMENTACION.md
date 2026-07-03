# Plan de Documentacion — Internacionalizacion por Geolocalizacion

> **Proposito**: Crear documentacion completa del sistema de i18n offline-first de Amauta, cubriendo todas las fases de implementacion, la arquitectura, el flujo de datos, la persistencia en Dexie, y los problemas conocidos.
> **Estado**: ✅ COMPLETADO (11/11 archivos)
> **Ultima actualizacion**: 03 Julio 2026

---

## Estructura Propuesta

Carpeta destino: `src/docs/internacionalizacion/`

| # | Archivo | Contenido | Estado |
|---|---------|-----------|--------|
| 1 | `00_INDICE.md` | Indice general, orden de lectura recomendado, glosario de terminos, mapa conceptual del sistema | ✅ |
| 2 | `01_VISION_GENERAL.md` | Resumen en lenguaje natural de alto nivel | ✅ |
| 3 | `02_MODELO_DE_DOMINIO.md` | Fase 0: tipos y relaciones | ✅ |
| 4 | `03_INFRAESTRUCTURA.md` | Fase 1: i18n, geo, persistence, db | ✅ |
| 5 | `04_STORE_Y_HOOKS.md` | Fase 2: store, hooks, utils | ✅ |
| 6 | `05_LOCALE_INITIALIZER.md` | Fase 3 + Refactor | ✅ |
| 7 | `06_FLUJO_PREAUTH.md` | detectPreAuthLocale | ✅ |
| 8 | `07_PERSISTENCIA_DEXIE.md` | Persistencia en Dexie | ✅ |
| 9 | `08_VARIANTES_REGIONALES.md` | Fase 12: variantes regionales | ✅ |
| 10 | `09_DIAGRAMAS.md` | Diagramas ASCII | ✅ |
| 11 | `10_PROBLEMAS_CONOCIDOS.md` | Problemas y casos pendientes | ✅ |

---

## Contenido Detallado por Archivo

### 1. `00_INDICE.md`

- Orden de lectura recomendado (3 rutas: rapida / operativa / profunda)
- Glosario de terminos (localeId, geoResult, hydrate, stale, etc.)
- Mapa conceptual ASCII de como se relacionan los modulos
- Referencia rapida a archivos fuente

### 2. `01_VISION_GENERAL.md`

- Que problema resuelve: mostrar traducciones regionales segun ubicacion, desde el primer render, incluso offline
- Por que i18next: ecosistema maduro, namespaces, fallback chain, reactivo
- Por que geo-deteccion pre-auth: login/register en idioma regional desde el inicio
- Por que es-LA embebido en bundle: unico locale disponible sin red
- Por que el resto se carga bajo demanda: evitar 66 JSONs en bundle
- Por que sin http-backend: race conditions con addResourceBundle manual
- Por que segmentacion por userId: tablets compartidas

### 3. `02_MODELO_DE_DOMINIO.md`

- `LocaleId`: union type de 7 variantes
- `GeoResult`: union discriminada con success/false y reason explicita (5 razones)
- `CacheableLocale`: interfaz con id, userId, localeId, data, version, cachedAt
- `LocaleInfo`: metadatos para UI (label, flag, country)
- `LocaleNamespace`: las 11 categorias de traduccion
- Diagrama de relaciones entre tipos

### 4. `03_INFRAESTRUCTURA.md`

- `i18n.ts`: inicializacion, import de 11 JSONs de es-LA, configuracion sin backend
- `geo-detection.service.ts`: llamada a ipapi.co, AbortSignal externo, 5 razones de fallo, LOCALE_MAP
- `locale-persistence.ts`: todas las funciones CRUD explicadas
- `db.ts`: schema Dexie v1 a v3, tabla preferences con indices, tabla localeCache eliminada en v3
- Diagrama de relacion entre estos archivos

### 5. `04_STORE_Y_HOOKS.md`

Cada accion del store con tabla de: firma, proposito, flujo interno paso a paso, impacto en persistencia:

| Accion | Proposito | Flujo interno |
|--------|-----------|---------------|
| `hydrateFromStorage(userId)` | Cargar locale desde Dexie pre-auth | getUserCachedLocale, isLocaleStale, addResourceBundle por namespace, changeLanguage, retornar boolean |
| `detectPreAuthLocale(timeoutMs)` | Geo-deteccion pre-auth sin userId | AbortController -> detectLocaleFromGeo -> resolveLocale -> fetch /locales/ -> addResourceBundle -> set flags |
| `resolveAndCacheLocale(userId)` | Orquestacion post-auth completa | Cache? -> stale? -> geo pre-resuelto? -> fetch -> saveCachedLocale -> addResourceBundle -> changeLanguage |
| `setUserPreference(locale, userId)` | Cambio manual de idioma | saveCachedLocale, changeLanguage |
| `resetLocale()` | Limpiar estado | Reset a es-LA, limpiar flags |

Ademas: `useLanguage()`, `useLocale()`, `locale-utils.ts`

### 6. `05_LOCALE_INITIALIZER.md`

- Estructura: 2 useEffect, 1 useRef, 1 useState
- Fase 1: `checkIfSessionExists()` + `hydrateFromStorage(userId)`
- Fase 2: `detectPreAuthLocale(800)` con semi-blocking via `AmautaLoadingState`
- Fase 3: post-auth con `resolveAndCacheLocale(userId)` y `getAuthUserId()`
- Integracion en `main.tsx`: LocaleInitializer antes que AuthInitializer
- Refactor Opcion A: reemplazo de `getLastActiveUserId` por `checkIfSessionExists`

### 7. `06_FLUJO_PREAUTH.md`

- AbortController con timeout default 800ms
- detectLocaleFromGeo(signal): success -> LOCALE_MAP, fail -> resolveLocale con fallback
- fetch /locales/{locale}/translation.json si locale != es-LA
- addResourceBundle por namespace, changeLanguage, set flags
- Por que timeout agresivo (800ms): UX, la app debe mostrarse rapido
- Por que no persiste en Dexie: no hay userId
- Memorizacion: preAuthLocaleData evita re-descarga post-auth

### 8. `07_PERSISTENCIA_DEXIE.md`

- Clave compuesta `${userId}:${localeId}` en db.preferences
- UserPreferencesEntry vs LocaleCacheEntry
- LOCALE_VERSIONS: versionado granular por variante
- isLocaleStale(): compara cached.version contra LOCALE_VERSIONS[cached.localeId]
- Ciclo de vida: creacion (post-auth) -> lectura (pre/post-auth) -> invalidacion (version change) -> limpieza (logout)
- Problema conocido: getUserCachedLocale usa .first() sin orden

### 9. `08_VARIANTES_REGIONALES.md`

- Ubicacion: public/locales/{locale}/translation.json
- Carga via SW: CacheFirst en static-resources-v1
- Estrategias: completa (en-US, 11 namespaces) vs diferencial (solo keys que cambian)
- LOCALE_MAP: mapeo codigo pais ISO a LocaleId
- Tabla de contenido real de cada archivo de traduccion

### 10. `09_DIAGRAMAS.md`

10 diagramas ASCII:
1. Flujo de inicio completo
2. Flujo pre-auth (cache vs geo)
3. Flujo post-auth (cache, stale, geo pre-resuelto)
4. Flujo offline (con y sin cache)
5. Flujo sesion recurrente
6. Flujo logout y re-ingreso
7. Diagrama de relacion entre archivos (imports)
8. Diagrama de capas (domain -> infra -> store -> hooks -> components)
9. Ciclo de vida del cache en Dexie
10. Arbol de archivos completo

### 11. `10_PROBLEMAS_CONOCIDOS.md`

| # | Problema | Impacto | Solucion propuesta |
|---|----------|---------|-------------------|
| 1 | `getUserCachedLocale` usa `.first()` sin orden | Usuario con multiples entries puede recibir locale incorrecto | Agregar `.orderBy("cachedAt").reverse().first()` |
| 2 | `es-LA` guarda `data: {}` en Dexie | Cache de es-LA no util como traduccion (intencional, ya embebido) | No requiere solucion |
| 3 | Variantes diferenciales solo tienen auth.login en cache | Si es-LA dejara de estar embebido, no funcionarian offline | Expandir variantes con mas namespaces en futuras fases |
| 4 | Sin cache pre-auth cuando no hay sesion activa | Usuario que cerro sesion y no tiene internet ve login en es-LA | Guardar lastLocale independiente de userId en preferences |
| 5 | `detectPreAuthLocale` no reintenta geo si falla | Usuario nuevo sin internet ve es-LA aunque este en MX | Aceptado. Se reintenta en post-auth si geoAlreadyRan=false |
| 6 | Geo usa ipapi.co (servicio externo gratuito) | Rate limiting (429), posible deprecacion, sin SLA | Tener fallback a navigator.language siempre |

Casos de uso pendientes:
- LanguageSwitcher UI (Fase 11)
- Sincronizacion de preferencia de locale entre dispositivos
- Deteccion de cambio de pais en sesion activa
- Tests automatizados (Fase 10)

---

## Total esfuerzo estimado: ~5 horas (✅ completado)

## Resumen de Archivos Creados

| Archivo | Tamano | Secciones principales |
|---------|--------|----------------------|
| `00_INDICE.md` | ~9 KB | 3 rutas de lectura, glosario (14 terminos), mapa conceptual ASCII, referencia de 22 archivos fuente |
| `01_VISION_GENERAL.md` | ~10 KB | Problema, solucion, 7 decisiones de arquitectura justificadas, relacion con otros componentes, flujo de alto nivel |
| `02_MODELO_DE_DOMINIO.md` | ~10 KB | 5 tipos explicados (LocaleId, GeoResult, CacheableLocale, LocaleInfo, LocaleNamespace), 3 constantes, config, diagrama de relaciones |
| `03_INFRAESTRUCTURA.md` | ~12 KB | 4 modulos: i18n.ts (init), geo-detection (5 razones de fallo), persistence (9 funciones), db.ts (v1→v2→v3), diagrama de imports |
| `04_STORE_Y_HOOKS.md` | ~14 KB | 5 acciones del store con tabla firma-proposito-flujo, 2 hooks, 3 utilidades, diagrama de flujo del store |
| `05_LOCALE_INITIALIZER.md` | ~9 KB | 3 fases detalladas, semi-blocking, uso de useRef, integracion main.tsx, refactor Opcion A, comparacion Antes vs Despues |
| `06_FLUJO_PREAUTH.md` | ~9 KB | Flujo paso a paso, tabla de tiempos de respuesta, 4 casos por tipo de conexion, 9 reglas de negocio |
| `07_PERSISTENCIA_DEXIE.md` | ~9 KB | 2 tipos de entrada, indices Dexie, ciclo de vida (creacion/lectura/invalidacion/limpieza), tabla de operaciones, diagrama de ciclo |
| `08_VARIANTES_REGIONALES.md` | ~7 KB | 6 archivos de traduccion, 2 estrategias (completa/diferencial), tabla por variante, LOCALE_MAP, SW caching, flujo de carga |
| `09_DIAGRAMAS.md` | ~14 KB | 10 diagramas ASCII (inicio, pre-auth, post-auth, offline, sesion recurrente, logout, imports, capas, cache lifecycle, arbol completo) |
| `10_PROBLEMAS_CONOCIDOS.md` | ~8 KB | 6 problemas detectados con impacto y solucion, 4 casos de uso pendientes, 8 tests necesarios, tabla de prioridades |
