## Resumen — Traducción es-MX para US y CU

> **Fecha**: 30 Junio 2026
> **Archivos modificados**: `locale.config.ts`, `geo-detection.service.ts`, `public/locales/es-MX/translation.json` (creado)

## Paso 1 — Mapear US y CU a es-MX en LOCALE_MAP

**Archivo**: `src/features/locale/domain/locale.config.ts:48`

Se añadió `US: "es-MX"` y se cambió `CU: "es-LA"` → `CU: "es-MX"`.

Ambos son temporales — cuando geo-detección devuelva US o CU, el sistema resuelve a `es-MX`, descarga el JSON regional y aplica las traducciones marcadas con `[MX]`.

```typescript
export const LOCALE_MAP: Record<string, LocaleInfo["id"]> = {
  MX: "es-MX",
  US: "es-MX",  // TEMPORAL
  CU: "es-MX",  // TEMPORAL
  // ...resto
};
```

## Paso 2 — Crear archivo de traducción es-MX

**Archivo creado**: `public/locales/es-MX/translation.json`

Contiene solo los namespaces que cambian respecto a `es-LA`:
- `auth.login` — 17 claves (title, subtitle, labels, botones, mensajes)
- `common` — 3 claves (loading, error, retry)

Cada valor lleva `[MX]` o `[México]` para identificar visualmente que el archivo se está cargando correctamente. La estructura es idéntica a `src/features/locale/infrastructure/resources/es-LA/`.

## Paso 3 — Conectar t() en login

**Sin cambios.** El componente `login-page.tsx` ya usa `useTranslation()` y todas las strings referencian claves i18n (`t("auth:login.title")`, etc.). No había texto hardcodeado que reemplazar.

## Paso 4 — Corregir mapping duplicado en geo-detection

**Archivo**: `src/features/locale/infrastructure/geo-detection.service.ts`

**Problema**: Había dos mappings separados para país → locale:
- `LOCALE_MAP` en `locale.config.ts` (se actualizó en Paso 1)
- `COUNTRY_TO_LOCALE` en `geo-detection.service.ts` (se quedó con el valor viejo)

La geo-detección usaba `COUNTRY_TO_LOCALE`, ignorando los cambios hechos en `LOCALE_MAP`. Por eso CU seguía resolviendo a `es-LA`.

**Solución**: Se eliminó `COUNTRY_TO_LOCALE` y se importó `LOCALE_MAP` directamente. Ahora ambos servicios comparten la misma fuente de verdad.

```typescript
// Antes
import type { GeoResult, LocaleId } from "../domain/locale.types";
const COUNTRY_TO_LOCALE: Record<string, LocaleId> = { CU: "es-LA", /* ... */ };

// Después
import { LOCALE_MAP } from "../domain/locale.config";
const localeId = LOCALE_MAP[countryCode];
```

## Cómo probar

1. Iniciar dev server: `pnpm dev`
2. Abrir DevTools → Application → Service Workers → marcar "Offline" (desmarcar)
3. Usar una VPN o proxy que cambie la IP a Estados Unidos o Cuba
4. Recargar la app
5. Verificar que el login muestre textos con `[MX]` y `[México]`
