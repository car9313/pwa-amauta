## Resumen — Fase 12: Variantes regionales reales

> **Fecha**: 03 Julio 2026
> **Objetivo**: Reemplazar placeholders temporales con contenido real en todas las variantes regionales, y agregar soporte completo para inglés (en-US).

---

## Archivos modificados

### Infraestructura (Subfase 12-A)

| Archivo | Cambio |
|---------|--------|
| `locale.types.ts:1` | + `"en-US"` en `LocaleId` |
| `locale.constants.ts:9` | + `"en-US": "1.0.0"` en `LOCALE_VERSIONS`; `es-MX` → `"1.1.0"` |
| `locale.config.ts:3` | + entry `en-US` en `SUPPORTED_LOCALES` |
| `locale.config.ts:48` | `US: "es-MX"` → `US: "en-US"`; `CU: "es-MX"` → `CU: "es-LA"` |
| `locale-utils.ts:28` | `getLocaleFromNavigator` ahora detecta `en-*` además de `es-*` |

### Archivos de traducción (Subfases 12-B, 12-C, 12-D)

| Archivo | Contenido | Estrategia |
|---------|-----------|------------|
| `public/locales/en-US/translation.json` | 11 namespaces completos | Traducción completa desde es-LA |
| `public/locales/es-MX/translation.json` | auth + common (reales, sin [MX]) | Replace placeholders con MX real |
| `public/locales/es-AR/translation.json` | auth.login (diferencial, voseo) | Solo keys que cambian |
| `public/locales/es-CL/translation.json` | auth.login (diferencial) | Solo keys que cambian |
| `public/locales/es-CO/translation.json` | auth.login (diferencial) | Solo keys que cambian |
| `public/locales/es-PE/translation.json` | auth.login (diferencial) | Solo keys que cambian |

---

## Estrategia de traducción

### Inglés (en-US) — Completo
Única variante con traducción completa de todos los namespaces. i18next usa es-LA como fallback pero en-US no debería necesitarlo porque tiene todas las claves.

### Variantes español — Diferencial
Cada archivo solo contiene los keys que cambian respecto a es-LA. Lo que no está en el archivo cae automáticamente a es-LA (fallback de i18next).

| Variante | Diferencias principales vs es-LA |
|----------|----------------------------------|
| **es-MX** | "Entrar", "¿Revisa que tu correo...?", "¡Qué gusto verte..." |
| **es-AR** | Voseo: "Iniciá sesión", "Necesitás", "Registrate acá" |
| **es-CL** | "Ingresar", "¡Qué bueno verte..." |
| **es-CO** | "Ingresar", "¡Qué alegría verte...", "continuar aprendiendo" |
| **es-PE** | "Ingresar", "¡Qué bueno verte..." |

---

## Flujo completo de resolución de locale

```
1. checkIfSessionExists()
   ├── SÍ → hydrateFromStorage(userId) → cache en Dexie → render inmediato
   └── NO → detectPreAuthLocale(800ms)
            ├── Geo exitoso → LOCALE_MAP[countryCode]
            │   ├── US → "en-US" → fetch /locales/en-US/translation.json
            │   ├── MX → "es-MX" → fetch /locales/es-MX/translation.json
            │   ├── AR → "es-AR" → fetch /locales/es-AR/translation.json
            │   ├── CL, CO, PE → respectivo fetch
            │   └── Otros → "es-LA" (embebido, sin fetch)
            │
            ├── Geo falla → getLocaleFromNavigator()
            │   ├── "en-US" → "en-US"
            │   ├── "es-MX" → "es-MX"
            │   └── otro → DEFAULT_LOCALE = "es-LA"
            │
            └── Sin navegador → "es-LA"
```

## LOCALE_MAP actual

| Código | Locale |
|--------|--------|
| MX | `es-MX` |
| AR | `es-AR` |
| CL | `es-CL` |
| CO | `es-CO` |
| PE | `es-PE` |
| US | `en-US` |
| BO, VE, EC, PY, UY, CR, GT, HN, SV, NI, PA, DO, CU, PR | `es-LA` |

## Pendiente para futuras fases

- Expandir variantes español a más namespaces (navigation, dashboard, lessons, etc.)
- Agregar `LanguageSwitcher` UI para cambio manual de idioma
- Tests automatizados (Fase 10)
