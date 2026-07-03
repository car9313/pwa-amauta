# Modelo de Dominio — Fase 0

> **Proposito**: Definir los tipos fundamentales del sistema de internacionalizacion, sus relaciones, y por que existen.
> **Archivos**: `locale.types.ts`, `locale.constants.ts`, `locale.config.ts`
> **Dependencias**: Ninguna (tipos puros sin logica)

---

## LocaleId

El tipo base del sistema. Representa una variante idiomatica soportada.

```typescript
export type LocaleId =
  | "es-LA"    // Espanol latino neutro (default)
  | "es-MX"    // Espanol (Mexico)
  | "es-AR"    // Espanol (Argentina)
  | "es-CL"    // Espanol (Chile)
  | "es-CO"    // Espanol (Colombia)
  | "es-PE"    // Espanol (Peru)
  | "en-US";   // English (United States)
```

### Por que existe

- Es la unidad atomica del sistema. Cada accion (geo, fetch, cache, changeLanguage) opera sobre un `LocaleId`.
- Al ser un union type, TypeScript garantiza que solo se usen variantes validas en todo el codigo.
- Agregar una nueva variante solo requiere anadirla aqui y actualizar los archivos de configuracion.

### Donde se usa

| Ubicacion | Uso |
|-----------|-----|
| Store | `resolvedLocale: LocaleId`, `userPreference: LocaleId \| null` |
| Persistencia | Clave compuesta `${userId}:${localeId}` |
| i18next | `i18next.changeLanguage(localeId)` |
| Geo-detection | `LOCALE_MAP` mapea pais a `LocaleId` |
| Fetch | URL `/locales/{locale}/translation.json` |

---

## LocaleInfo

Metadatos de cada variante para uso en UI.

```typescript
export interface LocaleInfo {
  id: LocaleId;
  label: string;    // "Espanol (Mexico)"
  flag: string;     // "mx" (codigo de bandera)
  country: string;  // "Mexico"
  isDefault: boolean;
}
```

### Por que existe

Separa los datos de visualizacion (labels, banderas) del tipo puro. `SUPPORTED_LOCALES` es un array de `LocaleInfo` que se usa en hooks como `useLanguage()` para mostrar la lista de idiomas disponibles al usuario.

---

## GeoResult

Resultado tipado de la llamada a ipapi.co. Usa un union type discriminado: siempre se sabe si fue exito o fallo, y en caso de fallo, la razon exacta.

```typescript
export type GeoResult =
  | { success: true; localeId: LocaleId }
  | {
      success: false;
      reason:
        | "timeout"          // AbortController aborto por tiempo
        | "rate_limited"     // HTTP 429
        | "network_error"    // HTTP no-OK o fetch fallo
        | "unmapped_country" // Pais no tiene variante asignada
        | "parse_error";     // JSON mal formado o sin country_code
    };
```

### Por que existe

- **Seguridad en tiempo de compilacion**: El llamador (store) debe manejar explicitamente tanto el caso de exito como todos los casos de fallo. No hay un `LocaleId | null` ambiguo.
- **Trazabilidad**: Cada razon de fallo permite tomar la decision correcta en el store y registrar diagnosticos utiles.
- **Preparado para analytics**: Se puede contar cuantos usuarios reciben cada tipo de error.

### Flujo tipico

```
detectLocaleFromGeo() → GeoResult
                        │
                        ├── success: true → usar localeId
                        └── success: false
                            ├── timeout → fallback a navigator.language
                            ├── rate_limited → fallback a navigator.language
                            ├── network_error → fallback a navigator.language
                            ├── unmapped_country → fallback a navigator.language
                            └── parse_error → fallback a navigator.language
```

---

## CacheableLocale

Estructura de datos que se persiste en Dexie. Representa un bloque de traducciones de una variante para un usuario especifico.

```typescript
export interface CacheableLocale {
  id: string;    // Clave compuesta: "${userId}:${localeId}"
  userId: string;   // ID del usuario autenticado
  localeId: LocaleId; // La variante regional
  data: Record<string, unknown>; // Traducciones (objeto con namespaces como keys)
  version: string;  // Version de esta variante (de LOCALE_VERSIONS)
  cachedAt: number; // Date.now() al momento de cachear
}
```

### Por que existe

- **Cache offline**: Es el formato en que se guardan las traducciones en Dexie para que esten disponibles sin internet.
- **Segmentacion por usuario**: `userId` permite que multiples usuarios en el mismo dispositivo tengan caches independientes.
- **Versionado**: `version` permite invalidar el cache granularmente por variante. Si solo cambia `es-MX`, solo los usuarios de `es-MX` re-descargan.
- **Timestamp**: `cachedAt` permite ordenar entries y tomar la mas reciente si hay multiples para el mismo usuario.

### Diferencias con la version anterior

| Aspecto | Antes (v1) | Despues (v2/v3) |
|---------|-----------|-----------------|
| `id` | `LocaleId` (`"es-MX"`) | `string` (`"user_001:es-MX"`) |
| `userId` | No existia | Agregado, string |
| `localeId` | No existia (se inferia de `id`) | Agregado, LocaleId |
| `version` | `number` global | `string` por locale |
| `cachedAt` | `string` (ISO) | `number` (Date.now()) |

---

## LocaleNamespace

Las 11 categorias de traduccion, definidas como const array y tipo derivado.

```typescript
export const LOCALE_NAMESPACES = [
  "common",      // Botones genericos: Cargando, Error, Reintentar, Guardar, etc.
  "auth",        // Login, registro, validacion, errores de autenticacion
  "navigation",  // Sidebar, menu, breadcrumbs
  "dashboard",   // Paneles de estudiante, padre, teacher
  "lessons",     // Pantalla de lecciones y feedback
  "exercises",   // Tipos de ejercicios, feedback de respuestas
  "games",       // Juegos (memoria, contrarreloj, quiz)
  "practice",    // Practica libre
  "progress",    // Progreso del estudiante
  "role",        // Seleccion de rol
  "errors",      // Fallbacks, errores de red, estados de carga
] as const;

export type LocaleNamespace = typeof LOCALE_NAMESPACES[number];
```

### Por que existe

- **Carga granular**: No es necesario cargar las 11 categorias en cada pantalla. Una pantalla de login solo necesita `auth` y `common`.
- **Organizacion**: Separa preocupaciones. Cada namespace es un archivo independiente para `es-LA` y una seccion dentro del `translation.json` de cada variante.
- **i18next nativo**: i18next organiza las traducciones por namespace de forma nativa.

---

## Constantes

### DEFAULT_LOCALE

```typescript
export const DEFAULT_LOCALE: LocaleId = "es-LA";
```

El locale por defecto. Se usa como `fallbackLng` en i18next y como valor inicial del store.

### LOCALE_VERSIONS

```typescript
export const LOCALE_VERSIONS: Record<LocaleId, string> = {
  "es-LA": "1.0.0",
  "es-MX": "1.1.0",   // Actualizado respecto a la version inicial
  "es-AR": "1.0.0",
  "es-CL": "1.0.0",
  "es-CO": "1.0.0",
  "es-PE": "1.0.0",
  "en-US": "1.0.0",
};
```

Cada variante tiene su propia version. Al cambiar el contenido de `es-MX`, solo se incrementa su version. Los usuarios de `es-MX` re-descargan; los de `es-AR` no se ven afectados.

### IPAPI_TIMEOUT_MS

```typescript
export const IPAPI_TIMEOUT_MS = 5_000;  // 5 segundos
```

Timeout maximo para la llamada a ipapi.co en `detectLocaleFromGeo`. El store usa un timeout mas agresivo (800ms) para la fase pre-auth, pero el servicio subyacente mantiene 5s por si se usa directamente.

---

## Configuracion

### SUPPORTED_LOCALES

Array de `LocaleInfo` que define todas las variantes soportadas. Cada entrada tiene:

```typescript
{ id: "es-LA", label: "Espanol latino neutro", flag: "latam", country: "Latinoamerica", isDefault: true }
{ id: "en-US", label: "English (US)",           flag: "us",    country: "Estados Unidos",   isDefault: false }
// ... etc para MX, AR, CL, CO, PE
```

### LOCALE_MAP

Mapping de codigo de pais ISO 3166-1 a `LocaleId`.

```typescript
export const LOCALE_MAP: Record<string, LocaleInfo["id"]> = {
  MX: "es-MX",
  AR: "es-AR",
  CL: "es-CL",
  CO: "es-CO",
  PE: "es-PE",
  US: "en-US",
  BO: "es-LA", VE: "es-LA", EC: "es-LA", PY: "es-LA",
  UY: "es-LA", CR: "es-LA", GT: "es-LA", HN: "es-LA",
  SV: "es-LA", NI: "es-LA", PA: "es-LA", DO: "es-LA",
  CU: "es-LA",
  PR: "es-LA",
};
```

Los paises que no tienen variante regional propia (Bolivia, Venezuela, Ecuador, etc.) se mapean a `es-LA` (espanol neutro). Si un pais no esta en el mapa, `detectLocaleFromGeo` retorna `{ success: false, reason: "unmapped_country" }`.

---

## Diagrama de Relaciones entre Tipos

```
LocaleId (union type)
    │
    ├── usado por ─────────► LocaleInfo { id: LocaleId, label, flag, ... }
    │
    ├── usado por ─────────► GeoResult.success.localeId
    │
    ├── usado por ─────────► CacheableLocale.localeId
    │
    ├── usado por ─────────► LOCALE_VERSIONS[localeId]
    │
    └── usado por ─────────► LOCALE_MAP[countryCode] → LocaleId

GeoResult (discriminated union)
    │
    ├── success: true  ───► { localeId: LocaleId }
    │
    └── success: false ───► { reason: "timeout" | "rate_limited" | ... }

CacheableLocale
    │
    ├── id: string         ───► "${userId}:${localeId}"
    ├── userId: string     ───► segmentacion por usuario
    ├── localeId: LocaleId ───► que variante
    ├── data: Record       ───► traducciones indexadas por namespace
    ├── version: string    ───► LOCALE_VERSIONS[localeId]
    └── cachedAt: number   ───► timestamp de cacho

LocaleNamespace (const array → type)
    ├── "common", "auth", "navigation", "dashboard"
    ├── "lessons", "exercises", "games", "practice"
    ├── "progress", "role", "errors"
    └── Se usa como key en data de CacheableLocale
```

---

## Historial de Cambios

| Version | Fecha | Cambio |
|---------|-------|--------|
| 1.0.0 | 03 Jul 2026 | Creacion inicial |

## Archivos Relacionados

| Archivo | Ruta |
|---------|------|
| Tipos | `src/features/locale/domain/locale.types.ts` |
| Constantes | `src/features/locale/domain/locale.constants.ts` |
| Config | `src/features/locale/domain/locale.config.ts` |
