# Store y Hooks — Fase 2

> **Proposito**: Describir el Zustand store que orquesta toda la logica de internacionalizacion, los hooks que exponen la funcionalidad a los componentes, y las utilidades puras.
> **Archivos**: `locale-store.ts`, `useLanguage.ts`, `useLocale.ts`, `locale-utils.ts`
> **Dependencias**: Fase 0 (tipos), Fase 1 (i18n, geo, persistence, db)

---

## locale-store.ts — Zustand Store

**Ruta**: `src/features/locale/store/locale-store.ts`
**Proposito**: Orquestar la resolucion de locale (Dexie → Geo → fallback), gestionar el estado reactivo del locale activo, y coordinar la persistencia en Dexie.

### Estado

```typescript
interface LocaleState {
  resolvedLocale: LocaleId;                          // Locale activo actualmente
  isReady: boolean;                                  // Store listo para usar
  userPreference: LocaleId | null;                   // Preferencia guardada del usuario
  geoAlreadyRan: boolean;                            // Flag: geo ya se ejecuto esta sesion
  preAuthLocaleData: Record<string, Record<string, unknown>> | null; // Traducciones pre-auth en memoria
}
```

| Campo | Default | Cuando cambia | Proposito |
|-------|---------|---------------|-----------|
| `resolvedLocale` | `"es-LA"` | En cada accion que resuelve locale | Locale activo en i18next |
| `isReady` | `false` | `true` al completar hydrate, detect, resolve | Indica que el store esta listo |
| `userPreference` | `null` | En hydrate (si hay cache) o resolve post-auth | Locale que el usuario eligio o tiene guardado |
| `geoAlreadyRan` | `false` | `true` en detectPreAuthLocale | Evita que geo se ejecute dos veces |
| `preAuthLocaleData` | `null` | En detectPreAuthLocale si se descargo JSON | Traducciones en memoria para usar post-auth sin re-descargar |

### Acciones

---

#### hydrateFromStorage(userId)

```typescript
hydrateFromStorage: async (userId: string): Promise<boolean>
```

**Proposito**: Cargar el locale del usuario desde Dexie en la fase pre-auth. Es la primera accion que se ejecuta al montar la app.

**Cuando se llama**: En `LocaleInitializer.useEffect[0]` (fase pre-auth), si `checkIfSessionExists()` devuelve un userId.

**Por que existe**: Si el usuario ya visito la app antes y tiene cache en Dexie, no necesita geo-deteccion. Sus traducciones se cargan instantaneamente desde el disco local.

**Flujo interno**:

```
1. getUserCachedLocale(userId) en Dexie
   ├── No existe → isReady = true, retorna false
   │               (el llamador debe ejecutar geo-deteccion)
   │
   └── Existe → isLocaleStale(cached)?
       ├── Stale (version desactualizada) → isReady = true, retorna false
       │   (se necesita re-descargar)
       │
       └── Valido:
           ├── Por cada namespace en LOCALE_NAMESPACES:
           │   if (data[ns]) i18next.addResourceBundle(localeId, ns, data[ns], true, true)
           │   El 'true, true' hace merge profundo sobre las traducciones existentes
           │
           ├── i18next.changeLanguage(cached.localeId)
           │
           ├── resolvedLocale = cached.localeId
           ├── userPreference = cached.localeId
           ├── isReady = true
           │
           └── Retorna true (cache encontrado y aplicado)
```

**Impacto en persistencia**: Solo LECTURA de Dexie. No escribe nada.

**Impacto en UI**: Si retorna `true`, el `LocaleInitializer` salta la fase de geo-deteccion y el render es inmediato. El usuario ve la app en su idioma regional desde el primer frame.

---

#### detectPreAuthLocale(timeoutMs)

```typescript
detectPreAuthLocale: async (timeoutMs = 800): Promise<void>
```

**Proposito**: Ejecutar geo-deteccion en la fase pre-auth (sin userId) y cargar las traducciones regionales si es necesario.

**Cuando se llama**: En `LocaleInitializer.useEffect[0]`, solo si `hydrateFromStorage` retorno `false`.

**Por que existe**: Sin cache en Dexie (usuario nuevo o cache invalido), necesitamos determinar el pais del usuario para mostrar login/register en su idioma regional.

**Flujo interno**:

```
1. Crear AbortController con timeout de timeoutMs (default 800ms)
2. Llamar detectLocaleFromGeo(controller.signal)
3. ClearTimeout (cancelar el timeout si geo respondio antes)
4. ResolveLocale:
   resolved = resolveLocale(geoResult, getLocaleFromNavigator())
             ├── geoResult.success → usa geoResult.localeId
              ├── geoResult.fail → getLocaleFromNavigator()
              │   ├── navigator.language = "es-MX" → "es-MX"
              │   ├── navigator.language = "es-AR" → "es-AR"
              │   └── otro (incl. "en-US") → null → DEFAULT_LOCALE
              └── getLocaleFromNavigator = null → DEFAULT_LOCALE
                  ⚠️ "en-US" NO se extrae del navigator — solo por geo-detección

5. Si resolved != DEFAULT_LOCALE:
   ├── Fetch /locales/{resolved}/translation.json
   ├── Si response.ok:
   │   ├── preAuthLocaleData = response.json()  ← memoria, NO Dexie
   │   └── Por cada namespace en LOCALE_NAMESPACES:
   │       if (preAuthLocaleData[ns])
   │         i18next.addResourceBundle(resolved, ns, preAuthLocaleData[ns], true, true)
   └── Si fetch falla: silencioso, se usa es-LA como fallback

6. i18next.changeLanguage(resolved)
7. resolvedLocale = resolved
8. geoAlreadyRan = true
```

**Impacto en persistencia**: NO escribe en Dexie (no hay userId para segmentar). Los datos viven en memoria (`preAuthLocaleData`).

**Impacto en UI**: Bloquea el render (via `AmautaLoadingState`) hasta completarse. El usuario ve login/register en su idioma regional desde el primer render.

---

#### resolveAndCacheLocale(userId)

```typescript
resolveAndCacheLocale: async (userId: string): Promise<void>
```

**Proposito**: Orquestar la resolucion de locale en la fase post-auth y persistir las traducciones en Dexie.

**Cuando se llama**: En `LocaleInitializer.useEffect[1]` (fase post-auth), cuando `hasAuthHydrated && isAuthenticated && user`.

**Por que existe**: Al autenticarse, tenemos el userId necesario para persistir en Dexie. Ademas, si la geo pre-auth no pudo ejecutarse (fallo), este es el segundo intento.

**Flujo interno**:

```
1. getUserCachedLocale(userId) en Dexie
   ├── Existe y NO stale (isLocaleStale = false):
   │   ├── addResourceBundle por namespace con data del cache
   │   ├── i18next.changeLanguage(cached.localeId)
   │   ├── resolvedLocale = cached.localeId, userPreference = cached.localeId, isReady = true
   │   └── Retorna (cache valido encontrado)
   │
   └── No existe o stale:
       │
       2. ¿geoAlreadyRan = true?
          ├── SI (ya se ejecuto detectPreAuthLocale):
          │   ├── locale = resolvedLocale (de memoria)
          │   ├── preAuthData = preAuthLocaleData (de memoria, o {} si es es-LA)
          │   │
          │   ├── saveCachedLocale(userId, locale, preAuthData)
          │   │   → Guarda en Dexie con clave "${userId}:${locale}"
          │   │   → version = LOCALE_VERSIONS[locale]
          │   │   → cachedAt = Date.now()
          │   │
          │   ├── Si preAuthData existe:
          │   │   addResourceBundle(locale, ns, preAuthData[ns]) por namespace
          │   │
          │   ├── i18next.changeLanguage(locale)
          │   ├── userPreference = locale, isReady = true
          │   └── Retorna
          │
          └── NO (no se ejecuto detectPreAuthLocale — ej: habia cache, o fallo la sesion):
              │
              3. detectLocaleFromGeo() (sin señal externa, timeout interno 5s)
              4. resolveLocale(geoResult, getLocaleFromNavigator())
              5. Si locale != es-LA:
                 ├── fetch /locales/{locale}/translation.json
                 ├── saveCachedLocale(userId, locale, data)
                 ├── addResourceBundle por namespace
              6. Si locale = es-LA:
                 ├── saveCachedLocale(userId, locale, {})
                 │   → Guarda con data vacio (es-LA ya esta embebido)
              7. i18next.changeLanguage(locale)
              8. resolvedLocale = locale, userPreference = locale, isReady = true
```

**Impacto en persistencia**: ESCRIBE en Dexie. Crea la entrada `${userId}:${localeId}` que sera usada por `hydrateFromStorage` en la proxima sesion.

**Nota importante**: Cuando el locale es `es-LA`, guarda `data: {}` en lugar de los 11 namespaces. Esto es porque `es-LA` ya esta embebido en el bundle. La entrada en Dexie solo sirve para recordar que este usuario usa `es-LA`, no como fuente de traducciones.

---

#### setUserPreference(locale, userId)

```typescript
setUserPreference: async (locale: LocaleId, userId: string): Promise<void>
```

**Proposito**: Cambio manual de idioma por parte del usuario.

**Cuando se llama**: Desde el futuro `LanguageSwitcher` (Fase 11) o desde cualquier componente que permita cambiar de idioma.

**Por que existe**: El usuario debe poder cambiar su idioma manualmente si la deteccion automatica no fue correcta.

**Flujo interno**:

```
1. resolvedLocale = locale
2. userPreference = locale
3. saveCachedLocale(userId, locale, {}) en Dexie
   (data vacio porque las traducciones se cargaran bajo demanda)
4. i18next.changeLanguage(locale)
   (cambia el idioma — i18next usara es-LA como fallback para lo que falte)
```

**Impacto en persistencia**: Sobrescribe la entrada en Dexie con el nuevo locale. Notar que guarda `data: {}` — las traducciones reales se cargaran cuando se necesiten via el mecanismo normal (fetch de `/locales/{locale}/translation.json` en el proximo mount).

---

#### resetLocale()

```typescript
resetLocale: () => void
```

**Proposito**: Limpiar el estado del store y volver a es-LA.

**Cuando se llama**: En logout o cuando se necesita reiniciar el estado de locale.

**Flujo interno**:

```
1. resolvedLocale = DEFAULT_LOCALE ("es-LA")
2. userPreference = null
3. geoAlreadyRan = false
4. preAuthLocaleData = null
```

---

## useLanguage.ts — Hook Principal

**Ruta**: `src/features/locale/hooks/useLanguage.ts`
**Proposito**: Exponer la funcionalidad de i18n a los componentes.

```typescript
export function useLanguage() {
  const { t, i18n } = useTranslation();
  const resolvedLocale = useLocaleStore((state) => state.resolvedLocale);
  const isReady = useLocaleStore((state) => state.isReady);
  const userPreference = useLocaleStore((state) => state.userPreference);
  const setUserPreference = useLocaleStore((state) => state.setUserPreference);
  const resolveAndCacheLocale = useLocaleStore((state) => state.resolveAndCacheLocale);
  const resetLocale = useLocaleStore((state) => state.resetLocale);

  return {
    t,                          // Funcion de traduccion: t("auth.login.submitButton")
    locale: resolvedLocale,     // Locale activo actual
    i18n,                       // Instancia de i18next (para casos avanzados)
    userPreference,             // Preferencia guardada del usuario
    availableLocales: SUPPORTED_LOCALES,  // Lista de idiomas disponibles
    isReady,                    // Store listo
    setPreference: setUserPreference,     // Cambiar idioma manualmente
    resolveAndCacheLocale,      // Forzar resolucion post-auth
    resetLocale,                // Resetear locale
  };
}
```

**Nota sobre selectors**: Sigue la convencion del proyecto de usar selectores individuales en lugar de desestructurar el estado del store. Esto evita re-renders innecesarios.

---

## useLocale.ts — Hook Regional

**Ruta**: `src/features/locale/hooks/useLocale.ts`
**Proposito**: Proveer formateo regional de numeros y fechas basado en el locale activo.

```typescript
export function useLocale() {
  const resolvedLocale = useLocaleStore((state) => state.resolvedLocale);

  const formatNumber = useCallback(
    (value: number, options?: Intl.NumberFormatOptions): string => {
      try {
        return new Intl.NumberFormat(resolvedLocale, options).format(value);
      } catch {
        return value.toLocaleString(resolvedLocale, options);
      }
    },
    [resolvedLocale],
  );

  const formatDate = useCallback(
    (value: Date | number | string, options?: Intl.DateTimeFormatOptions): string => {
      const date = typeof value === "string" || typeof value === "number"
        ? new Date(value) : value;
      try {
        return new Intl.DateTimeFormat(resolvedLocale, options).format(date);
      } catch {
        return date.toLocaleDateString(resolvedLocale, options);
      }
    },
    [resolvedLocale],
  );

  return { formatNumber, formatDate };
}
```

**Uso tipico**:
```typescript
const { formatNumber, formatDate } = useLocale();
formatNumber(1500.5, { style: "currency", currency: "PEN" }); // "S/. 1,500.50"
formatDate(new Date(), { dateStyle: "full" });                 // "jueves, 3 de julio de 2026"
```

**Por que Intl API**: El API `Intl` del navegador ya tiene soporte nativo para formateo regional. No necesita librerias adicionales ni descarga de datos. El locale activo (`resolvedLocale`) se pasa directamente a `Intl.NumberFormat` y `Intl.DateTimeFormat`.

---

## locale-utils.ts — Utilidades Puras

**Ruta**: `src/features/locale/utils/locale-utils.ts`
**Proposito**: Funciones sin efectos secundarios para resolver y validar locales.

### resolveLocale

```typescript
export function resolveLocale(
  geoResult: GeoResult,
  navigatorLang: string | null,
): LocaleId
```

Cadena de prioridad:
1. Si `geoResult.success` → usa `geoResult.localeId`
2. Si no → `getLocaleFromNavigator(navigatorLang)` si existe
3. Si no → `DEFAULT_LOCALE` (`"es-LA"`)

### isLocaleSupported

```typescript
export function isLocaleSupported(locale: string): boolean
```

Verifica si un string dado existe en `SUPPORTED_LOCALES`.

### getLocaleFromNavigator

```typescript
export function getLocaleFromNavigator(
  navigatorLang?: string | null,
): LocaleId | null
```

Solo extrae variantes de español del navegador del usuario.
**`en-US` (y cualquier `en-*`) NO se extrae del navigator** — el inglés solo debe venir de geo-detección.
Si el navegador reporta inglés, se cae a `DEFAULT_LOCALE = "es-LA"`.

```
navigator.language = "en-US"  → null (solo geo decide inglés)
navigator.language = "es-MX"  → "es-MX"
navigator.language = "es-AR"  → "es-AR"
navigator.language = "fr-FR"  → null (no soportado)
navigator.language = "es"     → null (sin region)
```

---

## Diagrama de Flujo del Store

```
App mount
    │
    ▼
┌──────────────────────────────────────────────┐
│ LocaleInitializer.useEffect[0] (pre-auth)     │
│                                                │
│ 1. checkIfSessionExists()                     │
│    ├── userId encontrado:                     │
│    │   └── hydrateFromStorage(userId)         │
│    │       ├── true → cache valido → render  │
│    │       └── false → continuar             │
│    └── userId = null:                         │
│        └── continuar                          │
│                                                │
│ 2. detectPreAuthLocale(800)                   │
│    ├── Geo success → locale regional          │
│    ├── Geo fail → navigator.language          │
│    └── Sin red → es-LA                        │
│                                                │
│ 3. localePhaseReady = true → render           │
└──────────────────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────────────────┐
│ LocaleInitializer.useEffect[1] (post-auth)    │
│                                                │
│ Cuando: hasHydrated && isAuthenticated && user │
│                                                │
│ resolveAndCacheLocale(userId)                  │
│   ├── Cache en Dexie? → aplicar              │
│   ├── geoAlreadyRan? → persistir en Dexie    │
│   └── Sin cache ni geo → geo + fetch + guardar│
└──────────────────────────────────────────────┘
```

---

## Historial de Cambios

| Version | Fecha | Cambio |
|---------|-------|--------|
| 1.0.0 | 03 Jul 2026 | Creacion inicial |

## Archivos Relacionados

| Archivo | Ruta |
|---------|------|
| Store | `src/features/locale/store/locale-store.ts` |
| Hook principal | `src/features/locale/hooks/useLanguage.ts` |
| Hook regional | `src/features/locale/hooks/useLocale.ts` |
| Utilidades | `src/features/locale/utils/locale-utils.ts` |
