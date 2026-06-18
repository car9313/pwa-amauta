# Brand Layer

Componentes de marca que comunican la identidad visual de Amauta.

## AmautaHero

Hero section con gradiente azul-naranja, ruido de fondo y orbes decorativos animados.

### Props

```typescript
interface AmautaHeroProps {
  children: React.ReactNode
  className?: string
  size?: "default" | "compact" | "large"
}
```

### Variantes

| size | Altura | Padding |
|------|--------|---------|
| `default` | `min-h-[60vh]` | `py-20 sm:py-24` |
| `compact` | `min-h-[40vh]` | `py-12 sm:py-16` |
| `large` | `min-h-[80vh]` | `py-24 sm:py-32` |

### Subcomponentes

| Componente | Proposito |
|-----------|-----------|
| `AmautaHeroContent` | Wrapper centrado `max-w-3xl` para texto |
| `AmautaHeroActions` | Flex row/column para botones de CTA |

### Ejemplos

```tsx
<AmautaHero size="compact">
  <AmautaHeroContent>
    <h1 className="text-4xl font-bold">Bienvenido</h1>
    <p className="text-white/80">Texto descriptivo</p>
    <AmautaHeroActions>
      <AmautaButton>Empezar</AmautaButton>
    </AmautaHeroActions>
  </AmautaHeroContent>
</AmautaHero>
```

---

## CondorGuide

Mascota (condor) con burbuja de dialogo opcional.

### Props

```typescript
interface CondorGuideProps {
  message?: string
  className?: string
  position?: "left" | "right" | "center"
  size?: "sm" | "md" | "lg"
}
```

### Variantes

| size | Dimensiones |
|------|------------|
| `sm` | `w-12 h-12` |
| `md` | `w-16 h-16` |
| `lg` | `w-20 h-20 sm:w-24 sm:h-24` |

| position | Alineacion del contenedor |
|----------|--------------------------|
| `left` | `items-start` |
| `center` | `items-center` |
| `right` | `items-end` |

### Comportamiento

- La burbuja de dialogo aparece solo si `message` esta definido.
- La burbuja tiene un triangulo decorativo pseudo-element `::before`.
- position afecta tanto la alineacion del contenedor como la posicion del triangulo.
- La imagen del condor se carga desde `/img/amauta-mascot.jpg`.

### Ejemplos

```tsx
<CondorGuide message="Intenta de nuevo!" position="left" size="md" />

<CondorGuide size="lg" />
```

---

## AmautaLearningPath

Ruta de aprendizaje visual con pasos en estados completado/actual/bloqueado.

### Props

```typescript
type LearningPathStepStatus = "completed" | "current" | "locked"

interface LearningPathStep {
  id: string
  label: string
  description?: string
  status: LearningPathStepStatus
}

interface AmautaLearningPathProps {
  steps: LearningPathStep[]
  className?: string
  direction?: "vertical" | "horizontal"
  onStepClick?: (step: LearningPathStep) => void
}
```

### Estados de paso

| status | Node visual | Linea | Label |
|--------|------------|-------|-------|
| `completed` | Fondo naranja, checkmark SVG, sombra | Naranja | `text-foreground` |
| `current` | Borde azul con ring, numero pulsante | Azul claro | `text-[var(--amauta-blue)] font-bold` |
| `locked` | Fondo muted, icono candado SVG | Muted | `text-muted-foreground` |

### Direction

| direction | Layout |
|-----------|--------|
| `vertical` | Columna con lineas verticales entre nodos |
| `horizontal` | Fila con scroll horizontal, nodos conectados horizontalmente |

### Ejemplos

```tsx
const steps = [
  { id: "1", label: "Sumas", status: "completed" },
  { id: "2", label: "Restas", status: "current", description: "Paso actual" },
  { id: "3", label: "Multiplicacion", status: "locked" },
]

<AmautaLearningPath
  steps={steps}
  direction="vertical"
  onStepClick={(step) => navigate(`/lesson/${step.id}`)}
/>
```

---

## AmautaStatCard

Tarjeta de metrica con icono, valor, label, color y tendencia opcional.

### Props

```typescript
type AmautaStatColor = "primary" | "accent" | "success" | "warning" | "info"

interface AmautaStatCardProps {
  icon?: LucideIcon
  value: string | number
  label: string
  color?: AmautaStatColor
  className?: string
  trend?: "up" | "down" | "neutral"
  trendValue?: string
}
```

### Variantes de color

| color | Icono bg | Texto valor | Hover glow |
|-------|----------|-------------|------------|
| `primary` | Azul claro | Azul | `shadow-glow-blue` |
| `accent` | Naranja claro | Naranja oscuro | `shadow-glow-orange` |
| `success` | Verde 15% | Verde | Sombra verde |
| `warning` | Amarillo 15% | Amarillo | Sombra amarilla |
| `info` | Azul claro | Azul | `shadow-glow-blue` |

### Trend

| trend | Indicador | Color |
|-------|-----------|-------|
| `up` | `↑` + trendValue | `text-success` |
| `down` | `↓` + trendValue | `text-destructive` |
| `neutral` | trendValue | `text-muted-foreground` |

### Ejemplos

```tsx
<AmautaStatCard
  icon={Trophy}
  value={1250}
  label="Puntos"
  color="accent"
  trend="up"
  trendValue="+10%"
/>

<AmautaStatCard
  icon={Target}
  value="85%"
  label="Precision"
  color="success"
/>
```

---

## AmautaAchievement

Componente de logro con estados locked/unlocked, animaciones y sizes.

### Props

```typescript
type AmautaAchievementSize = "sm" | "md" | "lg"

interface AmautaAchievementProps {
  icon?: LucideIcon
  title: string
  description?: string
  unlocked?: boolean
  size?: AmautaAchievementSize
  className?: string
  onReveal?: () => void
}
```

### Variantes de tamano

| size | Box padding | Icon | Title font |
|------|------------|------|------------|
| `sm` | `min-w-[100px] p-3` | `h-6 w-6` | `text-xs` |
| `md` | `min-w-[120px] p-4` | `h-8 w-8` | `text-sm` |
| `lg` | `min-w-[140px] p-5` | `h-10 w-10` | `text-base` |

### Estados

| unlocked | Visual |
|----------|--------|
| `true` | Card con borde, sombra, hover scale + translate, sparkle animado en esquina superior derecha, icono naranja |
| `false` | Card muted, borde dashed, opacidad reducida, cursor default, sin hover effects |

### Ejemplos

```tsx
<AmautaAchievement
  icon={Trophy}
  title="Primer logro"
  description="Completaste tu primer ejercicio"
  unlocked={true}
  size="md"
  onReveal={() => console.log("Revelado!")}
/>

<AmautaAchievement
  title="Bloqueado"
  unlocked={false}
  size="sm"
/>
```
