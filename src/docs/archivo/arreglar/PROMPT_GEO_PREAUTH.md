# Prompt — Geo-detección Pre-Auth + Fixes locale-store (v2)

## Contexto del proyecto

Estoy trabajando en **Amauta**, una PWA educativa offline-first para niños de 3–9 años.
Stack: React 19, TypeScript, Vite, Tailwind CSS v4, Zustand, Dexie/IndexedDB, i18next, Workbox.

El sistema de i18n está implementado en `src/features/locale/`. Tengo:

- `domain/`: tipos (`LocaleId`, `CacheableLocale`, `GeoResult`), constantes (`DEFAULT_LOCALE`, `LOCALE_VERSIONS`, `LOCALE_NAMESPACES`), config, errors
- `infrastructure/`: `i18n.ts` (resources embebidos es-LA, sin http-backend), `locale-persistence.ts` (CRUD Dexie con clave `${userId}:${localeId}`), `geo-detection.service.ts` (retorna `GeoResult` discriminado, maneja 429)
- `store/locale-store.ts`: Zustand store con `hydrateFromStorage`, `resolveAndCacheLocale(userId)`, `setUserPreference`, `resetLocale`
- `components/LocaleInitializer.tsx`: componente NO blocking que orquesta el sistema

---

## Archivos actuales

### `locale-store.ts`

```typescript
import { create } from "zustand";
import i18next from "i18next";
import type { LocaleId } from "../domain/locale.types";
import { DEFAULT_LOCALE, LOCALE_NAMESPACES } from "../domain/locale.constants";
import { detectLocaleFromGeo } from "../infrastructure/geo-detection.service";
import {
  saveLocalePreference,
  getLocalePreference,
  getUserCachedLocale,
  saveCachedLocale,
  isLocaleStale,
} from "../infrastructure/locale-persistence";
import { resolveLocale, getLocaleFromNavigator } from "../utils/locale-utils";

interface LocaleState {
  resolvedLocale: LocaleId;
  isReady: boolean;
  userPreference: LocaleId | null;

  hydrateFromStorage: () => Promise<void>;
  resolveAndCacheLocale: (userId: string) => Promise<void>;
  setUserPreference: (locale: LocaleId) => Promise<void>;
  resetLocale: () => void;
}

export const useLocaleStore = create<LocaleState>((set) => ({
  resolvedLocale: DEFAULT_LOCALE,
  isReady: false,
  userPreference: null,

  hydrateFromStorage: async () => {
    const pref = await getLocalePreference();
    if (pref) {
      set({ userPreference: pref, resolvedLocale: pref });
    }
    set({ isReady: true });
  },

  resolveAndCacheLocale: async (userId) => {
    const cached = await getUserCachedLocale(userId);

    if (cached && !isLocaleStale(cached)) {
      const data = cached.data as Record<string, Record<string, unknown>>;
      for (const ns of LOCALE_NAMESPACES) {
        if (data[ns]) {
          i18next.addResourceBundle(cached.localeId, ns, data[ns], true, true);
        }
      }
      await i18next.changeLanguage(cached.localeId);
      set({ resolvedLocale: cached.localeId, isReady: true, userPreference: cached.localeId });
      return;
    }

    const geoResult = await detectLocaleFromGeo();
    const resolved = resolveLocale(geoResult, getLocaleFromNavigator());

    await saveLocalePreference(userId, resolved);

    if (resolved !== DEFAULT_LOCALE) {
      try {
        const response = await fetch(`/locales/${resolved}/translation.json`);
        if (response.ok) {
          const remoteData = await response.json() as Record<string, Record<string, unknown>>;
          await saveCachedLocale(userId, resolved, remoteData);
          for (const ns of LOCALE_NAMESPACES) {
            if (remoteData[ns]) {
              i18next.addResourceBundle(resolved, ns, remoteData[ns], true, true);
            }
          }
        }
      } catch {
        /* Regional files not available yet — fall through to es-LA */
      }
    }

    await i18next.changeLanguage(resolved);
    set({ resolvedLocale: resolved, userPreference: resolved, isReady: true });
  },

  setUserPreference: async (locale) => {
    set({ userPreference: locale, resolvedLocale: locale });
    await saveLocalePreference("__global__", locale);
    await i18next.changeLanguage(locale);
  },

  resetLocale: () => {
    set({ resolvedLocale: DEFAULT_LOCALE, userPreference: null });
  },
}));

export const selectResolvedLocale = (state: LocaleState) => state.resolvedLocale;
export const selectIsLocaleReady = (state: LocaleState) => state.isReady;
```

### `LocaleInitializer.tsx`

```typescript
import { useEffect, useRef } from "react";
import { useAuthStore } from "@/features/auth/presentation/store/auth-store";
import { useLocaleStore } from "@/features/locale/store/locale-store";
import type { AuthUser } from "@/features/auth/domain/types";

function getAuthUserId(user: AuthUser): string {
  switch (user.role) {
    case "student": return user.studentId;
    case "parent": return user.parentId;
    case "teacher": return user.teacherId;
  }
}

export function LocaleInitializer({ children }: { children: React.ReactNode }) {
  const hasAuthHydrated = useAuthStore((s) => s.hasHydrated);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const localeIsReady = useLocaleStore((s) => s.isReady);
  const hydrateFromStorage = useLocaleStore((s) => s.hydrateFromStorage);
  const hasHydratedLocale = useRef(false);

  useEffect(() => {
    if (localeIsReady || hasHydratedLocale.current) return;
    hasHydratedLocale.current = true;
    hydrateFromStorage();
  }, [localeIsReady, hydrateFromStorage]);

  useEffect(() => {
    if (!hasAuthHydrated || !isAuthenticated || !user) return;
    const userId = getAuthUserId(user);
    useLocaleStore.getState().resolveAndCacheLocale(userId);
  }, [hasAuthHydrated, isAuthenticated, user]);

  return <>{children}</>;
}
```

---

## Cambios que necesito

### Cambio 1 — Geo-detección pre-auth con timeout agresivo y semi-blocking

Quiero que la geo-detección ocurra **antes del login**, en el primer mount del componente, para que las pantallas públicas (login, register) ya estén en el locale regional del usuario.

**Comportamiento de UX requerido**:
- El usuario NO debe ver un flash de texto en `es-LA` seguido de un cambio al locale regional.
- `LocaleInitializer` debe ser **semi-blocking**: muestra `<AmautaLoadingState />` mientras resuelve el locale pre-auth, luego renderiza `{children}`.
- El tiempo de espera máximo es **800ms** (timeout agresivo con `AbortController`).
- Si el usuario ya tiene locale en Dexie (usuario que vuelve), el render es inmediato — cero espera.

**El timeout de 800ms NO es una espera fija**:
- Conexión rápida (geo responde en ~200ms): render a los 200ms.
- Conexión lenta (geo no responde en 800ms): `AbortController` cancela la petición, fallback a `navigator.language`, render inmediato a los 800ms exactos.
- Sin conexión (error de red instantáneo): render en <10ms.

**El flujo completo debe ser**:

```
Mount (pre-auth):
  1. hydrateFromStorage()
     ├── Encuentra locale en Dexie:
     │   → addResourceBundle con data de Dexie (ya completa, todos los namespaces)
     │   → i18next.changeLanguage(locale)  ← BUG A a corregir
     │   → store actualizado
     │   → localePhaseReady = true → render inmediato (0ms)
     └── No encuentra locale → continúa

  2. detectPreAuthLocale(timeoutMs: 800)
     ├── AbortController con setTimeout(800ms)
     ├── detectLocaleFromGeo() con ese AbortController
     │   ├── Responde antes de 800ms:
     │   │   → clearTimeout
     │   │   → resolveLocale(geoResult, getLocaleFromNavigator())
     │   │   → Si resolved !== DEFAULT_LOCALE:
     │   │       fetch /locales/{resolved}/translation.json   ← NUEVO, pre-auth
     │   │       addResourceBundle(resolved, data) por cada namespace
     │   │       guarda `data` en store como `preAuthLocaleData` (memoria, NO Dexie)
     │   │   → i18next.changeLanguage(resolved)
     │   │   → store: resolvedLocale, geoAlreadyRan = true
     │   │   → Login/Register YA renderizan con traducciones reales de ese locale ✅
     │   └── No responde en 800ms:
     │       → AbortController.abort() (cancela la petición HTTP)
     │       → GeoResult: { success: false, reason: 'timeout' }
     │       → fallback: getLocaleFromNavigator() ?? DEFAULT_LOCALE
     │       → Si fallback !== DEFAULT_LOCALE: mismo fetch + addResourceBundle que arriba
     │       → i18next.changeLanguage(fallback)
     │       → store: resolvedLocale = fallback, geoAlreadyRan = true
     └── localePhaseReady = true → render

Post-auth (hasAuthHydrated + isAuthenticated + userId):
  3. resolveAndCacheLocale(userId)
     ├── Lee Dexie con userId
     │   └── Cache válido y no stale:
     │       → addResourceBundle + changeLanguage → FIN
     │       (usuario que vuelve, no importa geoAlreadyRan)
     │
     └── Sin cache válido en Dexie:
         ├── geoAlreadyRan = true:
         │   → Usa resolvedLocale ya en store (resultado de pre-auth)
         │   → NO llama a detectLocaleFromGeo de nuevo
         │   → Si resolvedLocale ≠ DEFAULT_LOCALE Y hay preAuthLocaleData en store:
         │       → saveCachedLocale(userId, resolvedLocale, preAuthLocaleData)
         │       → SOLO PERSISTE — NO vuelve a hacer fetch del JSON ✅
         │       → Los recursos ya están en i18next desde el paso 2
         │   → Si resolvedLocale = DEFAULT_LOCALE (fallback a es-LA):
         │       solo persiste la preferencia en Dexie, no fetch (es-LA ya embebido)
         └── geoAlreadyRan = false (no debería ocurrir, pero por seguridad):
             → flujo completo: detectLocaleFromGeo (timeout 5s) → resolver → fetch → persistir
```

**Resumen de llamadas de red por sesión nueva**:
```
ipapi.co                              → 1 llamada (pre-auth)
/locales/{locale}/translation.json    → 1 llamada (pre-auth, si locale ≠ es-LA)
Dexie write                           → 1 escritura (post-auth, solo persiste lo ya descargado)
```
Ninguna de las dos llamadas de red se repite post-login. El fetch del JSON ocurre pre-auth para que login/register ya muestren las traducciones reales del locale detectado, no placeholders en es-LA.

**Regla crítica**: `detectLocaleFromGeo` nunca se llama dos veces en la misma sesión. El flag `geoAlreadyRan` garantiza esto. Una vez que geo corrió pre-auth (incluso si fue cancelada por timeout), `resolveAndCacheLocale` usa el resultado que quedó en memoria.

**Importante sobre conexión lenta y locale guardado en Dexie**:
Si la geo fue cancelada por timeout de 800ms y el locale guardado en Dexie es el de `navigator.language`, ese locale permanece para ese usuario en visitas siguientes. La geo **no vuelve a correr** en el post-login para intentar obtener un mejor resultado. El usuario puede corregir su locale manualmente desde settings (Fase 11). Esto es comportamiento esperado y correcto.

### Cambio 2 — Tres bugs en `locale-store.ts` a corregir

**Bug A**: `hydrateFromStorage` lee la preferencia de Dexie y la guarda en el store, pero nunca llama `i18next.changeLanguage()`. La UI se queda en `es-LA` aunque el store sepa que el locale es `es-MX`. Además, `hydrateFromStorage` debe retornar `Promise<boolean>` — `true` si encontró locale, `false` si no — para que `LocaleInitializer` sepa si debe disparar geo-detección.

**Bug B**: `setUserPreference` usa `"__global__"` como userId, rompiendo la segmentación por usuario:
```ts
await saveLocalePreference("__global__", locale) // ❌
```
Cambia la firma a `setUserPreference(locale: LocaleId, userId: string)`.

**Bug C**: `resolveAndCacheLocale` no tiene forma de saber si la geo ya corrió pre-auth. Sin el flag `geoAlreadyRan`, siempre llama a `detectLocaleFromGeo` cuando no hay cache en Dexie, repitiendo la llamada innecesariamente.

### Cambio 3 — Nueva acción `detectPreAuthLocale` en el store

```typescript
detectPreAuthLocale: (timeoutMs?: number) => Promise<void>
```

- `timeoutMs` default: `800`
- Crea un `AbortController` interno y un `setTimeout(timeoutMs)`
- Llama a `detectLocaleFromGeo()` pasándole la señal del AbortController
- Si responde antes del timeout: `clearTimeout`, resuelve locale con `resolveLocale`
- Si no responde: `abort()`, fallback a `getLocaleFromNavigator() ?? DEFAULT_LOCALE`
- **Si el locale resuelto (geo o fallback) ≠ `DEFAULT_LOCALE`**:
  - `fetch(/locales/{resolved}/translation.json)`
  - Por cada namespace en `LOCALE_NAMESPACES`: `i18next.addResourceBundle(resolved, ns, data[ns], true, true)`
  - Guarda `data` completo en el store como `preAuthLocaleData: Record<string, unknown> | null` (en memoria, **NO** en Dexie — no hay `userId` todavía)
  - Si el fetch falla (red, 404, JSON inválido): captura el error, NO rompe el flujo, deja `preAuthLocaleData = null` y el locale efectivo queda en `es-LA` aunque `resolvedLocale` diga otra cosa (fallback silencioso a nivel de UI, ya que i18next usará `es-LA` si no hay bundle para el locale resuelto)
- Aplica en `i18next.changeLanguage(resolved)`
- Actualiza store: `resolvedLocale = resolved`, `geoAlreadyRan = true`
- **NO persiste en Dexie** (sin userId todavía) — ni la preferencia ni el JSON descargado

> Nota: `detectLocaleFromGeo` en `geo-detection.service.ts` debe aceptar un `AbortSignal` opcional. Si actualmente no lo acepta, añade ese parámetro: `detectLocaleFromGeo(signal?: AbortSignal): Promise<GeoResult>`. Si ya lo acepta, no cambies nada más en ese archivo.

### Cambio 5 — `resolveAndCacheLocale` reutiliza `preAuthLocaleData` sin re-fetch

Cuando `geoAlreadyRan === true` y no hay cache válido en Dexie:
- Si `preAuthLocaleData !== null`: el JSON ya fue descargado y aplicado en `addResourceBundle` durante `detectPreAuthLocale`. `resolveAndCacheLocale` **solo** debe llamar `saveCachedLocale(userId, resolvedLocale, preAuthLocaleData)` para persistir — **sin volver a hacer fetch**.
- Si `preAuthLocaleData === null` (el fetch pre-auth falló o el locale resuelto es `es-LA`): comportamiento actual, sin fetch adicional (es-LA ya está embebido).
- Después de persistir, limpiar `preAuthLocaleData` del store (ya cumplió su propósito).

### Cambio 6 — `LocaleInitializer` semi-blocking

```tsx
// Estado local para controlar el render
const [localePhaseReady, setLocalePhaseReady] = useState(false)

// Fase pre-auth (mount):
useEffect(() => {
  const init = async () => {
    const found = await hydrateFromStorage()  // retorna boolean ahora
    if (found) {
      setLocalePhaseReady(true)
      return
    }
    await detectPreAuthLocale(800)  // semi-blocking, máx 800ms
    setLocalePhaseReady(true)
  }
  init()
}, [])

// Fase post-auth:
useEffect(() => {
  if (!hasAuthHydrated || !isAuthenticated || !user) return
  const userId = getAuthUserId(user)
  useLocaleStore.getState().resolveAndCacheLocale(userId)
}, [hasAuthHydrated, isAuthenticated, user])

// Semi-blocking: solo bloquea durante la fase pre-auth
if (!localePhaseReady) return <AmautaLoadingState />

return <>{children}</>
```

`AmautaLoadingState` está en `@/features/ui/amauta-ds/amauta-loading-state`. Impórtalo correctamente.

---

## Restricciones

- NO cambiar las firmas de `saveCachedLocale`, `getCachedLocale`, `getUserCachedLocale`, `isLocaleStale` — están implementadas y funcionan correctamente
- `detectLocaleFromGeo` puede recibir un `AbortSignal` opcional como único cambio permitido en ese archivo
- NO añadir nuevas dependencias npm
- El flag `geoAlreadyRan` debe ser interno al store — no exportado como selector público
- TypeScript estricto — sin `any`, sin casts innecesarios
- Mantener los selectores `selectResolvedLocale` y `selectIsLocaleReady`
- `LocaleInitializer` no contiene lógica de negocio — solo orquesta llamadas al store

---

## Output esperado

1. **`geo-detection.service.ts`**: solo si necesita el parámetro `signal?: AbortSignal`. Si ya lo tiene, omitir este archivo.
2. **`locale-store.ts`** completo:
   - Bug A corregido (`hydrateFromStorage` retorna `Promise<boolean>` y llama `changeLanguage`)
   - Bug B corregido (`setUserPreference` recibe `userId`)
   - Bug C corregido (flag interno `geoAlreadyRan`)
   - Nueva acción `detectPreAuthLocale(timeoutMs?: number)` que incluye fetch + addResourceBundle pre-auth cuando el locale resuelto ≠ es-LA
   - Nuevo campo interno `preAuthLocaleData: Record<string, unknown> | null` en el store
   - `resolveAndCacheLocale` actualizado para respetar `geoAlreadyRan` y reutilizar `preAuthLocaleData` sin re-fetch
3. **`LocaleInitializer.tsx`** completo con flujo semi-blocking de 3 fases

Todos los archivos deben compilar con `tsc --strict` sin errores.
