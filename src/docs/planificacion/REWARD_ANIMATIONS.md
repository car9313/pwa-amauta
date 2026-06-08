# Animaciones de Recompensa — Amauta

## 1. Análisis de la Situación Actual

### Estado Actual
- **NO existe** ningún sistema de animaciones de recompensa
- El feedback visual de correcto/incorrecto usa colores y el componente `FeedbackOverlay` (Dialog)
- No hay partículas, confeti ni efectos especiales
- Las transiciones y animaciones existentes son solo CSS (fade, slide, scale)

### Por qué necesitamos animaciones de recompensa
En una app educativa infantil, el momento posterior a una respuesta correcta es **crítico para la motivación**:

| Beneficio | Explicación |
|-----------|-------------|
| **Refuerzo positivo inmediato** | Las partículas visuales celebran el acierto y liberan dopamina |
| **Sentimiento de logro** | Una respuesta correcta se siente más significativa |
| **Gamificación** | Los niños asocian aprender con algo divertido |
| **Diferenciación** | Separa visualmente "correcto" de "siguiente pregunta" |
| **Originalidad** | En lugar de confeti genérico, usar "chispas de conocimiento" |

### Momentos de recompensa en Amauta

| Momento | Ubicación | Prioridad |
|---------|-----------|-----------|
| Respuesta correcta en quiz | `quiz-game.tsx` | **P0** |
| Respuesta correcta en práctica | `practice-page.tsx` | **P0** |
| Par encontrado en memory | `memory-board.tsx` | **P0** |
| Nivel completado | `level-screen.tsx` | **P1** |
| Logro/achievement desbloqueado | `achievement-card.tsx` | **P1** |
| Racha de aciertos (streak) | Dashboard | **P2** |
| Subida de nivel | `level-screen.tsx` | **P1** |

---

## 2. Opciones de Implementación

### Opción A: CSS Animations + DOM (0 dependencias)

| Aspecto | Detalle |
|---------|---------|
| **Bundle** | 0 KB |
| **Dependencias** | 0 |
| **Efectos posibles** | Estrellas fugaces, corazones flotantes (creando divs animados) |
| **Complejidad** | Alta — crear sistema de partículas desde cero con `@keyframes` |
| **Performance** | Limitada — muchas partículas DOM pesan |
| **Mantenibilidad** | Baja — cada efecto requiere decenas de líneas de CSS |
| **Offline** | ✅ 100% offline |

**Veredicto**: Solo viable para efectos muy simples (1-2 partículas). Para algo más elaborado, usar una librería.

### Opción B: `burst-particles` (recomendada)

| Aspecto | Detalle |
|---------|---------|
| **Bundle** | **~3 KB gzipped** |
| **Dependencias** | 0 |
| **Presets** | 14: `party`, `fire`, `snow`, `hearts`, `stars`, `bubbles`, `explode`, `rain`, `gold`, `sakura`, `electric`, `neon`, `flowers`, `smoke`, `laugh` |
| **Complejidad** | **Muy baja** — una función: `burst(event, 'stars')` |
| **Performance** | Excelente — canvas basado, 60fps |
| **Mantenibilidad** | Alta — cambias el preset string y listo |
| **Personalización** | Alta — `PresetConfig` con count, shapes, colors, spread, speed, gravity, drag, drift, fadeOut |
| **Offline** | ✅ Sin CDN, todo en bundle |
| **React específico** | No, pero se integra con `onClick` o `useEffect` |

**Uso típico:**
```tsx
import { burst } from "burst-particles";

function CorrectAnswer() {
  const handleCorrect = (e: React.MouseEvent) => {
    burst(e, "stars");
    // o: burst({ x: 300, y: 200 }, { preset: "stars", count: 20, colors: ["#FFD700", "#FFA500"] });
  };

  return <button onClick={handleCorrect}>Responder</button>;
}
```

### Opción C: `partycles`

| Aspecto | Detalle |
|---------|---------|
| **Bundle** | ~10 KB gzipped |
| **Dependencias** | 0 |
| **Presets** | 23 animaciones: confetti, sparkles, hearts, stars, fireworks, bubbles, snow, emoji, coins, petals, aurora, fireflies, balloons, galaxy... |
| **Complejidad** | Baja — `useReward(ref, "stars")` |
| **Performance** | Buena — requestAnimationFrame |
| **Mantenibilidad** | Alta |
| **React específico** | ✅ Sí — hook `useReward` nativo |
| **Personalización** | Alta — particleCount, spread, colors, physics, effects (twinkle, flutter, pulse) |
| **Offline** | ✅ Sin CDN |

**Uso típico:**
```tsx
import { useReward } from "partycles";

function CorrectButton() {
  const buttonRef = useRef(null);
  const { reward } = useReward(buttonRef, "stars", {
    particleCount: 30,
    colors: ["#FFD700", "#FFA500", "#FF6B6B"],
    effects: { twinkle: true },
  });

  return <button ref={buttonRef} onClick={reward}>¡Correcto!</button>;
}
```

### Opción D: `canvas-confetti` (personalizado)

| Aspecto | Detalle |
|---------|---------|
| **Bundle** | ~5 KB gzipped |
| **Dependencias** | 0 |
| **Efectos** | Confeti configurable (colores, spread, gravedad, origen) |
| **Complejidad** | Baja |
| **Limitación** | Solo confeti — no tiene estrellas, chispas ni otros shapes |
| **Personalización** | Limitada a formas rectangulares de confeti |

**Veredicto**: Si el usuario pidió explícitamente "nada de confeti", esta opción queda descartada.

---

## 3. Tabla Comparativa

| Criterio | CSS + DOM | **burst-particles** | partycles | canvas-confetti |
|----------|----------|-------------------|-----------|-----------------|
| Bundle extra | **0 KB** | **~3 KB** | ~10 KB | ~5 KB |
| Dependencias | 0 | 0 | 0 | 0 |
| Formas/Shapes | Solo CSS shapes | 12 shapes (rect, circle, triangle, heart, star, ring, etc.) | Solo el preset | Rectángulos |
| Presets incluidos | 0 | **14** | 23 | 0 |
| React hook nativo | No | No | **Sí** | No |
| API complexity | Alta | **Muy baja** | Baja | Baja |
| Performance | Baja | Alta | Alta | Alta |
| `prefers-reduced-motion` | Manual | Manual | **Automático** | Manual |
| Offline | ✅ | ✅ | ✅ | ✅ |
| Estrellas/chispas | Manual | ✅ Preset `stars` | ✅ Preset `stars` | ❌ |

---

## 4. Recomendación

### Opción recomendada: `burst-particles`

**Por qué:**
1. **Mínimo tamaño**: ~3 KB gzipped — el más pequeño de todas las opciones con presets reales
2. **Preset `stars` ideal**: produce "chispas de conocimiento" (estrellas doradas girando) — exactamente lo que el diseño minimalista pero pulido necesita
3. **API ultra simple**: `burst(event, 'stars')` — se integra en cualquier componente en segundos
4. **Shapes variados**: 12 formas (star, circle, heart, ring) permiten crear efectos originales sin recurrir a confeti genérico
5. **Sin dependencias**: 0 deps, vanilla JS, funciona en cualquier framework
6. **Renderizado canvas**:高性能, no satura el DOM

**Único trade-off**: No tiene hook React nativo (como sí lo tiene `partycles`). Solución: crear un hook `useRewardBurst` que envuelva `burst()` en un useEffect.

### Segunda opción: `partycles`
Si en el futuro se quieren efectos más complejos (fireflies, aurora, galaxy) o se prefiere un hook React nativo, `partycles` es la mejor alternativa con 23 presets y soporte de `prefers-reduced-motion` incorporado.

---

## 5. Plan de Implementación por Fases

### Fase 1: Burst en Respuestas Correctas (2 días)

#### Por qué
El momento más importante para celebrar es cuando el niño acierta una respuesta. Las "chispas de conocimiento" refuerzan el aprendizaje positivo.

#### Qué instalar
```bash
pnpm add burst-particles
```

#### Qué hacer

| Día | Tarea | Archivos |
|-----|-------|----------|
| 1 | **Crear hook `useRewardBurst`** que abstrae `burst()`:
   ```typescript
   import { burst } from "burst-particles";
   
   export function useRewardBurst(preset: string = "stars") {
     const fire = useCallback((origin?: { x: number; y: number }) => {
       burst(origin ?? { x: window.innerWidth / 2, y: window.innerHeight / 2 }, preset);
     }, [preset]);
     return { fire };
   }
   ``` | `src/hooks/useRewardBurst.ts` |
| 1 | **Integrar en `FeedbackOverlay`** — cuando `type="correct"`, disparar burst desde el centro de la pantalla | `feedback-overlay.tsx` |
| 1 | **Crear variante del preset `stars` para Amauta** con colores de la marca (azul `#1f4fa3`, naranja `#f2994a`, dorado `#FFD700`):
   ```typescript
   const amautaStars = {
     preset: "stars",
     colors: ["#1f4fa3", "#f2994a", "#FFD700", "#FF6B6B", "#4CAF50"],
     count: 20,
     fadeOut: true,
   };
   ``` | `src/lib/design-system/reward-presets.ts` |
| 2 | **Integrar en `quiz-game.tsx`** — burst al mostrar feedback correcto | `quiz-game.tsx` |
| 2 | **Integrar en `memory-board.tsx`** — burst en el centro al encontrar un par | `memory-board.tsx` |
| 2 | **Integrar en `practice-page.tsx`** — burst al acertar | `practice-page.tsx` |
| 2 | **Verificar**: `pnpm build && pnpm lint` | — |

#### Criterios de aceptación Fase 1
- [ ] `burst-particles` instalado (~3 KB)
- [ ] Al responder correctamente, estrellas doradas emergen del centro
- [ ] Animación dura <1.5s, no bloquea interacción
- [ ] `prefers-reduced-motion` desactiva el burst
- [ ] `pnpm build` y `pnpm lint` pasan

---

### Fase 2: Burst en Logros y Niveles (1 día)

#### Por qué
Subir de nivel o desbloquear un logro merece una celebración más grande que una respuesta correcta.

#### Qué instalar
- Nada nuevo

#### Qué hacer

| Tarea | Archivos |
|-------|----------|
| Añadir burst con preset personalizado (más partículas, más colores) al completar nivel | `level-screen.tsx` |
| Añadir burst al desbloquear achievement | `achievement-card.tsx` |
| Añadir burst "gold" (monedas + estrellas) por racha de aciertos | `student-dashboard-page.tsx` |

#### Criterios de aceptación Fase 2
- [ ] Nivel completado → burst de celebración (30+ partículas, colores variados)
- [ ] Achievement desbloqueado → burst desde la tarjeta del logro
- [ ] Racha de 5+ aciertos → burst "gold"

---

### Fase 3: Efectos Contextuales (futuro, opcional)

#### Por qué
Efectos más sutiles y contextuales mejoran la experiencia sin ser intrusivos.

#### Qué hacer

| Tarea | Archivos |
|-------|----------|
| Burst sutil al hacer click en botón "Siguiente" | `lesson-page.tsx` |
| Burst "hearts" al seleccionar asignatura favorita | Preferencias |
| Efecto de "chispas" alrededor de la mascota cuando está en mood happy | `mascot.tsx` |
| Partículas de "polvo de estrellas" al pasar el mouse sobre tarjetas de progreso | `progress-card.tsx` |

---

## 6. Resumen de Dependencias por Fase

| Fase | Paquete | Versión | Tamaño | Razón |
|------|---------|---------|--------|-------|
| 1 | `burst-particles` | última | ~3 KB gzipped | Efecto "estrellas de conocimiento" ultra ligero |
| 2 | — | — | 0 KB | Misma librería |
| 3 | — | — | 0 KB | Misma librería |

---

## 7. Personalización "Chispas de Conocimiento"

Amauta no usa confeti genérico. En su lugar, el concepto visual es **"chispas de conocimiento" (knowledge sparks)**:

```
✨ → Estrella dorada que aparece cuando un niño aprende algo nuevo
💡 → Chispa de luz que enciende el siguiente concepto
⭐ → Estrella que guía el progreso
```

### Configuración recomendada del preset Amauta

```typescript
// src/lib/design-system/reward-presets.ts
export const AMAUTA_REWARD_PRESETS = {
  correct: {
    preset: "stars",
    count: 20,
    colors: ["#1f4fa3", "#f2994a", "#FFD700", "#FFFFFF"],
    spread: Math.PI / 2,        // Arco de 90° hacia arriba
    speedMin: 3,
    speedMax: 6,
    gravity: 0.4,
    fadeOut: true,
    sizeMin: 3,
    sizeMax: 6,
  },
  levelup: {
    preset: "stars",
    count: 40,
    colors: ["#1f4fa3", "#f2994a", "#FFD700", "#FF6B6B", "#4CAF50"],
    spread: Math.PI * 2,        // Círculo completo
    speedMin: 4,
    speedMax: 8,
    gravity: 0.3,
    fadeOut: true,
    sizeMin: 4,
    sizeMax: 8,
  },
  streak: {
    preset: "gold",
    count: 15,
    colors: ["#FFD700", "#FFA500", "#FFD700"],
    spread: Math.PI / 3,
    speedMin: 2,
    speedMax: 5,
    gravity: 0.5,
    fadeOut: true,
  },
};
```

## 8. Referencias

- `burst-particles`: https://github.com/prabhasha2006/burst-particles
- Animaciones CSS existentes: `src/styles/animations.css`
- Design tokens (colores): `src/styles/tokens.css`
- Componente FeedbackOverlay: `src/components/ui/feedback-overlay.tsx`
