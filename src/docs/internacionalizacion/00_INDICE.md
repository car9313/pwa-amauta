# Indice — Internacionalizacion por Geolocalizacion

> **Sistema**: i18n offline-first con geo-deteccion pre-auth y cache en Dexie
> **Version del documento**: 1.1.0
> **Ultima actualizacion**: 06 Julio 2026

---

## Orden de Lectura Recomendado

### Ruta Rapida (30 min)
Si necesitas entender como funciona sin profundizar en cada detalle:

```
01_VISION_GENERAL.md  →  09_DIAGRAMAS.md  →  10_PROBLEMAS_CONOCIDOS.md  →  11_FLUJO_LOCALE_PRIORIDAD.md
```

### Ruta Operativa (1.5 hr)
Si vas a trabajar con el codigo o mantener el sistema:

```
01_VISION_GENERAL.md  →  02_MODELO_DE_DOMINIO.md  →  04_STORE_Y_HOOKS.md
→  05_LOCALE_INITIALIZER.md  →  07_PERSISTENCIA_DEXIE.md  →  09_DIAGRAMAS.md
→  10_PROBLEMAS_CONOCIDOS.md
```

### Ruta Profunda (3 hr)
Si necesitas entender el sistema completo, incluyendo infraestructura y variantes:

```
00_INDICE.md  →  01_VISION_GENERAL.md  →  02_MODELO_DE_DOMINIO.md
→  03_INFRAESTRUCTURA.md  →  04_STORE_Y_HOOKS.md  →  05_LOCALE_INITIALIZER.md
→  06_FLUJO_PREAUTH.md  →  07_PERSISTENCIA_DEXIE.md  →  08_VARIANTES_REGIONALES.md
→  09_DIAGRAMAS.md  →  10_PROBLEMAS_CONOCIDOS.md  →  11_FLUJO_LOCALE_PRIORIDAD.md
```

---

## Glosario de Terminos

| Termino | Definicion |
|---------|-----------|
| **LocaleId** | Tipo union que representa una variante idiomatica (`"es-LA"`, `"es-MX"`, `"en-US"`, etc.) |
| **es-LA** | Espanol latino neutro. Locale por defecto, embebido en el bundle. Funciona offline siempre. |
| **GeoResult** | Tipo discriminado que representa el resultado de la deteccion geografica (exito o fallo con razon explicita) |
| **Hydrate** | Proceso de cargar datos desde Dexie a memoria (Zustand store o React Query cache) |
| **Stale** | Estado de un cache cuya version no coincide con `LOCALE_VERSIONS` actual. Dispara re-descarga. |
| **Pre-auth** | Fase antes de la autenticacion del usuario. La app muestra login/register. |
| **Post-auth** | Fase despues de que el usuario inicia sesion. La app muestra dashboard, lecciones, etc. |
| **Semi-blocking** | Comportamiento del `LocaleInitializer` que muestra pantalla de carga hasta resolver el locale, con un maximo de 800ms. |
| **AbortController** | API del navegador para cancelar peticiones HTTP en curso. Usada para timeout agresivo de geo-deteccion. |
| **addResourceBundle** | Metodo de i18next para agregar traducciones a un locale en runtime (sin reinicializar) |
| **Diferencial** | Estrategia de traduccion donde el archivo JSON solo contiene las keys que cambian respecto a es-LA. |
| **LOCALE_MAP** | Mapping de codigo de pais ISO 3166-1 a `LocaleId`. Define que variante se asigna a cada pais. |
| **LOCALE_VERSIONS** | Registro de versiones por variante. Permite invalidacion granular del cache en Dexie. |
| **Namespace** | Categoria de traducciones en i18next. Amauta tiene 11 namespaces (auth, common, navigation, etc.). |

---

## Mapa Conceptual

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DOMINIO (Fase 0)                                  │
│  locale.types.ts ←─── locale.constants.ts ←─── locale.config.ts           │
│  (LocaleId,         (LOCALE_VERSIONS,       (SUPPORTED_LOCALES,            │
│   GeoResult,          DEFAULT_LOCALE)         LOCALE_MAP)                  │
│   CacheableLocale)                                                         │
└─────────────────────────────────────────────────────────────────────────────┘
         │                        │                            │
         ▼                        ▼                            ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         INFRAESTRUCTURA (Fase 1)                            │
│                                                                             │
│  i18n.ts ───────────────► i18next.init() con es-LA embebido                 │
│  (bundle)                                                                   │
│                                                                             │
│  geo-detection.service.ts ──► detectLocaleFromGeo() a ipapi.co             │
│  (ipapi.co)                                                                 │
│                                                                             │
│  locale-persistence.ts ─────► CRUD en Dexie (clave userId:localeId)        │
│  (Dexie)                                                                  │
│                                                                             │
│  db.ts ─────────────────────► Schema Dexie v1→v2→v3                       │
│  (Dexie schema)                                                            │
└─────────────────────────────────────────────────────────────────────────────┘
         │                        │                            │
         ▼                        ▼                            ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         STORE (Fase 2)                                       │
│                                                                             │
│  locale-store.ts ───────────► Zustand store con 5 acciones                 │
│  (Zustand)                                                                  │
│                                                                             │
│  locale-utils.ts ───────────► resolveLocale, getLocaleFromNavigator         │
│  (utils)                                                                     │
└─────────────────────────────────────────────────────────────────────────────┘
         │                        │                            │
         ▼                        ▼                            ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         HOOKS (Fase 2)                                      │
│                                                                             │
│  useLanguage.ts ───────────► t(), locale, availableLocales, setPreference   │
│  (react-i18next)                                                            │
│                                                                             │
│  useLocale.ts ─────────────► formatNumber(), formatDate() via Intl API      │
│  (Intl API)                                                                │
└─────────────────────────────────────────────────────────────────────────────┘
         │                        │                            │
         ▼                        ▼                            ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      COMPONENTES (Fase 3)                                    │
│                                                                             │
│  LocaleInitializer.tsx ────► Orquestador 3 fases (pre-auth → geo → post)   │
│  (React)                                                                    │
│                                                                             │
│  main.tsx ─────────────────► Monta i18next + LocaleInitializer             │
│  (entry point)                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
         │                        │                            │
         ▼                        ▼                            ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      PERSISTENCIA (Dexie)                                    │
│                                                                             │
│  preferences table ─────────► UserPreferencesEntry + LocaleCacheEntry       │
│  (clave: id / userId:localeId)                                              │
│                                                                             │
│  Cache lifecycle: Creacion (post-auth) → Lectura (pre/post)                 │
│                   → Invalidacion (version) → Limpieza (logout)              │
└─────────────────────────────────────────────────────────────────────────────┘
         │                        │                            │
         ▼                        ▼                            ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      CARGA DINAMICA (Fase 12)                                │
│                                                                             │
│  public/locales/{locale}/translation.json ←─── Servidos por Vite           │
│  Service Worker: CacheFirst en static-resources-v1                          │
│                                                                             │
│  en-US (completo) │ es-MX (real) │ AR/CL/CO/PE (diferenciales)             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Referencia Rapida a Archivos Fuente

### Domain (Fase 0)
| Archivo | Ruta |
|---------|------|
| Tipos | `src/features/locale/domain/locale.types.ts` |
| Constantes | `src/features/locale/domain/locale.constants.ts` |
| Config | `src/features/locale/domain/locale.config.ts` |

### Infraestructura (Fase 1)
| Archivo | Ruta |
|---------|------|
| i18next init | `src/features/locale/infrastructure/i18n.ts` |
| Geo-detection | `src/features/locale/infrastructure/geo-detection.service.ts` |
| Persistencia Dexie | `src/features/locale/infrastructure/locale-persistence.ts` |
| Schema Dexie | `src/lib/api/storage/db.ts` |
| Auth storage | `src/features/auth/infrastructure/auth-storage.ts` |

### Store y Hooks (Fase 2)
| Archivo | Ruta |
|---------|------|
| Zustand store | `src/features/locale/store/locale-store.ts` |
| Hook principal | `src/features/locale/hooks/useLanguage.ts` |
| Hook regional | `src/features/locale/hooks/useLocale.ts` |
| Utilidades | `src/features/locale/utils/locale-utils.ts` |

### Componentes (Fase 3)
| Archivo | Ruta |
|---------|------|
| LocaleInitializer | `src/features/locale/components/LocaleInitializer.tsx` |
| Entry point | `src/main.tsx` |

### Recursos es-LA (embebidos)
| Carpeta | Ruta |
|---------|------|
| 11 namespaces | `src/features/locale/infrastructure/resources/es-LA/` |

### Variantes regionales (public)
| Carpeta | Ruta |
|---------|------|
| en-US | `public/locales/en-US/translation.json` |
| es-MX | `public/locales/es-MX/translation.json` |
| es-AR | `public/locales/es-AR/translation.json` |
| es-CL | `public/locales/es-CL/translation.json` |
| es-CO | `public/locales/es-CO/translation.json` |
| es-PE | `public/locales/es-PE/translation.json` |

---

## Historial de Cambios

| Version | Fecha | Cambio |
|---------|-------|--------|
| 1.0.0 | 03 Jul 2026 | Creacion inicial del sistema de documentacion |
| 1.1.0 | 06 Jul 2026 | Agregado `11_FLUJO_LOCALE_PRIORIDAD.md` con cadena de prioridad y escenarios A-H |
