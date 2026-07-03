# Persistencia en Dexie — Cache de Traducciones

> **Proposito**: Describir como se guardan, leen, versionan e invalidan las traducciones regionales en IndexedDB via Dexie, garantizando funcionamiento offline y aislamiento entre usuarios.
> **Archivos**: `locale-persistence.ts`, `db.ts`
> **Dependencias**: Fase 0 (tipos), Fase 1 (schema Dexie)

---

## Esquema de Datos

### Tabla: preferences

La tabla `preferences` en Dexie almacena dos tipos de entradas:

#### UserPreferencesEntry

```typescript
export interface UserPreferencesEntry {
  id: "user-preferences";          // Clave fija, unica
  selectedStudentId: string | null; // Estudiante seleccionado para el dashboard
  locale: string | null;           // Locale preferido del usuario
  updatedAt: number;               // Timestamp de ultima actualizacion
}
```

Entrada unica que almacena preferencias globales del usuario. El campo `locale` es el locale mas reciente que el usuario uso (o null si nunca se persistio).

#### LocaleCacheEntry

```typescript
export interface LocaleCacheEntry {
  id: string;          // "${userId}:${localeId}" — clave compuesta
  userId: string;      // ID del usuario autenticado
  localeId: string;    // La variante regional ("es-MX", "en-US", etc.)
  data: unknown;      // Traducciones: { "auth": {...}, "common": {...}, ... }
  version: string;    // Version de esta variante (de LOCALE_VERSIONS)
  cachedAt: number;   // Date.now() al momento de cachear
}
```

Entrada por cada combinacion de usuario + variante. El `data` contiene las traducciones reales (o `{}` para es-LA).

### Indices

```typescript
db.version(3).stores({
  preferences: "id, userId, localeId, cachedAt",
});
```

| Indice | Descripcion | Uso |
|--------|-------------|-----|
| `id` | Clave primaria | Acceso directo por `${userId}:${localeId}` |
| `userId` | Busqueda por usuario | `getUserCachedLocale(userId)` — encuentra cualquier entry de un usuario |
| `localeId` | Busqueda por variante | (Preparado para uso futuro) |
| `cachedAt` | Ordenamiento temporal | (Preparado para ordenar entries por fecha) |

---

## Clave Compuesta

```typescript
function buildKey(userId: string, localeId: LocaleId): string {
  return `${userId}:${localeId}`;
}
```

**Ejemplos**:
- `"stu_001:es-MX"` — Estudiante 1, espanol mexicano
- `"parent_002:es-AR"` — Padre 2, espanol argentino
- `"teacher_003:en-US"` — Profesor 3, ingles

**Por que es importante**: Garantiza que dos usuarios en el mismo dispositivo tengan caches independientes. Maria (`stu_001`) puede tener `es-MX` mientras Juan (`stu_002`) tiene `es-AR`. Nunca se pisan entre si.

---

## Ciclo de Vida del Cache

### 1. Creacion (post-auth)

Se crea en `resolveAndCacheLocale(userId)`:

```typescript
// Cuando el locale es regional (no es-LA):
await saveCachedLocale(userId, "es-MX", remoteData);
// remoteData = { "auth": {...}, "common": {...}, "navigation": {...}, ... }

// Cuando el locale es es-LA:
await saveCachedLocale(userId, "es-LA", {});
// data = {} — es-LA ya esta embebido, no necesita cache
```

**Que se guarda**:
- `id`: `"stu_001:es-MX"`
- `userId`: `"stu_001"`
- `localeId`: `"es-MX"`
- `data`: El JSON completo descargado de `/locales/es-MX/translation.json`
- `version`: `"1.1.0"` (de `LOCALE_VERSIONS["es-MX"]`)
- `cachedAt`: `Date.now()`

**Nota sobre es-LA**: Guarda `data: {}`. La entrada solo sirve para recordar que este usuario usa `es-LA`, no como fuente de traducciones (es-LA ya esta en el bundle).

### 2. Lectura (pre-auth y post-auth)

#### En pre-auth: `hydrateFromStorage(userId)`

```typescript
const cached = await getUserCachedLocale(userId);
if (!cached || isLocaleStale(cached)) return false;

// Aplicar traducciones a i18next
for (const ns of LOCALE_NAMESPACES) {
  if (data[ns]) {
    i18next.addResourceBundle(cached.localeId, ns, data[ns], true, true);
  }
}
await i18next.changeLanguage(cached.localeId);
return true;
```

`getUserCachedLocale` busca en Dexie por `userId` sin especificar localeId. Esto permite que el sistema funcione aunque no sepa de antemano que locale tiene cacheado el usuario.

**Problema conocido**: Usa `.first()` sin orden. Ver `10_PROBLEMAS_CONOCIDOS.md`.

#### En post-auth: `resolveAndCacheLocale(userId)`

Misma logica, pero si el cache no existe o es stale, procede a descargar y guardar.

### 3. Invalidacion (cambio de version)

```typescript
export function isLocaleStale(cached: CacheableLocale): boolean {
  return cached.version !== LOCALE_VERSIONS[cached.localeId];
}
```

**Cuando ocurre**:
- Se actualiza el contenido de `es-MX/translation.json`
- Se incrementa `LOCALE_VERSIONS["es-MX"]` de `"1.0.0"` a `"1.1.0"`
- Los usuarios de `es-MX` tienen cache con version `"1.0.0"`
- `isLocaleStale` retorna `true`
- `resolveAndCacheLocale` re-descarga el JSON

**Ventaja**: Solo los usuarios afectados por el cambio re-descargan. Si solo cambio `es-MX`, los usuarios de `es-AR` no se ven afectados.

### 4. Limpieza (logout)

```typescript
export async function clearAllUserCachedLocales(userId: string): Promise<void> {
  await db.preferences.where("userId").equals(userId).delete();
}
```

Se llama cuando se hace logout completo. Elimina todas las entries de cache de ese usuario.

---

## Versionado Granular por Variante

```typescript
export const LOCALE_VERSIONS: Record<LocaleId, string> = {
  "es-LA": "1.0.0",
  "es-MX": "1.1.0",   // Incrementada cuando se reemplazaron placeholders con contenido real
  "es-AR": "1.0.0",
  "es-CL": "1.0.0",
  "es-CO": "1.0.0",
  "es-PE": "1.0.0",
  "en-US": "1.0.0",
};
```

**Como se usa**:
1. `saveCachedLocale` guarda la version actual al crear el cache
2. `isLocaleStale` compara la version guardada contra la version actual
3. Si el desarrollador actualiza `es-MX` y cambia su version a `"1.2.0"`, los usuarios de `es-MX` re-descargan
4. Los usuarios de `es-AR` (que siguen en `"1.0.0"`) no se ven afectados

---

## Resumen de Operaciones

| Operacion | Funcion | Cuando se llama | Que hace en Dexie |
|-----------|---------|-----------------|-------------------|
| Crear cache | `saveCachedLocale(userId, localeId, data)` | Post-auth en `resolveAndCacheLocale` | `db.preferences.put(entry)` |
| Leer cache por userId | `getUserCachedLocale(userId)` | Pre-auth y post-auth | `db.preferences.where("userId").equals(id).first()` |
| Leer cache exacto | `getCachedLocale(userId, localeId)` | (Uso interno) | `db.preferences.get(buildKey(userId, localeId))` |
| Invalidar stale | `isLocaleStale(cached)` | En cada lectura de cache | Solo comparacion de strings |
| Limpiar todo | `clearAllUserCachedLocales(userId)` | Logout | `db.preferences.where("userId").equals(id).delete()` |
| Guardar preferencia | `saveLocalePreference(userId, locale)` | Cambio manual de idioma | `db.preferences.put()` con id `"user-preferences"` |
| Leer preferencia | `getLocalePreference()` | (Uso futuro) | `db.preferences.get("user-preferences")` |

---

## Diagrama de Ciclo de Vida del Cache

```
PRIMERA VEZ (usuario nuevo)
┌──────────┐    ┌──────────────┐    ┌──────────────────┐
│ Geo      │───►│ Login        │───►│ saveCachedLocale │
│ detecta  │    │ (post-auth)  │    │ en Dexie         │
│ es-MX    │    │              │    │ clave: stu:es-MX │
└──────────┘    └──────────────┘    └──────────────────┘
                                           │
                                           ▼
SESION SIGUIENTE (con cache)
┌──────────┐    ┌──────────────┐    ┌──────────────────┐
│ App      │───►│ hydrateFrom  │───►│ Render en        │
│ mount    │    │ Storage(stu) │    │ es-MX (offline)  │
└──────────┘    └──────────────┘    └──────────────────┘
                                           │
                                           ▼
ACTUALIZACION DE TRADUCCIONES
┌──────────┐    ┌──────────────┐    ┌──────────────────┐
│ Dev      │───►│ LOCALE_      │───►│ isLocaleStale    │
│ cambia   │    │ VERSIONS     │    │ → true           │
│ es-MX    │    │ es-MX: 1.1.0 │    │ → re-descarga    │
└──────────┘    └──────────────┘    └──────────────────┘
                                           │
                                           ▼
LOGOUT DEL USUARIO
┌──────────┐    ┌──────────────────┐
│ Logout   │───►│ clearAllUser     │
│          │    │ CachedLocales    │
└──────────┘    └──────────────────┘
```

---

## Historial de Cambios

| Version | Fecha | Cambio |
|---------|-------|--------|
| 1.0.0 | 03 Jul 2026 | Creacion inicial |

## Archivos Relacionados

| Archivo | Ruta |
|---------|------|
| Persistencia | `src/features/locale/infrastructure/locale-persistence.ts` |
| Schema Dexie | `src/lib/api/storage/db.ts` |
| Store (creacion/lectura) | `src/features/locale/store/locale-store.ts` |
