# Variantes Regionales — Fase 12

> **Proposito**: Describir los archivos de traduccion de las variantes regionales, su ubicacion, estrategia de traduccion, carga via Service Worker, y el mapping de paises a variantes.
> **Archivos**: `public/locales/{locale}/translation.json`, `sw.ts`, `locale.config.ts`
> **Dependencias**: Fase 0 (LOCALE_MAP), Fase 1 (Service Worker), Store (carga dinamica)

---

## Ubicacion y Estructura

Los archivos de traduccion regionales se almacenan en `public/locales/{locale}/translation.json`. Al estar en `public/`, son servidos como archivos estaticos por Vite sin pasar por el pipeline de build.

```
public/locales/
├── en-US/
│   └── translation.json     (14.5 KB — 11 namespaces completos)
├── es-MX/
│   └── translation.json     (1.9 KB — auth + common reales)
├── es-AR/
│   └── translation.json     (611 B — diferencial, auth.login con voseo)
├── es-CL/
│   └── translation.json     (371 B — diferencial, auth.login)
├── es-CO/
│   └── translation.json     (494 B — diferencial, auth.login)
└── es-PE/
    └── translation.json     (371 B — diferencial, auth.login)
```

**Estructura interna**: Cada archivo es un objeto JSON cuyas keys son los namespaces:

```json
{
  "auth": { ... },
  "common": { ... },
  "navigation": { ... },
  ...
}
```

El store los recibe y los reparte con:
```typescript
for (const ns of LOCALE_NAMESPACES) {
  if (remoteData[ns]) {
    i18next.addResourceBundle(locale, ns, remoteData[ns], true, true);
  }
}
```

---

## Estrategias de Traduccion

### Completa (en-US)

El ingles es la unica variante que contiene todos los 11 namespaces completos. i18next usa `es-LA` como fallback, pero `en-US` no deberia necesitarlo porque tiene todas las claves.

```json
{
  "auth": { "login": { "title": "Welcome to Amauta!", ... }, "register": { ... }, ... },
  "common": { "loading": "Loading...", ... },
  "navigation": { ... },
  "dashboard": { ... },
  "lessons": { ... },
  "exercises": { ... },
  "games": { ... },
  "practice": { ... },
  "progress": { ... },
  "role": { ... },
  "errors": { ... }
}
```

### Diferencial (espanol)

Para las variantes de espanol, cada archivo solo contiene las keys que cambian respecto a `es-LA`. Lo que no esta en el archivo se resuelve via el fallback chain de i18next (cae a `es-LA`).

```json
// es-AR/translation.json — solo auth.login con voseo
{
  "auth": {
    "login": {
      "subtitle": "Iniciá sesión para seguir aprendiendo",
      "submitButton": "Ingresar",
      "registerLinkText": "Registrate acá",
      "offlineWelcome": "¡Qué bueno verte de nuevo, {{name}}! Necesitás internet para jugar.",
      "offlineMessage": "No tenés internet. Volvé cuando tengas conexión para empezar a jugar.",
      "sessionClosedMessage": "Tu sesión se cerró. Iniciá sesión de nuevo.",
      "accountNotFoundMessage": "No encontramos tu cuenta. ¿Revisá que tu correo esté bien escrito?",
      "preparing": "Preparando tu sesión..."
    }
  }
}
```

---

## Contenido por Variante

| Variante | Namespaces incluidos | Diferencias principales vs es-LA |
|----------|---------------------|----------------------------------|
| **en-US** | 11 namespaces completos | Traduccion completa al ingles |
| **es-MX** | auth (login, register, validation, errors, banner), common | "Entrar", "¿Revisa que tu correo...?", "¡Qué gusto verte...", "Crea tu cuenta para empezar a aprender" |
| **es-AR** | auth.login | Voseo: "Iniciá sesión", "Necesitás", "Registrate acá" |
| **es-CL** | auth.login | "Ingresar", "¡Qué bueno verte..." |
| **es-CO** | auth.login | "Ingresar", "¡Qué alegría verte...", "continuar aprendiendo" |
| **es-PE** | auth.login | "Ingresar", "¡Qué bueno verte..." |

---

## LOCALE_MAP

Define que variante regional se asigna a cada pais.

```typescript
export const LOCALE_MAP: Record<string, LocaleInfo["id"]> = {
  MX: "es-MX",
  AR: "es-AR",
  CL: "es-CL",
  CO: "es-CO",
  PE: "es-PE",
  US: "en-US",
  BO: "es-LA", VE: "es-LA", EC: "es-LA", PY: "es-LA",
  UY: "es-LA", CR: "es-LA", GT: "es-LA", HN: "es-LA",
  SV: "es-LA", NI: "es-LA", PA: "es-LA", DO: "es-LA",
  CU: "es-LA",
  PR: "es-LA",
};
```

| Codigo | Pais | Locale |
|--------|------|--------|
| MX | Mexico | `es-MX` |
| AR | Argentina | `es-AR` |
| CL | Chile | `es-CL` |
| CO | Colombia | `es-CO` |
| PE | Peru | `es-PE` |
| US | Estados Unidos | `en-US` |
| BO, VE, EC, PY, UY, CR, GT, HN, SV, NI, PA, DO, CU, PR | Resto de LATAM | `es-LA` |

Los paises no listados (España, Francia, etc.) generan `{ success: false, reason: "unmapped_country" }` que deriva en fallback a `navigator.language`.

---

## Carga via Service Worker

**Archivo**: `src/sw.ts`

```typescript
registerRoute(
  ({ url }) => url.pathname.startsWith('/locales/'),
  new CacheFirst({
    cacheName: 'static-resources-v1',
    plugins: [new CacheableResponsePlugin({ statuses: [0, 200] })]
  })
)
```

**Estrategia**: `CacheFirst`

- Los archivos de locale son **versionados** por `LOCALE_VERSIONS`. Nunca cambian sin cambiar su contenido.
- Si el archivo ya esta en el cache del SW, se sirve desde ahi (sin red).
- Si no esta en el cache, se descarga y se almacena para futuras visitas.
- Esto beneficia la segunda visita del usuario: aunque no haya internet, el JSON regional ya esta en el cache del SW.

**Cache name**: `static-resources-v1` — misma cache que scripts, CSS y fuentes.

---

## Flujo de Carga de una Variante Regional

```
1. geo detecta pais → US → "en-US"

2. detectPreAuthLocale(800):
   ├── fetch /locales/en-US/translation.json
   │   ├── Service Worker intercepta
   │   │   ├── CacheFirst: ¿esta en static-resources-v1?
   │   │   │   ├── Si → devuelve desde cache (sin red)
   │   │   │   └── No → fetch de red → guarda en cache → devuelve
   │   │
   │   └── Respuesta recibida
   │
   ├── addResourceBundle("en-US", "auth", data["auth"])
   ├── addResourceBundle("en-US", "common", data["common"])
   ├── ... (11 namespaces)
   │
   └── i18next.changeLanguage("en-US")
       → UI en ingles

3. Post-auth (login exitoso):
   ├── saveCachedLocale("user_001", "en-US", remoteData)
   │   → Dexie: { id: "user_001:en-US", data: { auth, common, ... }, version: "1.0.0" }
   │
   └── Proxima sesion: carga desde Dexie sin fetch ni SW
```

---

## Flujo Completo de Resolucion de Locale

```
1. checkIfSessionExists()
   ├── SI → hydrateFromStorage(userId) → cache en Dexie → render inmediato
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

---

## Pendientes para Futuras Fases

- Expandir variantes de espanol a mas namespaces (navigation, dashboard, lessons, etc.)
- Agregar `LanguageSwitcher` UI para cambio manual de idioma
- Traducciones completas para mas paises (ej: `es-ES` para Espana)
- Tests automatizados de contenido de traducciones

---

## Historial de Cambios

| Version | Fecha | Cambio |
|---------|-------|--------|
| 1.0.0 | 03 Jul 2026 | Creacion inicial con 6 variantes (en-US, es-MX, es-AR, es-CL, es-CO, es-PE) |

## Archivos Relacionados

| Archivo | Ruta |
|---------|------|
| en-US | `public/locales/en-US/translation.json` |
| es-MX | `public/locales/es-MX/translation.json` |
| es-AR | `public/locales/es-AR/translation.json` |
| es-CL | `public/locales/es-CL/translation.json` |
| es-CO | `public/locales/es-CO/translation.json` |
| es-PE | `public/locales/es-PE/translation.json` |
| Service Worker | `src/sw.ts` |
| LOCALE_MAP | `src/features/locale/domain/locale.config.ts` |
