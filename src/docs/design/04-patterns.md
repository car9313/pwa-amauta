# Pattern Layer (Composites)

Componentes compuestos que combinan componentes base y brand en patrones de UI reutilizables.

## HeroWithCondor

Hero completo con condor, headline, subtitle y hasta 2 CTAs.

### Props

```typescript
interface HeroWithCondorProps {
  headline: string
  subtitle: string
  condorMessage?: string
  primaryCta?: {
    label: string
    onClick: () => void
  }
  secondaryCta?: {
    label: string
    onClick: () => void
  }
  className?: string
}
```

### Layout

```
+----------------------------------+
|         [CondorGuide]            |
|         (with message)           |
|                                  |
|   # headline                     |
|   subtitle                       |
|                                  |
|   [primaryCta]  [secondaryCta]   |
+----------------------------------+
```

### Ejemplos

```tsx
<HeroWithCondor
  headline="Aprende matematicas jugando"
  subtitle="Ejercicios interactivos para ninos de 6 a 12 anos"
  condorMessage="Listo para empezar?"
  primaryCta={{ label: "Comenzar", onClick: () => navigate("/register") }}
  secondaryCta={{ label: "Saber mas", onClick: () => scrollTo("#about") }}
/>
```

---

## EducationalSection

Seccion educativa de dos columnas (texto + imagen) con variante de fondo.

### Props

```typescript
interface EducationalSectionProps {
  title: string
  description: string
  icon?: React.ReactNode
  image?: string
  imageAlt?: string
  reversed?: boolean
  variant?: "default" | "alt" | "primary" | "accent"
  action?: React.ReactNode
  className?: string
  id?: string
}
```

### Layout

| reversed=false | reversed=true |
|----------------|---------------|
| `[texto] [imagen]` | `[imagen] [texto]` |

### Comportamiento

- `icon` se muestra en un contenedor azul redondeado arriba del titulo.
- `action` se renderiza debajo de la descripcion.
- En mobile `<lg` todo se apila verticalmente centrado.

### Ejemplos

```tsx
<EducationalSection
  title="Ejercicios adaptativos"
  description="Cada nino avanza a su propio ritmo"
  icon={<Brain className="h-6 w-6" />}
  image="/img/learning.jpg"
  variant="alt"
  action={<AmautaButton>Explorar</AmautaButton>}
/>
```

---

## CTAEducational

Call-to-action con gradiente y orbes decorativos animados.

### Props

```typescript
interface CTAEducationalProps {
  headline: string
  description?: string
  buttonLabel: string
  buttonOnClick: () => void
  variant?: "primary" | "accent" | "dark"
  className?: string
}
```

### Variantes

| variant | Gradiente |
|---------|-----------|
| `primary` | Azul → Naranja |
| `accent` | Naranja → Naranja oscuro |
| `dark` | Azul oscuro → Azul |

### Ejemplos

```tsx
<CTAEducational
  headline="Empieza hoy"
  description="Crea una cuenta gratuita"
  buttonLabel="Registrarse"
  buttonOnClick={() => navigate("/register")}
  variant="primary"
/>
```

---

## FeatureGrid

Grid de caracteristicas con iconos, titulo y descripcion.

### Props

```typescript
interface FeatureItem {
  icon: LucideIcon
  title: string
  description: string
}

interface FeatureGridProps {
  title?: string
  subtitle?: string
  features: FeatureItem[]
  cols?: 2 | 3 | 4
  variant?: "default" | "alt"
  className?: string
  id?: string
}
```

### Layout

```
+----------------------------------+
|   title                          |
|   subtitle                       |
+----------------------------------+
|  [icon] [icon] [icon]            |
|  title  title  title             |
|  desc   desc   desc              |
+----------------------------------+
```

### Ejemplos

```tsx
<FeatureGrid
  title="Por que Amauta"
  subtitle="Disenado para el exito"
  cols={3}
  features={[
    { icon: Brain, title: "Adaptativo", description: "Se ajusta al ritmo del nino" },
    { icon: Trophy, title: "Logros", description: "Motivacion constante" },
    { icon: Sparkles, title: "Divertido", description: "Ejercicios como juegos" },
  ]}
/>
```

---

## HowItWorks

Lista de pasos vertical con numeros y tarjetas alternando colores de borde.

### Props

```typescript
interface HowItWorksStep {
  number: number
  title: string
  description: string
  icon?: React.ReactNode
}

interface HowItWorksProps {
  title: string
  subtitle?: string
  steps: HowItWorksStep[]
  variant?: "default" | "alt"
  className?: string
  id?: string
}
```

### Layout

```
# title
subtitle

[1] ──── step1 title
         step1 description

[2] ──── step2 title
         step2 description

[3] ──── step3 title
         step3 description
```

### Comportamiento

- Numeros pares tienen borde azul, impares borde naranja.
- Linea vertical conecta los pasos.
- Si `icon` se provee, reemplaza el numero.

### Ejemplos

```tsx
<HowItWorks
  title="Como funciona"
  steps={[
    { number: 1, title: "Responde", description: "Contesta ejercicios diarios" },
    { number: 2, title: "Gana puntos", description: "Acumula XP y sube de nivel" },
    { number: 3, title: "Desbloquea", description: "Nuevos temas al avanzar" },
  ]}
/>
```

---

## StudentProgressPanel

Panel de progreso para estudiantes. Combina AmautaStatCard, AmautaProgress, AmautaLearningPath y AmautaAchievement.

### Props

```typescript
interface StudentStats {
  points: number
  level: number
  accuracy: number
}

interface AchievementItem {
  id: string
  icon?: LucideIcon
  title: string
  description?: string
  unlocked: boolean
}

interface StudentProgressPanelProps {
  studentName?: string
  stats: StudentStats
  totalProgress: number
  learningPath: LearningPathStep[]
  achievements?: AchievementItem[]
  onStepClick?: (step: LearningPathStep) => void
  onAchievementReveal?: (achievement: AchievementItem) => void
  className?: string
}
```

### Layout

```
+----------------------------------+
| Progreso de {studentName}        |
|                                  |
| [Puntos] [Nivel] [Precision]     |
|  Trophy    Star     Target       |
|                                  |
| Progreso General                 |
| [============= 75% ===========]  |
|                                  |
| Ruta de Aprendizaje              |
| [1]---[2]---[3] (horizontal)     |
|                                  |
| Logros                           |
| [achievement] [achievement]      |
+----------------------------------+
```

### Ejemplos

```tsx
<StudentProgressPanel
  studentName="Ana"
  stats={{ points: 1250, level: 5, accuracy: 85 }}
  totalProgress={65}
  learningPath={[
    { id: "1", label: "Sumas", status: "completed" },
    { id: "2", label: "Restas", status: "current" },
    { id: "3", label: "Multiplicacion", status: "locked" },
  ]}
  achievements={[
    { id: "a1", icon: Trophy, title: "Primer logro", unlocked: true },
  ]}
/>
```

---

## ParentMetricsGrid

Grid de metricas para padres con resumen de hijos y actividad reciente.

### Props

```typescript
interface ChildOverview {
  id: string
  name: string
  avatar?: string
  level: number
  points: number
  accuracy: number
  streakDays: number
}

interface ActivityItem {
  id: string
  childName: string
  action: string
  subject?: string
  timestamp: string
  type: "completed" | "level_up" | "practice"
}

interface ParentMetricsGridProps {
  childrenData: ChildOverview[]
  recentActivity?: ActivityItem[]
  totalPoints?: number
  averageAccuracy?: number
  className?: string
}
```

### Layout

```
+----------------------------------+
| [Hijos] [Puntos] [Precision]     |
|  Trophy   Star     Target        |
+----------------------------------+
| Resumen de Hijos                 |
| +--------+  +--------+          |
| | Child1 |  | Child2 |          |
| +--------+  +--------+          |
+----------------------------------+
| Actividad Reciente               |
| - child1 completed sumas         |
| - child2 level_up                |
+----------------------------------+
```

### Comportamiento

- `totalPoints` y `averageAccuracy` se calculan automaticamente de `childrenData` si no se proveen.
- Los iconos de actividad se mapean segun `type`: `completed` → CheckCircle2, `level_up` → Trophy, `practice` → TrendingUp.

### Ejemplos

```tsx
<ParentMetricsGrid
  childrenData={[
    { id: "1", name: "Ana", level: 5, points: 1250, accuracy: 85, streakDays: 3 },
    { id: "2", name: "Luis", level: 3, points: 800, accuracy: 72, streakDays: 1 },
  ]}
  recentActivity={[
    { id: "a1", childName: "Ana", action: "Completo sumas", type: "completed", timestamp: "hace 5m" },
  ]}
/>
```
