# Problemas Conocidos y Casos de Uso Pendientes

> **Proposito**: Documentar los problemas detectados en la implementacion actual del sistema de i18n, su impacto, soluciones propuestas, y los casos de uso que aun no estan cubiertos.
> **Estado**: 🔴 Problemas activos · 🟡 Casos pendientes

---

## Problemas Detectados

### 1. `getUserCachedLocale` usa `.first()` sin orden

**Archivo**: `src/features/locale/infrastructure/locale-persistence.ts`

```typescript
const entry = await db.preferences
  .where("userId")
  .equals(userId)
  .first();   // ← Sin orden
```

**Problema**: Si un usuario tiene multiples entries en Dexie (por cambiar de locale, o porque `resolveAndCacheLocale` se ejecuto dos veces), `.first()` devuelve la primera que IndexedDB encuentre, sin garantia de orden. Podria devolver un locale incorrecto.

**Impacto**: 🟡 Medio. Afecta solo a usuarios que han cambiado de locale o tenido multiples resoluciones. En la practica, la mayoria de usuarios tiene una sola entry.

**Solucion propuesta**:

```typescript
const entry = await db.preferences
  .where("userId")
  .equals(userId)
  .reverse()           // ← Mas reciente primero
  .sortBy("cachedAt")  // ← Ordenar por timestamp
  .then(results => results[0] ?? null);
```

O usar `orderBy`:
```typescript
const entry = await db.preferences
  .where("userId")
  .equals(userId)
  .last();  // ← last() podria no ser suficiente
```

---

### 2. `es-LA` guarda `data: {}` en Dexie

**Archivo**: `src/features/locale/store/locale-store.ts` (linea 197)

```typescript
await saveCachedLocale(userId, resolved, {});
```

**Problema**: Cuando el locale resuelto es `es-LA`, se guarda `data: {}` en Dexie. Esto significa que la entrada en Dexie no contiene traducciones reales, solo sirve para recordar la preferencia del usuario.

**Impacto**: 🟢 Bajo. Es intencional: `es-LA` ya esta embebido en el bundle, no necesita ser cacheado. La entrada solo evita que el usuario pase por geo-deteccion en la proxima sesion.

**Nota**: Si en el futuro se decidiera que `es-LA` ya no esta embebido, habria que modificar esta linea para guardar los 11 namespaces completos.

---

### 3. Variantes diferenciales solo contienen `auth.login` en cache

**Archivo**: `public/locales/es-AR/translation.json`, `es-CL/`, `es-CO/`, `es-PE/`

**Problema**: Las variantes diferenciales (AR, CL, CO, PE) solo tienen keys de `auth.login`. El resto de namespaces (navigation, dashboard, lessons, etc.) caen al fallback de `es-LA`. Esto funciona actualmente porque `es-LA` esta embebido.

**Impacto**: 🟡 Medio. Si en el futuro:
- `es-LA` dejara de estar embebido
- O se perdiera el bundle de `es-LA`
- Las variantes diferenciales no tendrian suficientes datos para funcionar offline

**Solucion propuesta**: Expandir las variantes diferenciales con mas namespaces a medida que se identifican diferencias regionales en navigation, dashboard, lessons, etc.

---

### 4. Sin cache pre-auth cuando no hay sesion activa

**Flujo afectado**: Usuario cierra sesion, cierra la app, la reabre sin internet.

**Problema**: Sin sesion activa, `checkIfSessionExists()` retorna `null`. Sin userId, `hydrateFromStorage` no puede buscar el cache en Dexie. La geo-deteccion requiere internet. Resultado: el usuario ve login en `es-LA` aunque su cache de `es-AR` siga existiendo en Dexie.

**Impacto**: 🟠 Medio-Alto. Es un edge case (usuario que hace logout activamente), pero la experiencia es pobre: el usuario ve espanol neutro aunque la app tenga sus traducciones guardadas.

**Solucion propuesta**: Guardar un `lastLocale` independiente del userId en `UserPreferencesEntry`:

```typescript
export interface UserPreferencesEntry {
  id: "user-preferences";
  selectedStudentId: string | null;
  locale: string | null;       // ← Ultimo locale usado (cualquier usuario)
  lastLocale: string | null;   // ← Nuevo: locale independiente de userId
  updatedAt: number;
}
```

Y en `detectPreAuthLocale`, antes de geo, leer `lastLocale` de preferences:

```typescript
const prefs = await db.preferences.get("user-preferences");
if (prefs?.lastLocale) {
  const locale = prefs.lastLocale as LocaleId;
  // Intentar cargar cache desde Dexie por localeId
  // (requiere una nueva funcion de busqueda)
}
```

---

### 5. `detectPreAuthLocale` no reintenta geo si falla

**Problema**: Si geo falla en la fase pre-auth (timeout, 429, network error), no se reintenta. El flag `geoAlreadyRan` se setea a `true` de todas formas, y en post-auth no se vuelve a intentar (porque `geoAlreadyRan=true` evita la segunda llamada).

**Impacto**: 🟢 Bajo. El usuario recibe el locale de `navigator.language` como fallback, que suele ser correcto. El locale queda fijo para toda la sesion, pero el usuario puede cambiarlo manualmente cuando haya `LanguageSwitcher` (Fase 11).

**Nota**: Si `geoAlreadyRan=false` en post-auth (porque `hydrateFromStorage` encontro cache y salto `detectPreAuthLocale`), entonces `resolveAndCacheLocale` SI ejecuta geo. Este es el comportamiento correcto.

---

### 6. Geo usa ipapi.co (servicio externo gratuito)

**Problema**: ipapi.co es un servicio gratuito con las siguientes limitaciones:
- Rate limiting (HTTP 429) si se hacen muchas peticiones
- Sin SLA ni garantia de disponibilidad
- Podria cambiar su modelo de negocio o deprecarse
- Datos de geolocalizacion no siempre precisos (especialmente en VPNs)

**Impacto**: 🟡 Medio. El sistema ya maneja 429, timeout y network error con fallback a `navigator.language`. Pero si ipapi.co dejara de funcionar permanentemente, todos los usuarios nuevos perderian la geo-deteccion.

**Solucion propuesta**: Tener un plan de migracion a un servicio alternativo (ipapi.co, ipify.org, o un proxy propio). La abstraccion via `GeoResult` y `detectLocaleFromGeo` facilita el cambio: solo se modificaria ese archivo.

---

## Casos de Uso Pendientes

### LanguageSwitcher UI (Fase 11)

El usuario no puede cambiar manualmente su idioma desde la interfaz. La unica forma de cambiar de variante es:
1. Que la geo-deteccion asigne una diferente
2. Modificar directamente Dexie (solo para desarrolladores)

**Implementacion futura**: Un componente `LanguageSwitcher` que llame a `useLanguage().setPreference(locale, userId)`.

### Sincronizacion de preferencia entre dispositivos

Actualmente, la preferencia de locale vive solo en Dexie (local). Si un usuario usa Amauta en dos dispositivos diferentes, debe configurar su idioma en cada uno.

**Implementacion futura**: Sincronizar la preferencia de locale via API, guardandola en el backend y descargandola en el login.

### Deteccion de cambio de pais en sesion activa

Si un usuario viaja de Mexico a Argentina mientras usa la app, el locale no cambia automaticamente. Una vez resuelto al inicio de la sesion, queda fijo.

**Implementacion futura**: Opcionalmente, re-ejecutar geo-deteccion periodicamente o al detectar cambio de red.

### Tests automatizados (Fase 10)

No hay tests unitarios ni de integracion para el sistema de i18n. Los casos criticos que deberian cubrirse:

| # | Test | Prioridad |
|---|------|-----------|
| 1 | `locale-persistence`: CRUD con clave `${userId}:${localeId}`, aislamiento entre usuarios | Alta |
| 2 | `geo-detection.service`: exito, timeout, 429, 500, pais no mapeado, JSON malformado | Alta |
| 3 | `locale-store`: cadena de prioridad completa + flag `geoAlreadyRan` + bug fixes A/B/C | Alta |
| 4 | `LocaleInitializer`: flujo 3 fases: hydrate → pre-auth geo → post-auth persist | Alta |
| 5 | `detectPreAuthLocale`: aplica en i18next, no persiste en Dexie, setea flag | Media |
| 6 | Aislamiento entre usuarios: dos usuarios distintos en mismo dispositivo | Media |
| 7 | Offline: usuario con cache funciona sin internet | Alta |
| 8 | Offline: usuario sin cache muestra es-LA | Alta |

### Traducciones completas para mas paises

Actualmente hay 6 variantes. Paises con potencial para variante propia:
- Espana (`es-ES`)
- Venezuela (`es-VE`)
- Republica Dominicana (`es-DO`)

Requiere: agregar al `LOCALE_MAP`, crear archivo JSON, definir diferencias regionales.

---

## Resumen de Prioridades

| # | Problema | Prioridad | Esfuerzo estimado |
|---|----------|-----------|-------------------|
| 1 | `.first()` sin orden en `getUserCachedLocale` | 🟡 Media | 15 min |
| 2 | `es-LA` guarda `{}` | 🟢 Baja | No requiere |
| 3 | Variantes diferenciales limitadas | 🟡 Media | ~2 hr (expandir namespaces) |
| 4 | Sin cache pre-auth sin sesion | 🟠 Media-Alta | ~1 hr |
| 5 | Sin reintento de geo | 🟢 Baja | No requiere |
| 6 | Dependencia de ipapi.co | 🟡 Media | ~2 hr (alternativa) |
| — | LanguageSwitcher (Fase 11) | 🟡 Media | ~1.25 hr |
| — | Tests (Fase 10) | 🔴 Alta | ~2 hr |
| — | Sincronizacion entre dispositivos | 🟢 Baja | ~4 hr (futuro) |

---

## Historial de Cambios

| Version | Fecha | Cambio |
|---------|-------|--------|
| 1.0.0 | 03 Jul 2026 | Creacion inicial |
