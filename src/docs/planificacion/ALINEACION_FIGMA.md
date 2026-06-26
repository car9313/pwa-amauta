# Alineación con Figma — Plan de Implementación

> **Estado**: ✅ Implementado
> **Última actualización**: 2026-06-20

---

## 1. Diagnóstico Inicial

### 1.1 Objetivo

Alinear el design system y las páginas actuales de Amauta con la nueva propuesta visual de Figma ubicada en `D:\Estudio\Create Figma Page Design`, **sin perder** la funcionalidad existente (offline mode, validaciones, animaciones, tests, manejos de error).

### 1.2 Principios

- **No romper** componentes existentes — solo agregar variantes y props nuevos
- **Mantener** la arquitectura de 5 capas (Base, Layout, Brand, Patterns, Story)
- **Preservar** animaciones, manejos de error, offline mode y tests existentes
- **Actualizar** la documentación del design system al mismo tiempo que el código
- **Registrar** en este documento el avance de cada fase

### 1.3 Archivos del Figma de Referencia

| Archivo | Propósito |
|---------|-----------|
| `D:\Estudio\Create Figma Page Design\src\app\pages\student-dashboard.tsx` | Dashboard estudiante |
| `D:\Estudio\Create Figma Page Design\src\app\pages\parent-dashboard.tsx` | Dashboard padres |
| `D:\Estudio\Create Figma Page Design\src\app\pages\lesson-page.tsx` | Lección |
| `D:\Estudio\Create Figma Page Design\src\app\pages\practice-page.tsx` | Práctica |
| `D:\Estudio\Create Figma Page Design\src\app\pages\login-page.tsx` | Login |
| `D:\Estudio\Create Figma Page Design\src\app\pages\register-page.tsx` | Registro |
| `D:\Estudio\Create Figma Page Design\src\app\pages\progress-page.tsx` | Progreso |
| `D:\Estudio\Create Figma Page Design\src\app\pages\games-page.tsx` | Juegos |
| `D:\Estudio\Create Figma Page Design\src\app\components\character.tsx` | Componente Character (mascota) |
| `D:\Estudio\Create Figma Page Design\src\app\components\header.tsx` | Header con logo + menú |
| `D:\Estudio\Create Figma Page Design\src\app\components\navigation-menu.tsx` | Menú drawer lateral |
| `D:\Estudio\Create Figma Page Design\src\styles\theme.css` | Tokens CSS del Figma |
| `D:\Estudio\Create Figma Page Design\guidelines\Guidelines.md` | Guías (vacío) |

---

## 2. Análisis Comparativo Detallado

### 2.1 StudentDashboard

| Sección | Código Actual | Figma | Decisión |
|---------|--------------|-------|----------|
| **Hero background** | `bg-linear-to-br from-primary via-primary/80 to-accent` | `bg-gradient-to-r from-blue-500 to-purple-600` | 🔄 Cambiar |
| **Orbes decorativos** | 2 círculos blur + animaciones | No tiene | Mantener (son un plus) |
| **Noise overlay** | `noise-overlay` pseudo-element | No tiene | Mantener |
| **Avatar** | `<img>` inline con Unsplash | `<ImageWithFallback>` | 🔄 Usar `<Character>` |
| **Racha semanal** | Círculos L M M J V S D con active/inactive | Similar | Mantener |
| **Stats / Trofeos** | `AmautaStatCard` con variants `accent`, `primary`, `success` | White cards + icon circles colored | 🔄 Cambiar `accent` → `yellow` |
| **Agenda** | `AmautaCard glass` + `AgendaItem` | White card + border-left activities | Mantener |
| **Progress** | `AmautaProgress` con variant `lesson` | Raw divs `h-2 rounded-full` con colores por umbral | 🔄 Actualizar |
| **Quick Actions** | `from-accent to-accent/80` + botones ghost | `from-orange-400 to-yellow-400` | 🔄 Cambiar |
| **Logros** | `AmautaAchievement` | Divs simples con emoji | Mantener |

### 2.2 ParentDashboard

| Sección | Código Actual | Figma | Decisión |
|---------|--------------|-------|----------|
| **Hero background** | `from-primary via-primary/70 to-accent` | White card + stats | 🔄 Cambiar (mismo gradiente que Student) |
| **Stats semanales** | No tiene toggle Hoy/Semana | Toggle + gráfico de barras semanal | Mantener (postergado) |
| **Children cards** | Glass cards con hover-lift | Gradient cards con iconos | Mantener |
| **Actividad reciente** | Glass card expandible con Chevron | White card con lista | Mantener |
| **Quick Actions** | `from-primary to-primary/70` con resumen 3-columnas | White card + botones | Mantener |

### 2.3 LoginPage

| Aspecto | Código Actual | Figma |
|---------|--------------|-------|
| **Enfoque** | Formulario con validación Zod, offline mode, error handling | Role selector (Estudiante/Padre) + formulario simple |
| **Decisión** | Mantener como está por ahora | Postergado para futura iteración |

### 2.4 Páginas que NO se modifican

| Página | Razón |
|--------|-------|
| `RegisterPage` | Superior al Figma (validación, offline mode, iconos en inputs) |
| `LevelScreen` (Progress) | Más completo que el Figma (gráfico circular, materias, áreas a mejorar) |
| `LessonPage` | Más sofisticado (AmautaLearningPath, ejercicios reales con API) |
| `PracticePage` | Más completo (selector de tema/dificultad, streak, score) |
| `GamesPage` | Más completo (múltiples juegos con lógica real) |

---

## 3. Fases de Implementación

### 🟢 Fase 1 — Tokens y Design System (CSS)

> **Estado**: ✅ Completado
> **Archivos involucrados**: `src/styles/tokens.css`, `src/index.css`

| Tarea | Detalle |
|-------|---------|
| ✅ 1.1 | Agregar `--amauta-purple-500: #8b5cf6` y `--amauta-purple-600: #7c3aed` en `tokens.css` |
| ✅ 1.2 | Agregar `--amauta-yellow-100: #fef9c3` y `--amauta-yellow-600: #ca8a04` en `tokens.css` |
| ✅ 1.3 | Registrar en `@theme inline` como `--color-amauta-purple-*` y `--color-amauta-yellow-*` |
| ✅ 1.4 | Verificar que Tailwind genere las clases correctamente |

### 🟢 Fase 2 — Componentes del Design System

> **Estado**: ✅ Completado
> **Archivos involucrados**: `src/components/amauta/*.tsx`, `src/components/amauta/index.ts`

| Tarea | Componente | Cambio |
|-------|-----------|--------|
| ✅ 2.1 | **AmautaStatCard** | Agregar variant `"yellow"` → `{ bg: "bg-yellow-100 text-yellow-600", glow: "shadow-[0_0_25px_rgba(202,138,4,0.35)]", orb: "bg-yellow-600/10" }` |
| ✅ 2.2 | **AmautaProgress** | Agregar variant `"topic"` para barras que cambian de color según porcentaje (100%→green, ≥75%→blue, <75%→orange) |
| ✅ 2.3 | **CondorGuide** | Agregar size `"xl"` → `w-32 h-32` |
| ✅ 2.4 | **Character** (NUEVO) | Crear componente mascota sin burbuja, props: `size?: "sm" \| "md" \| "lg" \| "xl"`, `className?` |
| ✅ 2.5 | **NavigationMenu** (NUEVO) | Crear drawer lateral con items de navegación, avatar, cerrar sesión |
| ✅ 2.6 | **index.ts** | Agregar exports para Character y NavigationMenu |

### 🟢 Fase 3 — StudentDashboard

> **Estado**: ✅ Completado
> **Archivo**: `src/features/dashboard/pages/student-dashboard-page.tsx`

| Tarea | Sección | Cambio |
|-------|---------|--------|
| ✅ 3.1 | **Hero** | `bg-linear-to-br from-primary via-primary/80 to-accent` → `bg-gradient-to-r from-blue-500 to-purple-600` |
| ✅ 3.2 | **Hero avatar** | `<img>` → `<Character size="lg" />` |
| ✅ 3.3 | **Stats** | Trophy card: `color="accent"` → `color="yellow"` |
| ✅ 3.4 | **Progress** | Usar `AmautaProgress variant="topic"` con `colorByValue` |
| ✅ 3.5 | **Quick Actions** | `from-accent to-accent/80` → `from-orange-400 to-yellow-400` |
| ✅ 3.6 | **Quick Actions mascot** | `<img>` → `<Character size="md" />` |
| ✅ 3.7 | **Progress card** | Glass card → white card con borde |
| ✅ 3.8 | **Progress summary** | Eliminar tarjeta de "Progreso total" (sparkles, orbes, gradiente) |
| ✅ 3.9 | **Progress icon** | `bg-destructive/10 text-destructive` → `bg-orange-100 text-orange-600` |
| ✅ 3.10 | **Achievements card** | Glass card → white card con borde |
| ✅ 3.11 | **Achievements items** | `AmautaAchievement` → divs raw con `bg-gradient-to-br from-yellow-50 to-orange-50` |
| ✅ 3.12 | **Achievements emoji** | Mapeo `type` → emoji: streak🔥, level⭐, accuracy🎯 |
| ✅ 3.13 | **colorByValue thresholds** | Alineados con Figma: 100%→green, >=75%→blue, <75%→orange |

### 🟢 Fase 4 — ParentDashboard

> **Estado**: ✅ Completado
> **Archivo**: `src/features/dashboard/pages/parent-dashboard-page.tsx`

| Tarea | Sección | Cambio |
|-------|---------|--------|
| ✅ 4.1 | **Hero** | Mismo gradiente azul→púrpura que StudentDashboard |
| ✅ 4.2 | **Children cards** | Reemplazar `<img>` inline con `<Character size="sm" />` |

### 🟢 Fase 5 — Documentación

> **Estado**: ✅ Completado

| Tarea | Archivo | Cambio |
|-------|---------|--------|
| ✅ 5.1 | `src/docs/design/README.md` | Agregar Character, NavigationMenu al mapa de componentes |
| ✅ 5.2 | `src/docs/design/01-base-layer.md` | Agregar sección Character con props/variants |
| ✅ 5.3 | `src/docs/design/03-brand-layer.md` | Actualizar CondorGuide con size `xl` |
| ✅ 5.4 | Este documento | Marcar tareas como completadas a medida que se implementen |

---

## 4. Especificaciones de Componentes Nuevos

### 4.1 Character

```typescript
interface CharacterProps {
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
}
```

| size | Clases |
|------|--------|
| `sm` | `w-12 h-12` |
| `md` | `w-16 h-16` |
| `lg` | `w-24 h-24` |
| `xl` | `w-32 h-32` |

- Imagen: `/img/amauta-mascot.jpg`
- Sin burbuja de diálogo (separado de `CondorGuide`)
- `object-contain` para mantener aspect ratio

### 4.2 NavigationMenu

Menú drawer lateral que se abre desde el Header.

- Overlay semitransparente (`bg-black/50`)
- Panel derecho (`w-80 max-w-[85vw]`)
- Avatar + nombre de usuario en header
- Items de navegación con icono + active state
- Botón de cerrar sesión
- Mascota decorativa en footer

### 4.3 AmautaStatCard — Variant "yellow"

```typescript
// Nuevo en colorConfig
yellow: {
  bg: "bg-yellow-100 text-yellow-600",
  text: "text-yellow-600",
  glow: "shadow-[0_0_25px_rgba(202,138,4,0.35)]",
  orb: "bg-yellow-600/10",
},
```

### 4.4 AmautaProgress — Variant "topic"

```typescript
interface AmautaProgressProps {
  // ...props existentes
  amautaVariant?: "lesson" | "xp" | "level" | "default" | "topic"
  colorByValue?: boolean  // Si es true, cambia color según el value
  // value < 50 → orange, value < 80 → blue, value >= 80 → green
}
```

---

## 5. Criterios de Aceptación

- [x] `student-dashboard-page.tsx` usa white card con borde en Progress y Achievements (no glass)
- [x] `student-dashboard-page.tsx` no tiene card de resumen total en Progress
- [x] `student-dashboard-page.tsx` usa emojis por tipo de logro (streak🔥, level⭐, accuracy🎯)
- [x] `colorByValue` usa thresholds 100%→green, >=75%→blue, <75%→orange (Figma)
- [x] `student-dashboard-page.tsx` usa gradiente azul→púrpura en hero
- [x] `student-dashboard-page.tsx` usa `<Character>` en vez de `<img>` inline
- [x] `student-dashboard-page.tsx` usa `AmautaStatCard color="yellow"` para trophy
- [x] `student-dashboard-page.tsx` usa colores por umbral en progress bars
- [x] `student-dashboard-page.tsx` usa `from-orange-400 to-yellow-400` en quick actions
- [x] `parent-dashboard-page.tsx` usa gradiente azul→púrpura en hero
- [x] `parent-dashboard-page.tsx` usa `<Character>` en children cards
- [x] `Character` component existe y se exporta desde `@/components/amauta`
- [x] `NavigationMenu` component existe y se exporta desde `@/components/amauta`
- [ ] Tests existentes siguen pasando (`pnpm test` si estuviera configurado)
- [x] `pnpm build` compila sin errores
- [x] Documentación del design system actualizada

---

## 6. Historial de Cambios

| Fecha | Versión | Cambio |
|-------|---------|--------|
| 2026-06-20 | v1.0 | Creación del documento con análisis y fases |
| 2026-06-20 | v1.1 | Implementación completa: tokens, componentes, dashboards, documentación |
| 2026-06-20 | v1.2 | Alineación Progreso/Logros con Figma: white cards, emoji, thresholds, doc |
