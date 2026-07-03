# Sistema de Sonido — Amauta

## 1. Análisis de la Situación Actual

### Estado Actual
- **NO existe** ningún sistema de sonido en la aplicación
- 0 reproducciones de audio
- 0 hooks o componentes de audio
- No hay archivos de sonido en el proyecto
- La app educativa es completamente muda

### Por qué necesitamos sonido
En una app educativa para niños, el sonido cumple funciones críticas:

| Función | Impacto |
|---------|---------|
| **Feedback inmediato** | Un "ding" al acertar refuerza positivamente al instante |
| **Inmersión** | Sonidos ambientales hacen que el niño se sienta en un "espacio de aprendizaje" |
| **Accesibilidad** | Niños con dificultades de lectura reciben feedback por audio |
| **Comprensión oral** | La mascota puede "hablar" instrucciones (opcional, futuro) |
| **Motivación** | Sonidos de celebración al completar niveles aumentan engagement |

### Tipos de sonido necesarios

| Tipo | Ejemplos | Prioridad |
|------|----------|-----------|
| **UI/Sistema** | Click, hover, transición de pantalla | P2 — baja |
| **Feedback correcto** | "Ding" alegre, campana, nota musical ascendente | **P0 — crítica** |
| **Feedback incorrecto** | Sonido suave de error (no punitivo) | **P0 — crítica** |
| **Celebración/Logro** | Fanfarria corta, cascada de notas | P1 — alta |
| **Mascota** | Sonido de llama/alpaca (opcional, divertido) | P2 — baja |
| **Ambiental** | Música de fondo suave durante lecciones | P3 — futura |

---

## 2. Opciones de Implementación

### Opción A: Web Audio API pura (0 dependencias)

| Aspecto | Detalle |
|---------|---------|
| **Bundle** | 0 KB |
| **Dependencias** | 0 |
| **Sonidos incluidos** | Solo sintéticos (generados por osciladores) |
| **Complejidad** | Alta — cada sonido debe programarse manualmente (frecuencia, envolvente, forma de onda) |
| **Mantenibilidad** | Media — sonidos definidos en código, difíciles de ajustar sin programador |
| **Offline** | ✅ 100% offline (no requiere archivos) |
| **Calidad** | Baja-media — suena a "videojuego retro", no a producción |
| **Limitaciones** | Sin soporte para audio pregrabado, sin efectos tipo reverb/echo sin codificarlos |

**Ejemplo de sonido "correcto" con Web Audio API:**
```typescript
function playCorrectSound() {
  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
  osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
  osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2); // G5
  gain.gain.setValueAtTime(0.3, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
  osc.start();
  osc.stop(ctx.currentTime + 0.5);
}
```

### Opción B: `react-sounds` + `howler` (recomendada)

| Aspecto | Detalle |
|---------|---------|
| **Bundle** | ~0 KB en bundle (sonidos vía CDN) + ~7 KB gzipped (howler) |
| **Dependencias** | `react-sounds` + `howler` |
| **Sonidos incluidos** | 72+ sonidos categorizados (UI, notification, game) vía CDN |
| **Complejidad** | Muy baja — `useSound("success")` y ya suena |
| **Mantenibilidad** | Alta — sonidos se cambian por nombre, no hay que codificarlos |
| **Offline** | ⚠️ Parcial — CDN requiere internet. Incluye CLI para descargar sonidos y servirlos localmente |
| **Calidad** | Alta — sonidos pregrabados profesionales |
| **React hooks** | ✅ `useSound(soundName)` nativo, TypeScript incluido |
| **Lazy loading** | ✅ Los sonidos se cargan desde CDN solo al primer uso |

**Uso típico:**
```tsx
import { useSound } from "react-sounds";

function FeedbackCorrect() {
  const { play } = useSound("success");
  useEffect(() => { play(); }, []);
  return null;
}
```

**Sonidos disponibles relevantes para Amauta:**
| Nombre | Tipo | Uso |
|--------|------|-----|
| `success` | Notificación | Respuesta correcta |
| `error` | Notificación | Respuesta incorrecta |
| `click` | UI | Click en botón |
| `chime` | UI | Transición, bienvenida |
| `fanfare` | Celebración | Nivel completado |
| `pop` | UI | Apertura de modal/overlay |
| `levelup` | Game | Subida de nivel |
| `coins` | Game | Ganar puntos/recompensa |

### Opción C: `@mrmartineau/use-sound` + `howler`

| Aspecto | Detalle |
|---------|---------|
| **Bundle** | ~8 KB gzipped (howler + hook) |
| **Dependencias** | `@mrmartineau/use-sound` + `howler` |
| **Sonidos incluidos** | 0 — debes proveer tus propios archivos de audio |
| **Complejidad** | Media — necesitas conseguir/grabar archivos .mp3/.ogg |
| **Mantenibilidad** | Alta |
| **Calidad** | Depende de tus archivos |
| **Offline** | ✅ Si los archivos están en `public/` |
| **React hooks** | ✅ `useSound(src, options)` |

**Veredicto**: Buena opción si ya tienes archivos de audio. Para Amauta, no tenemos ningún archivo, así que habría que crearlos todos desde cero.

### Opción D: Howler.js directo + React wrapper custom

| Aspecto | Detalle |
|---------|---------|
| **Bundle** | ~7 KB gzipped (howler) |
| **Dependencias** | `howler` + `@types/howler` |
| **Sonidos incluidos** | 0 |
| **Complejidad** | Alta — crear wrapper React, manejar ciclo de vida manualmente |
| **Mantenibilidad** | Media |

**Veredicto**: Demasiado trabajo manual. Las opciones B y C ya hacen el wrapping.

---

## 3. Tabla Comparativa

| Criterio | Web Audio API | **react-sounds + howler** | use-sound + howler | Howler solo |
|----------|--------------|--------------------------|-------------------|-------------|
| Bundle extra | **0 KB** | ~7 KB | ~8 KB | ~7 KB |
| Nuevas dependencias | 0 | 2 | 2 | 2 |
| Sonidos listos | No | **72+ incluidos** | No | No |
| Calidad sonido | Baja | Alta | Depende | Depende |
| Complejidad | Alta | **Muy baja** | Media | Alta |
| Offline | ✅ | ✅ (con CLI) | ✅ | ✅ |
| React hooks | Manual | ✅ Nativo | ✅ Nativo | Manual |
| Lanzamiento | — | Mar 2026 | Mar 2026 | Sep 2023 |
| TypeScript | Manual | ✅ Built-in | ✅ Built-in | @types |

---

## 4. Recomendación

### Opción recomendada: `react-sounds` + `howler`

**Por qué:**
1. **72+ sonidos listos para usar** — no necesitamos grabar ni comprar nada. Los nombres `success`, `error`, `chime`, `fanfare`, `levelup` cubren exactamente las necesidades de Amauta
2. **Bundle mínimo** — los archivos de audio están en CDN, no en el bundle. Solo se carga el wrapper JS (~7 KB gzipped)
3. **API simple** — `useSound("success")` es todo lo que necesitamos para empezar
4. **Offline soportado** — incluye CLI para descargar sonidos y servirlos localmente
5. **Lazy loading** — los sonidos se cargan bajo demanda, no afectan el performance inicial
6. **TypeScript nativo** — sin necesidad de `@types` adicionales

**Único riesgo**: Dependencia de CDN para los sonidos. Mitigación: usar el CLI de `react-sounds` para descargar sonidos a `public/sounds/` y configurar el provider en modo local.

---

## 5. Plan de Implementación por Fases

### Fase 1: Sonidos Esenciales de Feedback (2 días)

#### Por qué
Los sonidos de correcto/incorrecto son el mínimo indispensable para una app educativa infantil. Sin ellos, el feedback visual pierde ~50% de su efectividad.

#### Qué instalar
```bash
pnpm add react-sounds howler
```

#### Qué hacer

| Día | Tarea | Archivos |
|-----|-------|----------|
| 1 | **Crear `SoundProvider`** que envuelve la app y habilita el contexto de sonido:
   - Usa `<SoundProvider>` de `react-sounds`
   - Prop `enabled` que respeta preferencia del usuario
   - Prop `volume` global (0-1)
   - Descargar sonidos a `public/sounds/` con CLI de react-sounds | `src/components/ui/sound-provider.tsx` (nuevo) |
| 1 | **Integrar `SoundProvider` en `App.tsx`** envolviendo toda la app | `src/App.tsx` |
| 1 | **Crear hook `useGameSound`** que abstrae los sonidos del juego:
   ```typescript
   function useGameSound() {
     const successSound = useSound("success");
     const errorSound = useSound("error");
     return {
       playCorrect: successSound.play,
       playIncorrect: errorSound.play,
     };
   }
   ``` | `src/hooks/useGameSound.ts` (nuevo) |
| 2 | **Integrar en quiz-game.tsx** — sonido correcto al acertar, incorrecto al fallar | `quiz-game.tsx` |
| 2 | **Integrar en memory-board.tsx** — sonido al emparejar (correcto/incorrecto) | `memory-board.tsx` |
| 2 | **Integrar en timed-challenge.tsx** — sonido al responder | `timed-challenge.tsx` |
| 2 | **Integrar en FeedbackOverlay** — sonido al mostrar correcto/incorrecto | `feedback-overlay.tsx` |
| 2 | **Verificar**: `pnpm build && pnpm lint` | — |
| 2 | **Configurar offline**: descargar sonidos con CLI de react-sounds a `public/sounds/` | `public/sounds/` |

#### Criterios de aceptación Fase 1
- [ ] Sonido "success" al responder correctamente
- [ ] Sonido "error" al responder incorrectamente
- [ ] Sonidos no se reproducen si `prefers-reduced-motion` está activo (accesibilidad)
- [ ] `pnpm build` y `pnpm lint` pasan
- [ ] Sonidos funcionan offline (archivos en `public/sounds/`)

---

### Fase 2: Sonidos de UI y Celebración (1 día)

#### Por qué
Completar la experiencia con sonidos de navegación y celebración mejora la sensación de "app pulida".

#### Qué instalar
- Nada nuevo

#### Qué hacer

| Tarea | Archivos |
|-------|----------|
| Añadir sonido `click` a botones primarios del dashboard | `student-dashboard-page.tsx` |
| Añadir sonido `chime` al cargar lección | `lesson-page.tsx` |
| Añadir sonido `fanfare` al completar nivel | `level-screen.tsx` |
| Añadir sonido `levelup` al subir de nivel | `level-screen.tsx` |

#### Criterios de aceptación Fase 2
- [ ] Botones del dashboard tienen feedback sonoro sutil
- [ ] Completar nivel reproduce fanfarria
- [ ] Todos los sonidos son desactivables globalmente

---

### Fase 3: Voz de Mascota y Ambientales (futuro, opcional)

#### Por qué
Llevar la experiencia al siguiente nivel con la mascota "hablando" instrucciones y música ambiental.

#### Qué instalar
- Nada nuevo (usa el mismo sistema `react-sounds` + `howler`)
- Se requieren archivos de audio personalizados (grabación de voz, música)

#### Qué hacer

| Tarea | Archivos |
|-------|----------|
| Grabar 5-10 frases de ánimo para la mascota ("¡Buen trabajo!", "Sigue así", "Inténtalo de nuevo") | `public/sounds/mascot/` |
| Crear `useMascotVoice()` hook que reproduce frases según contexto | `src/hooks/useMascotVoice.ts` |
| Añadir música ambiental suave durante lecciones (loop, volumen bajo) | `src/hooks/useAmbientMusic.ts` |
| Botón de mute global en el header | `app-header.tsx` |

---

## 6. Resumen de Dependencias por Fase

| Fase | Paquete | Versión | Tamaño | Razón |
|------|---------|---------|--------|-------|
| 1 | `react-sounds` | última | ~0 KB (CDN) + ~7 KB howler | Sonidos listos + offline |
| 1 | `howler` | ^2.2.3 | ~7 KB gzipped | Motor de audio |
| 2 | — | — | 0 KB | Misma infraestructura |
| 3 | — | — | 0 KB (solo archivos .mp3) | Voz y música |

---

## 7. Consideraciones de Accesibilidad

- **`prefers-reduced-motion`**: desactivar todos los sonidos no esenciales
- **Toggle de sonido**: debe ser visible y accesible (header o sidebar)
- **Volumen**: respetar el volumen del dispositivo
- **Autoplay**: los navegadores bloquean autoplay sin interacción. El primer click del usuario activa el AudioContext. `react-sounds` maneja esto automáticamente.

## 8. Referencias

- `react-sounds`: https://reactsounds.com
- `react-sounds` CLI offline: `npx react-sounds download public/sounds`
- Documentación actual de accesibilidad: `src/docs/errores/ERROR_HANDLING.md`
