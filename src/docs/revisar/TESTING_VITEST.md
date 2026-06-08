# Testing con Vitest — Plan por Fases

## Estado actual de la infraestructura

- Vitest 4 instalado con jsdom
- Config en `vitest.config.ts`: globals true, setup en `src/test/setup.ts`
- 12 archivos de test existentes (~286 tests en total)
- Los tests se ejecutan con: `pnpm test` (watch) o `pnpm test:run`

```
src/
├── test/setup.ts              # @testing-library/jest-dom + cleanup
├── components/error/ErrorBoundary.test.tsx     (15 tests)
├── components/pwa/ConnectionStatus.test.tsx    (20 tests)
├── features/auth/domain/auth-error.test.ts     (20 tests)
├── features/auth/domain/types.test.ts          (31 tests)
├── features/auth/domain/register-form.types.test.ts (9 tests)
├── features/auth/presentation/store/auth-store.test.ts (25 tests)
├── features/exercises/domain/exercise.types.test.ts (58 tests)
├── lib/http/client.test.ts                     (11 tests)
├── lib/query/keys.test.ts                      (27 tests)
├── lib/sync/conflict.test.ts                   (34 tests)
├── lib/sync/retry.test.ts                      (30 tests)
└── routes/guards/guards.test.tsx               (7 tests)
```

---

## Tests Planificados por Fase

### Fase 3.1 — game-config (dominio de juegos)

**Archivo**: `src/features/games/domain/game-config.test.ts`
**Prioridad**: Alta (lógica pura, sin dependencias)

| # | Test | Descripción |
|---|------|-------------|
| 1 | `GAME_CONFIGS` tiene 3 juegos | Verifica que existan memory, timed, quiz |
| 2 | Cada GameConfig tiene campos requeridos | id, title, description, icon, color, bgClass, estimatedMinutes |
| 3 | `generatePairs('easy')` retorna 8 pares | 4 sumas + 4 restas |
| 4 | `generatePairs('medium')` retorna 8 pares | 4 sumas (5-15) + 4 restas (8-20) |
| 5 | `generatePairs('hard')` retorna 8 pares | 4 multiplicaciones + 4 restas |
| 6 | Cada par tiene `expression` y `result` | Campos no vacíos, result es string numérico |
| 7 | Resultados matemáticos correctos | Verificar que `5 + 3` da `"8"`, etc. (con seed mockeado) |
| 8 | Pares están desordenados | Verificar que el orden no es secuencial |
| 9 | `generateQuizQuestions(0)` retorna `[]` | Edge case: count = 0 |
| 10 | `generateQuizQuestions(5)` retorna 5 preguntas | Longitud correcta |
| 11 | Cada pregunta tiene 4 opciones | options.length === 4 |
| 12 | `correctIndex` es válido | 0 <= correctIndex < 4 |
| 13 | Opción correcta está en `options[correctIndex]` | El valor coincide con el resultado de la operación |
| 14 | Todas las opciones son strings | Verificar tipo |
| 15 | Sin opciones duplicadas | Las 4 opciones son distintas |
| 16 | `generateQuizQuestions` genera distintos tipos | Debe incluir +, -, x en diferentes preguntas |

### Fase 3.2 — useMemoryGame (hook)

**Archivo**: `src/features/games/hooks/useMemoryGame.test.ts`
**Prioridad**: Alta (lógica de juego)

| # | Test | Descripción |
|---|------|-------------|
| 17 | Hook se inicializa con `totalPairs = 8` | Cards.length === 16, totalPairs === 8 |
| 18 | Todas las cartas empiezan ocultas | Ninguna isFlipped ni isMatched |
| 19 | Cada carta tiene un par único | pairId se repite exactamente 2 veces |
| 20 | `flipCard(0)` voltea la carta | cards[0].isFlipped === true |
| 21 | `flipCard(0)` dos veces no hace nada | La carta ya está volteada, no se puede repetir |
| 22 | Voltear carta ya matcheada no hace nada | isMatched === true → no se puede voltear |
| 23 | Match exitoso | Voltear 2 cartas del mismo pairId → ambas se matchean |
| 24 | Match fallido | Voltear 2 de distinto pairId → ambas se ocultan tras delay |
| 25 | Intentos incrementan en cada par | attempts +1 por cada par de flips |
| 26 | `matchedPairs` avanza con cada match | matchedPairs +1 por match exitoso |
| 27 | `isFinished` true cuando todos los pares resueltos | matchedPairs === totalPairs |
| 28 | `resetGame` reinicia todo | cards, flippedIndices, matchedPairs, attempts, isFinished |
| 29 | Nuevas cartas después de reset | Los ids pueden cambiar (nuevo shuffle) |
| 30 | ElapsedSeconds progresa | Al menos 1 segundo después de 1s real (usa vi.advanceTimers) |

### Fase 3.3 — useQuizGame (hook)

**Archivo**: `src/features/games/hooks/useQuizGame.test.ts`
**Prioridad**: Alta (lógica de quiz)

| # | Test | Descripción |
|---|------|-------------|
| 31 | Hook se inicializa con `totalCount = 10` | questions.length === 10 |
| 32 | `currentIndex` empieza en 0 | Primera pregunta visible |
| 33 | `selectOption(i)` marca selectedOption | selectedOption === i |
| 34 | `selectOption(i)` muestra feedback | showFeedback === true |
| 35 | Opción correcta → `isCorrect = true` | selectOption(correctIndex) → isCorrect true, score +10 |
| 36 | Opción incorrecta → `isCorrect = false` | selectOption(otra) → isCorrect false, score sin cambio |
| 37 | `selectOption` dos veces no funciona | showFeedback true bloquea segunda selección |
| 38 | `nextQuestion` avanza currentIndex | currentIndex +1, selectedOption = null, showFeedback = false |
| 39 | `nextQuestion` en última pregunta finaliza | isFinished = true, result no es null |
| 40 | `resetQuiz` reinicia todo | currentIndex 0, score 0, isFinished false |
| 41 | `correctCount` se actualiza | Cada acierto incrementa correctCount |
| 42 | `result.score` calcula porcentaje | 5/10 correctas → score 50 |

### Fase 3.4 — game.types (interfaces)

**Archivo**: `src/features/games/domain/game.types.test.ts`
**Prioridad**: Media

| # | Test | Descripción |
|---|------|-------------|
| 43 | GameId es union type | Solo "memory", "timed", "quiz" |
| 44 | GameConfig requiere todos los campos | id, title, etc. presentes |
| 45 | MemoryCard estructura | id, pairId, content, isFlipped, isMatched |
| 46 | QuizQuestion estructura | prompt, options, correctIndex |
| 47 | GameResult estructura | gameId, score, correctCount, totalCount, timeSeconds, earnedPoints |

### Fase 3.5 — practice-page (componente)

**Archivo**: `src/features/practice/pages/practice-page.test.tsx`
**Prioridad**: Media (depende de hooks y store)

| # | Test | Descripción |
|---|------|-------------|
| 48 | Renderiza selector de temas | 5 botones de tema visibles |
| 49 | Renderiza selector de dificultad | 3 niveles de estrella |
| 50 | Clic en tema lo selecciona | Tema cambia estilo visual |
| 51 | "Comenzar a practicar" inicia práctica | Selector desaparece, aparece input |
| 52 | Loading state mientras carga ejercicio | Spinner visible |
| 53 | Error state si falla fetch | Mensaje de error + botón reintentar |
| 54 | Contador de aciertos visible en modo práctica | Score/racha/intentos se renderizan |

### Fase 3.6 — games-page (componente)

**Archivo**: `src/features/games/pages/games-page.test.tsx`
**Prioridad**: Media

| # | Test | Descripción |
|---|------|-------------|
| 55 | Portal muestra 3 GameCards | 3 tarjetas con título y descripción |
| 56 | Clic en "Memoria" cambia a vista memory | currentView === "memory" |
| 57 | Clic en "Contrarreloj" cambia a vista timed | currentView === "timed" |
| 58 | Clic en "Quiz" cambia a vista quiz | currentView === "quiz" |
| 59 | Botón "Volver" regresa al portal | currentView === "portal" |

### Fase 4 — Teacher Dashboard (cuando se implemente)

**Archivo**: `src/features/dashboard/pages/teacher-dashboard-page.test.tsx`
**Prioridad**: Alta (cuando exista lógica)

| # | Test | Descripción |
|---|------|-------------|
| 60 | Renderiza lista de clases | Clases del docente visibles |
| 61 | Tabla de estudiantes con métricas | Nombre, score, precisión, racha |
| 62 | Estadísticas grupales se calculan correctamente | Promedios, gráficos |
| 63 | Loading state | Spinner mientras carga |
| 64 | Error state | Mensaje + reintentar |
| 65 | Solo accesible con role teacher | RequireRole bloquea otros roles |
| 66 | Responsive | Se adapta a mobile |

---

## Resumen de esfuerzo

| Fase | Archivos | Tests | Esfuerzo estimado |
|------|----------|-------|-------------------|
| 3.1 | `game-config.test.ts` | ~16 tests | 1 hr |
| 3.2 | `useMemoryGame.test.ts` | ~14 tests | 2 hr |
| 3.3 | `useQuizGame.test.ts` | ~12 tests | 1.5 hr |
| 3.4 | `game.types.test.ts` | ~5 tests | 0.5 hr |
| 3.5 | `practice-page.test.tsx` | ~7 tests | 1.5 hr |
| 3.6 | `games-page.test.tsx` | ~5 tests | 1.5 hr |
| 4 | teacher-dashboard-page.test.tsx | ~7 tests | 2 hr (post-implementación) |
| **Total** | **7 archivos** | **~66 tests** | **~10 hr** |

## Cómo ejecutar

```bash
pnpm test          # modo watch
pnpm test:run      # una sola ejecución
pnpm test:coverage # con reporte de cobertura
```

Para ejecutar un archivo específico:

```bash
pnpm test -- src/features/games/domain/game-config.test.ts
```
