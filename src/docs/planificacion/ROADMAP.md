# Roadmap — Próximos Pasos, Tareas y Prioridades

> ✅ **TODO COMPLETADO** — Todas las prioridades P0 a P4 han sido implementadas.
> Este documento se mantiene como registro histórico del plan original.

## Estado Actual

Amauta es una PWA educativa funcional con los siguientes componentes operativos:

- **Autenticación**: Login, registro (solo padres), sesión persistente offline vía Dexie
- **Roles**: Estudiante, Padre, Teacher (con dashboard completo)
- **Ruteo**: React Router con guards `RequireAuth` y `RequireRole`
- **PWA**: Service Worker con precaching, runtime caching (imágenes, API GET, navegación SPA)
- **Offline mutations**: Sistema de cola app-level outbox (Dexie + queue-manager + background-sync)
- **UI**: shadcn/ui, Tailwind CSS v4, diseño responsive
- **Testing**: Vitest configurado con +170 tests (retry, conflict, auth-store, guards, ConnectionStatus, schemas, ErrorBoundary)
- **Build**: TypeScript strict, Vite 7, ESLint flat config
- **Deploy**: Vercel con SPA rewrites
- **Error tracking**: Sentry integrado

---

## Prioridades de Implementación

| Prioridad | Significado | Acción |
|-----------|-------------|--------|
| **P0 — Crítico** | Bugs que causan error en runtime o build | Arreglar inmediatamente |
| **P1 — Alta** | Deuda técnica que afecta mantenibilidad o features incompletos | Siguiente sprint |
| **P2 — Media** | Código muerto, TODOs, convenciones, limpieza | Próximos sprints |
| **P3 — Baja** | Mejoras de calidad, polish, optimizaciones | Backlog |
| **P4 — Futuro** | Features nuevos, expansión de roles | Roadmap largo plazo |

---

## P0 — Crítico ✅ COMPLETADO

### P0.1 `use-session.ts` navega a rutas inexistentes

**Archivo**: `src/features/auth/queries/use-session.ts` (líneas 54-56)

**Problema**: Los hooks `useLogin`/`useRegister` en `use-session.ts` navegan a `/student/dashboard` y `/parent/dashboard`, pero las rutas reales son `/dashboard/student` y `/dashboard/parent`. Esto causa que después de login/registro, el usuario sea redirigido a una página 404.

**Solución**: Cambiar los `navigate()` para que usen las rutas correctas.

```
Antes:  navigate("/student/dashboard", ...)
Después: navigate("/dashboard/student", ...)
```

**Esfuerzo**: 5 minutos

---

### P0.2 `tsconfig.app.json` incluye directorio `scripts/` inexistente

**Archivo**: `tsconfig.app.json` (línea 25)

**Problema**: `"include": ["src", "scripts"]` — no existe un directorio `scripts/` en la raíz del proyecto. TypeScript falla con `File 'scripts' not found.`

**Solución**: Cambiar a `"include": ["src"]`.

**Esfuerzo**: 1 minuto

---

### P0.3 `shortcut-96.png` referenciado pero no existe

**Archivos**: `vite.config.ts` (línea 79), `public/manifest.webmanifest` (línea 47)

**Problema**: El manifest de la PWA referencia `/icons/shortcut-96.png` pero el archivo no existe en `public/icons/`.

**Solución**: Generar o crear el icono de 96×96 px y colocarlo en `public/icons/shortcut-96.png`.

**Esfuerzo**: 10 minutos

---

### P0.4 `console.log(credentials)` expone credenciales

**Archivo**: `src/features/auth/infraestructure/services/auth.service.ts` (línea 118)

**Problema**: `console.log(credentials)` imprime email y contraseña en consola durante el login. Riesgo de seguridad y privacidad.

**Solución**: Eliminar la línea o reemplazar con log sanitizado.

```
Antes:  console.log(credentials)
Después: (eliminar)
```

**Esfuerzo**: 1 minuto

---

## P1 — Alta Prioridad ✅ COMPLETADO

### P1.1 Configurar Vitest y crear tests

**Archivos**: Nuevo `vitest.config.ts`, `src/__tests__/`

**Problema**: Vitest v4 y `@testing-library/react` están instalados pero sin configurar. No hay `vitest.config.ts`, no hay script de test, no hay archivos de test. Cero cobertura.

**Tareas**:
1. Crear `vitest.config.ts` con configuración básica (jsdom, alias `@/`)
2. Agregar script `"test": "vitest run"` y `"test:watch": "vitest"` en `package.json`
3. Crear tests unitarios para:
   - `auth-store.ts` (estado, `handleAuthFailure`, `selectStudent`)
   - `useSafeMutation.ts` (comportamiento offline/online)
   - `offline-queue.ts` (CRUD, límite de 50, trim)
   - Componentes críticos (login, dashboard)
4. Instalar dependencias faltantes: `jsdom` o `happy-dom`, `@testing-library/jest-dom`

**Esfuerzo**: 4-6 horas

---

### P1.2 Duplicación de HTTP clients

**Archivos**: `src/lib/auth/http-client.ts` vs `src/lib/http/client.ts`

**Problema**: Dos implementaciones paralelas de cliente HTTP con funcionalidad similar (fetch, tokens, refresh, student ID injection). Esto causa inconsistencia y duplica mantenimiento.

**Tareas**:
1. Evaluar cuál está más completa y usarla como base
2. Unificar funcionalidades (student ID injection, token refresh, error mapping)
3. Actualizar todos los imports para que usen el cliente unificado
4. Eliminar el cliente duplicado

**Esfuerzo**: 3-4 horas

---

### P1.3 Duplicación de hooks de auth

**Archivos**: `src/features/auth/hooks/useAuth.ts` vs `src/features/auth/queries/use-session.ts`

**Problema**: Dos sets de hooks de autenticación (`useLogin`, `useRegister`, `useLogout`) con lógica similar pero destinos de navegación diferentes.

**Tareas**:
1. Determinar cuál es el oficial (probablemente `useAuth.ts` por estar mejor integrado)
2. Migrar funcionalidad faltante
3. Eliminar el set duplicado
4. Actualizar imports en componentes que usan `use-session.ts`

**Esfuerzo**: 2-3 horas

---

### P1.4 Directorio `infraestructure/` con typo

**Archivos**: `src/features/auth/infraestructure/` (typ0), `src/features/auth/infrastructure/`

**Problema**: Existen dos directorios: `infraestructure/` (con `mappers/` y `services/`) e `infrastructure/` (con `auth-storage.ts`). El typo causa confusión y 3 archivos importan desde la ruta incorrecta.

**Tareas**:
1. Unificar todo en `infrastructure/` (ortografía correcta)
2. Actualizar imports en:
   - `src/features/auth/hooks/useAuth.ts` (línea 3)
   - `src/features/auth/queries/auth-api.ts` (línea 5)
   - `src/lib/auth/http-client.ts` (línea 1)
3. Eliminar el directorio con typo

**Esfuerzo**: 30 minutos

---

### P1.5 Falta ruta `/dashboard/teacher`

**Archivos**: `src/routes/protected-routes.tsx`, `src/features/teacher/` (nuevo)

**Problema**: El rol `teacher` existe en el dominio (`types.ts`) pero `getDashboardPath("teacher")` retorna `/dashboard/teacher`, ruta que no está definida en el router. El profesor es redirigido al login tras iniciar sesión.

**Tareas**:
1. Crear feature `teacher/` con su página de dashboard
2. Agregar ruta `/dashboard/teacher` con `RequireRole allowedRole="teacher"`
3. Definir qué debe mostrar (clases, estudiantes, progreso grupal)
4. Agregar navegación para teacher

**Esfuerzo**: 4-8 horas (depende de funcionalidad)

---

### P1.6 Navegación referencia rutas inexistentes

**Archivo**: `src/features/navigation/components/config/navigation.config.ts`

**Problema**: El menú de navegación incluye enlaces a `/practice` y `/games` que no tienen rutas definidas en el router.

**Tareas**:
1. Opción A: Crear las rutas `/practice` y `/games` con páginas placeholder
2. Opción B: Eliminar temporalmente esos items del menú hasta implementarlos

**Esfuerzo**: 30 minutos (opción B) o 4-6 horas (opción A)

---

## P2 — Media Prioridad ✅ COMPLETADO

### P2.1 Eliminar código muerto

**Archivos**:
- `src/db/db.ts` — Base de datos Dexie duplicada y no usada
- `src/components/Sidebar.tsx` — No importado por ningún archivo activo
- `src/components/SidebarItem.tsx` — No importado por ningún archivo activo
- `src/components/StatBox.tsx` — No importado por ningún archivo activo
- `src/App.css` — CSS boilerplate de Vite no importado (42 líneas)

**Tareas**: Verificar cada archivo no es usado por ningún import, luego eliminarlos.

**Esfuerzo**: 30 minutos

---

### P2.2 Resolver 13 TODOs en el código

**Archivo principal**: `src/features/lessons/pages/lesson-page.tsx` (11 de 13 TODOs)

**Problema**: La página de lecciones tiene múltiples marcadores de posición para datos que debería devolver el API (`demoContent`, `secondaryQuestion`, `subInstruction`, `stepTotal`, `stepCurrent`, etc.).

**Tareas**:
1. Revisar los TODOs en `lesson-page.tsx` y determinar cuáles son resolvibles ahora
2. Reemplazar datos mock con datos reales del API
3. Eliminar los TODOs resueltos
4. Documentar los que dependen de cambios en el backend

**Esfuerzo**: 2-4 horas

---

### P2.3 Corregir emoji en código

**Archivo**: `src/features/lessons/pages/lesson-page.tsx` (línea 108)

**Problema**: Contiene el emoji `😢` en código. AGENTS.md prohíbe emojis en el código fuente.

**Solución**: Reemplazar con texto o un componente de icono.

**Esfuerzo**: 5 minutos

---

### P2.4 Limpiar Sidebar (usa default export)

**Archivo**: `src/components/Sidebar.tsx` (línea 5)

**Problema**: Usa `export default function Sidebar` — viola la convención de "named exports only". Además, el componente no es usado por nadie.

**Solución**: Si se mantiene, cambiar a named export. Si no se usa, eliminarlo (cubierto en P2.1).

**Esfuerzo**: 5 minutos

---

### P2.5 Actualizar favicon de Vite por defecto

**Archivo**: `index.html` (línea 5)

**Problema**: El favicon sigue siendo `/vite.svg` (el icono por defecto de Vite). Debería ser el logo de Amauta.

**Solución**: Reemplazar con el favicon de la aplicación.

**Esfuerzo**: 10 minutos

---

### P2.6 Verificar `robots.txt` faltante

**Archivo**: `vite.config.ts` (línea 33)

**Problema**: `includeAssets` lista `robots.txt` pero el archivo no existe en `public/`.

**Solución**: Crear `public/robots.txt` con configuración básica.

**Esfuerzo**: 10 minutos

---

## P3 — Baja Prioridad ✅ COMPLETADO

### P3.1 Manifest duplicado

**Archivos**: `vite.config.ts` (configuración de manifest) y `public/manifest.webmanifest`

**Problema**: El manifest de la PWA está definido en dos lugares. El plugin `vite-plugin-pwa` genera su propio manifest en build, por lo que tener `public/manifest.webmanifest` puede causar conflictos.

**Solución**: Elegir una fuente única (probablemente la config de `vite-plugin-pwa`) y eliminar `public/manifest.webmanifest`.

**Esfuerzo**: 30 minutos

---

### P3.2 `console.warn` en Service Worker de producción

**Archivo**: `src/sw.ts` (línea 49)

**Problema**: `console.warn('notifyClients error', err)` en código del SW que corre en producción.

**Solución**: Eliminar o reemplazar con logger condicional.

**Esfuerzo**: 5 minutos

---

### P3.3 `src/vite-env.d.ts` faltante

**Archivo**: `src/vite-env.d.ts` (no existe)

**Problema**: Aunque `tsconfig.app.json` tiene `"types": ["vite/client"]`, la convención de Vite incluye un archivo `src/vite-env.d.ts` con `/// <reference types="vite/client" />`.

**Solución**: Crear el archivo.

**Esfuerzo**: 2 minutos

---

### P3.4 Icono maskable sin padding de seguridad

**Archivo**: `vite.config.ts` (líneas 49-71)

**Problema**: El mismo icono se usa para `purpose: "any"` y `purpose: "maskable"`. Los iconos maskable requieren padding de seguridad para no ser recortados por el sistema operativo.

**Solución**: Generar un icono maskable con padding adecuado.

**Esfuerzo**: 15 minutos

---

### P3.5 Unificar `handleAuthFailure` en auth-store

**Archivo**: `src/features/auth/presentation/store/auth-store.ts` (líneas 148-170)

**Problema**: Los casos `NETWORK_ERROR`, `TOKEN_EXPIRED` y `REFRESH_FAILED` ejecutan exactamente la misma lógica. Código repetitivo.

**Solución**: Agrupar los casos que hacen lo mismo.

```
Antes: switch (error) { case A: ... case B: ... case C: ... }
Después: if ([A, B, C].includes(error)) { ... }
```

**Esfuerzo**: 10 minutos

---

## P4 — Futuro (Features Nuevos) ✅ COMPLETADO

### P4.1 Dashboard completo de profesor

**Descripción**: Implementar página de dashboard para el rol `teacher` con:
- Vista de clases/grupos asignados
- Progreso de estudiantes por clase
- Estadísticas y reportes

**Dependencias**: P1.5 (ruta base)

**Esfuerzo**: 8-16 horas

---

### P4.2 Página de Práctica (`/practice`)

**Descripción**: Implementar práctica libre de ejercicios sin estructura de lección. Ideal para refuerzo y estudio autónomo.

**Esfuerzo**: 4-8 horas

---

### P4.3 Página de Juegos (`/games`)

**Descripción**: Implementar juegos educativos para reforzar el aprendizaje de forma lúdica.

**Esfuerzo**: 8-16 horas

---

### P4.4 FeedbackPage después de ejercicios

**Archivo**: `src/features/lessons/pages/lesson-page.tsx` (TODO línea 82)

**Descripción**: Implementar pantalla de feedback después de responder un ejercicio, mostrando resultado, explicación y progreso.

**Esfuerzo**: 4-6 horas

---

### P4.5 Integración con Sentry (error tracking)

**Descripción**: Conectar `@sentry/react` para monitoreo de errores en producción. Ya está documentado en `ERROR_HANDLING.md`.

**Esfuerzo**: 2-3 horas

---

## Roadmap Sugerido (Orden de Ejecución) ✅ COMPLETADO

### Semana 1 — Correcciones Críticas (P0)

| Día | Tareas | Estado |
|-----|--------|--------|
| 1 | P0.1 Fix rutas en `use-session.ts` | ✅ |
| 1 | P0.2 Fix `tsconfig.app.json` (scripts/) | ✅ |
| 1 | P0.3 Generar `shortcut-96.png` | ✅ |
| 1 | P0.4 Eliminar `console.log(credentials)` | ✅ |

### Semana 2 — Testing y Deuda Técnica (P1)

| Día | Tareas | Estado |
|-----|--------|--------|
| 1-2 | P1.1 Configurar Vitest + primeros tests | ✅ (+170 tests) |
| 1 | P1.2 Unificar HTTP clients | ✅ |
| 1 | P1.3 Unificar hooks de auth | ✅ |
| 0.5 | P1.4 Fix typo `infraestructure/` → `infrastructure/` | ✅ |

### Semana 3 — Features Incompletos (P1)

| Día | Tareas | Estado |
|-----|--------|--------|
| 2 | P1.5 Dashboard de teacher (ruta + página base) | ✅ |
| 0.5 | P1.6 Fix navegación (`/practice`, `/games`) | ✅ |

### Semana 4 — Limpieza y Calidad (P2)

| Día | Tareas | Estado |
|-----|--------|--------|
| 0.5 | P2.1 Eliminar código muerto | ✅ |
| 1-2 | P2.2 Resolver TODOs en lesson-page.tsx | ✅ |
| 0.5 | P2.3-P2.6 Correcciones menores (emojis, favicon, robots.txt, Sidebar) | ✅ |

### Sprints Siguientes — Backlog (P3-P4)

| Sprint | Tareas | Estado |
|--------|--------|--------|
| 5 | P3.1-P3.5 Calidad (manifest, SW logs, maskable icon, etc.) | ✅ |
| 6 | P4.1 Dashboard de teacher completo | ✅ |
| 7 | P4.2 Página de práctica | ✅ |
| 8 | P4.3 Juegos educativos + FeedbackPage | ✅ |

---

## Resumen de Esfuerzo Estimado

| Prioridad | Tareas | Esfuerzo Total | Estado |
|-----------|--------|---------------|--------|
| P0 | 4 tareas | ~15 minutos | ✅ Completado |
| P1 | 6 tareas | ~15-22 horas | ✅ Completado |
| P2 | 6 tareas | ~3-5 horas | ✅ Completado |
| P3 | 5 tareas | ~1 hora | ✅ Completado |
| P4 | 5 tareas | ~26-49 horas | ✅ Completado |
| **Total** | **26 tareas** | **~45-77 horas** | **✅ TODO COMPLETADO** |

---

## Documentación Relacionada

- [`VISION_GENERAL.md`](../vision/VISION_GENERAL.md) — Visión general de la app en lenguaje natural
- [`ARCHITECTURE_LAYERS.md`](../fundamentos/ARCHITECTURE_LAYERS.md) — Arquitectura de capas
- [`OFFLINE_QUEUE_SYSTEM.md`](../offline/OFFLINE_QUEUE_SYSTEM.md) — Sistema de cola offline
- [`AUTH_FLOW.md`](../core/AUTH_FLOW.md) — Flujos de autenticación
- [`SERVICE_WORKER.md`](../offline/SERVICE_WORKER.md) — Service Worker y caching
- [`ERROR_HANDLING.md`](../errores/ERROR_HANDLING.md) — Manejo de errores
