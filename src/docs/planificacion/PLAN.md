# Plan de Trabajo por Fases

> Prioridades basadas en ROADMAP.md. Todo el P1 y P2 están completados.
> ✅ = Completado · 🟡 = En progreso · 🔴 = Pendiente

---

## Fase 0 — Correcciones Críticas (P0) — ✅ COMPLETADA (resuelto en refactors previos)

> **Esfuerzo total: ~15 min.** Items del ROADMAP.md no abordados aún.

| # | Item | Esfuerzo | Dependencias |
|---|------|----------|-------------|
| 0.1 | Fix rutas en `use-session.ts` navega a `/student/dashboard` en vez de `/dashboard/student` | 5 min | — |
| 0.2 | Fix `tsconfig.app.json`: eliminar `"scripts"` del `include` | 1 min | — |
| 0.3 | `shortcut-96.png` referenciado en manifest pero no existe en `public/icons/` | 10 min | — |
| 0.4 | Eliminar `console.log(credentials)` en `auth.service.ts` (expone passwords) | 1 min | — |

**Recomendación**: Hacer antes que cualquier feature, son bugs rápidos.

---

## Fase 1 — Features de Cierre del Ejercicio (P4) — ✅ COMPLETADA

| # | Item | Esfuerzo | Dependencias |
|---|------|----------|-------------|
| 1.1 | **FeedbackPage post-ejercicio** — Pantalla tras responder: resultado, score, explicación, botón continuar | 4-6 hr | — |
| 1.2 | Conectar FeedbackPage en `lesson-page.tsx` | 30 min | 1.1 |

---

## Fase 2 — Infraestructura y Monitoreo — ✅ COMPLETADA

| # | Item | Esfuerzo | Dependencias |
|---|------|----------|-------------|
| 2.1 | **Sentry** — Integrar `@sentry/react` para error tracking en producción | 2-3 hr | — |
| 2.2 | **Icono maskable** — Generar PNG con padding para `purpose: "maskable"` | 15 min | — |

---

## Fase 3 — Páginas Faltantes del Menú — ✅ COMPLETADA

| # | Item | Esfuerzo | Dependencias |
|---|------|----------|-------------|
| 3.1 | **Página de práctica `/practice`** — Selector de tema/dificultad + ejercicios libres con feedback | 4-6 hr | — |
| 3.2 | **Página de juegos `/games`** — Portal + 3 juegos: Memoria Matemática, Reto Contrarreloj, Quiz | 10-12 hr | — |

### Archivos creados

```
src/features/practice/
└── pages/practice-page.tsx        → Selector de tema/dificultad + flujo de práctica
src/features/games/
├── domain/game.types.ts           → GameConfig, GameResult, MemoryCard, QuizQuestion
├── domain/game-config.ts          → Config de juegos, generador de pares, generador quiz
├── hooks/useMemoryGame.ts         → Lógica de memory (flip, match, timer, score)
├── hooks/useTimedChallenge.ts     → (reemplazado por lógica inline en wrapper)
├── hooks/useQuizGame.ts           → Quiz state (preguntas, score, feedback)
├── components/game-card.tsx       → Tarjeta de selección en portal
├── components/game-header.tsx     → Barra superior: back, timer, score, streak
├── components/game-result.tsx     → Pantalla de resultado post-juego
├── components/memory-board.tsx    → Tablero de memoria + MemoryStats
├── components/timed-challenge.tsx → Vista reto contrarreloj
├── components/quiz-game.tsx       → Vista quiz de opción múltiple
└── pages/games-page.tsx           → Portal + state-driven game views
```

### Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `src/routes/protected-routes.tsx` | + lazy imports y rutas `/practice`, `/games` |
| `src/layout/amauta-layout.tsx` | + `"/practice"`, `"/games"` a LAYOUT_ROUTES |
| `src/components/ui/breadcrumb.tsx` | + entradas ROUTE_MAP |

**Nota**: La navegación ya tenía ambas rutas configuradas en `navigation.config.ts`.

---

## Fase 4 — Dashboard de Teacher — ✅ COMPLETADA

| # | Item | Esfuerzo | Dependencias |
|---|------|----------|-------------|
| 4.1 | **Dashboard teacher completo** — Clases, progreso grupal, estadísticas | 8-16 hr | Placeholder existía |

### Archivos creados/modificados

| Archivo | Cambio |
|---------|--------|
| `src/features/dashboard/pages/teacher-dashboard-page.tsx` | Dashboard completo con clases, estadísticas, progreso grupal, sección de riesgo |
| `src/features/dashboard/pages/teacher-dashboard-page.test.tsx` | Tests del dashboard |
| `src/features/auth/hooks/useAuth.ts` | Hook `useTeacherDashboard` |
| `src/features/auth/infrastructure/services/auth.service.ts` | `getTeacherDashboard()` con mock data y endpoint real |
| `src/features/exercises/domain/exercise.types.ts` | Schema `TeacherDashboard` |
| `src/routes/protected-routes.tsx` | Ruta `/dashboard/teacher` con lazy load |

---

## Resumen

| Fase | Items | Esfuerzo | Prioridad |
|------|-------|----------|-----------|
| Fase 0 — Correcciones P0 | 4 | ~15 min | ✅ Completo (refactors previos) |
| Fase 1 — FeedbackPage | 2 | ~5 hr | ✅ Completo |
| Fase 2 — Infraestructura | 2 | ~2.5 hr | ✅ Completo |
| Fase 3 — Menú faltante | 2 | ~12-24 hr | ✅ Completo — Práctica + 3 juegos |
| Fase 4 — Teacher dashboard | 1 | ~8-16 hr | ✅ Completo |

**Total pendiente**: ~0 hr — **TODAS LAS FASES COMPLETADAS**
