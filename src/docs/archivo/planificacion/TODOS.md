# TODOS — Implementaciones Pendientes

> Prioridades según `ROADMAP.md`.
> ✅ = Completado · 🟡 = En progreso · 🔴 = Pendiente

---

## Pendientes (post-MVP)

| Item | Prioridad | Dependencia | Notas |
|------|-----------|-------------|-------|
| **P5.1** — Conectar backend real (`.env` con `VITE_API_BASE_URL` y `VITE_USE_MOCK=false`) | 🔴 Alta | Backend operativo | Sin esto, `api-get-cache-v1` nunca se poblará. El contenido de API (ejercicios, lecciones, estudiantes) no estará disponible offline. |
| **P5.2** — Agregar screenshots al manifest | 🟡 Media | — | Chrome solicita screenshots para la "Richer PWA Install UI". No afecta funcionamiento. Se requieren screenshots wide (desktop) y portrait (mobile). |
| **P5.3** — Conectar conflict resolution en `queue-manager.ts` | 🟢 Baja | Backend debe implementar HTTP 409 Conflict + timestamps | `conflict.ts` tiene las 4 estrategias implementadas y testeadas (34 tests). Faltan ~20 líneas en `processQueue()` para llamar a `resolveConflict()`. Ver `docs/core/BACKEND_CONFLICT_RESOLUTION.md` para el contrato. |
| **P5.4** — Llamar a `stopBackgroundSync()` en cleanup del efecto | 🟢 Baja | — | `initBackgroundSync()` se llama en `App.tsx` pero `stopBackgroundSync()` nunca se ejecuta. Fuga de intervalo en desarrollo (StrictMode). En producción no impacta. |

## Correcciones Críticas (P0)

| Item | Estado |
|------|--------|
| **P0.1** — Rutas incorrectas en `use-session.ts` (`/student/dashboard` vs `/dashboard/student`) | ✅ Resuelto — archivo eliminado (dead code) |
| **P0.2** — `tsconfig.app.json` incluye `"scripts"` inexistente | ✅ Resuelto — `include` solo contiene `"src"` |
| **P0.3** — `shortcut-96.png` referenciado en PWA manifest pero no existe | ✅ Resuelto — archivo existe en `public/icons/shortcut-96.png` |
| **P0.4** — `console.log(credentials)` expone contraseñas en login | ✅ Resuelto — línea eliminada al migrar a `infrastructure/` |

---

## Testing (P1.1)

| Item | Estado | Archivo | Notas |
|------|--------|---------|-------|
| Configuración Vitest + jsdom | ✅ | `vitest.config.ts`, `src/test/setup.ts` | Fase 1 |
| Tests `retry.ts` | ✅ | `src/lib/sync/retry.test.ts` | 30 tests, Fase 2 |
| Tests `conflict.ts` | ✅ | `src/lib/sync/conflict.test.ts` | 34 tests, Fase 3 |
| Tests `query/keys.ts` | ✅ | `src/lib/query/keys.test.ts` | 27 tests, claves de caché |
| Tests `http/client.ts` | ✅ | `src/lib/http/client.test.ts` | 11 tests, isHttpError + HttpError |
| Tests `auth-error.ts` | ✅ | `src/features/auth/domain/auth-error.test.ts` | 20 tests, Fase 4. Bug corregido: case sensitivity en "Network" |
| Tests Zod schemas (auth) | ✅ | `src/features/auth/domain/types.test.ts` | 31 tests |
| Tests Zod schemas (register-form) | ✅ | `src/features/auth/domain/register-form.types.test.ts` | 9 tests |
| Tests `difficultyToStars` + exercise schemas | ✅ | `src/features/exercises/domain/exercise.types.test.ts` | 58 tests |
| Tests auth-store (Zustand) | ✅ | `src/features/auth/presentation/store/auth-store.test.ts` | 25 tests, mock de Dexie |
| Tests ConnectionStatus | ✅ | `src/components/pwa/ConnectionStatus.test.tsx` | 20 tests |
| Tests RequireAuth / RequireRole | ✅ | `src/routes/guards/guards.test.tsx` | 7 tests |
| Tests ErrorBoundary | ✅ | `src/components/error/ErrorBoundary.test.tsx` | 15 tests |

---

## Deuda Técnica (P1)

| Item | Prioridad | Archivos | Notas |
|------|-----------|---------|-------|
| Conflict resolution (`lastWriteWins`, `serverWins`, `clientWins`, `merge`) definidas en `conflict.ts` pero NO conectadas al `queue-manager.ts` | ✅ Frontend listo — 🟡 Pendiente de backend | `src/lib/sync/conflict.ts`, `queue-manager.ts` | Las funciones de resolución existen y están testeadas (34 tests). El frontend está preparado: solo faltan ~20 líneas en `queue-manager.ts` para llamar a `resolveConflict()`. El backend debe implementar versionado de datos (timestamps en respuestas, HTTP 409 Conflict) según el contrato en `docs/core/BACKEND_CONFLICT_RESOLUTION.md` |
| Duplicación de HTTP clients | ✅ | `src/lib/http/client.ts` | Unificado en `src/lib/http/client.ts`. Se eliminó `src/lib/auth/http-client.ts`. Se agregaron métodos convenience (get/post/put/patch/delete), auto-inyección de studentId + tenantId, y auto-configuración. |
| Duplicación de hooks de auth | ✅ | `src/features/auth/hooks/useAuth.ts` | Se eliminó `queries/use-session.ts` (dead code, 0 consumidores). Teacher redirect ya existía en `auth-navigation.ts`. |
| Typo `infraestructure/` | ✅ | `src/features/auth/infrastructure/` | Movidos `adapter.ts` y `auth.service.ts` a `infrastructure/`. Eliminado `infraestructure/`. |
| Falta ruta `/dashboard/teacher` | ✅ | `src/routes/protected-routes.tsx` | Agregada ruta con placeholder `TeacherDashboardPage`. Previene redirect loop al hacer login con rol teacher. |
| Navegación a rutas inexistentes | ✅ | `src/features/navigation/components/config/navigation.config.ts` | `/practice` y `/games` ya existen con vistas completas |

---

## Código Muerto y Limpieza (P2)

| Item | Estado |
|------|--------|
| Eliminar `src/db/db.ts` | ✅ |
| Eliminar `src/components/Sidebar.tsx` | ✅ |
| Eliminar `src/components/SidebarItem.tsx` | ✅ |
| Eliminar `src/components/StatBox.tsx` | ✅ |
| Eliminar `src/App.css` | ✅ |
| Limpiar ~13 TODOs en `lesson-page.tsx` | ✅ (~4 reales mantenidos) |
| Emoji 😢 → `AlertTriangle` icon | ✅ |
| Favicon Vite → PNG favicon | ✅ |
| `robots.txt` faltante | ✅ Creado |
| Sidebar default export | ✅ Archivo eliminado |

## Mejoras de Calidad (P3)

| Item | Estado |
|------|--------|
| `console.warn` en SW producción | ✅ |
| Manifest duplicado | ✅ Eliminado `public/manifest.webmanifest` |
| `src/vite-env.d.ts` faltante | ✅ Creado |
| `handleAuthFailure` repetitivo | ✅ Refactorizado |
| Icono maskable sin padding | ✅ Generados `maskable-192.png` y `maskable-512.png` con 20% de padding. Manifest actualizado con `purpose: "maskable"` separado. Script en `scripts/generate-maskable-icons.mjs` |

---

## Features Futuros (P4)

| Item | Esfuerzo | Notas |
|------|----------|-------|
| Dashboard completo de teacher | 8-16 hr | ✅ Completado en Fase 4 (clases, estadísticas, progreso grupal, sección de riesgo) |
| Página de práctica `/practice` | 4-6 hr | ✅ Completado en Fase 3 |
| Página de juegos `/games` | 10-12 hr | ✅ Completado en Fase 3 (portal + 3 juegos) |
| FeedbackPage post-ejercicio | 4-6 hr | ✅ Completado en Fase 1 |
| Integración con Sentry | 2-3 hr | ✅ Completado en Fase 2 |

---

## Leyenda

| Símbolo | Significado |
|---------|-------------|
| ✅ | Completado |
| 🟡 | Avanzado pero con pendientes |
| 🔴 | No iniciado |

> Fuente original: `ROADMAP.md` — este archivo es un resumen vivo de los TODOs.
> Los TODOs en código fuente se marcan con `// TODO: ...` en los archivos correspondientes.
