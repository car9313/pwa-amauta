# Vision General — Internacionalizacion por Geolocalizacion

> **Proposito**: Explicar en lenguaje natural que es el sistema de i18n, que problema resuelve, como funciona a alto nivel, y por que se tomaron las decisiones de arquitectura clave.

---

## El Problema

Amauta es una aplicacion educativa para ninos de 3 a 9 anos, usada en toda Latinoamerica y Estados Unidos. Cada pais tiene su propia forma de hablar: en Mexico se dice "entrar", en Argentina "ingresar" con voseo, en Chile "¡que bueno verte!", y en Estados Unidos todo debe estar en ingles.

Ademas, Amauta es una **PWA offline-first**: debe funcionar en tablets sin internet, en escuelas con conexion intermitente, y en zonas rurales donde la red es lenta o inexistente.

El problema entonces es triple:
1. Mostrar las traducciones correctas segun **donde vive el usuario**
2. Hacerlo desde **el primer momento** (incluso en la pantalla de login)
3. Que funcione **sin internet** si el usuario ya visito la app antes

## La Solucion

El sistema combina cuatro mecanismos que trabajan juntos:

### 1. Un idioma base siempre disponible

El espanol latino neutro (`es-LA`) esta **embebido dentro del bundle de la aplicacion**. No necesita descargarse, no necesita internet. Tiene 11 categorias de traducciones (auth, common, navigation, dashboard, lessons, exercises, games, practice, progress, role, errors). Es el piso sobre el que se construye todo lo demas.

### 2. Deteccion geografica al abrir la app

Apenas la app se abre, pregunta a un servicio web (`ipapi.co`) de que pais es el usuario. Con esa informacion, determina que variante regional debe usar. Si el servicio no responde rapido (maximo 800 milisegundos), usa el idioma del navegador. Si tampoco tiene esa informacion, usa el espanol neutro.

### 3. Carga de variantes regionales bajo demanda

Cuando se determina que el usuario necesita una variante especifica (`es-MX`, `es-AR`, `en-US`, etc.), la app descarga un archivo JSON con las traducciones de esa variante. Para las variantes de espanol, el archivo solo contiene las diferencias con respecto al espanol neutro (estrategia diferencial). Para el ingles, contiene todas las traducciones completas.

### 4. Cache offline en IndexedDB

Una vez que el usuario inicia sesion, las traducciones de su variante regional se guardan en una base de datos local (IndexedDB via Dexie), asociadas a su cuenta. La proxima vez que abra la app, las traducciones se cargan desde ahi sin necesidad de internet.

---

## Decisiones de Arquitectura

### Por que i18next

i18next es la libreria de internacionalizacion mas madura del ecosistema JavaScript. Sus caracteristicas clave para este proyecto:

- **Namespaces**: Permite organizar las traducciones en 11 categorias independientes (auth, common, navigation, etc.), cargando solo las necesarias en cada pantalla
- **Fallback chain**: Si una clave no existe en la variante regional (ej: `es-AR`), busca automaticamente en el idioma por defecto (`es-LA`). Esto hace viable la estrategia diferencial.
- **Interpolacion**: Soporta variables en los textos (ej: `"Hola, {{name}}"`), necesario para personalizar mensajes con el nombre del usuario
- **react-i18next**: Integracion nativa con React, hooks como `useTranslation()`
- **addResourceBundle**: Permite agregar traducciones en runtime sin reinicializar la libreria, ideal para cargar variantes bajo demanda

### Por que geo-deteccion pre-auth

En la mayoria de las apps, el idioma se detecta despues del login. Pero en Amauta, la pantalla de **login y registro** deben verse en el idioma regional del usuario desde el primer momento. Si eres de Mexico, el boton de "Entrar" debe decir "Entrar" (no "Iniciar sesion"), y si eres de Argentina, debe decir "Ingresar" con voseo.

La solucion no fue reescribir el sistema existente, sino anadir una fase pre-auth al `LocaleInitializer` que se ejecuta antes de que el usuario vea cualquier pantalla.

### Por que es-LA embebido en el bundle

El espanol neutro es el unico idioma que debe estar disponible **sin ningun tipo de conexion**. Al estar compilado dentro del bundle JS, forma parte del precache del Service Worker. Esto significa que:

- Un usuario nuevo sin internet ve la app en espanol neutro
- Un usuario recurrente que ya tiene cache en Dexie ve su variante regional, respaldado por es-LA para lo que no este en su cache
- La app nunca se queda sin traducciones, incluso en el primer arranque offline

### Por que el resto se carga bajo demanda

Si todas las variantes regionales (6 variantes x 11 namespaces = 66 archivos) estuvieran embebidas en el bundle, el tamano de la aplicacion creceria innecesariamente para la mayoria de los usuarios, que solo usan una variante.

### Por que sin i18next-http-backend

i18next tiene un plugin llamado `http-backend` que automaticamente hace fetch de archivos JSON cuando el idioma cambia. Pero Amauta ya tiene un mecanismo explicito de carga via `addResourceBundle` desde `LocaleInitializer`. Usar ambos simultaneamente producia **race conditions**: cuando el usuario cambiaba de idioma, ambos mecanismos intentaban cargar el mismo archivo, y el que llegaba segundo pisaba al primero.

Se elimino completamente `http-backend`. Toda la carga de variantes es orquestada por `LocaleInitializer` y el store.

### Por que segmentacion por userId en Dexie

Amauta se usa en tablets escolares compartidas. Maria (estudiante), su mama (parent) y su profesor (teacher) pueden usar la misma tablet. Sin segmentacion, cuando Maria se loguea, sus traducciones de `es-MX` quedan cacheadas. Cuando la mama se loguea, encuentra el cache de Maria en lugar del suyo (`es-AR`).

La solucion es usar una clave compuesta `${userId}:${localeId}` en Dexie. Cada usuario tiene su propio cache, aislado de los demas.

---

## Como se Relaciona con el Resto de la App

El sistema de internacionalizacion no esta aislado. Se integra con:

| Componente | Relacion |
|------------|----------|
| **AuthInitializer** | `LocaleInitializer` se ejecuta antes. Locale necesita saber si hay sesion activa via `checkIfSessionExists()` |
| **AuthStore** | El locale post-auth depende de `hasHydrated`, `isAuthenticated` y `user` del AuthStore |
| **Service Worker** | Los archivos JSON de variantes regionales se cachean con estrategia CacheFirst |
| **Dexie/IndexedDB** | Las traducciones se persisten en la tabla `preferences` con claves compuestas |
| **React Router** | Las rutas publicas (login, register) se benefician del locale pre-auth |
| **Componentes UI** | Usan `useTranslation()` con `t()` para mostrar textos en el locale activo |

---

## Flujo de Alto Nivel

```
Usuario abre la app
        │
        ▼
┌─────────────────────────────────────┐
│ LocaleInitializer (pre-auth)         │
│ 1. Hay sesion activa?               │
│    ├── Si: carga cache de Dexie     │
│    │   → Render inmediato           │
│    └── No: geo-deteccion (max 800ms)│
│        → Resuelve locale regional   │
│        → Render                     │
└─────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────┐
│ Pantallas publicas                   │
│ (login/register en idioma regional) │
└─────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────┐
│ Usuario inicia sesion                │
└─────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────┐
│ LocaleInitializer (post-auth)        │
│ → Persiste locale en Dexie          │
│ → addResourceBundle si es necesario  │
│ → changeLanguage al locale correcto  │
└─────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────┐
│ Dashboard y funcionalidad completa   │
│ en el idioma regional del usuario    │
│ (funciona offline si ya hay cache)   │
└─────────────────────────────────────┘
```

---

## Lo Que NO Hace Este Sistema

- **No traduce automaticamente**: Todas las traducciones son escritas a mano. No hay DeepL, Google Translate ni ninguna API de traduccion automatica.
- **No cambia de idioma en sesion**: Una vez resuelto el locale, no cambia automaticamente aunque el usuario se mueva de pais.
- **No sincroniza entre dispositivos**: La preferencia de idioma vive solo en el dispositivo local (Dexie). No hay sincronizacion en la nube (aun).
- **No tiene LanguageSwitcher UI**: El usuario no puede cambiar manualmente su idioma desde la interfaz (es una fase futura).
