# Story Layer

Componentes para estados de UI: transiciones, carga, vacio, error y revelaciones.

## AmautaTransition

Sistema de animacion stagger para hijos con contexto anidado.

### Props

```typescript
type AmautaAnimationType = "fade-in-up" | "scale-in" | "slide-in-right" | "count-up"
type AmautaTransitionOrder = "forward" | "reverse"

interface AmautaTransitionProps {
  children: React.ReactNode
  className?: string
  animation?: AmautaAnimationType
  stagger?: number
  order?: AmautaTransitionOrder
}
```

### Subcomponentes

```typescript
interface AmautaTransitionItemProps {
  children: React.ReactNode
  className?: string
  index?: number
  animation?: AmautaAnimationType
}
```

### Tipos de animacion

| animation | Clase CSS |
|-----------|-----------|
| `fade-in-up` | `animate-fade-in-up` |
| `scale-in` | `animate-scale-in` |
| `slide-in-right` | `animate-slide-in-right` |
| `count-up` | `animate-count-up` |

### Comportamiento

- Cuando `stagger > 0`: los hijos se envuelven individualmente con delays progresivos.
- Cuando `stagger = 0`: el wrapper completo se anima una sola vez.
- El contexto se propaga: un `AmautaTransition` anidado hereda `stagger`, `animation` y calcula `baseIndex` del padre.
- `order="reverse"` invierte los delays.

### Ejemplos

```tsx
// Stagger simple
<AmautaTransition stagger={300}>
  <div>Item 1 (delay 0ms)</div>
  <div>Item 2 (delay 150ms)</div>
  <div>Item 3 (delay 300ms)</div>
</AmautaTransition>

// Con item explicito y animacion custom
<AmautaTransition animation="scale-in" stagger={400}>
  <AmautaTransitionItem index={0}>Primero</AmautaTransitionItem>
  <AmautaTransitionItem index={1}>Segundo</AmautaTransitionItem>
</AmautaTransition>

// Sin stagger (wrapper completo)
<AmautaTransition animation="fade-in-up">
  <div className="card">Contenido</div>
</AmautaTransition>
```

---

## AmautaLoadingState

Estado de carga con 5 variantes de skeleton.

### Props

```typescript
type AmautaLoadingVariant = "page" | "card" | "text" | "avatar" | "stat"

interface AmautaLoadingStateProps {
  variant?: AmautaLoadingVariant
  count?: number
  className?: string
  label?: string
}
```

### Variantes

| variant | Visual | count afecta |
|---------|--------|--------------|
| `page` | Sparkle animado con ping + texto "Cargando..." | No |
| `card` | Skeleton de tarjetas con icono, titulo y contenido | Numero de tarjetas |
| `text` | Lineas de texto skeleton | Numero de parrafos |
| `avatar` | Circulo + 2 lineas de texto | No |
| `stat` | Skeleton de metricas con icono, valor y label | Numero de stats (default 3) |

### Accesibilidad

- `role="status"` y `aria-live="polite"` en el contenedor.
- `sr-only` "Cargando..." para lectores de pantalla.

### Ejemplos

```tsx
// Pantalla completa
<AmautaLoadingState variant="page" />

// Con label personalizado
<AmautaLoadingState variant="page" label="Preparando tu sesion..." />

// Skeletons de tarjetas
<AmautaLoadingState variant="card" count={3} />

// Skeleton de texto
<AmautaLoadingState variant="text" count={2} />
```

---

## AmautaEmptyState

Estado vacio con icono, titulo, descripcion y accion opcional. Soporta variante con `CondorGuide`.

### Props

```typescript
interface AmautaEmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  condorMessage?: string
  className?: string
  size?: "sm" | "md" | "lg"
}
```

### Variantes

| size | Padding vertical |
|------|-----------------|
| `sm` | `py-8` |
| `md` | `py-16` |
| `lg` | `py-24` |

### Comportamiento

- Si `condorMessage` se provee: muestra el `CondorGuide` con burbuja (reemplaza icon).
- Si no hay `condorMessage` pero hay `icon`: muestra icono en contenedor azul.
- `action` puede ser cualquier ReactNode (boton, link, etc).

### Ejemplos

```tsx
// Con condor
<AmautaEmptyState
  condorMessage="No hay ejercicios nuevos"
  title="Completaste todo"
  description="Vuelve manana para mas retos"
  action={<AmautaButton onClick={handleRefresh}>Actualizar</AmautaButton>}
/>

// Con icono
<AmautaEmptyState
  icon={<Inbox className="h-6 w-6" />}
  title="Bandeja vacia"
  size="sm"
/>
```

---

## AmautaErrorState

Estado de error con icono, titulo, mensaje y boton de reintento personalizable.

### Props

```typescript
interface AmautaErrorStateProps {
  title?: string
  message?: string
  onRetry?: () => void
  retryLabel?: string
  className?: string
}
```

### Defaults

| Prop | Default |
|------|---------|
| `title` | `"Ups! Algo salio mal"` |
| `retryLabel` | `"Intentar de nuevo"` |

### Comportamiento

- Sin `onRetry`: no renderiza boton.
- Con `onRetry` + `retryLabel`: boton con texto personalizado.
- Icono `HelpCircle` con animacion ping.
- Texto del error en `message` con max-width `max-w-sm`.

### Ejemplos

```tsx
// Error con reintento
<AmautaErrorState
  title="Error de conexion"
  message="No pudimos cargar los datos. Revisa tu conexion."
  onRetry={() => refetch()}
/>

// Error sin reintento
<AmautaErrorState
  title="Acceso denegado"
  message="No tienes permisos para ver esta pagina."
/>

// Con label personalizado
<AmautaErrorState
  message="El servidor no responde."
  onRetry={onBack}
  retryLabel="Volver al inicio"
/>
```

---

## AmautaReveal

Dialogo de revelacion (overlay) para logros o contenido desbloqueado. Basado en `AmautaDialog`.

### Props

```typescript
interface AmautaRevealProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  icon?: React.ReactNode
  children?: React.ReactNode
  action?: React.ReactNode
}
```

### Layout

```
+---------------------------+
| [X] close                 |
|                           |
|      (sparkles)           |
|    +--------+             |
|    |  icon  |             |
|    +--------+             |
|                           |
|      # title              |
|      description          |
|                           |
|      [children]           |
|                           |
|      [action]             |
+---------------------------+
```

### Comportamiento

- `open` controla visibilidad del Dialog.
- `onClose` se llama al cerrar (click fuera o boton X).
- `icon` default es `Sparkles` si no se provee.
- Animaciones: `scale-in` en icono, `fade-in-up` en title/description/children/action con delays progresivos.

### Ejemplos

```tsx
const [showReveal, setShowReveal] = useState(false)

<AmautaReveal
  open={showReveal}
  onClose={() => setShowReveal(false)}
  title="Nuevo logro!"
  description="Completaste 10 ejercicios seguidos"
  icon={<Trophy className="h-10 w-10 text-[var(--amauta-orange-dark)]" />}
  action={<AmautaButton onClick={() => setShowReveal(false)}>Continuar</AmautaButton>}
/>
```
