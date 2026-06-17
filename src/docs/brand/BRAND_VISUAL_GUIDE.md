# Guía Visual de Marca — Amauta

> Este documento define el sistema visual de Amauta: tipografía, espaciado, sombras, iconografía y lenguaje gráfico. Es la referencia para cualquier persona que desarrolle componentes o pantallas de la aplicación.

---

## 1. Tipografía

### Tipografía principal

**Nunito** — sans-serif con curvas suaves y amigable para niños. Se usa en toda la interfaz.

```css
--font-sans: "Nunito", "Nunito Fallback", sans-serif;
```

### Escala modular

Base: `16px` | Ratio: `1.25`

| Token CSS | Tamaño | Utilidad Tailwind | Uso principal |
|-----------|--------|-------------------|---------------|
| `--text-xs` | 0.75rem (12px) | `text-xs` | Captions, metadatos, badges |
| `--text-sm` | 0.875rem (14px) | `text-sm` | Labels, descripciones, botones |
| `--text-base` | 1rem (16px) | `text-base` | Body, párrafos |
| `--text-lg` | 1.125rem (18px) | `text-lg` | Subtítulos, estadísticas destacadas |
| `--text-xl` | 1.25rem (20px) | `text-xl` | Encabezados de sección |
| `--text-2xl` | 1.5rem (24px) | `text-2xl` | H3, títulos de card |
| `--text-3xl` | 1.875rem (30px) | `text-3xl` | H2, números grandes |
| `--text-4xl` | 2.25rem (36px) | `text-4xl` | H1, hero headings |
| `--text-5xl` | 3rem (48px) | `text-5xl` | Display, hero principal |

### Jerarquía semántica

| Nivel | Tamaño | Peso | Uso |
|-------|--------|------|-----|
| Display / Hero | `text-5xl` | 700 | Pantallas de bienvenida, landing, estados vacíos |
| H1 | `text-4xl` | 700 | Título principal de página |
| H2 | `text-3xl` | 600 | Encabezados de sección |
| H3 | `text-2xl` | 600 | Títulos de card, subtítulos |
| Body | `text-base` | 400-500 | Texto corrido, descripciones |
| Small / Caption | `text-xs` o `text-sm` | 400 | Metadatos, timestamps, badges |

### Pesos

- **700** → Títulos display y H1
- **600** → H2, H3, subtítulos
- **400–500** → Texto normal
- No usar 300 ni 800+ en UI principal

### Reglas

- Para niños, evitar texto menor a `14px` en elementos interactivos.
- En dashboards de padres/docentes, `text-sm` es aceptable para datos densos.
- El line-height por defecto de Tailwind (`leading-normal`) es adecuado para la mayoría de casos. Para títulos, usar `leading-tight`.

---

## 2. Espaciado

### Escala

Amauta usa una escala de `4px` (`0.25rem`). Esta escala **es la misma que Tailwind v4 ya proporciona** por defecto:

| Tailwind | Rem | Píxeles | Uso |
|----------|-----|---------|-----|
| `p-1` | 0.25rem | 4px | Mínimo, separación entre iconos |
| `p-2` | 0.5rem | 8px | Compacto, badges, chips |
| `p-3` | 0.75rem | 12px | Padding interno de cards pequeñas |
| `p-4` | 1rem | 16px | Estándar entre título y texto |
| `p-5` | 1.25rem | 20px | Cómodo para cards medianas |
| `p-6` | 1.5rem | 24px | Padding de cards principales |
| `p-8` | 2rem | 32px | Entre bloques de contenido |
| `p-10` | 2.5rem | 40px | Separación de secciones |
| `p-12` | 3rem | 48px | Separación grande entre secciones |
| `p-16` | 4rem | 64px | Hero, landing, pantallas completas |
| `p-20` | 5rem | 80px | Secciones muy separadas |
| `p-24` | 6rem | 96px | Máxima separación, contenedores amplios |

### Reglas de composición

| Relación | Espaciado recomendado |
|----------|----------------------|
| Entre título y texto adyacente | `space-y-4` o `space-y-6` |
| Entre bloques de contenido | `space-y-8` o `space-y-12` |
| Entre secciones grandes | `space-y-16` o `space-y-20` |
| Padding interno de cards | `p-4 sm:p-6` |
| Padding de Container global | `px-4 sm:px-6 lg:px-8` |
| Entre elementos en fila (gap) | `gap-3` a `gap-6` según densidad |

### Práctica

- No improvisar valores fuera de la escala.
- Preferir espaciado generoso (`p-6`) sobre compacto para la experiencia infantil.
- En dashboards de adultos se permite `p-4` para mayor densidad de información.
- Usar `space-y-*` para espaciado vertical entre hijos de un contenedor.

---

## 3. Sombras

### Niveles

| Token | Value | Utilidad | Uso |
|-------|-------|----------|-----|
| `--shadow-sm` | `0 1px 2px rgba(31, 79, 163, 0.08)` | `shadow-sm` | Inputs, chips, badges, cards pequeños |
| `--shadow-md` | `0 6px 18px rgba(31, 79, 163, 0.10)` | `shadow-md` | Cards normales, paneles |
| `--shadow-lg` | `0 12px 32px rgba(31, 79, 163, 0.14)` | `shadow-lg` | Hero cards, modales, paneles principales |
| `--shadow-xl` | `0 20px 48px rgba(31, 79, 163, 0.16)` | `shadow-xl` | Diálogos grandes, sheets, overlays |
| `--shadow-2xl` | `0 32px 64px rgba(31, 79, 163, 0.18)` | `shadow-2xl` | Elementos elevados máximos |
| `--shadow-glow-blue` | `0 0 24px rgba(31, 79, 163, 0.18)` | `shadow-glow-blue` | CTA, cóndor mentor, elementos destacados |
| `--shadow-glow-orange` | `0 0 24px rgba(244, 112, 31, 0.20)` | `shadow-glow-orange` | Logros, recompensas, estados positivos |

### Reglas

- Todas las sombras usan `rgba(31, 79, 163, ...)` (azul Amauta) como base — **nunca negro**.
- El glow azul sugiere "guía, confianza, avance".
- El glow naranja sugiere "logro, celebración, energía".
- No apilar múltiples sombras. Una sola capa de elevación es suficiente.
- Los glow son para elementos destacados, no para uso masivo.

---

## 4. Iconografía

### Estilo

- **Outline** — siempre trazo abierto, sin relleno.
- **Mismo grosor de línea** — 1.5px (el default de Lucide).
- **Esquinas suaves** — preferir iconos con `stroke-linecap="round"` y `stroke-linejoin="round"`.
- **Tamaños estándar**: `16px`, `20px`, `24px`.

### Set recomendado

**Lucide** — es la librería ya en uso en el proyecto. Mantener.

### Tamaños por contexto

| Contexto | Tamaño | Clase |
|----------|--------|-------|
| Badges, metadatos | 16px | `size-4` |
| Botones, items de lista | 20px | `size-5` |
| Cards, encabezados | 24px | `size-6` |

### Iconos clave de Amauta

| Icono | Uso |
|-------|-----|
| `Sparkles` | Logros, recompensas, celebración |
| `Star` | Progreso, calificación |
| `BookOpen` | Lecciones, contenido educativo |
| `GraduationCap` | Educación, perfil de estudiante |
| `Users` | Perfil de padre/docente, grupos |
| `Trophy` | Logros, medallas |
| `Target` | Metas, objetivos |
| `TrendingUp` | Progreso, estadísticas |
| `Flame` | Rachas (streaks) |
| `HelpCircle` | Ayuda, tooltips |
| `Lightbulb` | Consejos, sugerencias |
| `ShieldCheck` | Seguridad, verificado |
| `WifiOff` | Estado offline |
| `CloudOff` | Sin conexión (alternativo) |
| `MessageCircle` | Comentarios, feedback |
| `Compass` | Navegación, descubrir |
| `Route` | Ruta de aprendizaje |

### Qué evitar

- Iconos rellenos (filled) salvo casos muy puntuales.
- Iconos con demasiado detalle (se ven pixelados en 16px).
- Mezclar estilos (ej: outline + filled en la misma pantalla).
- Pictogramas genéricos sin personalidad.

---

## 5. Lenguaje Gráfico

Amauta tiene tres familias visuales que la distinguen. Ninguna es obligatoria, pero usadas con criterio crean identidad.

### Familia 1: Constelaciones

Líneas curvas que conectan nodos (círculos pequeños). Sugieren conexión, recorrido, guía.

**Uso:**
- Fondos de hero y landing
- Transiciones entre secciones
- Decoración en pantallas vacías (empty states)
- Backgrounds de dashboards (opacidad baja)

**Reglas:**
- Líneas finas (`strokeWidth: 1-1.5`).
- Pocos nodos (4-6 por constelación).
- Composición aireada — dejar espacio para respirar.
- Color: `text-amauta-blue/10` a `text-amauta-blue/20`.
- **Nunca saturar.** Una constelación por viewport es suficiente.

**Componente disponible:**

```tsx
import { Constellation } from "@/components/ui/constellation";

<Constellation variant="hero" className="absolute inset-0" />
<Constellation variant="decorative" className="w-48 h-36" />
<Constellation variant="mini" className="w-24 h-18" />
```

| Variant | ViewBox | Nodos | Uso |
|---------|---------|-------|-----|
| `hero` | 130×110 | 6 | Pantallas completas, fondo |
| `decorative` | 110×85 | 5 | Cards, secciones |
| `mini` | 80×55 | 4 | Espacios pequeños, badges |

### Familia 2: Estrellas / Chispas

Pequeños burst o estrellas de 4 puntas. Señalan logros, recompensas, momentos positivos.

**Uso:**
- Animación al completar un ejercicio
- Al recibir una recompensa
- En el feedback-overlay (correcto)
- Decoración en el Cóndor Mentor

**Reglas:**
- Uso puntual — una chispa pierde valor si aparece siempre.
- Tamaño pequeño (16-24px).
- Brillo suave, no destello agresivo.
- Color: `text-amauta-orange` o `text-yellow-400`.
- Acompañar con `animate-sparkle` (definido en `animations.css`).

### Familia 3: Caminos de Progreso

Trazos orgánicos y curvos que representan avance. Conectan etapas, lecciones, niveles.

**Uso:**
- Onboarding (paso 1 → paso 2 → paso 3)
- Progreso de lecciones (lección actual → siguiente)
- Timeline de logros
- Mapa de ruta de aprendizaje

**Reglas:**
- Trazos orgánicos (curvas bezier, no líneas rectas).
- Curvas suaves, sin ángulos bruscos.
- Sensación de avance (de izquierda a derecha o de abajo arriba).
- Color: `stroke-amauta-blue` para el camino, `stroke-amauta-orange` para el punto activo.
- El camino puede originarse desde el Cóndor Mentor como "guía".

### Regla General del Lenguaje Gráfico

| Elemento | Cuándo usarlo | Cuándo evitarlo |
|----------|--------------|-----------------|
| Constelaciones | Fondos, transiciones, decoración pasiva | Encima de texto legible, zonas interactivas |
| Estrellas/Chispas | Logros, recompensas, feedback positivo | En navegación rutinaria, botones, estados neutrales |
| Caminos | Progreso, onboarding, secuencias | En contenido estático sin flujo narrativo |

---

## 6. El Cóndor Mentor

El Cóndor Mentor es el símbolo central de Amauta. Su implementación visual y de animación está documentada por separado:

- **Implementación de la mascota**: `src/docs/planificacion/MASCOT_IMPLEMENTATION.md`
- **Estados de ánimo**: idle, happy, celebrate, thinking, sad
- **Formato actual**: SVG (Fase 1) / Lottie (Fase 2, futuro)

### Relación con el lenguaje gráfico

El Cóndor Mentor debe integrarse con las tres familias:

1. **Constelaciones** — el cóndor puede estar rodeado por una constelación que lo conecta con el contenido.
2. **Estrellas/Chispas** — el cóndor emite chispas cuando celebra un logro.
3. **Caminos** — el cóndor "señala" o "vuela sobre" el camino de progreso del estudiante.

---

## 7. Resumen Técnico

### Lo que debes saber al crear una nueva pantalla

1. Usa clases Tailwind estándar: `text-sm`, `shadow-md`, `p-6`, `gap-4`, etc.
2. Los valores de estas clases ya están personalizados con los tokens de Amauta (definidos en `src/styles/tokens.css`).
3. Si necesitas un valor en runtime (JS/TS), impórtalo desde `@/lib/design-system/tokens`.
4. Para decoración visual, usa `<Constellation>` del ui kit.
5. Para logros, aplica `shadow-glow-orange` y `animate-sparkle`.
6. Para fondos de hero, combina `.gradient-mesh` y `<Constellation variant="hero">`.

### Referencia rápida

```tsx
// Card estándar — ejemplo de uso correcto
<div className="rounded-xl bg-card p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
  <h3 className="text-2xl font-semibold text-foreground">Título</h3>
  <p className="mt-2 text-sm text-muted-foreground">Descripción</p>
</div>

// Hero con lenguaje gráfico
<div className="relative gradient-mesh overflow-hidden rounded-2xl p-8 sm:p-12 shadow-lg">
  <Constellation variant="hero" className="absolute inset-0 w-full h-full text-amauta-blue/10" />
  <h1 className="relative text-4xl sm:text-5xl font-bold text-foreground">Bienvenido</h1>
</div>

// Logro con glow naranja
<div className="rounded-xl bg-card p-6 shadow-glow-orange text-center">
  <Sparkles className="size-8 text-amauta-orange mx-auto animate-sparkle" />
  <p className="mt-4 text-lg font-semibold">¡Logro completado!</p>
</div>
```
