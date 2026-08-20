# Flujo de Resolucion de Locale: Cadena de Prioridad

> **Proposito**: Documentar la cadena de prioridad completa para la resolucion de locale en Amauta, los escenarios contemplados y la justificacion de cada decision.
> **Estado**: ✅ Completo (v1.4.0)

---

## Cadena de Prioridad

```
1. Cache en Dexie (sesion previa del mismo usuario)
   └─ userId + localeId + data + version + countryCode
   └─ Si existe y version coincide → USA ESE LOCALE al instante (offline-safe)
   └─ En background (verifyLocaleAgainstGeo, no-bloqueante):
       └─ Offline (navigator.onLine=false) o geo falla → cache intacta
       └─ Pais actual == countryCode de la cache → no-op
       └─ Pais difiere → geo gana: hot-swap al locale correcto (sin recarga)

2. Geo-deteccion (ipapi.co, timeout 800ms pre-auth / 5s post-auth)
   └─ LOCALE_MAP[code] (variante regional: es-MX, es-CO, en-US, ...)
   └─ fallbackLocaleForCountry(code) (idioma del pais: es-LA / en-US)
   └─ Ninguno → unmapped_country → geoFailReason para decision post-auth

3. navigator.language
   └─ es-* → variante regional (es-MX, es-AR, etc.)
   └─ en-* → "en-US"
   └─ Otros → no soportado, cae al siguiente

4. es-LA (fallback final, embebido en bundle)
   └─ Siempre disponible offline
```

### Por que este orden

| Prioridad | Fuente | Confiabilidad | Offline |
|-----------|--------|---------------|---------|
| 1. Cache Dexie | Local | Alta (datos del usuario real) | Total |
| 2. Geo-deteccion | ipapi.co | Media | Ninguna |
| 3. navigator.language | Navegador | Media-alta | Total |
| 4. es-LA | Bundle | Maxima | Total |

---

## Flujo Detallado

### Fase 1: Pre-auth (pantalla de login)

```
LocaleInitializer.render()
  │
  ├─ checkIfSessionExists()
  │   └─ ¿Hay userId?
  │       ├─ SI → hydrateFromStorage(userId)
  │       │   ├─ Cache existe y valido → locale + data a i18next → READY ✅
  │       │   └─ No cache → isReady = true (sigue a detectPreAuthLocale)
  │       │
  │       └─ NO → (sigue a detectPreAuthLocale)
  │
  └─ detectPreAuthLocale(timeoutMs = 800)
      │
      ├─ detectLocaleFromGeo(AbortSignal, 800ms)
      │   ├─ Exito → locale regional
      │   │   ├─ fetch(`/locales/${locale}/translation.json`)
      │   │   ├─ OK → preAuthLocaleData = traducciones completas
      │   │   ├─ Fallo → sin traducciones regionales (fallback a es-LA)
      │   │   └─ i18next.addResourceBundle + changeLanguage()
      │   │
      │   └─ Fallo → geoFailReason = motivo
      │       └─ resolveLocale() → navigator.language
      │           ├─ es-* o en-* → usa ese locale
      │           └─ Otro → es-LA
      │
      └─ set({ resolvedLocale, geoAlreadyRan: true, geoFailReason })
          └─ READY ✅
```

### Fase 2: Post-auth (despues del login)

```
LocaleInitializer.useEffect()
  │
  ├─ ¿Hay sesion autenticada?
  │   └─ SI → determine flujo
  │
  ├─ needsGeoRetry = geoAlreadyRan && (network_error || timeout)
  │
  ├─ SI necesita retry → BLOQUEANTE
  │   ├─ setLocalePhaseReady(false) → Muestra AmautaLoadingState
  │   ├─ resolveAndCacheLocale(userId)
  │   │   ├─ detectLocaleFromGeo() (timeout 5s, sin AbortSignal externo)
  │   │   │   ├─ Exito → locale regional + fetch data + saveCachedLocale
  │   │   │   │           + i18next.addResourceBundle + changeLanguage()
  │   │   │   │           + set({ resolvedLocale, userPreference, geoFailReason: null })
  │   │   │   │
  │   │   │   └─ Fallo → saveCachedLocale locale pre-auth
  │   │   │               set({ userPreference, geoFailReason: null })
  │   │   │
  │   │   └─ Dashboard renderiza con locale final
  │   │
  │   └─ setLocalePhaseReady(true) → Dashboard visible ✅
  │
  └─ NO necesita retry → NO BLOQUEANTE (background)
      ├─ resolveAndCacheLocale(userId)
      │   ├─ Cache existe y valido → locale desde cache ✅
      │   ├─ geoAlreadyRan → persiste locale pre-auth ✅
      │   └─ !geoAlreadyRan → geo fresca (timeout 5s) + persiste ✅
      │
      └─ Dashboard renderiza inmediatamente ✅
```

---

## Escenarios

### Escenario A: Normal (geo funciona)

```
Pre-auth:  geo → exito → locale regional → login en regional
Post-auth: geoAlreadyRan=true, failReason=null → persiste regional
UX:        Sin demora. Login y dashboard en el mismo idioma.
```

### Escenario B: Sin conexion pre-auth + login con red

```
Pre-auth:  geo → network_error → navigator (en-US o es-*) → login OK
Post-auth: geoFailReason='network_error' → needsGeoRetry=true
           → BLOQUEANTE: loading → reintenta geo (5s) → exito
           → Dashboard en locale regional correcto
UX:        Login rapido en fallback → loading post-login (max 5s) → dashboard correcto
```

### Escenario C: Timeout pre-auth + login con red estable

```
Pre-auth:  geo → timeout → navigator (en-US o es-*) → login OK
Post-auth: geoFailReason='timeout' → needsGeoRetry=true
           → BLOQUEANTE: loading → reintenta geo → probable exito
           → Dashboard en locale regional correcto
UX:        Login rapido en fallback → loading post-login (tipicamente <500ms) → dashboard correcto
```

### Escenario D: Rate limited (429)

```
Pre-auth:  geo → 429 → navigator (en-US o es-*) → login OK
Post-auth: geoFailReason='rate_limited' → needsGeoRetry=false
           → NO BLOQUEANTE: persiste navigator locale
UX:        Dashboard inmediato. Usuario puede cambiar manualmente con LanguageSwitcher (Fase 11).
```

**Por que no reintentar**: El 429 significa que ipapi.co ya rechazo la peticion por exceso de requests. Reintentar inmediatamente solo generaria otro 429. No tiene sentido.

### Escenario E: Pais no mapeado

```
Pre-auth:  geo → exito pero pais sin variante regional NI idioma conocido
           → unmapped_country → navigator o es-LA
Post-auth: geoFailReason='unmapped_country' → needsGeoRetry=false
           → NO BLOQUEANTE: persiste locale resuelto
UX:        Dashboard inmediato.
```

**Por que no reintentar**: El mapa de paises no cambio entre pre-auth y post-auth. Reintentar daria el mismo resultado.

**Nota**: Con el fallback por idioma (`locale-languages.ts`), `unmapped_country` es raro: casi todo pais resuelve a `es-LA` o `en-US`.

### Escenario F: Parse error

```
Pre-auth:  geo → respuesta malformada → parse_error → es-LA
Post-auth: geoFailReason='parse_error' → needsGeoRetry=false
           → NO BLOQUEANTE: persiste es-LA
UX:        Dashboard inmediato en es-LA.
```

### Escenario G: Cache valido (sesion recurrente)

```
Pre-auth:  hydrateFromStorage(userId) → cache existe y valido
           → i18next.addResourceBundle + changeLanguage
           → locale regional sin ninguna llamada externa
Post-auth: Cache existe y valido → directamente desde cache
UX:        Instantaneo. Sin llamadas de red.
```

### Escenario H: Cache obsoleto (version cambio)

```
Pre-auth:  hydrateFromStorage(userId) → cache existe pero version obsoleta
           → isReady=true → detectPreAuthLocale(800)
           → geo + navigator + es-LA (cadena normal)
Post-auth: No cache (obsoleto) → geoAlreadyRan depende de pre-auth
UX:        Similar a escenarios A-E segun resultado de geo.
```

### Escenario I: Viaje entre paises (cache valida + pais distinto)

```
Pre-auth:  cache en-US valida (USA) → login/dashboard en en-US al instante
           verifyLocaleAgainstGeo (background, no-bloqueante):
             → geo: CO → es-CO ≠ en-US → fetch regional + hot-swap
             → cache actualizada a es-CO (countryCode=CO)
Post-auth: cache ya corregida → directo
UX:        Dashboard inmediato en en-US → cambio silencioso a es-CO
           en los primeros segundos, sin recarga ni loading.
```

**Variantes**:
- Offline al abrir la app → `navigator.onLine === false` → sin intento, cache intacta.
- Geo falla (429/red/timeout) → cache intacta.
- Mismo idioma, pais distinto (cache `es-CO` desde CO, geo dice VE → `es-LA`... o `es-CO` vs pais X hispano) → solo se refresca el `countryCode` de la cache.
- Internet regresa **mid-session** → no hay re-chequeo (regla "Idioma fijo en sesion"). La correccion espera al proximo inicio de sesion.

---

## Decisiones de Diseno

### 1. `getLocaleFromNavigator` extrae `en-US`

**Problema original**: geo fallaba por CORS/429 y usuario en US recibia `es-LA`.
**Solucion**: `navigator.language = "en-US"` ahora se traduce a `en-US` en lugar de ignorarse.
**Riesgo**: Ninguno. Si geo funciona, su resultado tiene prioridad sobre navigator.

### 2. `rate_limited` no reintenta

**Justificacion**: El 429 es una limitacion activa del servicio. Reintentar inmediatamente no la resuelve. Es mejor usar navigator y persistir ese locale.

### 3. Retry bloqueante en LocaleInitializer

**Problema**: Sin bloqueo, el dashboard renderizaba en fallback y luego cambiaba bruscamente al locale correcto (flash).
**Solucion**: Mostrar loading durante el reintento (max 5s). El usuario ya esta acostumbrado a este patron desde la fase pre-auth.
**Alternativa descartada**: Hacer el reintento en segundo plano y cambiar el locale "en caliente". Causaba flash de idioma y confundia al usuario.

### 4. Tiempo de timeout diferencial

| Fase | Timeout | Fundamento |
|------|---------|------------|
| Pre-auth | 800ms | El usuario esperando ver el login. Rapidez > precision. |
| Post-auth | 5s | El usuario ya esta dentro de la app. Precision > rapidez. |

---

## Estados del Store Relevantes

```typescript
interface LocaleState {
  resolvedLocale: LocaleId;           // Locale actualmente activo
  isReady: boolean;                   // Locale resuelto para UI
  userPreference: LocaleId | null;    // Preferencia persistida del usuario
  geoAlreadyRan: boolean;             // Geo se ejecuto en pre-auth
  preAuthLocaleData: Record<...> | null; // Traducciones precargadas en pre-auth
  preAuthCountryCode: string | null;  // Pais de la geo pre-auth (se persiste con la cache)
  geoFailReason: GeoFailReason | null;   // Por que fallo geo (solo si fallo)
  geoVerificationInFlight: boolean;   // Guard anti-duplicados de verifyLocaleAgainstGeo

  verifyLocaleAgainstGeo: (userId: string) => Promise<void>; // Verificacion no-bloqueante al iniciar sesion con cache valida
}
type GeoFailReason =
  | "timeout"
  | "rate_limited"
  | "network_error"
  | "unmapped_country"
  | "parse_error";
```

---

## Referencias

| Documento | Contenido |
|-----------|-----------|
| `10_PROBLEMAS_CONOCIDOS.md` | Historial de bugs y fixes |
| `05_LOCALE_INITIALIZER.md` | Componente LocaleInitializer |
| `06_FLUJO_PREAUTH.md` | Flujo pre-auth detallado |
| `04_STORE_Y_HOOKS.md` | Store locale-store.ts |
| `03_INFRAESTRUCTURA.md` | Servicios de geo y persistencia |

---

## Historial de Cambios

| Version | Fecha | Cambio |
|---------|-------|--------|
| 1.0.0 | 06 Jul 2026 | Creacion inicial. Documentacion de cadena de prioridad, escenarios A-H y decisiones de diseno. |
| 1.1.0 | 20 Ago 2026 | Cadena actualizada: geo con fallback por idioma del pais + verificacion background al iniciar sesion. Escenario E actualizado, nuevo Escenario I (viaje). Nuevos estados `preAuthCountryCode`, `geoVerificationInFlight` y accion `verifyLocaleAgainstGeo`. |
