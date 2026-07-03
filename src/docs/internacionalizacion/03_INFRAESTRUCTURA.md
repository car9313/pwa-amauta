# Infraestructura — Fase 1

> **Proposito**: Describir los 4 modulos de infraestructura que soportan el sistema de i18n: inicializacion de i18next, deteccion geografica, persistencia en Dexie, y esquema de base de datos.
> **Archivos**: `i18n.ts`, `geo-detection.service.ts`, `locale-persistence.ts`, `db.ts`
> **Dependencias**: Fase 0 (tipos, constantes, config)

---

## 1. i18n.ts — Inicializacion de i18next

**Ruta**: `src/features/locale/infrastructure/i18n.ts`
**Proposito**: Inicializar i18next con `es-LA` embebido y configurar react-i18next.

### Que hace

1. Importa los 11 archivos JSON de `es-LA` desde `./resources/es-LA/`
2. Los organiza en un objeto `esLAResources` con los namespaces como keys
3. Inicializa i18next con:
   - `lng: "es-LA"` — idioma inicial
   - `fallbackLng: "es-LA"` — si falta una clave, buscar aqui
   - `resources: { "es-LA": esLAResources }` — solo es-LA embebido
   - `ns: [...]` — los 11 namespaces
   - `interpolation: { escapeValue: false }` — React ya escapa HTML

```typescript
const esLAResources = {
  common: esLACommon,
  auth: esLAAuth,
  navigation: esLANavigation,
  dashboard: esLADashboard,
  lessons: esLALessons,
  exercises: esLAExercises,
  games: esLAGames,
  practice: esLAPractice,
  progress: esLAProgress,
  role: esLARole,
  errors: esLAErrors,
};

i18next.use(initReactI18next).init({
  lng: DEFAULT_LOCALE,
  fallbackLng: DEFAULT_LOCALE,
  resources: { [DEFAULT_LOCALE]: esLAResources },
  interpolation: { escapeValue: false },
  ns: Object.keys(esLAResources),
  defaultNS: "common",
  returnObjects: true,
});
```

### Por que es importante

- **es-LA siempre disponible**: Al estar importado estaticamente, se compila dentro del bundle. No necesita descarga, no necesita internet.
- **Sin http-backend**: Las variantes regionales se cargan manualmente via `addResourceBundle`. Esto evita race conditions.
- **initPromise**: Se dispara `void initPromise` al importar el modulo. El import en `main.tsx` (`import "./features/locale/infrastructure/i18n"`) garantiza que i18next este listo antes de que cualquier componente monte.

### Lo que NO hace

- No carga variantes regionales (eso lo hace `LocaleInitializer` via el store)
- No configura backend HTTP
- No exporta la configuracion de i18next (solo la instancia default)

---

## 2. geo-detection.service.ts — Deteccion Geografica

**Ruta**: `src/features/locale/infrastructure/geo-detection.service.ts`
**Proposito**: Determinar el pais del usuario via ipapi.co y mapearlo a un `LocaleId`.

### Funcion principal

```typescript
export async function detectLocaleFromGeo(
  externalSignal?: AbortSignal,
): Promise<GeoResult>
```

### Como funciona

1. **Timeout interno**: Crea un `AbortController` con timeout de 5 segundos (`IPAPI_TIMEOUT_MS`)
2. **Señal combinada**: Si recibe una `externalSignal`, la combina con la interna usando `AbortSignal.any()` (si esta disponible). Esto permite que el store cancele la peticion desde afuera.
3. **Fetch a ipapi.co**: `GET https://ipapi.co/json/` con la señal combinada
4. **Manejo de respuesta**:

| Respuesta | Accion |
|-----------|--------|
| HTTP 429 | `{ success: false, reason: "rate_limited" }` |
| HTTP no-OK | `{ success: false, reason: "network_error" }` |
| JSON invalido | `{ success: false, reason: "parse_error" }` |
| Sin country_code | `{ success: false, reason: "parse_error" }` |
| Pais no mapeado | `{ success: false, reason: "unmapped_country" }` |
| AbortError | `{ success: false, reason: "timeout" }` |
| Error de red | `{ success: false, reason: "network_error" }` |
| Exito | `{ success: true, localeId: LOCALE_MAP[countryCode] }` |

### La funcion NO hace fallback

A diferencia de la version anterior, `detectLocaleFromGeo` no aplica ningun fallback. Simplemente retorna un `GeoResult`. El llamador (el store) es quien decide que hacer con cada tipo de fallo. Esto mantiene la responsabilidad unica en el servicio.

### Uso en el store

```typescript
// En detectPreAuthLocale (pre-auth)
const controller = new AbortController();
const timer = setTimeout(() => controller.abort(), 800);
const geoResult = await detectLocaleFromGeo(controller.signal);
clearTimeout(timer);

// En resolveAndCacheLocale (post-auth)
const geoResult = await detectLocaleFromGeo();
```

La diferencia: en pre-auth se pasa una señal externa con timeout de 800ms; en post-auth se usa solo el timeout interno de 5s.

---

## 3. locale-persistence.ts — Persistencia en Dexie

**Ruta**: `src/features/locale/infrastructure/locale-persistence.ts`
**Proposito**: CRUD de traducciones en Dexie con segmentacion por usuario y versionado.

### Funciones

#### buildKey

```typescript
function buildKey(userId: string, localeId: LocaleId): string {
  return `${userId}:${localeId}`;
}
```

Clave compuesta que garantiza aislamiento entre usuarios. Ejemplo: `"stu_001:es-MX"`, `"parent_002:es-AR"`.

#### saveCachedLocale

```typescript
export async function saveCachedLocale(
  userId: string,
  localeId: LocaleId,
  data: Record<string, unknown>,
): Promise<void>
```

Guarda un bloque de traducciones en Dexie. Crea una entrada `LocaleCacheEntry` con:
- `id`: `${userId}:${localeId}`
- `userId`, `localeId`, `data`, `version` (de `LOCALE_VERSIONS[localeId]`), `cachedAt`

#### getCachedLocale

```typescript
export async function getCachedLocale(
  userId: string,
  localeId: LocaleId,
): Promise<CacheableLocale | null>
```

Busca una entrada especifica por userId + localeId. Usa `buildKey` para la clave exacta.

#### getUserCachedLocale

```typescript
export async function getUserCachedLocale(
  userId: string,
): Promise<CacheableLocale | null>
```

**Busca cualquier entrada de locale para este usuario**, sin importar el localeId. Usa `db.preferences.where("userId").equals(userId).first()`.

**Problema conocido**: Usa `.first()` sin orden. Si hay multiples entries para el mismo userId (ej: mismo usuario con diferentes locales), puede devolver cualquiera. Ver `10_PROBLEMAS_CONOCIDOS.md`.

#### isLocaleStale

```typescript
export function isLocaleStale(cached: CacheableLocale): boolean {
  return cached.version !== LOCALE_VERSIONS[cached.localeId];
}
```

Compara la version guardada contra la version actual definida en `LOCALE_VERSIONS`. Si son diferentes, el cache esta obsoleto y debe re-descargarse.

#### saveLocalePreference / getLocalePreference / clearLocalePreference

Gestionan la preferencia de locale global del usuario (no las traducciones en si, solo el locale elegido). Usan la entrada `"user-preferences"` en Dexie.

```typescript
export async function saveLocalePreference(
  userId: string,
  localeId: LocaleId,
): Promise<void>
```

#### clearAllUserCachedLocales

```typescript
export async function clearAllUserCachedLocales(userId: string): Promise<void>
```

Elimina **todas** las entries de locale para un usuario. Se usa en logout completo para limpiar el cache.

### Funciones eliminadas

Con el refactor Opcion A, se eliminaron:
- `setLastActiveUserId(userId)` — ya no se necesita puntero externo
- `getLastActiveUserId()` — se reemplazo por `checkIfSessionExists()`
- Tipo `LastActiveUserEntry` y su validador `isLastActiveUserEntry`

---

## 4. db.ts — Schema Dexie

**Ruta**: `src/lib/api/storage/db.ts`
**Proposito**: Definir el esquema de IndexedDB para toda la aplicacion.

### Tabla preferences (la que usa i18n)

```typescript
export interface UserPreferencesEntry {
  id: "user-preferences";       // Clave fija
  selectedStudentId: string | null;
  locale: string | null;
  updatedAt: number;
}

export interface LocaleCacheEntry {
  id: string;                    // "${userId}:${localeId}"
  userId: string;
  localeId: string;
  data: unknown;
  version: string;
  cachedAt: number;
}

export type PreferencesEntry = UserPreferencesEntry | LocaleCacheEntry;
```

### Evolucion del schema

#### v1 (version original)
```typescript
db.version(1).stores({
  preferences: "id",  // Solo indice por id
});
```

#### v2 (se agrega localeCache como tabla separada)
```typescript
db.version(2).stores({
  preferences: "id",
  localeCache: "id",  // Tabla separada para cache de locale
});
```

#### v3 (actual, unificada en preferences)
```typescript
db.version(3).stores({
  preferences: "id, userId, localeId, cachedAt",  // Indices para busqueda por userId
  // localeCache eliminada — todo va a preferences
}).upgrade(tx => {
  return tx.table("preferences").delete("user-preferences");
});
```

### Por que se unifico en v3

En v2, `localeCache` y `preferences` eran tablas separadas, pero ambas almacenaban datos de configuracion del usuario. Al unificarlas en `preferences`:
- Un solo punto de acceso para toda la configuracion del usuario
- Indices compartidos: `id, userId, localeId, cachedAt`
- `userId` como indice permite buscar todas las entradas de un usuario eficientemente
- El upgrade elimina la entrada `"user-preferences"` legacy que podria quedar de migraciones anteriores

### Indices disponibles en preferences v3

| Indice | Uso |
|--------|-----|
| `id` | Clave primaria. Acceso directo por `${userId}:${localeId}` |
| `userId` | Busqueda de todas las entries de un usuario (`getUserCachedLocale`) |
| `localeId` | (No usado actualmente, preparado para busquedas futuras) |
| `cachedAt` | (No usado actualmente, preparado para ordenamiento) |

---

## Diagrama de Relacion entre Archivos de Infraestructura

```
main.tsx
    │
    ├── importa ─────────► i18n.ts ─────────────► resources/es-LA/*.json
    │                           │                      (11 archivos estaticos)
    │                           │
    │                           └── i18next.init() con es-LA embebido
    │
    └── renderiza ───────► LocaleInitializer.tsx
                                │
                                ├── usa ──────────► locale-store.ts
                                │                       │
                                │                       ├── usa ────► geo-detection.service.ts ───► ipapi.co
                                │                       │                        │
                                │                       │                        └── usa ────► LOCALE_MAP (locale.config.ts)
                                │                       │
                                │                       ├── usa ────► locale-persistence.ts
                                │                       │                        │
                                │                       │                        └── usa ────► db.ts (Dexie schema)
                                │                       │
                                │                       └── usa ────► i18next.changeLanguage()
                                │
                                └── usa ──────────► auth-storage.ts (checkIfSessionExists)
```

---

## Historial de Cambios

| Version | Fecha | Cambio |
|---------|-------|--------|
| 1.0.0 | 03 Jul 2026 | Creacion inicial |

## Archivos Relacionados

| Archivo | Ruta |
|---------|------|
| Inicializacion i18next | `src/features/locale/infrastructure/i18n.ts` |
| Geo-detection | `src/features/locale/infrastructure/geo-detection.service.ts` |
| Persistencia Dexie | `src/features/locale/infrastructure/locale-persistence.ts` |
| Schema Dexie | `src/lib/api/storage/db.ts` |
| Recursos es-LA (11 archivos) | `src/features/locale/infrastructure/resources/es-LA/` |
