# Plan: Gamificación y UX enriquecida de la página de Lección

> **Proyecto**: pwa-amauta (proyecto real)
> **Origen de las ideas**: prototipo `amauta (7)` (LessonsPage + ExerciseStage)
> **Principio**: mantener intacta la infraestructura del proyecto real (API, Dexie, outbox offline, i18n, arquitectura DDD). Solo se adoptan ideas de UX del prototipo.

---

## Estado del plan

| Fase | Descripción | Estado |
|------|-------------|--------|
| 1 | Fundaciones (Character expressions, useBreakpoint, sound, confetti) | ✅ Completada |
| 2 | Dominio y datos (options en schema, mocks, Dexie v5 conceptMastery, hooks) | ✅ Completada |
| 3 | Componentes de ejercicio (question-card, mascot-feedback, lesson-header) | ✅ Completada |
| 4 | Orquestador lesson-page.tsx (reducer sesión, server-first, split layout) | ✅ Completada |
| 5 | i18n (es-LA/lessons.json) | ✅ Completada |
| 7 | Corrección: validación mock exacta + fin de lección (stepCurrent/stepTotal) | ✅ Completada |
| 8 | Corrección: confeti de celebración en pantalla de resumen | ✅ Completada |
| 6 | Verificación manual (`pnpm lint && pnpm build && pnpm test:run`) — la ejecuta el usuario | ⏳ Pendiente |

**Protocolo**: cada fase se ejecuta completa; al terminar se reporta y se espera confirmación explícita del usuario antes de marcarla como completada y pasar a la siguiente.

---

## Decisiones confirmadas

| # | Decisión | Elección |
|---|----------|----------|
| 1 | Validación de respuestas | **Server-first optimista**: POST `submitAnswer` → `ExerciseResult` (sin cambios de contrato, anti-cheat intacto). Mientras llega el resultado: mascota `thinking`. Al llegar: verde/confetti/sonido o ámbar/ánimo. |
| 2 | Selección táctil | Campo opcional `options?: string[]` en `exerciseSchema` + mocks. Sin `options`, la UI cae a input numérico/texto (compatibilidad total con backend actual). |
| 3 | Flujo de feedback | **Inline** tras cada respuesta (bottom sheet móvil / sidebar desktop). `/lessons/feedback` se conserva SOLO para respuestas encoladas offline (`QUEUED_OFFLINE`). |
| 4 | Animaciones | Instalar `motion` (ya instalado: `motion@13.1.1`). |
| 5 | Mascota reactiva | 6 expresiones con imágenes propias `.webp`: `idle, thinking, happy, encouraging, superstar, sad`. |
| 6 | Layout lección | Split-screen 40/60 dentro del `AmautaLayout` actual (mantiene Shell, navegación, ConnectionStatus). |

## Assets verificados

- `public/img/mascota/idle.webp`
- `public/img/mascota/thinking.webp`
- `public/img/mascota/happy.webp`
- `public/img/mascota/encouraging.webp`
- `public/img/mascota/superstar.webp`
- `public/img/mascota/sad.webp`

Fallback del componente Character a `/img/amauta-mascot.jpg` si falta alguna expresión.

## Infraestructura existente que se reutiliza (NO se duplica)

- **Dexie v4** (`amauta-db`): tabla `progress` ya tiene `points`, `level`, `precision`, `streakDays`, `lastPlayedAt` → XP/racha se persisten ahí. Solo se agrega tabla `conceptMastery` en v5.
- **`useSafeMutation`** + outbox (`mutations` table) para submit offline.
- **Patrón CRUD Dexie**: módulos por entidad en `src/lib/api/storage/*-db.ts`.
- **`canvas-confetti@1.9.4`** ya instalado.
- **`AmautaProgress`, `AmautaButton`, `AmautaBadge`** del design system.
- **i18n react-i18next**, namespace `lessons`.

---

## Fase 1 — Fundaciones ⏳

| Archivo | Acción | Detalle |
|---|---|---|
| `src/components/amauta/character.tsx` | Modificar | Prop opcional `expression?: CharacterExpression` ("idle" \| "thinking" \| "happy" \| "encouraging" \| "superstar" \| "sad"). Mapea a `/img/mascota/{expression}.webp` con fallback a `amauta-mascot.jpg`. Animación motion según expresión. Backward-compatible (prop opcional). Exportar tipo en `index.ts`. |
| `src/hooks/useBreakpoint.ts` | Crear | Puerto del prototipo adaptado a convenciones: function declaration, named export, matchMedia reactivo (<768 mobile, <1024 tablet, resto desktop). |
| `src/lib/sound/sound.ts` | Crear | Web Audio API generado (sin assets → offline-safe): `playCorrectSound`, `playWrongSound`, `playVictoryFanfare`, `speakText(text)` (texto ya traducido desde i18n), toggle/estado global. |
| `src/lib/effects/confetti.ts` | Crear | Wrappers tipados sobre canvas-confetti: `fireCorrectBurst()`, `fireVictoryCelebration()`. Respeta `prefers-reduced-motion`. |

## Fase 2 — Dominio y datos ⏳

| Archivo | Acción | Detalle |
|---|---|---|
| `src/features/exercises/domain/exercise.types.ts` | Modificar | `exerciseSchema` += `options: z.array(z.string()).optional()` |
| `src/services/exercise.service.ts` | Modificar | Los 3 mocks reciben `options` (respuesta correcta NO incluida) |
| `src/lib/api/storage/db.ts` | Modificar | `db.version(5)`: tabla `conceptMastery: "id, studentId, topicId, subject"` + interfaz `ConceptMasteryEntry { id, studentId, topicId, subject, masteryLevel, confidenceStage, consecutiveCorrect, totalAttempts, totalCorrect, firstTryCorrectCount, lastPracticedAt }` |
| `src/lib/api/storage/concept-mastery-db.ts` | Crear | CRUD estilo `exercises-db.ts` + `recordConceptAttempt(studentId, topicId, subject, isCorrect, isFirstAttempt)` con fórmula del prototipo: mastery = clamp(accuracy×0.75 + bonusRacha(min(25, consecutivos×5)), 10..100); stages: ≥80&rango≥2 → mastered, ≥40 → practicing, sino exploring |
| `src/features/exercises/hooks/useConceptMastery.ts` | Crear | Hook React Query + Dexie (patrón `useProgressByStudent`) + mutación para registrar intento |
| `src/lib/query/keys.ts` | Modificar | `progressKeys.mastery(studentId)` |

## Fase 3 — Componentes de ejercicio ⏳

Ubicación: `src/features/lessons/components/exercise/`

| Archivo | Detalle |
|---|---|
| `question-card.tsx` | Prompt + botón altavoz TTS grande + toggle pista (`hints[]`) + grid opciones táctil si `options` existe (estados: neutral → checking disabled → verde correcta / ámbar elegida / atenuadas) + input fallback NUMERIC/TEXT + botón Continuar post-respuesta |
| `mascot-feedback.tsx` | Sidebar (tablet/desktop, col 40%): Character animado + card feedback (+XP pill, mastery %, explicación). Bottom sheet (móvil): sheet inferior sin overlay oscuro, mascota flotando borde superior, botón continuar. Expresiones: thinking/happy/encouraging/sad |
| `lesson-header.tsx` | Progreso paso (AmautaProgress) + badges sesión: +XP acumulado, racha streakDays, mastery tema |

## Fase 4 — Orquestador lesson-page.tsx ⏳

| Aspecto | Detalle |
|---|---|
| Reducer sesión | `idle → selecting(option) → checking(mascot thinking + submitAnswer) → correct(+10XP, confetti, sonido, auto-avance 1.9s cancelable) / incorrect(sonido suave, explicación, espera Continuar) → advance(refetch next exercise, reset)` |
| firstTryCorrectCount | Historial en reducer por exerciseId (primer intento correcto de sesión) |
| Persistencia | Result → feedback inline + `recordConceptAttempt()` Dexie + update `progress` (points/streakDays/precision vía patrón existente) |
| Offline | `QUEUED_OFFLINE` → navega a `/lessons/feedback` con `{ queued: true }` (igual que hoy) |
| Layout | Grid 12 cols dentro de AmautaContainer: `lg:col-span-5` mascota / `lg:col-span-7` ejercicio; stack + bottom sheet móvil |
| Se conserva | `DownloadLesson`, prefetch `exerciseKeys.next`, guards de ruta actuales |

## Fase 5 — i18n ⏳

`es-LA/lessons.json` nuevas claves (sin emojis, per AGENTS.md):
`lesson.xpEarned, lesson.streakDays, lesson.mastery, lesson.listening, lesson.hintShow, lesson.hintHide, lesson.continue, lesson.autoAdvancing, lesson.checking, lesson.correctTitle, lesson.incorrectTitle, lesson.reviewBadge, lesson.optionsLabel`

## Fase 6 — Verificación manual (usuario)

```bash
pnpm lint && pnpm build && pnpm test:run
```

Tests nuevos esperados (patrón colocado `*.test.ts(x)`):
- Reducer de sesión (transiciones, firstTry, XP)
- `recordConceptAttempt` (fórmula mastery + stages)
- QuestionCard (opciones vs input fallback)
- Character mapping de expresiones

---

## Registro de progreso

| Fecha | Fase | Nota |
|---|---|---|
| 2026-08-21 | 1 | Character con 6 expresiones webp + fallback legacy; useBreakpoint; sound.ts (Web Audio + TTS); confetti.ts. tsc -b limpio |
| 2026-08-21 | 2 | options? en schema + mocks (ex_001/002 MC, ex_003 NUMERIC fallback); Dexie v5 conceptMastery; CRUD con formula prototipo; hooks React Query; keys mastery/masteryTopic |
| 2026-08-21 | 3 | question-card (opciones tactiles + input fallback), mascot-feedback (sidebar/sheet), lesson-header (XP/racha/mastery). i18n estrictamente tipado: claves lessons.json adelantadas; size child-md fix |
| 2026-08-21 | 4-5 | lesson-page reescrito: reducer sesion (idle/checking/correct/incorrect), XP +10 por acierto, firstTry por historial exerciseId, auto-avance 1.9s en correcto, mastery via useRecordConceptAttempt, puntos/racha/nivel via useUpdateProgress existente (offline-aware), QUEUED_OFFLINE navega a feedback, split md:col-span-5/7 con sheet movil; keepPreviousData en useNextExercise; gamification.utils.ts (streak calendario, nivel por 100pts). i18n: 38 claves verificadas automaticamente. tsc -b limpio |
| 2026-08-21 | 7 | Bugfix: getMockResult evaluaba con heuristica numerica vieja (respuesta <=5 siempre fallaba). Ahora MOCK_ANSWER_KEY por ejercicio + comparacion exacta trim(). Fin de leccion definido: passed && stepCurrent >= stepTotal (mock cicla pasos por topicId) → fanfarria + confetti victory + navigate a /lessons/feedback {summary}. FeedbackPage: nueva rama summary (Character superstar/happy, badges XP + precision, CTA Seguir practicando / Ir al inicio). ensureMockExercises re-seedea siempre (fix mocks obsoletos sin options en Dexie). tsc -b limpio |
| 2026-08-21 | 8 | Bugfix confeti: se disparaba pre-navegacion y se perdia en la transicion; la pantalla de resumen no tenia ninguno. fireVictoryCelebration reemplazado por fireLessonCelebration(perfect) en confetti.ts: burst central + cañones laterales via requestAnimationFrame (1600ms perfecto / 800ms normal) con colores Amauta. SummaryView extraido como componente en feedback-page.tsx con useEffect al montar → dispara celebracion sobre el resumen. lesson-page conserva solo playVictoryFanfare (el sonido no depende de la ruta). Sheet movil tambien corregido antes: bg-card solido (antes bg-success/10 translucido dejaba ver texto detras) + z-50. tsc -b limpio |
| 2026-08-21 | 9 | Bugfix confeti invisible en dev: el sistema tenia prefers-reduced-motion activo y los wrappers de confetti.ts lo suprimian silenciosamente (guard manual + disableForReducedMotion); el confetti del dashboard funcionaba porque llama a canvas-confetti directo sin guard. Fix: isConfettiSuppressed() centraliza el guard, log warn una vez por sesion en dev explicando la causa, override VITE_FORCE_CONFETTI=true (.env.example documentado) que tambien desactiva disableForReducedMotion interno; fireCorrectBurst ahora usa colores Amauta. En produccion los usuarios con reduced-motion siguen sin animaciones (accesibilidad intacta). tsc -b limpio |

## Registro de decisiones de implementación

- **Character backward-compatible**: sin prop `expression` usa `/img/amauta-mascot.jpg` (dashboards/navigation sin cambios visuales). Con `expression` usa `/img/mascota/{expression}.webp`.
- **Server-first**: al fallar NO se revela la opcion correcta (el backend no la envia); seleccion queda ambar + explicacion textual.
- **Fin de leccion**: `passed && stepCurrent >= stepTotal` usando campos ya existentes en el schema Exercise. Fallo en ultimo paso NO completa (filosofia adaptativa: repite hasta lograr). En produccion el backend controla stepCurrent/stepTotal; cliente solo detecta.
- **Progreso persistido**: bucket por `topicId` en tabla `progress` (points acumulados, streakDays por dias calendario con reset si se salta un dia, nivel = floor(points/100)+1). `precision` no se toca localmente (la posee el backend).
- **Mastery**: solo Dexie (`concept-mastery-db`); el backend recibe su propia metrica via submitAnswer.
- **useUpdateProgress** (existente) reutilizado para persistir recompensas: ya tiene outbox offline configurado.
