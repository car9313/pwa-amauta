# Diagramas — Internacionalizacion por Geolocalizacion

> **Proposito**: Diagramas ASCII que ilustran los flujos del sistema de i18n, las relaciones entre componentes y el arbol de archivos.
> **Nota**: Estos diagramas son de texto. Para una version visual, usar herramienta de diagramas (Mermaid, Draw.io, etc.)

---

## 1. Flujo de Inicio Completo

```
main.tsx mount
    │
    ├── import i18n.ts → i18next.init() con es-LA embebido
    │   └── resources: { "es-LA": { auth, common, navigation, ... } }
    │
    ├── <LocaleInitializer>
    │   │
    │   ├── useState: localePhaseReady = false
    │   │   └── render: <AmautaLoadingState />
    │   │
    │   ├── useEffect [mount]:
    │   │   │
    │   │   ├── 1. checkIfSessionExists()
    │   │   │   │
    │   │   │   ├── SI (userId encontrado):
    │   │   │   │   └── hydrateFromStorage(userId)
    │   │   │   │       ├── Cache valido → addResourceBundle + changeLanguage
    │   │   │   │       │   → localePhaseReady = true
    │   │   │   │       │   → Render INMEDIATO en locale regional ✅
    │   │   │   │       │
    │   │   │   │       └── Cache invalido/no existe
    │   │   │   │           → localePhaseReady = false
    │   │   │   │           → continua a detectPreAuthLocale
    │   │   │   │
    │   │   │   └── NO (sin sesion):
    │   │   │       └── localePhaseReady = false
    │   │   │           → continua a detectPreAuthLocale
    │   │   │
    │   │   └── 2. detectPreAuthLocale(800ms)
    │   │       ├── Geo responde rapido (~200ms)
    │   │       │   → fetch regional JSON → addResourceBundle
    │   │       │   → changeLanguage → localePhaseReady = true
    │   │       │   → Render a ~400ms en locale regional ✅
    │   │       │
    │   │       ├── Geo timeout (>800ms)
    │   │       │   → AbortController.abort()
    │   │       │   → getLocaleFromNavigator()
    │   │       │   → fetch regional JSON → addResourceBundle
    │   │       │   → changeLanguage → localePhaseReady = true
    │   │       │   → Render a ~800ms+ en locale del navegador ✅
    │   │       │
    │   │       └── Sin red
    │   │           → Error inmediato
    │   │           → getLocaleFromNavigator()
    │   │           → fetch falla (sin JSON regional)
    │   │           → changeLanguage("es-LA") → localePhaseReady = true
    │   │           → Render a <10ms en es-LA ⚠️
    │   │
    │   └── useEffect [post-auth: hasHydrated + isAuthenticated + user]:
    │       └── resolveAndCacheLocale(userId)
    │           ├── Cache valido en Dexie → aplica directamente
    │           ├── geoAlreadyRan=true → persiste datos de memoria en Dexie
    │           └── geoAlreadyRan=false → geo + fetch + persistir
    │
    └── App renderiza en locale correcto
```

---

## 2. Flujo Pre-auth (cache vs geo)

```
App mount
    │
    ▼
┌─────────────────────────────┐
│ checkIfSessionExists()      │
│                             │
│ ¿Hay tokens en Dexie?       │
└─────────────────────────────┘
    │                    │
    SI                  NO
    │                    │
    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐
│ hydrateFrom     │  │ detectPreAuth   │
│ Storage(userId) │  │ Locale(800)     │
└─────────────────┘  └─────────────────┘
    │                    │
    ├── true          ┌──┴──────────┐
    │   (cache OK)    │             │
    │                 ▼             ▼
    │           ┌──────────┐  ┌──────────┐
    │           │ Geo OK   │  │ Geo fail │
    │           │ → locale │  │ → navig  │
    │           │ regional │  │ language │
    │           └──────────┘  └──────────┘
    │                 │             │
    └──────┬──────────┴─────────────┘
           │
           ▼
┌─────────────────────┐
│ localePhaseReady    │
│ = true              │
│ → Render            │
└─────────────────────┘
```

---

## 3. Flujo Post-auth

```
AuthStore: hasHydrated + isAuthenticated + user
    │
    ▼
resolveAndCacheLocale(userId)
    │
    ├── 1. getUserCachedLocale(userId)
    │       │
    │       ├── Existe y NO stale:
    │       │   ├── addResourceBundle (desde Dexie)
    │       │   ├── changeLanguage
    │       │   └── FIN ✅
    │       │
    │       └── No existe o stale:
    │           │
    │           ├── 2. ¿geoAlreadyRan?
    │           │       │
    │           │       ├── SI:
    │           │       │   ├── saveCachedLocale(userId, locale, preAuthData)
    │           │       │   ├── addResourceBundle (si preAuthData existe)
    │           │       │   └── FIN ✅
    │           │       │
    │           │       └── NO:
    │           │           │
    │           │           ├── 3. detectLocaleFromGeo()
    │           │           ├── resolveLocale()
    │           │           │
    │           │           ├── locale != es-LA:
    │           │           │   ├── fetch /locales/{locale}/translation.json
    │           │           │   ├── saveCachedLocale(userId, locale, data)
    │           │           │   └── addResourceBundle
    │           │           │
    │           │           └── locale = es-LA:
    │           │               └── saveCachedLocale(userId, "es-LA", {})
    │           │
    │           └── changeLanguage
    │               FIN ✅
```

---

## 4. Flujo Offline

### Con cache en Dexie (sesion activa)

```
Sin internet
    │
    ▼
checkIfSessionExists() → "stu_001" (token en Dexie)
    │
    ▼
hydrateFromStorage("stu_001")
    │
    ├── getUserCachedLocale → entry: { localeId: "es-MX", data: {...} }
    ├── isLocaleStale → false (version coincide)
    ├── addResourceBundle("es-MX", "auth", data["auth"])
    ├── addResourceBundle("es-MX", "common", data["common"])
    ├── ... (todos los namespaces disponibles)
    ├── i18next.changeLanguage("es-MX")
    │
    └── localePhaseReady = true → Render en es-MX ✅
        (login/register NO aparecen, sesion ya activa)
```

### Sin cache en Dexie (usuario nuevo o logout)

```
Sin internet
    │
    ▼
checkIfSessionExists() → null
    │
    ▼
detectPreAuthLocale(800)
    ├── detectLocaleFromGeo()
    │   └── Error inmediato (<10ms): { success: false, reason: "network_error" }
    │
    ├── getLocaleFromNavigator() → "es-MX" (si configurado)
    │
    ├── fetch /locales/es-MX/translation.json
    │   └── Falla (sin red)
    │
    └── changeLanguage("es-LA") → Render en espanol neutro ⚠️

    (El unico locale disponible offline sin cache es es-LA)
```

---

## 5. Flujo Sesion Recurrente

```
Usuario abre app (2da visita, con cache)
    │
    ▼
import i18n.ts → i18next.init(es-LA)   [<1ms]
    │
    ▼
<LocaleInitializer>
    │
    ├── localePhaseReady = false
    │   → <AmautaLoadingState />  [render inicial, apenas visible]
    │
    ├── checkIfSessionExists() → "stu_001"
    │
    ├── hydrateFromStorage("stu_001")
    │   ├── getUserCachedLocale → es-MX cache
    │   ├── addResourceBundle (todos los ns desde Dexie)
    │   ├── changeLanguage("es-MX")
    │   └── localePhaseReady = true   [~5ms]
    │
    ├── AuthInitializer tambien corre en paralelo:
    │   ├── hydrateFromStorage() → tokens desde Dexie
    │   ├── isAuthenticated = true
    │   └── user = datos del usuario
    │
    ├── useEffect post-auth:
    │   └── resolveAndCacheLocale("stu_001")
    │       ├── getUserCachedLocale → cache valido
    │       ├── addResourceBundle (confirmacion)
    │       └── changeLanguage("es-MX")
    │
    └── Render dashboard en es-MX desde el primer frame visible ✅
```

---

## 6. Flujo Logout y Re-ingreso

```
┌──────────   Sesion activa   ──────────┐
                                         │
Usuario hace logout                       │
    │                                     │
    ├── clearAuth() en Dexie             │
    │   → tokens borrados               │
    │                                     │
    └── resetLocale() en store           │
        → resolvedLocale = "es-LA"       │
        → geoAlreadyRan = false          │
                                         │
┌────────   App cerrada   ──────────────┘
    │
    ▼
Usuario abre app (sin internet)
    │
    ├── checkIfSessionExists() → null
    │   (tokens borrados en logout)
    │
    ├── hydrateFromStorage no se ejecuta
    │   (no hay userId)
    │
    ├── detectPreAuthLocale(800)
    │   ├── Geo falla (sin red)
    │   ├── navigator.language → si es "es-AR"
    │   ├── fetch falla (sin red)
    │   └── changeLanguage("es-AR") no funciona
    │       (no hay bundle regional, no hay cache)
    │
    └── Login en es-LA ⚠️
        (El cache de es-AR sigue en Dexie, pero no hay userId
         para buscarlo sin sesion activa)
```

---

## 7. Diagrama de Relacion entre Archivos (Imports)

```
locale.types.ts           locale.constants.ts       locale.config.ts
    │                          │                        │
    └────────────┬─────────────┴───────────────┬────────┘
                 │                             │
                 ▼                             ▼
         locale-persistence.ts          geo-detection.service.ts
                 │                             │
                 └────────────┬────────────────┘
                              │
                              ▼
                      locale-store.ts
                           │    │
                    ┌──────┘    └──────┐
                    ▼                  ▼
              useLanguage.ts     useLocale.ts
                    │                  │
                    └──────┬───────────┘
                           │
                           ▼
                  LocaleInitializer.tsx
                           │
                    ┌──────┴──────┐
                    ▼             ▼
              main.tsx        auth-storage.ts
                                        │
                                        ▼
                                  AuthStore (auth-store.ts)

--- Capa externa ---
locale-utils.ts (utilidades puras, importada por store)

--- Capa de datos ---
db.ts (schema Dexie, importado por locale-persistence.ts)
```

---

## 8. Diagrama de Capas

```
┌────────────────────────────────────────────────────────────┐
│ PAGE                                                       │
│ login-page.tsx, register-page.tsx, dashboard-page.tsx      │
│ Usan useLanguage().t() para traducir textos                │
└────────────────────────────────────────────────────────────┘
        │
        ▼
┌────────────────────────────────────────────────────────────┐
│ COMPONENTS                                                 │
│ LocaleInitializer.tsx, LanguageSwitcher (F11)              │
│ Componentes UI con t("namespace.key")                    │
└────────────────────────────────────────────────────────────┘
        │
        ▼
┌────────────────────────────────────────────────────────────┐
│ HOOKS                                                      │
│ useLanguage.ts → { t, locale, setPreference }              │
│ useLocale.ts   → { formatNumber, formatDate }              │
└────────────────────────────────────────────────────────────┘
        │
        ▼
┌────────────────────────────────────────────────────────────┐
│ STORE                                                      │
│ locale-store.ts → Zustand                                  │
│    hydrateFromStorage, detectPreAuthLocale,                │
│    resolveAndCacheLocale, setUserPreference, resetLocale   │
└────────────────────────────────────────────────────────────┘
        │
        ▼
┌────────────────────────────────────────────────────────────┐
│ INFRASTRUCTURE                                             │
│ i18n.ts (i18next init)                                     │
│ geo-detection.service.ts (ipapi.co)                        │
│ locale-persistence.ts (Dexie CRUD)                         │
│ auth-storage.ts (checkIfSessionExists)                     │
└────────────────────────────────────────────────────────────┘
        │
        ▼
┌────────────────────────────────────────────────────────────┐
│ DOMAIN                                                     │
│ locale.types.ts (LocaleId, GeoResult, CacheableLocale)     │
│ locale.constants.ts (DEFAULT_LOCALE, LOCALE_VERSIONS)      │
│ locale.config.ts (SUPPORTED_LOCALES, LOCALE_MAP)           │
│ locale-utils.ts (resolveLocale, getLocaleFromNavigator)    │
└────────────────────────────────────────────────────────────┘
        │
        ▼
┌────────────────────────────────────────────────────────────┐
│ DATA / EXTERNAL                                            │
│ Dexie (IndexedDB) — tabla preferences                      │
│ ipapi.co — servicio de geo-deteccion                       │
│ public/locales/{locale}/translation.json — JSON regionales │
│ Service Worker — CacheFirst para /locales/*                │
└────────────────────────────────────────────────────────────┘
```

---

## 9. Ciclo de Vida del Cache en Dexie

```
LINEA DE TIEMPO
──────┬─────────────────────────────────────────────────────►
      │
      │  1ra SESION (con internet)
      │
      │  Geo → es-MX → login → resolveAndCacheLocale("stu_001")
      │  │
      │  ├── saveCachedLocale("stu_001", "es-MX", data)
      │  │   → Dexie: preferences.put({
      │  │        id: "stu_001:es-MX",
      │  │        userId: "stu_001",
      │  │        localeId: "es-MX",
      │  │        data: { auth: {...}, common: {...}, ... },
      │  │        version: "1.1.0",
      │  │        cachedAt: 1712345678000
      │  │     })
      │  │
      │  └── addResourceBundle + changeLanguage("es-MX")
      │
      ├── Cierra app
      │
      │  2da SESION (sin internet)
      │
      │  checkIfSessionExists() → "stu_001"
      │  hydrateFromStorage("stu_001")
      │  │
      │  ├── getUserCachedLocale("stu_001")
      │  │   → Dexie: preferences.where("userId").equals("stu_001").first()
      │  │   → Encuentra: { id: "stu_001:es-MX", ... }
      │  │
      │  ├── isLocaleStale(cached)
      │  │   → cached.version ("1.1.0") === LOCALE_VERSIONS["es-MX"] ("1.1.0")
      │  │   → false (no stale)
      │  │
      │  ├── addResourceBundle("es-MX", "auth", data["auth"])
      │  ├── addResourceBundle("es-MX", "common", data["common"])
      │  ├── ...
      │  │
      │  └── changeLanguage("es-MX")
      │      → Render es-MX SIN INTERNET ✅
      │
      ├── Actualizacion de traducciones (desarrollador)
      │
      │  LOCALE_VERSIONS["es-MX"] = "1.2.0"
      │  public/locales/es-MX/translation.json actualizado
      │
      ├── 3ra SESION (con internet)
      │
      │  getUserCachedLocale → cache stale (version "1.1.0" ≠ "1.2.0")
      │  → isLocaleStale = true
      │  → fetch /locales/es-MX/translation.json (nueva version)
      │  → saveCachedLocale con nueva data y version "1.2.0"
      │  → addResourceBundle + changeLanguage
      │
      ├── Logout
      │
      │  clearAllUserCachedLocales("stu_001")
      │  → Dexie: preferences.where("userId").equals("stu_001").delete()
      │  → Cache eliminado
```

---

## 10. Arbol de Archivos Completo

```
src/
└── features/
    └── locale/
        ├── domain/
        │   ├── locale.types.ts          # LocaleId, GeoResult, CacheableLocale
        │   ├── locale.constants.ts      # DEFAULT_LOCALE, LOCALE_VERSIONS
        │   └── locale.config.ts         # SUPPORTED_LOCALES, LOCALE_MAP
        │
        ├── infrastructure/
        │   ├── i18n.ts                  # i18next.init con es-LA embebido
        │   ├── geo-detection.service.ts # detectLocaleFromGeo (ipapi.co)
        │   ├── locale-persistence.ts    # CRUD en Dexie
        │   └── resources/
        │       └── es-LA/              # 11 archivos JSON embebidos
        │           ├── auth.json
        │           ├── common.json
        │           ├── navigation.json
        │           ├── dashboard.json
        │           ├── lessons.json
        │           ├── exercises.json
        │           ├── games.json
        │           ├── practice.json
        │           ├── progress.json
        │           ├── role.json
        │           └── errors.json
        │
        ├── store/
        │   └── locale-store.ts          # Zustand store
        │
        ├── hooks/
        │   ├── useLanguage.ts           # Hook principal de traduccion
        │   └── useLocale.ts             # Hook de formateo regional
        │
        ├── utils/
        │   └── locale-utils.ts          # resolveLocale, isLocaleSupported, getLocaleFromNavigator
        │
        └── components/
            └── LocaleInitializer.tsx    # Componente orquestador

public/
└── locales/
    ├── en-US/
    │   └── translation.json             # 11 namespaces (completo)
    ├── es-MX/
    │   └── translation.json             # auth + common (real)
    ├── es-AR/
    │   └── translation.json             # auth.login (diferencial, voseo)
    ├── es-CL/
    │   └── translation.json             # auth.login (diferencial)
    ├── es-CO/
    │   └── translation.json             # auth.login (diferencial)
    └── es-PE/
        └── translation.json             # auth.login (diferencial)
```

---

## Historial de Cambios

| Version | Fecha | Cambio |
|---------|-------|--------|
| 1.0.0 | 03 Jul 2026 | Creacion inicial |
