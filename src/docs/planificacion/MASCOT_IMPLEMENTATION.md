# Implementación de Mascota Animada — Amauta

## 1. Análisis de la Situación Actual

### Estado Actual
- La mascota existe únicamente como imagen JPG estática: `/img/amauta-mascot.jpg`
- Se usa en 4 ubicaciones:
  - `login-page.tsx` (151) — decoración en formulario de login
  - `register-page.tsx` (115) — decoración en formulario de registro
  - `lesson-page.tsx` (199, 212) — avatar del tutor en lecciones
  - `student-dashboard-page.tsx` (236) — avatar en dashboard del estudiante
- **Problema**: Imagen plana, sin vida, no aprovecha el potencial de conexión emocional con niños

### ¿Qué es la mascota?
Es una llama/alpaca (animal andino) que funciona como **tutor virtual** — en quechua, "Amauta" significa "maestro" o "sabio". La mascota es la representación visual de ese tutor.

### Objetivo
Transformar la imagen estática en un personaje animado con **sistema de estados de ánimo (moods)** que reaccione al contexto:
- **idle** — estado de reposo (respiración suave)
- **happy** — respuesta correcta, logro
- **celebrate** — nivel completado, racha de aciertos
- **thinking** — mientras el niño responde, carga
- **sad** — respuesta incorrecta, ánimo

---

## 2. Opciones de Implementación

### Opción A: SVG Animado con CSS nativo (0 dependencias)

| Aspecto | Detalle |
|---------|---------|
| **Bundle** | 0 KB adicionales |
| **Dependencias** | 0 |
| **Complejidad** | Media — requiere convertir JPG a SVG vectorial |
| **Mantenibilidad** | Alta — el SVG se edita con cualquier editor de vectores |
| **Performance** | Excelente — CSS animations son GPU-aceleradas |
| **Limitaciones** | Animaciones limitadas a transforms y opacity; no morphing complejo |
| **Moods** | 5 estados vía clases CSS + `@keyframes` |

**Proceso**: Convertir `amauta-mascot.jpg` a SVG trazado vectorial → dividir en capas (cuerpo, cabeza, ojos, boca, brazos) → animar cada capa con `@keyframes`.

### Opción B: Lottie con `@lottiefiles/dotlottie-react`

| Aspecto | Detalle |
|---------|---------|
| **Bundle** | ~15 KB gzipped (librería) + animaciones `.lottie` comprimidas |
| **Dependencias** | `@lottiefiles/dotlottie-react` (1.1M semanales, oficial LottieFiles) |
| **Complejidad** | Baja en código — crear las animaciones requiere un diseñador con AfterEffects + LottieFiles |
| **Mantenibilidad** | Alta — las animaciones `.lottie` son archivos separados, editables |
| **Performance** | Excelente — renderiza en Canvas o SVG, 60fps |
| **Moods** | Ilimitados — cada mood es un archivo `.lottie` independiente |
| **Offline** | Los `.lottie` se importan como assets estáticos → funcionan offline |

**Proceso**: Diseñador crea 5 animaciones en AfterEffects → exporta como `.lottie` (formato comprimido, ~80% más pequeño que JSON) → se importan como `import animIdle from "@/assets/lottie/mascot-idle.lottie"`.

### Opción C: `micro-lottie-react`

| Aspecto | Detalle |
|---------|---------|
| **Bundle** | ~12 KB gzipped |
| **Dependencias** | `micro-lottie-react` (3 estrellas, 1 contributor) |
| **Complejidad** | Baja en código |
| **Riesgo** | **Alto** — proyecto muy nuevo (jul 2025), sin comunidad, soporte incierto |
| **Mantenibilidad** | Baja — riesgo de abandonment |

**Veredicto**: No recomendado para producción. Riesgo de mantenimiento muy alto.

### Opción D: Spritesheet + Canvas (0 dependencias)

| Aspecto | Detalle |
|---------|---------|
| **Bundle** | 0 KB + spritesheet PNG |
| **Dependencias** | 0 |
| **Complejidad** | Alta — requiere tooling para generar spritesheet desde animaciones |
| **Mantenibilidad** | Media — modificar animaciones requiere regenerar spritesheet |
| **Performance** | Buena |

**Veredicto**: Sobredimensionado para 5 estados simples. Mejor opción para juegos con muchas frames.

---

## 3. Tabla Comparativa

| Criterio | SVG + CSS | `@lottiefiles/dotlottie-react` | `micro-lottie-react` | Spritesheet |
|----------|-----------|-------------------------------|---------------------|-------------|
| Bundle extra | 0 KB | ~15 KB | ~12 KB | 0 KB |
| Nuevas dependencias | 0 | 1 | 1 | 0 |
| Calidad animación | Media | Muy alta | Muy alta | Alta |
| Facilidad implementación | Media | Baja (requiere diseñador) | Baja | Alta |
| Mantenibilidad | Alta | Alta | Baja | Media |
| Madurez librería | N/A | ✅ Alta (1.1M semanales) | ❌ Muy baja | N/A |
| Offline nativo | ✅ Sí | ✅ Sí | ✅ Sí | ✅ Sí |
| Tamaño animaciones | N/A | ~5-15 KB c/u | ~5-15 KB c/u | ~50-200 KB |

---

## 4. Recomendación

### Fase 1 (Inmediato) → Opción A: SVG + CSS
**Por qué**: 0 dependencias, 0 KB extra, aprovecha Tailwind/animations.css existentes. Se puede implementar ahora mismo con el diseñador convirtiendo el logo a SVG. La calidad es suficiente para estados simples (idle, happy, thinking).

### Fase 2 (Futuro) → Opción B: `@lottiefiles/dotlottie-react`
**Por qué**: Cuando se encarguen animaciones profesionales a un diseñador, Lottie da calidad de producción (AfterEffects). La librería es oficial, madura y ampliamente adoptada. Migrar de SVG a Lottie es transparente para los consumidores del componente `Mascot`.

---

## 5. Plan de Implementación por Fases

### Fase 1: Fundación SVG + CSS (3-4 días)

#### Por qué
Necesitamos una mascota animada **ya**, sin depender de diseñadores externos ni agregar librerías. El SVG del logo es un asset que ya existe (solo hay que vectorizarlo).

#### Qué instalar
- **Nada nuevo** — 0 dependencias

#### Qué hacer

| Día | Tarea | Archivos |
|-----|-------|----------|
| 1 | **Convertir `amauta-mascot.jpg` a SVG vectorizado** con capas separadas: cuerpo, cabeza, orejas, ojos, boca, brazos. Guardar en `src/assets/mascot/amauta-mascot.svg` | `src/assets/mascot/amauta-mascot.svg` (nuevo) |
| 1 | **Crear las variantes de SVG para cada mood** (idle, happy, celebrate, thinking, sad) — cada una con pequeñas diferencias en posición de ojos, boca y brazos. O usar un solo SVG con capas y animar las capas. | `src/assets/mascot/amauta-mascot-idle.svg`, `-happy.svg`, `-celebrate.svg`, `-thinking.svg`, `-sad.svg` |
| 2 | **Crear `@keyframes` para cada mood** en `src/styles/animations.css`:
  - `idle`: float suave (3s) + parpadeo cada 4s
  - `happy`: bounce + rotación orejas
  - `celebrate`: scale up/down + wave
  - `thinking`: tilt cabeza + tapping
  - `sad`: droop + fade ligero | `src/styles/animations.css` |
| 2 | **Añadir clases utilitarias** `.mood-idle`, `.mood-happy`, `.mood-celebrate`, `.mood-thinking`, `.mood-sad` en `index.css` o en `animations.css` | `src/styles/animations.css` |
| 3 | **Crear componente `<Mascot>`** con:
  - Prop `mood: "idle" | "happy" | "celebrate" | "thinking" | "sad"`
  - Prop `size: "sm" | "md" | "lg"`
  - Prop `className?: string`
  - Renderiza SVG + clase de animación
  - `aria-label="Tutor Amauta, estado: {mood}"`
  - `role="img"`
  - `prefers-reduced-motion` → versión estática | `src/components/ui/mascot.tsx` (nuevo) |
| 3 | **Actualizar `login-page.tsx`** — reemplazar `<img src="/img/amauta-mascot.jpg">` por `<Mascot mood="idle" size="lg">` | `login-page.tsx` |
| 3 | **Actualizar `register-page.tsx`** — mismo reemplazo | `register-page.tsx` |
| 3 | **Actualizar `lesson-page.tsx`** — reemplazar, mood cambia según contexto (thinking mientras carga, happy al responder) | `lesson-page.tsx` |
| 3 | **Actualizar `student-dashboard-page.tsx`** — reemplazar con mood="happy" | `student-dashboard-page.tsx` |
| 4 | **Integrar `FeedbackOverlay`** — cuando se muestra correct/incorrect, la mascota reacciona | `feedback-overlay.tsx` |
| 4 | **Verificar build**: `pnpm build && pnpm lint` | — |

#### Criterios de aceptación Fase 1
- [ ] 0 nuevas dependencias
- [ ] `pnpm build` sin errores
- [ ] `pnpm lint` sin errores
- [ ] Mascota visible con animación suave en login, register, dashboard, lecciones
- [ ] `prefers-reduced-motion` muestra versión estática
- [ ] Touch target de 44px si es clickable
- [ ] `aria-label` descriptivo presente

---

### Fase 2: Mejora Profesional con Lottie (opcional, futuro)

#### Por qué
Cuando se requieran animaciones de alta calidad (transiciones suaves entre moods, morphing, animaciones estilo Disney), Lottie con AfterEffects es el estándar de la industria.

#### Qué instalar
```bash
pnpm add @lottiefiles/dotlottie-react
```

#### Qué hacer

| Día | Tarea | Archivos |
|-----|-------|----------|
| 1 | **Diseñador crea 5 animaciones** en AfterEffects usando el vector de la mascota como base. Exporta como `.lottie` (formato comprimido) | `src/assets/lottie/mascot-idle.lottie`, `-happy.lottie`, `-celebrate.lottie`, `-thinking.lottie`, `-sad.lottie` |
| 1 | **Refactorizar `<Mascot>`** para que acepte tanto SVG como Lottie:
   - Si hay archivos `.lottie` disponibles, usa `@lottiefiles/dotlottie-react`
   - Si no, fallback al SVG animado | `src/components/ui/mascot.tsx` |
| 1 | **Verificar build** + performance (Lottie en Canvas para mascotas grandes) | — |

#### Criterios de aceptación Fase 2
- [ ] Transiciones suaves entre moods
- [ ] Animaciones fluidas a 60fps
- [ ] Bundle total < 30 KB adicional
- [ ] Fallback a SVG si `.lottie` no está disponible

---

## 6. Resumen de Dependencias por Fase

| Fase | Paquete | Versión | Tamaño | Razón |
|------|---------|---------|--------|-------|
| 1 | — | — | 0 KB | SVG nativo + CSS |
| 2 | `@lottiefiles/dotlottie-react` | última | ~15 KB gzipped | Animaciones profesionales |

---

## 7. Referencias

- Assets actuales de mascota: `public/img/amauta-mascot.jpg`
- Logo vectorial: `src/assets/logo.png`
- Animaciones existentes: `src/styles/animations.css`
- Design tokens: `src/styles/tokens.css`
