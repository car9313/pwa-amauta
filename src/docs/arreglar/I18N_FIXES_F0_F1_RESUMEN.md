# Resumen de Cambios — i18n Fase 0 y Fase 1

> **Fecha**: 2026-06-27
> **Documento origen**: `I18N_FIXES_F0_F1.md`
> **Toolchain**: `tsc -b && vite build` ✅ | `pnpm lint` ✅

---

## Estado: ✅ Fase 0 y Fase 1 completadas

---

## Fix 1 — `locale.constants.ts`: Versionado por locale

**Archivo**: `src/features/locale/domain/locale.constants.ts`

### Cambios
| Antes | Después |
|-------|---------|
| `LOCALE_VERSION = 1` (global, `number`) | Eliminado |
| — | `LOCALE_VERSIONS: Record<LocaleId, string>` con versión individual por locale |

Cada locale tiene su propia versión: al actualizar `es-MX`, solo los usuarios de `es-MX` re-descargan.

---

## Fix 2 — `locale.types.ts`: `CacheableLocale` con `userId` + `GeoResult` discriminado

**Archivo**: `src/features/locale/domain/locale.types.ts`

### Cambios en `CacheableLocale`
| Campo | Antes | Después |
|-------|-------|---------|
| `id` | `LocaleId` (`"es-MX"`) | `string` (clave compuesta `"${userId}:${localeId}"`) |
| `userId` | — | `string` (nuevo) |
| `localeId` | — | `LocaleId` (nuevo) |
| `version` | `number` | `string` (consistente con `LOCALE_VERSIONS`) |
| `cachedAt` | `string` (ISO) | `number` (`Date.now()`) |

### Cambios en `GeoResult`
| Antes | Después |
|-------|---------|
| `{ locale, countryCode, region }` (siempre éxito) | `{ success: true, localeId } \| { success: false, reason }` |

`reason` puede ser: `timeout`, `rate_limited`, `network_error`, `unmapped_country`, `parse_error`.

---

## Fix 3 — `i18n.ts`: Eliminar `i18next-http-backend`

**Archivo**: `src/features/locale/infrastructure/i18n.ts`
**Paquete eliminado**: `i18next-http-backend@^4.0.0` (`pnpm remove`)

### Cambios
- Eliminado `import HttpBackend from "i18next-http-backend"`
- Eliminado `i18next.use(HttpBackend)` de la cadena de init
- Eliminado `export { LOCALE_VERSION }` (migrado a Fix 1)
- Eliminado el campo `backend` del objeto de configuración de i18n
- Recursos se cargan exclusivamente vía `resources` embebidos + `addResourceBundle` manual desde `LocaleInitializer` (Fase 2)

**Razón**: `HttpBackend` + carga manual desde Dexie producían race conditions al cargar variantes regionales.

---

## Fix 4 — `locale-persistence.ts`: Segmentación por `userId`

**Archivo**: `src/features/locale/infrastructure/locale-persistence.ts`

### Cambios estructurales
| Aspecto | Antes | Después |
|---------|-------|---------|
| Tabla Dexie | `localeCache` + `preferences` (separadas) | Solo `preferences` (unificada) |
| Clave de cache | `"locale-cache-{localeId}"` | `"${userId}:${localeId}"` |
| `saveCachedLocale` | `(locale: CacheableLocale)` | `(userId, localeId, data)` |
| `getCachedLocale` | `(localeId: LocaleId)` | `(userId, localeId)` |
| Segmentación usuario | ❌ No | ✅ Sí |
| `getUserCachedLocale` | — | Nueva: busca por `userId` en Dexie |
| `clearAllUserCachedLocales` | — | Nueva: limpia todos los locales de un usuario |
| `isLocaleStale` | — | Nueva: compara versión contra `LOCALE_VERSIONS` |

### Funciones renombradas
- `saveLocalePreference` — ahora recibe `(userId, localeId)` en lugar de solo `locale`

---

## Fix 5 — `geo-detection.service.ts`: Manejo robusto de errores

**Archivo**: `src/features/locale/infrastructure/geo-detection.service.ts`

### Cambios
| Aspecto | Antes | Después |
|---------|-------|---------|
| Nombre | `detectLocale()` | `detectLocaleFromGeo()` (más explícito) |
| Retorno | `Promise<GeoResult>` (siempre éxito) | `Promise<GeoResult>` (discriminado) |
| HTTP 429 | ❌ No manejado | ✅ `{ success: false, reason: 'rate_limited' }` |
| Timeout | `withTimeout` helper | `AbortController` + `setTimeout` |
| Fallback a navigator | ✅ Sí (silencioso) | ❌ No (el llamador decide el fallback) |
| Mapa de países | Solo MX, AR, CL, CO, PE | Todos los países LATAM + `es-LA` como regional |
| `clearTimeout` en catch | ❌ No | ✅ Sí |

---

## Cambios adicionales (fuera del documento original)

### `db.ts` — `src/lib/api/storage/db.ts`
| Cambio | Detalle |
|--------|---------|
| `CachedLocale` | Eliminado (interfaz obsoleta) |
| `UserPreferencesEntry` | Reemplaza a `UserPreferences`; `id` es literal `"user-preferences"` |
| `LocaleCacheEntry` | Reemplaza a `CachedLocaleEntry`; `data: unknown` en vez de `data: string` |
| `PreferencesEntry` | Ahora es union `UserPreferencesEntry \| LocaleCacheEntry` (antes era interfaz plana con todo opcional) |
| `.upgrade()` en v3 | Elimina la entrada `"user-preferences"` legacy al migrar desde v2 |
| Tabla `localeCache` | Eliminada del schema v3 |
| Tabla `preferences` | Índices: `"id, userId, localeId, cachedAt"` |
| Schema Dexie | v3 agregado (v1 → v2 → v3) |
| `AmautaDatabase` | `localeCache` eliminado, `preferences` usa `PreferencesEntry` |

### `auth-db.ts` — `src/lib/api/storage/auth-db.ts`
| Cambio | Detalle |
|--------|---------|
| `saveSelectedStudentId` | Cast `as UserPreferencesEntry` en el `put()` |
| `getSelectedStudentId` | Cast `as UserPreferencesEntry` al leer de Dexie |

### `locale-persistence.ts` — `src/features/locale/infrastructure/locale-persistence.ts`
| Cambio | Detalle |
|--------|---------|
| Imports | Cambiado a `UserPreferencesEntry` y `LocaleCacheEntry` |
| `saveLocalePreference` | Cast `as UserPreferencesEntry` en el `put()` |
| `clearLocalePreference` | Cast `as UserPreferencesEntry` en `existing` y `put()` |
| `saveCachedLocale` | Variable tipada como `LocaleCacheEntry` (no más `PreferencesEntry`) |
| `getCachedLocale` | Narrowing vía `"userId" in entry`; eliminados casts redundantes (`as string`, `as number`) |
| `getUserCachedLocale` | Ídem |

### `locale.config.ts` — `src/features/locale/domain/locale.config.ts`
- `LOCALE_MAP` extendido con todos los países latinoamericanos (BO, VE, EC, PY, UY, CR, GT, HN, SV, NI, PA, DO, CU, PR → `es-LA`)

---

## Checklist de Verificación

```
✅ Fix 1: locale.constants.ts exporta LOCALE_VERSIONS (Record<LocaleId, string>)
         y NO exporta LOCALE_VERSION

✅ Fix 2: CacheableLocale tiene { id, userId, localeId, data, version, cachedAt }
         GeoResult es union type discriminado con campo 'reason'

✅ Fix 3: i18n.ts NO importa i18next-http-backend
         El paquete NO está en package.json
         i18n.init() usa solo 'resources' embebidos

✅ Fix 4: locale-persistence.ts usa buildKey(userId, localeId)
         saveCachedLocale recibe (userId, localeId, data)
         getUserCachedLocale(userId) busca por userId en Dexie
         db.ts v3.indexa 'id, userId, localeId, cachedAt' en preferences

✅ Fix 5: detectLocaleFromGeo() retorna Promise<GeoResult>
         HTTP 429 → { success: false, reason: 'rate_limited' }
         Timeout → { success: false, reason: 'timeout' }
         No hay return con LocaleId directo — siempre GeoResult

✅ db.ts: PreferencesEntry es union UserPreferencesEntry | LocaleCacheEntry
         (no más interfaz plana con todo opcional)

✅ db.ts v3: .upgrade() elimina entrada "user-preferences" legacy al migrar

✅ locale-persistence.ts: narrowing vía "userId" in entry,
         casts eliminados (as string, as number)

✅ auth-db.ts: casts as UserPreferencesEntry en put() y get()

✅ TypeScript compila sin errores (tsc -b)
✅ Lint clean (sin errores propios)
✅ Sin imports rotos
```

---

## Próximos pasos (Fase 2+)

| Tarea | Dependencias |
|-------|------------|
| `LocaleInitializer` — componente que hydratea el locale desde Dexie | Fix 4 (persistence) |
| `LocaleSelector` — componente UI para cambiar de variante | — |
| `locale-store.ts` — store con `resolveAndCacheLocale` | Fix 1, 2, 4, 5 |
| Carga dinámica de JSONs regionales desde `/public/locales/` | Fix 3 |
