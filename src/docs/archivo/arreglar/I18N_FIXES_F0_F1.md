# Fixes Fase 0 y Fase 1 — i18n Amauta

> **Propósito**: Corregir los problemas encontrados en la implementación inicial de las Fases 0 y 1 antes de continuar con las fases siguientes.
> **Documento relacionado**: `I18N_PLAN_v2.md`
> **Estado**: 🔴 Pendiente de aplicar — NO continuar a Fase 2 hasta completar estos fixes.

---

## Resumen de Fixes

| Fix | Archivo | Problema | Prioridad |
|-----|---------|----------|-----------|
| Fix 1 | `locale.constants.ts` | `LOCALE_VERSION` global → `LOCALE_VERSIONS` por locale | 🔴 Crítico |
| Fix 2 | `locale.types.ts` | `CacheableLocale` sin campo `userId` | 🔴 Crítico |
| Fix 3 | `i18n.ts` | `i18next-http-backend` activo genera race conditions | 🔴 Crítico |
| Fix 4 | `locale-persistence.ts` | CRUD sin segmentación por `userId` | 🔴 Crítico |
| Fix 5 | `geo-detection.service.ts` | No maneja 429 ni retorna `GeoResult` tipado | 🟠 Importante |

---

## Fix 1 — `locale.constants.ts`: Versionado por locale

### Problema

`LOCALE_VERSION` es una constante global. Si se actualiza, **todos** los usuarios en todas las variantes invalidan su cache al mismo tiempo, aunque solo haya cambiado `es-MX`.

### Antes (problemático)

```ts
// locale.constants.ts
export const LOCALE_VERSION = '1.0.0'
export const DEFAULT_LOCALE: LocaleId = 'es-LA'
export const IPAPI_TIMEOUT_MS = 5000
```

### Después (correcto)

```ts
// locale.constants.ts
import type { LocaleId } from './locale.types'

export const DEFAULT_LOCALE: LocaleId = 'es-LA'
export const IPAPI_TIMEOUT_MS = 5000

// Cada locale tiene su propia versión independiente.
// Al actualizar es-MX, solo los usuarios de es-MX re-descargan.
export const LOCALE_VERSIONS: Record<LocaleId, string> = {
  'es-LA': '1.0.0',
  'es-MX': '1.0.0',
  'es-AR': '1.0.0',
  'es-CL': '1.0.0',
  'es-CO': '1.0.0',
  'es-PE': '1.0.0',
}
```

### Cómo usar en código

```ts
// Donde antes comparabas:
if (cached.version !== LOCALE_VERSION) { ... }

// Ahora:
if (cached.version !== LOCALE_VERSIONS[cached.localeId]) { ... }
```

---

## Fix 2 — `locale.types.ts`: `CacheableLocale` con `userId`

### Problema

`CacheableLocale` no incluye `userId`. Sin este campo, no es posible segmentar el cache por usuario en Dexie, y múltiples usuarios en el mismo dispositivo comparten el mismo locale cacheado.

### Antes (problemático)

```ts
// locale.types.ts
export interface CacheableLocale {
  id: LocaleId
  data: Record<string, unknown>
  version: string
  cachedAt: number
}
```

### Después (correcto)

```ts
// locale.types.ts

export type LocaleId = 'es-LA' | 'es-MX' | 'es-AR' | 'es-CL' | 'es-CO' | 'es-PE'

export interface LocaleInfo {
  id: LocaleId
  label: string       // "Español (México)"
  region: string      // "MX"
  flag?: string       // opcional, para UI
}

// GeoResult: contrato tipado del servicio de geo-detección.
// Cualquier fallo debe retornar success: false con reason explícita.
export type GeoResult =
  | { success: true; localeId: LocaleId }
  | {
      success: false
      reason: 'timeout' | 'rate_limited' | 'network_error' | 'unmapped_country' | 'parse_error'
    }

// CacheableLocale: incluye userId para segmentación por usuario.
// La clave primaria en Dexie es `${userId}:${localeId}`.
export interface CacheableLocale {
  id: string          // clave compuesta: `${userId}:${localeId}`
  userId: string      // ID del usuario autenticado
  localeId: LocaleId  // la variante regional
  data: Record<string, unknown>
  version: string     // debe coincidir con LOCALE_VERSIONS[localeId]
  cachedAt: number    // Date.now() al momento de cachear
}
```

---

## Fix 3 — `i18n.ts`: Eliminar `i18next-http-backend`

### Problema

`i18next-http-backend` hace fetches HTTP automáticos cuando el idioma activo cambia. Combinado con la carga manual vía `addResourceBundle` desde Dexie en `LocaleInitializer`, produce race conditions: ambos mecanismos intentan cargar el mismo locale y el que llega segundo pisa al primero.

### Antes (problemático)

```ts
// i18n.ts
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import HttpBackend from 'i18next-http-backend'  // ← el problema

// Importar JSONs de es-LA
import esLACommon from './resources/es-LA/common.json'
import esLAAuth from './resources/es-LA/auth.json'
// ... resto de imports

i18n
  .use(HttpBackend)           // ← activa fetches automáticos
  .use(initReactI18next)
  .init({
    lng: 'es-LA',
    fallbackLng: 'es-LA',
    resources: {
      'es-LA': {
        common: esLACommon,
        auth: esLAAuth,
        // ...
      }
    },
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    // ...
  })
```

### Después (correcto)

```ts
// i18n.ts
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
// Sin HttpBackend — eliminado completamente

// Importar JSONs de es-LA (embebidos en el bundle)
import esLACommon from './resources/es-LA/common.json'
import esLAAuth from './resources/es-LA/auth.json'
import esLANavigation from './resources/es-LA/navigation.json'
import esLAErrors from './resources/es-LA/errors.json'
import esLARole from './resources/es-LA/role.json'
import esLADashboard from './resources/es-LA/dashboard.json'
import esLALessons from './resources/es-LA/lessons.json'
import esLAExercises from './resources/es-LA/exercises.json'
import esLAGames from './resources/es-LA/games.json'
import esLAPractice from './resources/es-LA/practice.json'
import esLAProgress from './resources/es-LA/progress.json'

import { DEFAULT_LOCALE } from '../domain/locale.constants'

i18n
  .use(initReactI18next)   // sin HttpBackend
  .init({
    lng: DEFAULT_LOCALE,
    fallbackLng: DEFAULT_LOCALE,
    resources: {
      'es-LA': {
        common: esLACommon,
        auth: esLAAuth,
        navigation: esLANavigation,
        errors: esLAErrors,
        role: esLARole,
        dashboard: esLADashboard,
        lessons: esLALessons,
        exercises: esLAExercises,
        games: esLAGames,
        practice: esLAPractice,
        progress: esLAProgress,
      }
    },
    // Las variantes regionales se cargan manualmente desde LocaleInitializer
    // usando i18n.addResourceBundle() — nunca por este mecanismo.
    interpolation: {
      escapeValue: false  // React ya escapa
    },
    ns: ['common', 'auth', 'navigation', 'errors', 'role', 'dashboard', 'lessons', 'exercises', 'games', 'practice', 'progress'],
    defaultNS: 'common',
  })

export default i18n
```

### Desinstalar el paquete

```bash
npm uninstall i18next-http-backend
```

Verificar que no queda en `package.json` ni importado en ningún archivo.

---

## Fix 4 — `locale-persistence.ts`: Segmentación por `userId`

### Problema

El CRUD actual usa `LocaleId` como clave primaria. Dos usuarios en el mismo dispositivo comparten la misma entrada en Dexie. El locale del usuario anterior persiste cuando inicia sesión uno nuevo.

### Antes (problemático)

```ts
// locale-persistence.ts
export async function saveLocale(locale: CacheableLocale): Promise<void> {
  await db.preferences.put({ id: locale.id, ...locale })  // id = 'es-MX'
}

export async function getLocale(localeId: LocaleId): Promise<CacheableLocale | null> {
  return await db.preferences.get(localeId) ?? null
}

export async function clearLocale(localeId: LocaleId): Promise<void> {
  await db.preferences.delete(localeId)
}
```

### Después (correcto)

```ts
// locale-persistence.ts
import type { LocaleId, CacheableLocale } from '../domain/locale.types'
import { LOCALE_VERSIONS } from '../domain/locale.constants'
import { db } from '@/lib/api/storage/db'

// Clave compuesta: cada usuario tiene su propio cache por locale
function buildKey(userId: string, localeId: LocaleId): string {
  return `${userId}:${localeId}`
}

export async function saveLocale(
  userId: string,
  localeId: LocaleId,
  data: Record<string, unknown>
): Promise<void> {
  const entry: CacheableLocale = {
    id: buildKey(userId, localeId),
    userId,
    localeId,
    data,
    version: LOCALE_VERSIONS[localeId],
    cachedAt: Date.now(),
  }
  await db.preferences.put(entry)
}

export async function getLocale(
  userId: string,
  localeId: LocaleId
): Promise<CacheableLocale | null> {
  const key = buildKey(userId, localeId)
  return (await db.preferences.get(key)) ?? null
}

// Obtener cualquier locale cacheado para este usuario
// (útil cuando no sabes qué locale tiene cacheado)
export async function getUserLocale(
  userId: string
): Promise<CacheableLocale | null> {
  return (await db.preferences
    .where('userId')
    .equals(userId)
    .first()) ?? null
}

export async function clearLocale(
  userId: string,
  localeId: LocaleId
): Promise<void> {
  await db.preferences.delete(buildKey(userId, localeId))
}

// Limpia todos los locales de un usuario específico
// Úsalo solo si necesitas forzar re-detección para ese usuario
export async function clearAllUserLocales(userId: string): Promise<void> {
  await db.preferences.where('userId').equals(userId).delete()
}

export function isLocaleStale(cached: CacheableLocale): boolean {
  return cached.version !== LOCALE_VERSIONS[cached.localeId]
}
```

### Actualizar schema de Dexie (`db.ts`)

El campo `userId` debe estar indexado para que `getUserLocale` sea eficiente:

```ts
// db.ts — en la definición del schema
this.version(2).stores({
  // ... otras tablas existentes
  preferences: 'id, userId, localeId, cachedAt'
  //                  ^^^^ índice necesario para where('userId')
})
```

---

## Fix 5 — `geo-detection.service.ts`: Manejo robusto de errores

### Problema

El servicio actual probablemente solo maneja el timeout. No retorna un tipo discriminado, lo que obliga al llamador a inferir si la detección fue exitosa. El caso 429 no está cubierto explícitamente.

### Antes (problemático — patrón típico)

```ts
// geo-detection.service.ts
export async function detectLocale(): Promise<LocaleId> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), IPAPI_TIMEOUT_MS)
    const res = await fetch('https://ipapi.co/json/', { signal: controller.signal })
    clearTimeout(timeout)
    const data = await res.json()
    return countryToLocaleMap[data.country_code] ?? DEFAULT_LOCALE
  } catch {
    return DEFAULT_LOCALE  // fallback silencioso, no distingue razones
  }
}
```

### Después (correcto)

```ts
// geo-detection.service.ts
import type { GeoResult, LocaleId } from '../domain/locale.types'
import { DEFAULT_LOCALE, IPAPI_TIMEOUT_MS } from '../domain/locale.constants'
import { SUPPORTED_LOCALES } from '../domain/locale.config'

// Mapa de código de país ISO 3166-1 → LocaleId
const COUNTRY_TO_LOCALE: Record<string, LocaleId> = {
  MX: 'es-MX',
  AR: 'es-AR',
  CL: 'es-CL',
  CO: 'es-CO',
  PE: 'es-PE',
  // Países que usan es-LA como fallback regional:
  BO: 'es-LA', VE: 'es-LA', EC: 'es-LA', PY: 'es-LA',
  UY: 'es-LA', CR: 'es-LA', GT: 'es-LA', HN: 'es-LA',
  SV: 'es-LA', NI: 'es-LA', PA: 'es-LA', DO: 'es-LA',
  CU: 'es-LA', PR: 'es-LA',
}

export async function detectLocaleFromGeo(): Promise<GeoResult> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), IPAPI_TIMEOUT_MS)

  try {
    const response = await fetch('https://ipapi.co/json/', {
      signal: controller.signal,
    })
    clearTimeout(timer)

    // Rate limit explícito — no tratar igual que un error de red
    if (response.status === 429) {
      return { success: false, reason: 'rate_limited' }
    }

    if (!response.ok) {
      return { success: false, reason: 'network_error' }
    }

    let data: unknown
    try {
      data = await response.json()
    } catch {
      return { success: false, reason: 'parse_error' }
    }

    const countryCode = (data as Record<string, unknown>)?.country_code
    if (typeof countryCode !== 'string') {
      return { success: false, reason: 'parse_error' }
    }

    const localeId = COUNTRY_TO_LOCALE[countryCode]
    if (!localeId) {
      return { success: false, reason: 'unmapped_country' }
    }

    return { success: true, localeId }

  } catch (error) {
    clearTimeout(timer)
    // AbortController dispara DOMException con name 'AbortError'
    if (error instanceof DOMException && error.name === 'AbortError') {
      return { success: false, reason: 'timeout' }
    }
    return { success: false, reason: 'network_error' }
  }
}
```

### Uso correcto en `locale-store.ts` (Fase 2)

```ts
// En resolveAndCacheLocale — el fallback está garantizado para CUALQUIER fallo
const geoResult = await detectLocaleFromGeo()

const resolvedLocale: LocaleId = geoResult.success
  ? geoResult.localeId
  : getLocaleFromNavigator() ?? DEFAULT_LOCALE
//  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
//  Este fallback se ejecuta para timeout, 429, network_error,
//  unmapped_country y parse_error. Nunca queda sin locale.
```

---

## Checklist de Verificación

Antes de marcar las Fases 0 y 1 como `✅` y continuar a Fase 2:

```
□ Fix 1: locale.constants.ts exporta LOCALE_VERSIONS (Record<LocaleId, string>)
         y NO exporta LOCALE_VERSION (string global)

□ Fix 2: CacheableLocale tiene campos { id: string, userId: string, localeId: LocaleId, ... }
         GeoResult es un union type discriminado con campo 'reason'

□ Fix 3: i18n.ts NO importa i18next-http-backend
         El paquete NO está en package.json
         i18n.init() usa solo 'resources' embebidos, sin campo 'backend'

□ Fix 4: locale-persistence.ts usa buildKey(userId, localeId) como clave primaria
         saveLocale recibe (userId, localeId, data) — no CacheableLocale directamente
         getUserLocale(userId) busca por índice userId en Dexie
         db.ts tiene 'userId' como índice en la tabla preferences

□ Fix 5: detectLocaleFromGeo() retorna Promise<GeoResult>
         El caso 429 retorna { success: false, reason: 'rate_limited' }
         El timeout retorna { success: false, reason: 'timeout' }
         No hay ningún return con LocaleId directo — siempre GeoResult

□ TypeScript compila sin errores tras los cambios
□ No hay imports rotos entre los archivos modificados
```
