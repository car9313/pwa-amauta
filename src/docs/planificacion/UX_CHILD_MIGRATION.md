# Migración UI/UX Infantil — Amauta

Plan incremental por fases para migrar la interfaz a un Design System infantil con animaciones, responsive mejorado y UX niño-friendly.

---

## Handoff Protocol

Al finalizar **CADA fase**, el agente DEBE:

1. **Mostrar resumen** con:
   - Archivos modificados (ruta exacta)
   - Líneas agregadas/eliminadas (stats de diff)
   - Checklist de la fase (marcar lo completado)
   - Problemas encontrados (si los hay)
2. **Preguntar explícitamente**:
   > "Fase N completada. ¿Revisas los resultados y confirmas para continuar a la Fase N+1?"
3. **Esperar confirmación** del usuario antes de continuar

---

## Fase 0 — Preparación (1 día)

### Tareas
- [ ] Crear estructura de carpetas:
  ```
  src/
  ├── styles/
  │   ├── tokens.css        # Variables de diseño extraídas de index.css
  │   └── animations.css    # Animaciones personalizadas
  ├── components/ui/        # Ya existe — añadir Container, Shell, ProgressBar
  └── lib/design-system/
      └── tokens.ts         # Constantes JS (espaciado, colores, breakpoints)
  ```
- [ ] Añadir optimizaciones táctiles globales en `index.css`:
  ```css
  html {
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
  }
  ```
- [ ] Verificar que `cva`, `clsx`, `tailwind-merge` estén actualizados (✅ ya instalados)
- [ ] Verificar que `pnpm build` pase sin errores

### Comandos de verificación
```bash
pnpm build
pnpm lint
```

---

## Fase 1 — Layout y estructura global (2 días)

### Tareas
- [ ] Crear `Container` — envoltura responsiva con max-width y padding
- [ ] Crear `Shell` — layout wrapper con modo sin distracciones (`distractionFree`)
- [ ] Refactorizar `AmautaLayout` para usar `Container`
- [ ] Refactorizar `PublicLayout` para usar `Container`
- [ ] Añadir tokens de espaciado semántico en `index.css`:
  ```css
  @theme inline {
    --spacing-page-x: 1rem;
    --spacing-section: 1.5rem;
    @media (width >= 40rem) {
      --spacing-page-x: 1.5rem;
      --spacing-section: 2rem;
    }
  }
  ```
- [ ] Agregar touch targets globales:
  ```css
  @layer base {
    button, a, [role="button"], input, select, textarea {
      @apply min-h-[44px] min-w-[44px];
    }
  }
  ```

### Archivos a modificar
- `src/index.css` — añadir tokens + touch
- `src/layout/amauta-layout.tsx` — usar Container
- `src/layout/public-layout.tsx` — usar Container
- `src/layout/app-header.tsx` — responsivo
- **Nuevos**: `src/components/ui/container.tsx`, `src/components/ui/shell.tsx`

### Pruebas de regresión visual
- `pnpm dev` + verificar header, footer, layout en móvil (375px) y desktop
- Navegar por todas las rutas principales
- Verificar que el espaciado no haya cambiado drásticamente

### Comandos de verificación
```bash
pnpm build
pnpm lint
```

---

## Fase 2 — Componentes base (3 días)

### Tareas
- [ ] **Button** — Extender `buttonVariants` con tallas infantiles:
  ```typescript
  "child-sm": "h-10 rounded-xl px-4 text-sm",
  "child-md": "h-12 rounded-xl px-6 text-base font-bold",
  "child-lg": "h-14 rounded-2xl px-8 text-lg font-bold",
  "child-icon": "size-12 rounded-xl",
  ```
- [ ] **Input** — Aumentar tamaño táctil (`h-9` → `h-12`)
- [ ] **Card** — Añadir variante `variant="glass"` (usando estilos de `.glass-card`)
- [ ] Crear **ProgressBar** — componente de barra de progreso animada
- [ ] Crear **FeedbackOverlay** — overlay de feedback correcto/incorrecto (basado en Dialog)
- [ ] Migrar clases CSS personalizadas de `index.css` a componentes:
  - `.glass-card` → `Card variant="glass"`
  - `.hover-lift` → utilidad o variante de botón
  - `.shimmer` → componente `Skeleton` o animación directa
  - `.text-gradient` → utilidad `bg-gradient-to-r ... bg-clip-text text-transparent`
  - `.scrollbar-hide` → mantener como utilidad global
- [ ] Añadir clases de utilidad para `animation-delay`:
  ```css
  .animation-delay-500  { animation-delay: 500ms; }
  .animation-delay-1000 { animation-delay: 1000ms; }
  .animation-delay-1500 { animation-delay: 1500ms; }
  .animation-delay-2000 { animation-delay: 2000ms; }
  ```

### Archivos a modificar
- `src/components/ui/button.tsx` — extender variantes
- `src/components/ui/input.tsx` — aumentar altura
- `src/components/ui/card.tsx` — añadir variant="glass"
- `src/index.css` — añadir animation-delay utils
- **Nuevos**: `progress-bar.tsx`, `feedback-overlay.tsx`

### Comandos de verificación
```bash
pnpm build
pnpm lint
```

---

## Fase 3 — Dashboard / Home (2 días)

### Tareas
- [ ] Migrar colores hardcodeados en `student-dashboard-page.tsx`:
  ```
  bg-[#1f4fa3]   → bg-primary
  text-[#1f4fa3]  → text-primary
  bg-[#f4701f]   → bg-accent
  text-[#f4701f]  → text-accent
  bg-[#17306d]   → bg-amauta-blue-dark
  text-[#fccca1]  → text-amauta-orange-light
  bg-[#e7eefb]   → bg-secondary
  text-[#1f3c78]  → text-foreground
  text-[#6b7280]  → text-muted-foreground
  bg-[#3d5a80]   → bg-primary/80 (o token similar)
  ```
- [ ] Migrar inline styles de `animationDelay` → clases `.animation-delay-*`
- [ ] Migrar inline styles de `animationDuration` → clases de utilidad
- [ ] Migrar `stat-card.tsx` — reemplazar `rgba()` por clases con opacidad (`bg-accent/30`)
- [ ] Migrar `progress-card.tsx` — reemplazar colores hardcodeados
- [ ] Migrar `agenda-item.tsx` — reemplazar colores hardcodeados
- [ ] Migrar `achievement-card.tsx` — reemplazar colores hardcodeados
- [ ] Reemplazar `.glass-card` por `Card variant="glass"`
- [ ] Usar `ProgressBar` donde corresponda

### Archivos a modificar
- `src/features/dashboard/pages/student-dashboard-page.tsx`
- `src/features/dashboard/components/stat-card.tsx`
- `src/features/dashboard/components/progress-card.tsx`
- `src/features/dashboard/components/agenda-item.tsx`
- `src/features/dashboard/components/achievement-card.tsx`

### Pruebas de regresión visual
- Verificar visualmente que los colores no hayan cambiado
- Navegar con DevTools en modo móvil para probar touch targets
- Verificar que las animaciones de entrada (fade-in, scale) sigan funcionando

### Comandos de verificación
```bash
pnpm build
pnpm lint
```

---

## Fase 4 — Feature Juegos (2 días)

### Tareas
- [ ] Migrar `quiz-game.tsx`:
  - Reemplazar colores hardcodeados por tokens
  - Usar `Button size="child-lg"` para botón "Siguiente" / "Ver resultado"
  - Migrar `style={{ width: \`${progress}%\` }}` → `ProgressBar`
  - Añadir `aria-live="polite"` al feedback de correcto/incorrecto
- [ ] Migrar `memory-board.tsx`:
  - Reemplazar colores hardcodeados por tokens
  - Reemplazar botones raw por `Button size="child-icon"`
  - Añadir `aria-label` descriptivo a cada carta
  - Asegurar `focus-visible:ring-4` en cartas
- [ ] Migrar `game-card.tsx`:
  - Reemplazar colores hardcodeados
  - Migrar `style={{ color: config.color }}` a clases condicionales
  - Añadir `min-h-[44px]`
- [ ] Migrar `timed-challenge.tsx`:
  - Reemplazar `style={{ width: ... }}` por `ProgressBar`
  - Añadir `aria-live="polite"` para el timer
- [ ] Migrar `game-header.tsx` y `game-result.tsx` — reemplazar colores

### Archivos a modificar
- `src/features/games/components/quiz-game.tsx`
- `src/features/games/components/memory-board.tsx`
- `src/features/games/components/game-card.tsx`
- `src/features/games/components/timed-challenge.tsx`
- `src/features/games/components/game-header.tsx`
- `src/features/games/components/game-result.tsx`

### Pruebas de regresión visual
- Probar cada juego en móvil (DevTools 375px)
- Probar navegación por teclado (Tab) en memory-board y quiz
- Verificar que las animaciones de acierto/error se vean correctas

### Comandos de verificación
```bash
pnpm build
pnpm lint
```

---

## Fase 5 — Feature Lecciones / Práctica (2 días)

### Tareas
- [ ] Migrar `lesson-page.tsx`:
  - Reemplazar colores hardcodeados por tokens
  - Usar `Button size="child-md"` para acciones
  - Usar `ProgressBar` para progreso de lección
  - Envolver contenido en `Container`
- [ ] Migrar `feedback-page.tsx`:
  - Reemplazar inline styles de `animationDelay` por clases
  - Reemplazar colores hardcodeados
  - Usar `FeedbackOverlay` para correcto/incorrecto
- [ ] Migrar `practice-page.tsx`:
  - Reemplazar colores hardcodeados
  - Asegurar touch targets de 44px

### Archivos a modificar
- `src/features/lessons/pages/lesson-page.tsx`
- `src/features/lessons/pages/feedback-page.tsx`
- `src/features/practice/pages/practice-page.tsx`

### Pruebas de regresión visual
- Flujo completo: lección → ejercicio → feedback
- Verificar en móvil y desktop

### Comandos de verificación
```bash
pnpm build
pnpm lint
```

---

## Fase 6 — Perfil / Progreso del niño (1 día)

### Tareas
- [ ] Migrar `level-screen.tsx`:
  - Reemplazar colores hardcodeados por tokens
  - Migrar `style={{ width: ... }}` por `ProgressBar`
- [ ] Migrar `user-profile-card.tsx`, `nav-item.tsx` del dashboard
  - Reemplazar colores hardcodeados

### Archivos a modificar
- `src/features/progress/pages/level-screen.tsx`
- `src/features/dashboard/components/user-profile-card.tsx`
- `src/features/dashboard/components/nav-item.tsx`
- `src/features/dashboard/layout/sidebar-nav.tsx`

### Comandos de verificación
```bash
pnpm build
pnpm lint
```

---

## Fase 7 — Auth (1 día)

### Tareas
- [ ] Migrar `login-page.tsx`:
  - Reemplazar colores hardcodeados por tokens
  - Migrar inline styles de `animationDelay`
  - Usar `Button size="child-lg"` para botón de login
- [ ] Migrar `register-page.tsx`:
  - Reemplazar colores hardcodeados por tokens
  - Migrar inline styles de `animationDelay`
  - Usar `Button size="child-lg"` para botón de registro
- [ ] Migrar `FormErrorBanner.tsx` — usar tokens de color
- [ ] Migrar `ConnectionStatus.tsx` — usar variantes de Button
- [ ] Migrar `PublicConnectionBanner.tsx` — usar tokens

### Archivos a modificar
- `src/features/auth/presentation/pages/login-page.tsx`
- `src/features/auth/presentation/pages/register-page.tsx`
- `src/features/auth/presentation/components/FormErrorBanner.tsx`
- `src/components/pwa/ConnectionStatus.tsx`
- `src/features/auth/presentation/components/PublicConnectionBanner.tsx`

### Comandos de verificación
```bash
pnpm build
pnpm lint
```

---

## Fase 8 — PWA Offline + Limpieza Final (2 días)

### Tareas
- [ ] **Verificar PWA offline**:
  ```bash
  pnpm build && pnpm preview
  ```
  - Probar offline con DevTools
  - Asegurar que estilos críticos estén en precache
  - Verificar que no haya errores visuales en modo offline
- [ ] **Eliminar clases CSS no usadas** de `index.css`:
  - Identificar clases personalizadas que ya no se referencian
  - Mover las que aún se usan a `styles/` si aplica
- [ ] **Verificar 0 colores hardcodeados**:
  ```bash
  grep -rn "text-\[#" src/ --include="*.tsx" --include="*.ts"
  grep -rn "bg-\[#" src/ --include="*.tsx" --include="*.ts"
  grep -rn "border-\[#" src/ --include="*.tsx" --include="*.ts"
  ```
- [ ] **Verificar 0 estilos inline** no justificados:
  ```bash
  grep -rn "style={" src/ --include="*.tsx" --include="*.ts"
  ```
- [ ] **Ejecutar Lighthouse** en modo PWA y corregir puntuaciones
- [ ] **Verificar contraste WCAG AA** en textos principales

### Archivos a modificar
- `src/index.css` — limpieza final
- Posiblemente `src/styles/tokens.css` si se extraen variables

### Comandos de verificación
```bash
pnpm build
pnpm lint
pnpm preview              # luego probar offline
npx lighthouse http://localhost:4173 --view --preset=desktop
```

---

## Criterios de Aceptación Finales

- [ ] **0** ocurrencias de `text-[#`, `bg-[#` o `border-[#` en componentes
- [ ] **0** estilos inline (`style={{}}`) en componentes (excepto props dinámicas justificadas)
- [ ] **0** warnings de accesibilidad (aria, contraste, touch targets)
- [ ] Todos los botones/links tienen `min-h-[44px]` y `min-w-[44px]`
- [ ] Lighthouse PWA ≥ 90 en todas las categorías
- [ ] `pnpm build` sin errores
- [ ] `pnpm lint` sin errores
- [ ] Touch targets verificados en dispositivo real (o DevTools móvil)
- [ ] Contraste WCAG AA verificado en textos principales
- [ ] Animaciones funcionan con y sin `prefers-reduced-motion`
- [ ] App funciona offline sin errores visuales
