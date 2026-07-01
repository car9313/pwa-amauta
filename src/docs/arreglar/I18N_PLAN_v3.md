# Plan de Internacionalización — Amauta PWA (v3)

> **Propósito**: Sistema de i18n offline-first para múltiples variantes del español latinoamericano con geo-detección pre-autenticación.
> **Estado**: ✅ Fases 0–9 completas (ajustes aplicados)
> **Documentos relacionados**: `I18N_FIXES_F0_F1.md`, `PROMPT_GEO_PREAUTH.md`

---

## Cambio Principal Respecto a v2

### ¿Por qué geo-detección pre-auth?

En v2, la geo-detección ocurría únicamente post-login. Esto significaba que las pantallas públicas (login, register) siempre mostraban `es-LA` neutro para usuarios nuevos. El requisito de negocio es internacionalización por geolocalización, lo que implica que el locale regional debe aplicarse desde el primer momento en que el usuario interactúa con la app.

La solución no requiere reescribir el sistema: solo añade una fase pre-auth al flujo de `LocaleInitializer` y una acción nueva al store. El 100% de lo implementado en Fases 0–9 sigue siendo válido.

---

## Decisiones de Arquitectura (actualizadas)

### Flujo de resolución de locale (v3)

```
FASE PRE-AUTH (mount, sin userId)
  │
  ├── 1. hydrateFromStorage()
  │       Lee Dexie buscando preferencia previa
  │       ├── Encontrada → aplica en i18next + store → FIN (usuario que vuelve)
  │       └── No encontrada → continúa a geo-detección
  │
  └── 2. detectPreAuthLocale()
          Llama a detectLocaleFromGeo() [ipapi.co, timeout 5s]
          ├── Éxito → resolveLocale(geoResult, navigator.language)
          └── Fallo (429 / timeout / red) → getLocaleFromNavigator() ?? es-LA
          Aplica en i18next (changeLanguage)
          Guarda en store: resolvedLocale, geoAlreadyRan = true
          NO persiste en Dexie (sin userId todavía)

          → Pantallas de login/register renderizan en locale regional ✅

FASE POST-AUTH (hasHydrated + isAuthenticated + userId)
  │
  └── 3. resolveAndCacheLocale(userId)
          ├── Si geoAlreadyRan = true en store:
          │     Usa resolvedLocale ya en memoria (sin llamar geo de nuevo)
          │     Fetch /locales/{locale}/translation.json si locale ≠ es-LA
          │     Persiste en Dexie con clave ${userId}:${localeId}
          │     addResourceBundle + changeLanguage
          └── Si hay cache válido en Dexie para userId:
                Aplica directamente (usuario que ya tenía cache)
```

### Regla crítica: geo-detección nunca se llama dos veces

El flag interno `geoAlreadyRan` en el store garantiza que `resolveAndCacheLocale` no repite la llamada a `ipapi.co` si ya corrió en la fase pre-auth. Una sola llamada por sesión.

### Prioridad de resolución (actualizada)

```
Dexie (userId) → Geo pre-auth (memoria) → Navigator.language → es-LA
```

---

## Ajuste Post-Fase 3 — Bugs y mejoras de UX identificados ✅

> ✅ Todos los fixes fueron aplicados. Ver `I18N_RESUMEN_APLICADO.md` para el detalle de implementación.

### Bug A — `hydrateFromStorage` no aplica locale en i18next ni retorna boolean ✅

`hydrateFromStorage` ahora retorna `Promise<boolean>` y llama `i18next.changeLanguage(pref)` cuando encuentra preferencia. La UI se actualiza al locale correcto de inmediato.

### Bug B — `setUserPreference` usa `"__global__"` como userId ✅

Firma actualizada a `setUserPreference(locale: LocaleId, userId: string)`. Ahora persiste con el `userId` real, no `"__global__"`.

### Bug C — `resolveAndCacheLocale` no detecta geo pre-resuelto ✅

Flag interno `geoAlreadyRan` añadido al store. `resolveAndCacheLocale` verifica este flag antes de llamar a `detectLocaleFromGeo`.

### Nueva acción — `detectPreAuthLocale(timeoutMs?: number)` ✅

Implementada en `locale-store.ts`. Incluye:
- `AbortController` con timeout default 800ms
- `detectLocaleFromGeo(signal)` con señal de cancelación
- Fetch de `/locales/{locale}/translation.json` si locale ≠ es-LA
- Almacenamiento en `preAuthLocaleData` (memoria, no Dexie)
- `addResourceBundle` + `changeLanguage`
- `geoAlreadyRan = true`

### Sin doble llamada a ningún recurso de red ✅

Implementado: el flag `geoAlreadyRan` y `preAuthLocaleData` garantizan que ni geo-detección ni fetch de JSON se repiten post-auth.

### Cambio en `LocaleInitializer` — Semi-blocking ✅

`LocaleInitializer` ahora es semi-blocking con `<AmautaLoadingState />` durante la fase pre-auth (máx 800ms). Flujo de 3 fases implementado.

---

## Estado de Fases

### FASE 0 — Modelo de Dominio ✅
Sin cambios respecto a v2.

### FASE 1 — Infraestructura ✅
Sin cambios. `geo-detection.service.ts`, `locale-persistence.ts`, `i18n.ts` y `db.ts` no requieren modificaciones.

### FASE 2 — Store y Hooks ✅

| # | Archivo | Estado |
|---|---------|--------|
| 2.1 | `locale-store.ts` | ✅ Bugs A/B/C corregidos + `detectPreAuthLocale` implementada |
| 2.2 | `useLanguage.ts` | ✅ Sin cambios |
| 2.3 | `useLocale.ts` | ✅ Sin cambios |
| 2.4 | `locale-utils.ts` | ✅ Sin cambios |

### FASE 3 — LocaleInitializer ✅

| # | Archivo | Estado |
|---|---------|--------|
| 3.1-3.2 | `LocaleInitializer.tsx` | ✅ Semi-blocking + flujo 3 fases implementado |
| 3.4 | `main.tsx` | ✅ Sin cambios |
| 3.5 | `sw.ts` | ✅ Sin cambios |

**Flujo actualizado de `LocaleInitializer`**:

```tsx
const [localePhaseReady, setLocalePhaseReady] = useState(false)

// Fase pre-auth (mount) — semi-blocking máx 800ms:
useEffect(() => {
  const init = async () => {
    const found = await hydrateFromStorage()  // retorna boolean
    if (found) { setLocalePhaseReady(true); return }
    await detectPreAuthLocale(800)  // AbortController, máx 800ms
    setLocalePhaseReady(true)
  }
  init()
}, [])

// Fase post-auth:
useEffect(() => {
  if (!hasAuthHydrated || !isAuthenticated || !user) return
  resolveAndCacheLocale(userId)  // usa geoAlreadyRan internamente
}, [hasAuthHydrated, isAuthenticated, user])

// Bloquea render solo durante fase pre-auth
if (!localePhaseReady) return <AmautaLoadingState />
return <>{children}</>
```

### FASES 4-9 — Archivos JSON + Migración UI ✅
Sin cambios. Los archivos de traducción y la migración de componentes no se ven afectados por este cambio.

### FASE 10 — Pruebas ⬜ (actualizada)

> Los tests deben cubrir el nuevo flujo pre-auth.

| # | Tarea | Estado | Esfuerzo |
|---|-------|--------|----------|
| 10.1 | Test: `locale-persistence` — CRUD con clave `userId:localeId`, aislamiento entre usuarios | ⬜ | 20 min |
| 10.2 | Test: `geo-detection.service` — éxito, timeout, 429, 500, país no mapeado, JSON malformado | ⬜ | 25 min |
| 10.3 | Test: `locale-store` — cadena de prioridad completa + flag `geoAlreadyRan` + bug fixes A/B/C | ⬜ | 25 min |
| 10.4 | Test: `LocaleInitializer` — flujo 3 fases: hydrate → pre-auth geo → post-auth persist | ⬜ | 35 min |
| 10.5 | Test: `locale-store.detectPreAuthLocale` — aplica en i18next, no persiste en Dexie, setea flag | ⬜ | 15 min |
| 10.6 | Test: aislamiento entre usuarios — dos usuarios distintos en mismo dispositivo | ⬜ | 15 min |

**Casos críticos que debe cubrir el test 10.4**:
- Mount sin cache en Dexie → geo corre → locale aplicado en login/register
- Mount con cache en Dexie → geo NO corre → locale de Dexie aplicado
- Post-auth con `geoAlreadyRan=true` → geo NO se repite → se persiste en Dexie
- Post-auth con cache válido en Dexie → aplica directamente
- Geo falla (429) → fallback a navigator.language → no crash

### FASE 11 — LanguageSwitcher ⬜

Sin cambios respecto a v2, salvo que `setUserPreference` ahora requiere `userId`:

```ts
// Uso en LanguageSwitcher (Fase 11)
const { user } = useAuthStore()
const { setUserPreference } = useLanguage()
// ...
setUserPreference(selectedLocale, getAuthUserId(user))
```

### FASE 12 — Variantes Regionales ⬜ (Post-MVP)
Sin cambios respecto a v2.

---

## Flujo Completo de Inicio (v3)

```
main.tsx mount
  │
  ├── import i18n.ts → i18next.init(es-LA embebido)
  │
  ├── <LocaleInitializer>
  │   │
  │   ├── useState: localePhaseReady = false → muestra <AmautaLoadingState />
  │   │
  │   ├── useEffect [mount] — SEMI-BLOCKING (máx 800ms):
  │   │   │
  │   │   ├── hydrateFromStorage() → retorna boolean
  │   │   │   ├── true (tiene cache en Dexie):
  │   │   │   │   → addResourceBundle con data completa de Dexie
  │   │   │   │   → i18next.changeLanguage(locale)
  │   │   │   │   → localePhaseReady = true → render INMEDIATO ✅
  │   │   │   └── false (usuario nuevo):
  │   │   │       → detectPreAuthLocale(800ms)
  │   │   │           ├── Geo responde en ~200ms → resuelve locale
  │   │   │           │   → fetch /locales/{locale}/translation.json
  │   │   │           │   → addResourceBundle (i18next ya tiene el locale completo)
  │   │   │           │   → render a ~200-400ms con traducciones REALES ✅
  │   │   │           ├── Geo tarda > 800ms → AbortController.abort()
  │   │   │           │   → navigator.language → mismo fetch + addResourceBundle
  │   │   │           │   → render a 800ms+ con traducciones REALES
  │   │   │           └── Sin red → error <10ms → navigator.language, sin fetch posible
  │   │   │               → render <10ms en es-LA (único disponible offline)
  │   │   └── localePhaseReady = true → <AmautaLoadingState /> desaparece
  │   │
  │   ├── {children} renderizan en locale correcto, sin flash ✅
  │   │   └── Login/Register YA en locale regional CON traducciones reales ✅
  │   │
  │   └── useEffect [post-auth: hasHydrated + isAuthenticated + userId]:
  │       └── resolveAndCacheLocale(userId)
  │           ├── Cache válido en Dexie → aplica directamente ✅
  │           └── Sin cache + geoAlreadyRan=true:
  │               → usa resolvedLocale + preAuthLocaleData de memoria
  │               → SOLO persiste en Dexie: ${userId}:${localeId}
  │               → geo NO vuelve a correr, fetch NO se repite ✅
  │
  └── App en locale correcto desde el primer render visible
```

---

## Reglas de Negocio (actualizadas)

| Regla | Descripción |
|-------|-------------|
| **Geo pre-auth semi-blocking** | `LocaleInitializer` muestra `AmautaLoadingState` hasta resolver locale. Máx 800ms para usuario nuevo. |
| **Timeout agresivo con AbortController** | 800ms no es espera fija. Geo rápida = render rápido. Geo lenta = cancel + fallback + render a 800ms. |
| **Una sola llamada a geo** | `geoAlreadyRan` garantiza que `ipapi.co` se llama máximo una vez por sesión. Post-login no repite geo. |
| **Sin flash de texto ni traducción** | Usuario nunca ve `es-LA` seguido de cambio a locale regional. El JSON regional se descarga y aplica ANTES del primer render de login/register. |
| **Fetch único de traducciones** | El JSON regional (`/locales/{locale}/translation.json`) se descarga una sola vez, en la fase pre-auth. Post-login solo se persiste lo ya descargado — sin re-fetch. |
| **Sin persistencia pre-auth** | El locale resuelto pre-auth vive en memoria hasta autenticación. Dexie solo se escribe post-login con `userId`. |
| **Persistencia post-auth** | Al autenticarse, locale se persiste en Dexie: `${userId}:${localeId}`. |
| **Locale post-timeout** | Si geo fue cancelada por timeout, el locale de `navigator.language` queda permanente para ese usuario. No se reintenta. Corregible en Fase 11. |
| **Prioridad de resolución** | Dexie (userId) → Geo pre-auth (memoria) → Navigator.language → es-LA |
| **Idioma fijo en sesión** | El locale no cambia automáticamente una vez resuelto. |
| **Versionado por locale** | `LOCALE_VERSIONS: Record<LocaleId, string>` — invalidación granular por variante. |
| **Segmentación por userId** | Dexie usa clave `${userId}:${localeId}`. Usuarios independientes en mismo dispositivo. |
| **Sin http-backend** | Toda la carga de variantes es orquestada por `LocaleInitializer` y el store. |
| **Traducciones manuales** | Sin APIs de traducción automática en runtime. |

---

## Orden de Trabajo Recomendado

```
✅ COMPLETADO:
  1. Prompt PROMPT_GEO_PREAUTH.md aplicado
     → locale-store.ts corregido + detectPreAuthLocale()
     → LocaleInitializer.tsx con flujo 3 fases
  2. pnpm build → compilación limpia ✅

⬜ PENDIENTE:
  3. Fase 10 — tests (incluye nuevos casos pre-auth)
  4. Fase 11 — LanguageSwitcher (opcional, puede diferirse)
  5. Fase 12 — variantes regionales (post-MVP)
```

---

## Resumen de Esfuerzo Restante

| Fase | Descripción | Estado | Esfuerzo |
|------|-------------|--------|----------|
| Ajuste 2.1 | `locale-store.ts` — bugs A/B/C + `detectPreAuthLocale` | ✅ | — |
| Ajuste 3.1 | `LocaleInitializer.tsx` — flujo 3 fases | ✅ | — |
| 10 | Tests | ⬜ | ~2 hr |
| 11 | LanguageSwitcher (opcional) | ⬜ | ~1.25 hr |
| 12 | Variantes regionales (post-MVP) | ⬜ | ~2.5 hr |
| | **Total restante MVP** | | **~3 hr** |
