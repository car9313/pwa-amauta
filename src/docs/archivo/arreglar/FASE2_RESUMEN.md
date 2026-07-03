# Resumen Fase 2 — Store y Hooks de i18n

> **Plan**: `I18N_PLAN_v2.md` · **Fixes aplicados previamente**: `I18N_FIXES_F0_F1.md`
> **Fecha**: 2026-06-27 · **Estado**: ✅ Completado

---

## Archivos Creados (4)

| # | Archivo | Descripción |
|---|---------|-------------|
| 2.1 | `src/features/locale/store/locale-store.ts` | Zustand store |
| 2.2 | `src/features/locale/hooks/useLanguage.ts` | Hook principal `{ t, locale, setPreference, ... }` |
| 2.3 | `src/features/locale/hooks/useLocale.ts` | Hook regional `{ formatNumber, formatDate }` |
| 2.4 | `src/features/locale/utils/locale-utils.ts` | Utilidades puras |

---

## Detalle por Tarea

### 2.1 — `locale-store.ts`

**Estado del store**:
| Campo | Tipo | Default | Descripción |
|-------|------|---------|-------------|
| `resolvedLocale` | `LocaleId` | `"es-LA"` | Locale activo actualmente en i18next |
| `isReady` | `boolean` | `false` | Store hidratado (no bloqueante) |
| `userPreference` | `LocaleId \| null` | `null` | Preferencia guardada del usuario |

**Acciones públicas**:
| Acción | Propósito |
|--------|-----------|
| `hydrateFromStorage()` | Lee preferencia de Dexie sin triggers externos (uso en splash/pre-auth) |
| `resolveAndCacheLocale(userId)` | Orquestación completa: Dexie → Geo → fallback → persistir → changeLanguage |
| `setUserPreference(locale)` | Cambio manual de idioma (para Fase 11) |
| `resetLocale()` | Vuelve a es-LA, limpia preferencia en memoria |

**Selectores compartidos**: `selectResolvedLocale`, `selectIsLocaleReady`

**Flujo de `resolveAndCacheLocale`**:
```
1. getUserCachedLocale(userId) en Dexie
2. ¿Cache válido y versión coincide?
   ├── Sí → addResourceBundle por namespace → changeLanguage → store
   └── No → detectLocaleFromGeo()
            → resolveLocale(geoResult, navigator.language)
            → saveLocalePreference(userId, resolved)
            → Si locale ≠ es-LA → fetch /locales/{locale}/translation.json
            → saveCachedLocale(userId, data)
            → addResourceBundle → changeLanguage → store
```

### 2.2 — `useLanguage.ts`

Hook principal que combina `useTranslation` de react-i18next con el store.

```typescript
const { t, locale, i18n, userPreference, availableLocales,
        isReady, setPreference, resolveAndCacheLocale, resetLocale } = useLanguage();
```

### 2.3 — `useLocale.ts`

Utilidades regionales basadas en `Intl` API.

```typescript
const { formatNumber, formatDate } = useLocale();
formatNumber(1500.5, { style: "currency", currency: "PEN" })
formatDate(new Date(), { dateStyle: "full" })
```

### 2.4 — `locale-utils.ts`

Funciones puras sin efectos secundarios.

| Función | Firma | Propósito |
|---------|-------|-----------|
| `resolveLocale` | `(GeoResult, string\|null) => LocaleId` | Cadena de prioridad: Geo → Navigator → es-LA |
| `isLocaleSupported` | `(string) => boolean` | Verifica contra `SUPPORTED_LOCALES` |
| `getLocaleFromNavigator` | `(string?\|null) => LocaleId\|null` | Extrae `es-XX` de `navigator.language` |

---

## Impacto en la Aplicación

### Lo que cambia

| Antes | Después |
|-------|---------|
| Sin store de locale, sin estado global | `useLocaleStore` con estado reactivo del locale resuelto |
| Sin hooks de i18n | `useLanguage()` disponible en cualquier componente |
| Sin utilidades regionales | `useLocale()` con `formatNumber`/`formatDate` por locale |
| Sin lógica de resolución | `resolveAndCacheLocale(userId)` orquesta Dexie → Geo → fallback |

### Lo que NO cambia (aún)

- Los componentes siguen usando strings hardcodeados (Fases 5-9)
- `LocaleInitializer` aún no existe (Fase 3)
- No hay variantes regionales descargables (Fase 12)
- No hay LanguageSwitcher en UI (Fase 11)

### Preparado para Fase 3

`LocaleInitializer` (Fase 3.1-3.3) solo necesita:
1. Llamar `useLocaleStore.getState().hydrateFromStorage()` en mount
2. Escuchar AuthStore `isAuthenticated + hasHydrated + userId`
3. Llamar `resolveAndCacheLocale(userId)` cuando haya userId

El store ya contiene toda la lógica de orquestación; `LocaleInitializer` será puramente un delegado.

---

## Verificación

```bash
pnpm build    # ✅ tsc -b && vite build — sin errores
pnpm lint     # ✅ Sin advertencias nuevas
```
