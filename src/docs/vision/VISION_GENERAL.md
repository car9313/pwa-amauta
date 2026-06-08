# Visión General de Amauta — Cómo Funciona la Aplicación

## ¿Qué es Amauta?

Amauta es una **aplicación web progresiva (PWA)** diseñada para la **educación infantil**. Su objetivo principal es proporcionar una experiencia de aprendizaje adaptativo que funcione **siempre**, incluso cuando no hay conexión a internet.

Al ser una PWA, Amauta se puede **instalar como una app nativa** en el dispositivo (Android, iOS, escritorio). Una vez instalada, se comporta como cualquier otra aplicación: tiene su propio ícono, se abre en pantalla completa y puede funcionar sin conexión.

### Principios de Diseño

| Principio | Descripción |
|-----------|-------------|
| **Offline-first** | La app prioriza la disponibilidad sobre la frescura. Los niños no deben ver pantallas de carga ni errores de conexión. |
| **Rápido y siempre disponible** | El contenido se carga desde caché instantáneamente. La experiencia debe ser fluida como una app nativa. |
| **Sincronización automática** | Cuando hay conexión, los datos se sincronizan en segundo plano sin interrumpir al usuario. |
| **Experiencia infantil** | Interfaz gamificada con niveles, puntos y rachas para mantener el engagement. |

---

## Los 3 Roles de Usuario

Amauta tiene tres roles, cada uno con una experiencia y permisos diferentes:

### Estudiante (niño/niña)

El rol principal de la plataforma. El estudiante puede:

- **Ver su dashboard personal** con su nivel, puntos, racha de días y ejercicios pendientes.
- **Tomar lecciones** interactivas adaptadas a su nivel educativo.
- **Responder ejercicios** y recibir retroalimentación inmediata (incluso offline).
- **Ver su progreso** en una pantalla tipo juego (niveles, estrellas, barras de avance).
- **Navegar lecciones y práctica** desde el menú de navegación.

El estudiante **no puede seleccionar otros perfiles** — solo ve su propia información. Su `studentId` se inyecta automáticamente en cada petición al servidor.

### Padre/Madre

El rol de acompañamiento y supervisión. El padre/madre puede:

- **Registrarse** en la plataforma (el registro solo crea cuentas de tipo `parent`).
- **Gestionar uno o más hijos** vinculados a su cuenta.
- **Ver un dashboard parental** con el resumen de todos sus hijos (nombre, avatar, nivel, puntos, precisión, racha de días).
- **Seleccionar un hijo activo** para ver su detalle, progreso y lecciones.
- **Navegar las lecciones y el progreso** del hijo seleccionado.
- **Cambiar de hijo** en cualquier momento — la selección se guarda incluso offline.

### Profesor/Teacher

El rol de gestión educativa. El profesor puede:

- **Tener clases/grupos** de estudiantes asignados (`classIds`).
- **Ver lecciones y progreso** de sus estudiantes.

> **Nota**: El dashboard específico de profesor (`/dashboard/teacher`) está pendiente de implementar. Actualmente el profesor puede acceder a `/lessons` y `/progress`, pero al iniciar sesión es redirigido a una ruta que aún no existe. Los profesores son creados externamente (no hay registro público para este rol).

---

## Cómo Funciona en Modo Online

Cuando el dispositivo tiene conexión a internet, Amauta funciona como una aplicación web tradicional:

1. **Login**: El usuario ingresa credenciales, el servidor valida y devuelve tokens.
2. **Datos en tiempo real**: Las consultas (`useQuery`) obtienen datos frescos del servidor.
3. **Mutaciones directas**: Las acciones (responder ejercicio, añadir hijo, etc.) se envían inmediatamente al servidor vía HTTP.
4. **Caché activa**: TanStack Query mantiene una caché en memoria que se revalida en segundo plano.
5. **Service Worker**: El SW intercepta requests de navegación, imágenes y recursos estáticos para servirlos desde caché más rápido, pero siempre intenta actualizar en background.

### Flujo Online

```
Usuario → Componente React → useSafeMutation()
                                   │
                                   ▼
                            ¿Hay conexión?
                                   │ Sí
                                   ▼
                              HTTP directo
                                   │
                                   ▼
                              Servidor API
                                   │
                                   ▼
                         TanStack Query actualiza caché
                                   │
                                   ▼
                         UI muestra datos actualizados
```

---

## Cómo Funciona en Modo Offline

Cuando el dispositivo **no tiene conexión**, Amauta entra en modo offline. La aplicación **no se rompe** — sigue funcionando con datos locales.

### ¿Qué datos están disponibles offline?

| Tipo de dato | Fuente offline | Disponible |
|-------------|----------------|------------|
| App shell (HTML, JS, CSS) | Precache del Service Worker | ✅ Siempre |
| Imágenes | `images-cache-v1` (CacheFirst) | ✅ Si ya se cargaron antes |
| API GET (ejercicios, lecciones) | `api-get-cache-v1` (NetworkFirst con fallback) | ✅ Si ya se consultaron antes |
| Navegación SPA (cambiar de ruta) | `navigation-cache-v1` + fallback a index.html | ✅ Siempre |
| Sesión del usuario | IndexedDB (Dexie - tabla `tokens` y `users`) | ✅ Si ya inició sesión antes |
| Mutaciones pendientes | IndexedDB (Dexie - tabla `mutations`) | ✅ Se encolan automáticamente |
| Recursos estáticos (CSS, fonts) | `static-resources-v1` (StaleWhileRevalidate) | ✅ Siempre |

### ¿Qué NO está disponible offline?

- Login de un nuevo usuario (no hay sesión previa).
- Datos de API que nunca se consultaron estando online.
- Operaciones de escritura en el servidor (se encolan para cuando vuelva la conexión).

### Flujo Offline

```
Usuario → Componente React → useSafeMutation()
                                   │
                                   ▼
                            ¿Hay conexión?
                                   │ No
                                   ▼
                      Se encola en IndexedDB (Dexie)
                                   │
                                   ▼
                      UI muestra feedback "Guardado offline"
                                   │
                                   ▼
                      (Cuando vuelve la conexión...)
                                   │
                                   ▼
                      background-sync.ts detecta online
                                   │
                                   ▼
                      processQueue() ejecuta por prioridad
                                   │
                                   ▼
                      Servidor API → actualiza datos
```

### ¿Cómo se ve el modo offline para el usuario?

1. **Banner ámbar** en la parte superior: "Sin conexión — los datos se sincronizarán cuando haya internet".
2. **Las lecciones y ejercicios** se muestran desde caché (si ya se visitaron antes).
3. **Las respuestas a ejercicios** se guardan localmente con un indicador visual "Enviado (offline)".
4. **La sesión del usuario** se mantiene activa (no se cierra la sesión por falta de red).
5. **Las rutas SPA** funcionan con normalidad (el Service Worker sirve `index.html` como fallback).

---

## ¿Qué Pasa Cuando Vuelve la Conexión?

Amauta **sincroniza todo automáticamente** cuando detecta que la red se restauró:

### Trigger de Sincronización

| Evento | Comportamiento |
|--------|---------------|
| `window.online` | Sincronización inmediata |
| Intervalo de 30s | Sincronización periódica si hay pendientes |
| Al montar la app | Sincronización inicial si hay pendientes + conexión |

### Orden de Sincronización (por Prioridad)

Las mutaciones encoladas se procesan en orden de prioridad:

| Prioridad | Mutaciones | Por qué primero |
|-----------|------------|-----------------|
| **Alta (1)** | login, register, logout, **submitAnswer** | Las respuestas de ejercicios deben persistirse cuanto antes |
| **Media (2)** | addChild, updateProgress | Datos importantes pero no críticos |
| **Baja (3)** | updateProfile, updatePreferences | Pueden esperar sin afectar la experiencia |

### ¿Qué Pasa Si Hay Conflictos?

Amauta usa una estrategia **"last-write-wins"** (el último dato escrito gana). Esto es suficiente porque:

- La app se usa típicamente en un solo dispositivo.
- No hay ediciones concurrentes desde múltiples dispositivos.
- Para educación infantil, los datos del estudiante son mayormente secuenciales.

Si una mutación falla después de 3 intentos (con backoff exponencial: 1s, 2s, 4s), se marca como `"failed"` y queda registrada para revisión manual.

---

## Matriz de Funcionamiento: Online vs Offline por Pantalla y Rol

| Pantalla | Rol | Online | Offline | Notas |
|----------|-----|--------|---------|-------|
| **Login** (`/login`) | Todos | ✅ Login normal | ❌ No disponible | Requiere servidor para autenticar |
| **Registro** (`/register`) | Padre | ✅ Registro | ❌ No disponible | Solo crea cuentas `parent` |
| **Dashboard Estudiante** | Estudiante | ✅ Datos en tiempo real | ⚠️ Datos cacheados | Si nunca visitó la página estando online, no hay datos |
| **Dashboard Padre** | Padre | ✅ Datos en tiempo real | ⚠️ Datos cacheados | Muestra hijos desde caché si están disponibles |
| **Lecciones** | Todos | ✅ Contenido fresco | ⚠️ Contenido cacheadox | Las imágenes se cachean con CacheFirst |
| **Ejercicios** | Todos | ✅ Respuesta inmediata | ✅ Se encola y sincroniza | Feedback instantáneo sin score falso |
| **Progreso** | Todos | ✅ Datos actualizados | ⚠️ Datos cacheados | |
| **Seleccionar hijo** | Padre | ✅ Persiste en servidor | ✅ Persiste en Dexie | La selección se guarda localmente |
| **Cerrar sesión** | Todos | ✅ Logout inmediato | ✅ Se encola y ejecuta al reconectar | |

### Leyenda
- ✅ **Funciona completo** — experiencia completa sin limitaciones
- ⚠️ **Funciona parcialmente** — datos desde caché, puede no mostrar información actualizada
- ❌ **No disponible** — la operación requiere conexión

---

## Flujo Completo del Usuario

### 1. Instalación PWA

1. El usuario abre `https://amauta.app` en el navegador.
2. Aparece el prompt de instalación (o el usuario lo activa desde el menú).
3. La app se instala como una aplicación nativa con su propio ícono.
4. A partir de ahora, el usuario puede abrir Amauta desde su pantalla de inicio.

### 2. Primera Vez (Registro o Login)

1. La app se abre y detecta que no hay sesión guardada.
2. El usuario puede:
   - **Iniciar sesión** si ya tiene cuenta (email + contraseña).
   - **Registrarse** como padre (solo rol `parent` disponible para registro).
3. Credenciales se envían al servidor.
4. El servidor valida y devuelve tokens de acceso + datos del usuario.
5. Los tokens y datos se guardan en IndexedDB (Dexie) para acceso offline futuro.
6. El usuario es redirigido a su dashboard según su rol.

### 3. Experiencia Diaria

- **Con conexión**: Todo funciona normalmente. Las respuestas se envían al servidor, los datos están actualizados.
- **Sin conexión**: La app funciona con datos locales. El usuario ve un banner indicando modo offline. Las respuestas y cambios se guardan localmente.
- **Al reconectar**: Todo se sincroniza automáticamente. El banner de offline desaparece.

### 4. Cierre de Sesión

1. El usuario hace clic en "Cerrar sesión".
2. **Online**: Se hace una petición al servidor, se limpian los datos locales (IndexedDB + caché), se redirige al login.
3. **Offline**: La acción de logout se encola en Dexie. En cuanto haya conexión, se ejecuta automáticamente.

---

## Preguntas Frecuentes

### ¿Puedo usar la app sin internet?

Sí, siempre que ya hayas iniciado sesión al menos una vez estando online. La sesión se guarda en el dispositivo. Las lecciones, ejercicios y progreso que ya hayas visto estarán disponibles desde la caché.

### ¿Qué pasa con las respuestas de ejercicios si estoy offline?

Se guardan localmente en una cola de sincronización. Cuando el dispositivo recupere la conexión, las respuestas se enviarán automáticamente al servidor — sin que el usuario tenga que hacer nada. La interfaz muestra un indicador "Guardado offline" para que el usuario sepa que su respuesta está pendiente de envío.

### ¿Los datos se pierden si cierro el navegador?

No. Los datos importantes (sesión, tokens, preferencias, cola de mutaciones) se guardan en IndexedDB, que persiste incluso si cierras la pestaña o el navegador. El caché del Service Worker también persiste. Al volver a abrir la app, todo continúa donde lo dejaste.

### ¿Cómo sé si estoy en modo offline?

Aparece un **banner ámbar** en la parte superior de la pantalla con el mensaje "Sin conexión — los datos se sincronizarán cuando haya internet". Este banner desaparece automáticamente cuando se restaura la conexión.

### ¿Puedo tener la cuenta de un estudiante en varios dispositivos?

Sí. Cada dispositivo debe iniciar sesión por separado. Los datos se sincronizan a través del servidor cuando cada dispositivo tiene conexión.

### ¿Cuánto tiempo se retienen las mutaciones offline?

Hasta 50 mutaciones pendientes. Si se supera ese límite, las más antiguas se descartan automáticamente para evitar que la cola crezca indefinidamente.

### ¿Qué significa el indicador "Enviado (offline)" en un ejercicio?

Significa que la respuesta se guardó correctamente en el dispositivo y está en cola para enviarse al servidor cuando haya conexión. No significa que el ejercicio esté calificado — la calificación se hará cuando el servidor reciba la respuesta.

---

## Resumen Técnico (Para Desarrolladores)

| Componente | Tecnología | Propósito |
|------------|-----------|-----------|
| **UI** | React 19 + TypeScript + Tailwind CSS 4 | Interfaz de usuario |
| **Estado runtime** | Zustand | Sesión, preferencias, modo offline |
| **Server state** | TanStack Query | Caché de datos del servidor |
| **Persistencia local** | Dexie (IndexedDB) | Tokens, usuarios, cola de mutaciones |
| **Caché PWA** | Workbox (Service Worker) | App shell, imágenes, API GET, navegación |
| **Sincronización offline** | App-level outbox (Dexie + queue-manager) | Cola de mutaciones con prioridad |
| **Ruteo** | React Router 7 | Navegación SPA con guards por rol |
| **Formularios** | React Hook Form + Zod | Validación de formularios |
| **Build tool** | Vite 7 | Build y dev server |

### Archivos Clave del Sistema Offline

```
src/
├── lib/
│   ├── api/storage/
│   │   ├── db.ts                       # Schema Dexie unificado
│   │   └── offline-queue.ts            # CRUD de mutations en Dexie
│   └── sync/
│       ├── useSafeMutation.ts          # Hook único para mutations con offline
│       ├── queue-manager.ts            # Lógica de cola + ejecución HTTP
│       ├── background-sync.ts          # Sync automático (eventos + intervalo)
│       ├── retry.ts                    # Exponential backoff
│       └── conflict.ts                 # Last-write-wins resolver
├── features/auth/
│   ├── domain/types.ts                 # Definición de roles y tipos
│   ├── hooks/useOfflineMode.ts         # Hook para detectar modo offline
│   └── presentation/store/auth-store.ts # Estado de autenticación
└── sw.ts                              # Service Worker (caching PWA)
```

---

## Documentación Relacionada

| Documento | Descripción |
|-----------|-------------|
| `ARCHITECTURE_LAYERS.md` | Capas de la aplicación y flujo de datos |
| `AUTH_FLOW.md` | Flujos de autenticación (login, logout, refresh, offline) |
| `OFFLINE_QUEUE_SYSTEM.md` | Sistema de cola offline (app-level outbox) |
| `SERVICE_WORKER.md` | Service Worker y estrategias de caching |
| `ERROR_HANDLING.md` | Manejo de errores y edge cases |
| `DEXIE_INDEXEDDB_GUIDE.md` | Guía completa de Dexie/IndexedDB |
| `API_CONTRACT.md` | Contrato de API con el backend |
