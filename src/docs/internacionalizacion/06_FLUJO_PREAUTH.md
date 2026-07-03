# Flujo Pre-auth — detectPreAuthLocale

> **Proposito**: Describir en detalle la accion `detectPreAuthLocale` del store: que hace, como maneja el timeout, por que es semi-blocking, como evita duplicar llamadas, y como memoriza los datos para la fase post-auth.
> **Archivos**: `locale-store.ts` (accion `detectPreAuthLocale`)
> **Dependencias**: `geo-detection.service.ts`, `locale-utils.ts`, `i18n.ts`

---

## Contexto

En la version anterior del sistema (v2), la geo-deteccion solo ocurria post-login. Esto significaba que las pantallas de login y register siempre se mostraban en `es-LA` para usuarios nuevos. El requisito de negocio es que el usuario vea su variante regional desde el primer momento.

La solucion no requirio reescribir el sistema: solo se añadio `detectPreAuthLocale` al store y una fase pre-auth en `LocaleInitializer`.

---

## La Accion

```typescript
detectPreAuthLocale: async (timeoutMs = 800): Promise<void>
```

### Cuando se llama

En `LocaleInitializer.useEffect[0]`, solo si:
1. `checkIfSessionExists()` retorno `null` (no hay sesion activa), O
2. `hydrateFromStorage(userId)` retorno `false` (cache no encontrado o invalido)

### Flujo Detallado

```
detectPreAuthLocale(800)
    │
    ├── [1] Crear AbortController
    │   ├── controller = new AbortController()
    │   └── timer = setTimeout(() => controller.abort(), 800)
    │
    ├── [2] detectLocaleFromGeo(controller.signal)
    │   ├── Fetch a ipapi.co con la señal combinada
    │   ├── Internamente tiene su propio timeout de 5s
    │   │   pero la señal externa aborta antes (800ms)
    │   │
    │   ├── Exito: { success: true, localeId: "es-MX" }
    │   ├── 429:   { success: false, reason: "rate_limited" }
    │   ├── Timeout: { success: false, reason: "timeout" }
    │   └── Error:  { success: false, reason: "network_error" }
    │
    ├── [3] clearTimeout(timer)
    │   (Importante: siempre limpiar el timer, incluso si fallo)
    │
    ├── [4] Resolver locale
    │   resolved = resolveLocale(geoResult, getLocaleFromNavigator())
    │       ├── geoResult.success → usa ese localeId
    │       ├── geoResult.fail → getLocaleFromNavigator()
    │       │   ├── "en-US" → "en-US"
    │       │   ├── "es-MX" → "es-MX"
    │       │   └── null → "es-LA"
    │       └── ambos fallan → DEFAULT_LOCALE
    │
    ├── [5] Si resolved != "es-LA":
    │   ├── fetch /locales/{resolved}/translation.json
    │   │   ├── OK → response.json()
    │   │   │   ├── preAuthLocaleData = result
    │   │   │   └── Por cada ns en LOCALE_NAMESPACES:
    │   │   │       if (result[ns])
    │   │   │         i18next.addResourceBundle(resolved, ns, result[ns], true, true)
    │   │   │
    │   │   └── Fallo → silencioso (no se carga nada, se usa es-LA)
    │   │
    │   └── resolved == "es-LA": no hay fetch (ya embebido)
    │
    ├── [6] i18next.changeLanguage(resolved)
    │   (i18next ahora tiene el locale regional activo)
    │
    └── [7] Set state
        ├── resolvedLocale = resolved
        ├── geoAlreadyRan = true
        └── (isReady se queda como esta, no se cambia aqui)
```

---

## Por que 800ms de timeout

El timeout agresivo de 800ms no es una espera fija. El comportamiento es:

| Tiempo de respuesta de ipapi.co | Experiencia del usuario |
|--------------------------------|------------------------|
| ~200ms (tipico) | Render a los ~200ms con traducciones regionales reales |
| ~500ms | Render a los ~500ms |
| >800ms | AbortController cancela, fallback a navigator, render a los 800ms |
| Sin red | Error inmediato (<10ms), fallback a es-LA, render inmediato |

**Por que 800ms y no 5s como el timeout interno del servicio**: En la fase pre-auth, la app muestra `AmautaLoadingState`. Esperar 5 segundos para ver la pantalla de login seria una mala experiencia de usuario. 800ms es un limite aceptable: si ipapi.co no responde en ese tiempo, probablemente la conexion es lenta y es mejor usar el locale del navegador que mantener al usuario esperando.

---

## Por que no persiste en Dexie

La accion `detectPreAuthLocale` se ejecuta **sin userId**. No se sabe quien es el usuario porque:
- No ha iniciado sesion
- `checkIfSessionExists()` retorno `null`
- Es la primera vez que el usuario abre la app

Sin userId, no se puede construir la clave compuesta `${userId}:${localeId}` necesaria para la segmentacion en Dexie. Si se guardara con una clave generica, dos usuarios en el mismo dispositivo compartirian el cache.

Por eso, los datos descargados viven en **memoria** (`preAuthLocaleData`). Cuando el usuario inicia sesion (post-auth), `resolveAndCacheLocale` toma esos datos de memoria y los persiste en Dexie con el userId real.

---

## Memorizacion con preAuthLocaleData

El flag `geoAlreadyRan` y el objeto `preAuthLocaleData` trabajan juntos para evitar duplicacion de trabajo:

```
detectPreAuthLocale()
    ├── geoAlreadyRan = true
    ├── preAuthLocaleData = { auth: {...}, common: {...}, ... }  (o null si es es-LA)
    └── resolvedLocale = "es-MX"

...mas tarde, post-auth...

resolveAndCacheLocale(userId)
    ├── No hay cache en Dexie
    ├── Pero geoAlreadyRan = true ← detecta que ya se ejecuto
    │
    ├── Usa resolvedLocale de memoria (no llama a ipapi.co de nuevo)
    ├── Usa preAuthLocaleData de memoria (no hace fetch de nuevo)
    │
    └── SOLO persiste en Dexie: saveCachedLocale(userId, locale, preAuthLocaleData)
```

**Garantia**: Una sola llamada a ipapi.co por sesion. Una sola descarga del JSON regional por sesion.

---

## Casos por tipo de conexion

### Conexion rapida (200ms)

```
1. ipapi.co responde → MX → es-MX
2. fetch /locales/es-MX/translation.json → exito
3. addResourceBundle("es-MX", ...)
4. Render a ~400ms con traducciones MEXICANAS reales ✅
```

### Conexion lenta (800ms+)

```
1. ipapi.co no responde → AbortController.abort()
2. getLocaleFromNavigator() → "es-MX" (navegador configurado en MX)
3. fetch /locales/es-MX/translation.json → exito
4. addResourceBundle("es-MX", ...)
5. Render a ~800ms con traducciones MEXICANAS reales ✅
```

### Sin conexion

```
1. ipapi.co → error inmediato (<10ms)
2. getLocaleFromNavigator() → "es-MX" (navegador configurado en MX)
3. fetch /locales/es-MX/translation.json → falla (sin red)
4. No hay addResourceBundle (es-LA es lo unico disponible)
5. Render a <10ms con es-LA ⚠️
```

### Usuario recurrente (con cache)

```
(No pasa por detectPreAuthLocale)
1. checkIfSessionExists() → "user-abc"
2. hydrateFromStorage("user-abc") → cache valido en Dexie
3. addResourceBundle con cache
4. i18next.changeLanguage("es-MX")
5. Render INMEDIATO con traducciones MEXICANAS ✅
```

---

## Reglas de Negocio

| Regla | Descripcion |
|-------|-------------|
| **Geo pre-auth semi-blocking** | `LocaleInitializer` muestra `AmautaLoadingState` hasta resolver locale. Maximo 800ms. |
| **Timeout agresivo con AbortController** | 800ms no es espera fija. Geo rapida = render rapido. Geo lenta = cancel + fallback + render a 800ms. |
| **Una sola llamada a geo** | `geoAlreadyRan` garantiza que `ipapi.co` se llama maximo una vez por sesion. Post-login no repite geo. |
| **Sin flash de texto** | Usuario nunca ve `es-LA` seguido de cambio a locale regional. El JSON regional se descarga y aplica ANTES del primer render de login/register. |
| **Fetch unico de traducciones** | El JSON regional se descarga una sola vez, en la fase pre-auth. Post-login solo se persiste lo ya descargado. |
| **Sin persistencia pre-auth** | El locale resuelto pre-auth vive en memoria hasta autenticacion. Dexie solo se escribe post-login con userId. |
| **Locale post-timeout** | Si geo fue cancelada por timeout, el locale de navigator.language queda permanente para esa sesion. No se reintenta. |
| **Prioridad de resolucion** | Dexie (userId) → Geo (memoria) → Navigator.language (solo español) → es-LA |
| **Idioma fijo en sesion** | El locale no cambia automaticamente una vez resuelto, incluso si el usuario se mueve de pais. |

---

## Historial de Cambios

| Version | Fecha | Cambio |
|---------|-------|--------|
| 1.0.0 | 03 Jul 2026 | Creacion inicial |
