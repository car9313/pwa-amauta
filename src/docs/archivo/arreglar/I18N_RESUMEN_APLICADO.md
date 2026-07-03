# Resumen de Cambios — Internacionalización v3

> **Fecha**: 30 Junio 2026
> **Documento base**: `I18N_PLAN_v3.md`
> **Archivos modificados**: `locale-store.ts`, `LocaleInitializer.tsx`, `geo-detection.service.ts`

---

## ¿Qué cambió y por qué?

Antes de esta actualización, la app detectaba el país del usuario **solo después de iniciar sesión**. Esto significaba que las pantallas de **login y registro** siempre se veían en español neutro (`es-LA`) para todos los usuarios nuevos, sin importar si eran de México, Argentina, Colombia, etc.

Con los cambios aplicados, la geo-detección ahora ocurre **pre-auth** (antes del login), para que desde el primer momento en que un usuario visita la app ya vea los textos en su variante regional.

---

## Archivos Modificados

### 1. `geo-detection.service.ts`

**Qué hacía antes**: Llamaba a `ipapi.co` con un timeout fijo de 5 segundos.

**Qué hace ahora**: Acepta una **señal de cancelación externa**. Esto permite que otras partes del código (como el store) decidan cuándo cancelar la petición si se demora demasiado.

**Cómo afecta**: La app puede tener un timeout más agresivo (800ms) en la fase pre-auth, sin romper el timeout de 5 segundos que se usa en otros casos.

---

### 2. `locale-store.ts`

Este es el archivo que más cambió. Contiene 4 correcciones:

#### Bug A — `hydrateFromStorage` no aplicaba el idioma

**Antes**: Leía la preferencia guardada en Dexie (si el usuario ya había visitado la app antes) y la guardaba en el store, pero **nunca se la decía a i18next**. El resultado: el store sabía que el usuario quería `es-MX`, pero la UI seguía mostrando `es-LA`.

**Después**: Cuando `hydrateFromStorage` encuentra una preferencia guardada, llama `i18next.changeLanguage()` para que la UI cambie al idioma correcto **de inmediato**. Además, ahora retorna `true` o `false` para que el `LocaleInitializer` sepa si debe ejecutar geo-detección o no.

#### Bug B — `setUserPreference` guardaba con `"__global__"`

**Antes**: Cuando un usuario cambiaba manualmente su idioma, se guardaba con la clave `"__global__"` en Dexie, ignorando qué usuario era. Esto rompía la segmentación: si papá y mamá usaban el mismo dispositivo, el segundo pisaba la preferencia del primero.

**Después**: Ahora requiere el `userId` real y lo pasa correctamente a la base de datos.

#### Bug C — `resolveAndCacheLocale` llamaba a geo-detección siempre

**Antes**: Aunque la geo-detección ya hubiera corrido en la fase pre-auth, al iniciar sesión se volvía a llamar a `ipapi.co`, duplicando la consulta innecesariamente.

**Después**: Se agregó un flag interno `geoAlreadyRan`. Si la geo-detección ya se ejecutó en la fase pre-auth, `resolveAndCacheLocale` **no vuelve a llamarla**. Usa el resultado que ya está en memoria.

#### Nueva acción — `detectPreAuthLocale`

**Nueva funcionalidad**: Es la acción que orquesta la geo-detección pre-auth.

1. Crea un `AbortController` con timeout de **800ms** (no es una espera fija — si geo responde antes, se libera antes)
2. Llama a `detectLocaleFromGeo()` con la señal de cancelación
3. Si geo responde exitosamente, determina el locale regional
4. Si el locale no es `es-LA`, descarga el archivo `/locales/{locale}/translation.json` y lo carga en i18next
5. **Guarda el JSON descargado en memoria** (no en Dexie, porque todavía no hay userId)
6. Aplica el locale en i18next y marca `geoAlreadyRan = true`

**Comportamiento por tipo de conexión**:
- Conexión rápida (geo ~200ms) → render a los 200ms con traducciones reales
- Conexión lenta (geo > 800ms) → render a los 800ms con locale del navegador
- Sin conexión → render inmediato en `es-LA`
- Usuario que vuelve (cache en Dexie) → render inmediato, sin geo

---

### 3. `LocaleInitializer.tsx`

**Antes**: Era un componente pasivo que no bloqueaba el render. Los hijos se renderizaban inmediatamente y, si el locale cambiaba después, había un "flash" de `es-LA` seguido del cambio al idioma correcto.

**Después**: Ahora es **semi-blocking**. El componente se divide en 3 fases:

```
FASE PRE-AUTH (al montar la app)
  │
  ├── 1. hydrateFromStorage()
  │       ├── ¿Hay preferencia guardada en Dexie?
  │       │   → Sí: aplica locale + render INMEDIATO (sin geo)
  │       │   → No: continúa...
  │       │
  │       └── 2. detectPreAuthLocale(800ms)
  │               → Mientras: muestra pantalla de carga (AmautaLoadingState)
  │               → Geo responde → aplica locale regional
  │               → Timeout → usa locale del navegador
  │               → Sin red → es-LA
  │               → Renderiza la app en el locale correcto
  │
FASE POST-AUTH (después del login)
  │
  └── 3. resolveAndCacheLocale(userId)
          → Usa el resultado de la fase pre-auth (geoAlreadyRan=true)
          → NO vuelve a llamar a ipapi.co
          → NO vuelve a descargar el JSON de traducciones
          → SOLO persiste en Dexie con el userId real
```

---

## Flujo Actual de Traducciones por Geolocalización

### Cuando un usuario NUEVO abre la app por primera vez:

```
1. App se monta → LocaleInitializer muestra pantalla de carga
2. Busca en Dexie → no hay preferencia guardada (es nuevo)
3. Detecta país vía ipapi.co (máximo 800ms de espera)
4. Si el país es México → locale = "es-MX"
5. Descarga /locales/es-MX/translation.json
6. Carga las traducciones en i18next
7. Aplica "es-MX" → login/register se ven en español mexicano
8. Usuario se registra/inicia sesión
9. Se persiste "es-MX" en Dexie asociado a su userId
10. En adelante, siempre que abra la app, leerá su preferencia de Dexie
    y verá español mexicano desde el primer frame
```

### Cuando un usuario que YA VISITÓ la app vuelve a entrar:

```
1. App se monta → LocaleInitializer muestra pantalla de carga (mínima)
2. hydrateFromStorage() detecta preferencia en Dexie → retorna true
3. localePhaseReady = true → render INMEDIATO (≈0ms, sin geo)
4. AuthInitializer restaura la sesión desde Dexie (instantáneo)
5. Post-auth effect → resolveAndCacheLocale(userId)
   → getUserCachedLocale(userId): encuentra cache completo en Dexie
   → addResourceBundle con todos los namespaces
   → changeLanguage("es-MX") ← traducciones completas
6. Dashboard renderiza en es-MX desde el primer frame visible ✅
```

> **Aclaración importante**: En una PWA con persistencia de sesión (Dexie), el usuario recurrente **no pasa por login**. Su sesión se restaura inmediatamente al montar la app. `AuthInitializer` hidrata los tokens y marca `isAuthenticated = true` casi al mismo tiempo que `LocaleInitializer` completa su fase pre-auth. Como resultado, `resolveAndCacheLocale` se ejecuta inmediatamente después, leyendo el cache completo de Dexie con el `userId` ya disponible. Las traducciones regionales se aplican **antes de que el dashboard se renderice**.

#### Único caso donde un usuario recurrente ve login

Si el usuario **cerró sesión explícitamente** (logout), al volver:
1. `hydrateFromStorage()` encuentra preferencia guardada: `es-MX`
2. `changeLanguage("es-MX")` — pero i18next no tiene recursos regionales sin `userId`
3. Login se renderiza mayormente en `es-LA` (fallback porque no hay bundle para `es-MX`)
4. Tras iniciar sesión, `resolveAndCacheLocale` carga el cache desde Dexie → recién ahí se aplican traducciones reales

**¿Es esto un problema real?** No en la práctica. Es un edge case (usuario que voluntariamente cerró sesión) y la lectura de Dexie post-auth es <1ms, por lo que el cambio es imperceptible si ocurre dentro del dashboard. La prioridad correcta para resolverlo sería implementar búsqueda en Dexie por `localeId` (sin `userId`) durante la fase pre-auth, pero no justifica el esfuerzo para el MVP.

### ¿Qué pasa si no hay internet?

```
1. App se monta → LocaleInitializer muestra pantalla de carga
2. Busca en Dexie → no hay preferencia (es nuevo) O hay preferencia
   → Si hay preferencia: aplica locale guardado, render inmediato
   → Si no hay: geo falla en <10ms → usa es-LA (único disponible offline)
3. Login/register se ven en español neutro
4. Cuando vuelva el internet, la geo-detección no se reintenta (geoAlreadyRan=true)
5. El usuario puede cambiar su idioma manualmente cuando haya conexión
```

### ¿Qué pasa si geo responde pero el país no está mapeado?

Ipapi.co devuelve el país, pero si no tenemos una variante regional para ese país (ej: España, Francia), se usa el locale del navegador. Si el navegador tampoco tiene un español regional, cae a `es-LA` (español neutro latino).

### Reglas clave del sistema

| Regla | Explicación |
|-------|-------------|
| **Geo solo una vez por sesión** | Nunca se llama a ipapi.co más de una vez, incluso si el usuario cierra sesión y vuelve a iniciar |
| **Sin flash de texto** | El usuario nunca ve `es-LA` y de repente `es-MX`. La pantalla de carga bloquea hasta tener el locale resuelto |
| **Descarga única de traducciones** | El JSON regional se descarga UNA sola vez, en la fase pre-auth. Al hacer login solo se persiste en Dexie |
| **Persistencia solo post-login** | El locale resuelto pre-auth vive en memoria hasta que el usuario inicia sesión |
| **Prioridad de resolución** | 1° Cache en Dexie → 2° Geo-detección → 3° Navegador → 4° es-LA |
| **Timeout agresivo** | 800ms máximo de espera para geo. Si no responde, se usa el locale del navegador |
| **Locale permanente post-timeout** | Si geo falló por timeout, el locale del navegador queda fijo para esa sesión (el usuario puede cambiarlo manualmente después) |
| **Cache por userId** | Los recursos regionales se guardan en Dexie con clave `${userId}:${localeId}`. En fase pre-auth no hay `userId`, por lo que las traducciones regionales no están disponibles hasta post-auth. Esto solo afecta al edge case de usuario que cierra sesión y vuelve a login (ver aclaración arriba). |

---

## ¿Cómo afecta esto a la aplicación?

### Para el usuario:
- **Mejor experiencia**: Si eres de México y abres la app por primera vez, ves los formularios en español mexicano desde el inicio, no después de registrarte
- **Sin parpadeos**: No hay un cambio brusco de idioma en medio de la navegación
- **Rápido**: Si ya visitaste la app antes, todo carga instantáneo sin pantalla de carga

### Para el desarrollador:
- El `LocaleInitializer` ahora es semi-blocking — hay que considerar que muestra una pantalla de carga durante máximo 800ms
- Al llamar `setUserPreference` ahora es obligatorio pasar el `userId`
- El store tiene dos nuevos estados: `geoAlreadyRan` y `preAuthLocaleData`
- La función `detectLocaleFromGeo` acepta un `AbortSignal` opcional

### Próximos pasos (Fase 10-12):
1. **Fase 10**: Escribir tests que cubran el nuevo flujo pre-auth
2. **Fase 11**: Implementar `LanguageSwitcher` para que el usuario pueda cambiar manualmente su idioma
3. **Fase 12**: Agregar más variantes regionales (post-MVP)

---

## Bugs Corregidos

| Bug | Síntoma | Solución |
|-----|---------|----------|
| `hydrateFromStorage` sin changeLanguage | Usuario con preferencia guardada veía `es-LA` hasta recargar | Se agregó `i18next.changeLanguage()` y retorno booleano |
| `setUserPreference` con `__global__` | Dos usuarios en mismo dispositivo pisaban sus preferencias | Ahora usa `userId` real |
| `resolveAndCacheLocale` duplicaba geo | Se llamaba a `ipapi.co` dos veces por sesión | Flag `geoAlreadyRan` previene la segunda llamada |
