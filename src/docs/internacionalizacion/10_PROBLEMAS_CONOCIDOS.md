# Problemas Conocidos y Casos de Uso Pendientes

> **Proposito**: Documentar los problemas detectados en la implementacion actual del sistema de i18n, su impacto, soluciones propuestas, y los casos de uso que aun no estan cubiertos.
> **Estado**: 🟢 Problemas activos · 🟡 Casos pendientes

> **Actualizacion (06 Jul 2026)**: Fix aplicado al Problema 1. Ver detalle abajo.

---

## Problemas Detectados

### 1. `getUserCachedLocale` usa `.first()` sin orden

**Archivo**: `src/features/locale/infrastructure/locale-persistence.ts`

```typescript
const entry = await db.preferences
  .where("userId")
  .equals(userId)
  .first();
```

**Problema**: Si un usuario tiene multiples entries en Dexie (por cambiar de locale, o porque `resolveAndCacheLocale` se ejecuto dos veces), `.first()` devuelve la primera que IndexedDB encuentre, sin garantia de orden. Podria devolver un locale incorrecto.

**Impacto**: 🟡 Medio (antes del fix).

**Estado**: ✅ **RESUELTO (06 Jul 2026)**

**Solucion aplicada**: En lugar de ordenar en el read path, se elimina la causa raiz. `saveCachedLocale` ahora limpia cualquier `LocaleCacheEntry` previa del mismo `userId` con distinto `localeId` antes de insertar la nueva. Esto garantiza la invariante **maximo 1 entry de cache por usuario**, haciendo que `.first()` sea deterministico.

Cambio en `saveCachedLocale` (`locale-persistence.ts:38-63`):

```typescript
const oldEntries = await db.preferences
  .where("userId")
  .equals(userId)
  .filter((entry) => isLocaleCacheEntry(entry) && entry.localeId !== localeId)
  .toArray();

if (oldEntries.length > 0) {
  await db.preferences.bulkDelete(oldEntries.map((e) => e.id));
}
```

La solucion original propuesta (`.reverse().sortBy()`) no funcionaba porque `sortBy` devuelve `Promise<T[]>` directamente y no es chainable con `.reverse()` en la API de Dexie.

**Nota**: El filtro `isLocaleCacheEntry` es necesario porque la tabla `preferences` tambien almacena `UserPreferencesEntry` (id: `"user-preferences"`) y `LastActiveUserEntry` (id: `"last-active-user"`), que no deben ser eliminados.

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

**Impacto**: 🟢 Bajo.

**Decision**: **ACEPTADO POR DISEÑO PARA MVP**.

**Motivo**: La solucion intuitiva (guardar un `lastLocale` global en `UserPreferencesEntry`) reintroduce el problema del Sistema A que eliminamos: si Maria uso `es-MX` y Juan uso `es-AR`, `lastLocale` quedaria en `es-AR` y Maria veria `es-AR` al abrir la app sin sesion. Es una regresion.

Ademas, `es-LA` es el unico locale garantizado offline porque esta embebido en el bundle. Cuando el usuario no tiene sesion ni conexion, necesita conexion para hacer login de todas formas. En ese momento la geo-deteccion corre y aplica su locale correcto.

**Cuando reconsiderar**: Si en el futuro se implementa un flujo pre-auth que funcione completamente offline (login offline con biometricos, por ejemplo), tendria sentido resolver este edge case con otro enfoque.

---

### 5. `detectPreAuthLocale` no reintenta geo si falla

**Problema**: Si geo falla en la fase pre-auth (timeout, 429, network error), no se reintenta. El flag `geoAlreadyRan` se setea a `true` de todas formas, y en post-auth no se vuelve a intentar (porque `geoAlreadyRan=true` evita la segunda llamada).

**Impacto**: 🟡 Medio (antes del fix).

**Estado**: ✅ **RESUELTO (06 Jul 2026)**

**Solucion aplicada**: Se añadio `geoFailReason` al store de locale que captura el motivo exacto del fallo de geo-deteccion pre-auth. En `resolveAndCacheLocale`, si el motivo fue `network_error` o `timeout`, se reintenta geo con timeout completo (5s) antes de persistir el locale. Si el reintento tiene exito, se aplica el nuevo locale; si falla, se cae al comportamiento anterior (usar el locale pre-auth).

**Cambios en `locale-store.ts`**:

1. Nuevo estado `geoFailReason` con tipo derivado de `GeoResult`:
   ```typescript
   type GeoFailReason = Extract<GeoResult, { success: false }>["reason"];
   // "timeout" | "rate_limited" | "network_error" | "unmapped_country" | "parse_error"
   ```

2. En `detectPreAuthLocale`, se captura el motivo:
   ```typescript
   const failReason = geoResult.success ? null : geoResult.reason;
   set({ resolvedLocale: resolved, geoAlreadyRan: true, geoFailReason: failReason });
   ```

3. En `resolveAndCacheLocale`, se reintenta solo si fue error de red o timeout:
   ```typescript
   const shouldRetryGeo = failReason === "network_error" || failReason === "timeout";
   if (shouldRetryGeo) {
     const retryResult = await detectLocaleFromGeo(); // sin AbortSignal, timeout 5s
     // ... si éxito, aplica nuevo locale y persiste
   }
   // Si no aplica reintento o falló, persiste locale pre-auth
   ```

**Cambios adicionales**:

4. `getLocaleFromNavigator` (`locale-utils.ts`): ahora tambien extrae `en-US` del navegador cuando geo falla. Antes solo extreia variantes de espanol (`es-MX`, `es-AR`, etc.). Esto evita que un usuario con navegador en ingles reciba `es-LA` cuando geo falla (CORS, 429, etc.).

   ```typescript
   // Antes
   if (parts[0].toLowerCase() === "es" && parts.length >= 2) { ... }
   return null;

   // Despues
   if (parts[0].toLowerCase() === "es" && parts.length >= 2) { ... }
   if (parts[0].toLowerCase() === "en") { return "en-US"; }
   return null;
   ```

5. `LocaleInitializer` ahora bloquea el renderizado del dashboard cuando hay reintento de geo, evitando el flash de idioma (cambio brusco de `es-LA` al locale correcto). Si `geoFailReason` es `network_error` o `timeout`, se muestra `AmautaLoadingState` hasta que el reintento termina (max 5s), luego se renderiza el dashboard con el locale correcto.

   ```tsx
   const { geoAlreadyRan, geoFailReason } = useLocaleStore.getState();
   const needsGeoRetry = geoAlreadyRan
     && (geoFailReason === "network_error" || geoFailReason === "timeout");

   if (needsGeoRetry) {
     setLocalePhaseReady(false);                  // muestra loading
     await resolveAndCacheLocale(userId);          // reintenta geo (5s)
     setLocalePhaseReady(true);                    // renderiza dashboard
   } else {
     void resolveAndCacheLocale(userId);           // background, sin bloqueo
   }
   ```

**Comportamiento por escenario**:

| Escenario | Pre-auth | Post-auth (login) | UX |
|-----------|----------|-------------------|-----|
| Sin conexion pre-auth + login con red | `geoFailReason: 'network_error'` → `es-LA` | Reintenta geo (5s) → locale correcto | Loading post-login (max 5s) → dashboard correcto |
| Timeout pre-auth + login con red estable | `geoFailReason: 'timeout'` → `es-LA` | Reintenta geo (5s) → locale correcto | Loading post-login (max 5s) → dashboard correcto |
| Rate limited (429) | `geoFailReason: 'rate_limited'` → navigator | No reintenta → usa navigator | Dashboard inmediato (sin loading extra) |
| Pais no mapeado | `geoFailReason: 'unmapped_country'` → `es-LA` | No reintenta → usa `es-LA` | Dashboard inmediato |
| Cache valido | Salta pre-auth | Usa cache directamente | Dashboard inmediato |
| Geo exitosa pre-auth | locale regional + `preAuthLocaleData` | Persiste locale regional | Dashboard inmediato |
| Error de parseo | `geoFailReason: 'parse_error'` → `es-LA` | No reintenta → usa `es-LA` | Dashboard inmediato |

---

### 6. Geo usa ipapi.co (servicio externo gratuito)

**Problema**: ipapi.co es un servicio gratuito con las siguientes limitaciones:
- Rate limiting (HTTP 429) si se hacen muchas peticiones
- Sin SLA ni garantia de disponibilidad
- Podria cambiar su modelo de negocio o deprecarse
- Datos de geolocalizacion no siempre precisos (especialmente en VPNs)

**Impacto**: 🟡 Medio. El sistema ya maneja 429, timeout y network error con fallback a `navigator.language`. Pero si ipapi.co dejara de funcionar permanentemente, todos los usuarios nuevos perderian la geo-deteccion.

**Estado**: 🟡 **Documentado con solucion de respaldo lista para implementar**.

**Solucion propuesta**: En lugar de depender de un solo proveedor, usar un array de proveedores con un adapter `extractLocale` por cada uno, e intentarlos en orden hasta que uno responda exitosamente.

**Archivos afectados**:

`src/features/locale/domain/locale.constants.ts` — anadir:

```typescript
export const GEO_PROVIDERS = [
  {
    url: "https://ipapi.co/json/",
    extractLocale: (data: unknown): string | null => {
      const d = data as Record<string, unknown>;
      return typeof d.country_code === "string" ? (d.country_code as string) : null;
    },
  },
  {
    url: "https://freeipapi.com/api/json/",
    extractLocale: (data: unknown): string | null => {
      const d = data as Record<string, unknown>;
      return typeof d.countryCode === "string" ? (d.countryCode as string) : null;
    },
  },
] as const;
```

`src/features/locale/infrastructure/geo-detection.service.ts` — reemplazar:

```typescript
export async function detectLocaleFromGeo(signal?: AbortSignal): Promise<GeoResult> {
  for (const provider of GEO_PROVIDERS) {
    try {
      const response = await fetch(provider.url, { signal });

      if (response.status === 429) continue;
      if (!response.ok) continue;

      let data: unknown;
      try {
        data = await response.json();
      } catch {
        continue;
      }

      const countryCode = provider.extractLocale(data);
      if (!countryCode) continue;

      const localeId = LOCALE_MAP[countryCode];
      if (!localeId) {
        return { success: false, reason: "unmapped_country" };
      }

      return { success: true, localeId };
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return { success: false, reason: "timeout" };
      }
      continue;
    }
  }

  return { success: false, reason: "network_error" };
}
```

**Timeout**: El limite de 800ms en pre-auth aplica a todos los proveedores compartiendo la misma `AbortSignal`. Si el primer proveedor falla rapido (429, network error), el segundo tiene tiempo suficiente. Si ambos son lentos, se aborta y se usa `navigator.language` como fallback. En post-auth (`resolveAndCacheLocale`), el timeout interno del servicio es de 5s, dando margen completo para recorrer ambos proveedores.

**Nota**: Los proveedores usan campos distintos para el codigo de pais (`country_code` en ipapi.co, `countryCode` en freeipapi.com). El adapter `extractLocale` encapsula esta diferencia, manteniendo `detectLocaleFromGeo` agnostico al formato del response.

**No implementado actualmente** — disponible para cuando se necesite mayor resiliencia en geo-deteccion.

---

### 7. Cache inmortal: idioma no cambia al viajar entre paises

**Archivo**: `src/features/locale/store/locale-store.ts` (`verifyLocaleAgainstGeo`)

**Problema**: La cache en Dexie solo expira por version (`LOCALE_VERSIONS`). Si un usuario se autentica en USA (`en-US`) y viaja a Colombia, la cache sigue siendo `en-US` indefinidamente. Ademas, sin LanguageSwitcher (Fase 11), el usuario no puede corregirlo manualmente.

**Impacto**: 🟡 Medio.

**Estado**: ✅ **RESUELTO (20 Ago 2026)**

**Solucion aplicada**: Nueva accion `verifyLocaleAgainstGeo(userId)` en el store, disparada **no-bloqueante** desde `LocaleInitializer` tras un hydrate exitoso con cache valida:

1. `navigator.onLine === false` → no intenta (offline: la cache es la fuente de verdad).
2. Geo falla (timeout, 429, red) → cache intacta.
3. `countryCode` de geo == `countryCode` de la cache → no-op.
4. Idioma resultante == idioma cachado → solo refresca el `countryCode` de la cache.
5. Difieren → descarga el JSON regional, `addResourceBundle` + `changeLanguage` (hot-swap, **sin recarga**) y actualiza la cache.

**Regla**: la correccion ocurre SOLO al iniciar sesion (abrir la app o loguearse). Internet regresando **mid-session** no cambia el idioma (comportamiento previo se mantiene, ver "Idioma fijo en sesion").

**Nota para el futuro LanguageSwitcher**: cuando exista cambio manual de idioma, `verifyLocaleAgainstGeo` podria pisar la preferencia manual. Al implementar la Fase 11, la cache debera marcar las preferencias manuales (p.ej. `manualOverride: true`) para que la verificacion las respete.

### 8. Sin fallback por idioma para paises sin traduccion regional

**Archivo**: `src/features/locale/domain/locale-languages.ts` (nuevo)

**Problema (antes del fix)**: `LOCALE_MAP` solo mapeaba hispanohablantes a `es-LA` y USA a `en-US`. Un britanico con navegador en espanol recibia `es-LA`; un espanol con navegador en ingles recibia `en-US` (via `unmapped_country` → navigator).

**Impacto**: 🟡 Medio (antes del fix).

**Estado**: ✅ **RESUELTO (20 Ago 2026)**

**Solucion aplicada**: Nuevo `domain/locale-languages.ts` con `SPANISH_COUNTRIES`, `ENGLISH_COUNTRIES` y `fallbackLocaleForCountry()`. La decision en `detectLocaleFromGeo` ahora es:

```
LOCALE_MAP[countryCode] ?? fallbackLocaleForCountry(countryCode) ?? unmapped_country
```

`LOCALE_MAP` quedo reducido a variantes regionales (MX, AR, CL, CO, PE, US). El idioma de respaldo nunca reemplaza una traduccion regional cuando existe. `unmapped_country` queda solo para paises sin idioma conocido (poco comun).

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

Si un usuario viaja de Mexico a Argentina **mientras usa la app**, el locale no cambia automaticamente. Una vez resuelto al inicio de la sesion, queda fijo (regla "Idioma fijo en sesion").

**Estado parcial**: ✅ El caso de cambio de pais **entre sesiones** (abrir la app en otro pais) quedo resuelto con `verifyLocaleAgainstGeo` (Problema 7). El caso **mid-session** sigue pendiente.

**Implementacion futura**: Re-ejecutar geo-deteccion al detectar cambio de red / `visibilitychange`, con umbral minimo de tiempo y respetando preferencias manuales (requiere LanguageSwitcher para poder revertir).

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
| 1 | `.first()` sin orden en `getUserCachedLocale` | ✅ **Resuelto** | — |
| 2 | `es-LA` guarda `{}` | 🟢 Baja | No requiere |
| 3 | Variantes diferenciales limitadas | 🟡 Media | ~2 hr (expandir namespaces) |
| 4 | Sin cache pre-auth sin sesion | 🟢 **Aceptado por diseno** | — |
| 5 | Sin reintento de geo | ✅ **Resuelto** | — |
| 6 | Dependencia de ipapi.co | 🟡 **Documentado con solucion lista** | ~1 hr (cuando se implemente) |
| 7 | Cache inmortal / viaje entre paises | ✅ **Resuelto** | — |
| 8 | Sin fallback por idioma | ✅ **Resuelto** | — |
| — | LanguageSwitcher (Fase 11) | 🟡 Media | ~1.25 hr |
| — | Tests (Fase 10) | 🔴 Alta | ~2 hr |
| — | Sincronizacion entre dispositivos | 🟢 Baja | ~4 hr (futuro) |

---

## Historial de Cambios

| Version | Fecha | Cambio |
|---------|-------|--------|
| 1.0.0 | 03 Jul 2026 | Creacion inicial |
| 1.1.0 | 06 Jul 2026 | Fix Problema 1: `saveCachedLocale` ahora limpia entries previas del mismo userId con distinto localeId antes de insertar. Documentacion actualizada. |
| 1.2.0 | 06 Jul 2026 | Fix Problema 5: `geoFailReason` añadido al store. Geo se reintenta post-login si fallo por `network_error` o `timeout`. Documentacion actualizada. |
| 1.3.0 | 06 Jul 2026 | Problema 4 marcado como aceptado por diseno para MVP. Problema 6 documentado con solucion de respaldo (GEO_PROVIDERS + freeipapi.com) lista para implementar. |
| 1.4.0 | 06 Jul 2026 | Fix Problema 5 (completado): `getLocaleFromNavigator` ahora extrae `en-US`. `LocaleInitializer` bloquea durante reintento de geo para evitar flash de idioma. Documentacion actualizada. |
| 1.5.0 | 20 Ago 2026 | Fix Problema 7: `verifyLocaleAgainstGeo` corrige el idioma al iniciar sesion si el pais difiere del de la cache (hot-swap, sin recarga; respeta offline). Fix Problema 8: `locale-languages.ts` con fallback por idioma del pais (`es-LA`/`en-US`); `LOCALE_MAP` reducido a variantes regionales. `GeoResult` y cache ahora llevan `countryCode`. Logs de debug gateados con `import.meta.env.DEV`. |
