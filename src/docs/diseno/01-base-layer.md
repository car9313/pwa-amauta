# Base Layer

Componentes base que envuelven shadcn/ui con variantes semanticas.

## AmautaButton

Envuelve `Button` de shadcn. El `variant` de shadcn se usa cuando `amautaVariant="default"`. Los `amautaVariant` no-default sobreescriben el variant de shadcn.

### Props

```typescript
interface AmautaButtonProps extends React.ComponentProps<typeof Button> {
  amautaVariant?: "default" | "accent" | "accent-ghost" | "success"
}
```

### Variantes

| amautaVariant | Descripcion | Uso tipico |
|---------------|-------------|------------|
| `default` | Pasa el variant shadcn (default/primary/secondary/outline/ghost/destructive) | Uso general |
| `accent` | Fondo naranja, hover mas oscuro, sombra | CTAs principales (empezar, continuar) |
| `accent-ghost` | Fondo naranja claro, texto naranja oscuro | Acciones secundarias |
| `success` | Fondo verde, texto blanco | Acciones de exito |

### Ejemplos

```tsx
<AmautaButton onClick={handleStart}>
  Comenzar
</AmautaButton>

<AmautaButton amautaVariant="accent" size="child-lg" className="w-full">
  Empezar leccion
</AmautaButton>

<AmautaButton amautaVariant="success" disabled={isPending}>
  Guardar progreso
</AmautaButton>

<AmautaButton variant="outline" size="sm">
  Cancelar
</AmautaButton>
```

---

## AmautaCard

Envuelve `Card` de shadcn. Re-exporta los subcomponentes `AmautaCardHeader`, `AmautaCardTitle`, `AmautaCardDescription`, `AmautaCardContent`, `AmautaCardFooter`, `AmautaCardAction`.

### Props

```typescript
type AmautaCardVariant = "default" | "glass" | "elevated" | "bordered" | "interactive"

interface AmautaCardProps extends React.ComponentProps<typeof Card> {
  amautaVariant?: AmautaCardVariant
}
```

### Variantes

| amautaVariant | Descripcion |
|---------------|-------------|
| `default` | Card shadcn default con borde sutil |
| `glass` | Efecto vidrio con backdrop-filter |
| `elevated` | Sin borde, sombra grande, hover mas sombra |
| `bordered` | Borde grueso azul claro |
| `interactive` | Hover levanta y agrega sombra, cursor pointer |

### Ejemplos

```tsx
<AmautaCard amautaVariant="elevated" className="p-4">
  <AmautaCardTitle>Progreso semanal</AmautaCardTitle>
  <AmautaCardContent>
    <p>Contenido de la tarjeta</p>
  </AmautaCardContent>
</AmautaCard>

<AmautaCard amautaVariant="interactive" onClick={handleSelect}>
  <AmautaCardContent>Seleccionar</AmautaCardContent>
</AmautaCard>
```

---

## AmautaBadge

Badge autonomo (no envuelve shadcn). Usa CVA para variantes y tamanos.

### Props

```typescript
interface AmautaBadgeProps
  extends React.ComponentProps<"span">,
    VariantProps<typeof amautaBadgeVariants> {}
```

### Variantes

| variant | Descripcion |
|---------|-------------|
| `default` | Azul claro sobre azul |
| `success` | Verde semitransparente |
| `warning` | Amarillo semitransparente |
| `xp` | Naranja claro sobre naranja oscuro |
| `streak` | Gradiente naranja, texto blanco |
| `achievement` | Gradiente azul oscuro, texto blanco |

| size | Clases |
|------|--------|
| `sm` | `px-2 py-0.5 text-xs rounded-md` |
| `md` | `px-3 py-1 text-sm rounded-lg` |
| `lg` | `px-4 py-1.5 text-base rounded-xl` |

### Ejemplos

```tsx
<AmautaBadge variant="xp" size="sm">+50 XP</AmautaBadge>
<AmautaBadge variant="streak">Racha de 3 dias</AmautaBadge>
<AmautaBadge variant="achievement" size="lg">Nuevo logro</AmautaBadge>
```

---

## AmautaProgress

Envuelve `ProgressBar` (`src/components/ui/progress-bar.tsx`). Agrega label semantico, valor numerico y estilo de juego: barra gruesa con efecto tubo, transicion spring y estrella en la punta del relleno.

### Props

```typescript
type AmautaProgressVariant = "lesson" | "xp" | "level" | "default" | "topic"

interface AmautaProgressProps extends Omit<ProgressBarProps, "color"> {
  amautaVariant?: AmautaProgressVariant
  label?: string
  showValue?: boolean
  hideLabel?: boolean
  colorByValue?: boolean
}
```

### Props heredadas de ProgressBar

| Prop | Default | Descripcion |
|------|---------|-------------|
| `max` | `100` | Valor maximo de escala; el porcentaje se calcula como `value / max`. |
| `gloss` | `false` | Brillo superior sobre el relleno. |
| `showTipStar` | `true` | Estrella en la punta del relleno cuando el porcentaje supera 6%. |
| `interactive` | `true` | Glow del color del relleno al hacer hover sobre la barra. |
| `animated` | `true` | Shimmer sweep sobre el relleno. |
| `color` | `"primary"` | Color solido del relleno: `primary`, `accent`, `success`. |

### Variantes

| amautaVariant | Color | Label default |
|---------------|-------|---------------|
| `lesson` | primary (azul) | "Progreso de leccion" |
| `xp` | accent (naranja/amber) | "Puntos de experiencia" |
| `level` | success (verde) | "Nivel" |
| `default` | primary (azul) | "Progreso" |
| `topic` | primary (configurable via colorByValue) | "Progreso" |

### Prop especial: colorByValue

Cuando `colorByValue={true}`, el color de la barra cambia segun el valor:
- `value === 100` → success (verde)
- `value >= 50` → primary (azul)
- `value < 50` → accent (naranja)

### Estilo

- Grosor uniforme en toda la app: usar `size="md"` (28px). Todos los consumidores actuales lo usan; `sm` (20px) y `lg` (36px) existen como API pero deben evitarse para mantener consistencia.
- Pista con efecto tubo: fondo `secondary`, borde `border-border/70` y sombra interna.
- Relleno solido con tokens de diseno (sin gradientes), transicion spring `cubic-bezier(0.34, 1.56, 0.64, 1)` de 700ms.
- Fila de label con icono de estrella ambar y porcentaje en pill badge (`bg-secondary text-primary rounded-full border`).
- Hover: glow suave del color del relleno, scoped con `group/progress` (no se activa desde contenedores padres con `group`). Desactivable con `interactive={false}`.

### Comportamiento

- `hideLabel` cuando es `true`: renderiza solo la barra sin label ni valor. Util para tablas o listas donde el label ya esta en el layout padre.

### Ejemplos

```tsx
<AmautaProgress value={75} amautaVariant="lesson" />
<AmautaProgress value={60} amautaVariant="xp" label="Experiencia" size="md" />
<AmautaProgress value={100} amautaVariant="level" showValue={false} />
<AmautaProgress value={85} amautaVariant="lesson" hideLabel />
<AmautaProgress value={7} max={10} hideLabel interactive={false} />
```

---

## Character

Mascota de Amauta sin burbuja de dialogo. Version simplificada de `CondorGuide` para usar como avatar o decoracion. Soporta expresiones reactivas para gamificacion (feedback de lecciones).

### Props

```typescript
type CharacterSize = "sm" | "md" | "lg" | "xl"

type CharacterExpression =
  | "idle"
  | "thinking"
  | "happy"
  | "encouraging"
  | "superstar"
  | "sad"

interface CharacterProps {
  size?: CharacterSize
  expression?: CharacterExpression
  className?: string
}
```

### Variantes de tamano

| size | Clases |
|------|--------|
| `sm` | `w-12 h-12` |
| `md` | `w-16 h-16` |
| `lg` | `w-24 h-24` |
| `xl` | `w-32 h-32` |

### Expresiones

Con la prop `expression`, el componente carga la imagen correspondiente desde `/img/mascota/`:

| expression | Imagen | Uso tipico |
|------------|--------|-----------|
| `idle` | `/img/mascota/idle.webp` | Estado neutral / esperando |
| `thinking` | `/img/mascota/thinking.webp` | Mientras se valida una respuesta (server-first) |
| `happy` | `/img/mascota/happy.webp` | Respuesta correcta / resumen con errores |
| `encouraging` | `/img/mascota/encouraging.webp` | Animo tras un error |
| `superstar` | `/img/mascota/superstar.webp` | Leccion perfecta (precision 100%) |
| `sad` | `/img/mascota/sad.webp` | Feedback correctivo suave |

### Comportamiento

- **Sin `expression`** (backward-compatible): usa la imagen legacy `/img/amauta-mascot.jpg`. Dashboards y navegacion no cambian.
- **Con `expression`**: usa el `.webp` correspondiente; si la imagen falla, hace fallback a la legacy.
- Animacion ligera (`motion`) segun la expresion.
- Sin burbuja de dialogo (a diferencia de `CondorGuide`)
- `object-contain` para mantener aspect ratio
- Borde redondeado completo (`rounded-full`) con borde blanco

### Ejemplos

```tsx
<Character size="sm" />
<Character size="lg" className="shadow-xl" />
<Character size="md" expression="thinking" />
<Character size="xl" expression="superstar" />
```

---

## AmautaInput

Envuelve `Input` de shadcn. Estiliza con bordes azules y focus ring.

### Props

```typescript
interface AmautaInputProps extends React.ComponentProps<typeof Input> {}
```

No agrega variantes. Solo estiliza el input por defecto con border-radius `rounded-xl` y colores amauta.

### Ejemplos

```tsx
<AmautaInput placeholder="Escribe tu respuesta" />
<AmautaInput type="number" value={answer} onChange={handleChange} disabled={submitted} />
```

---

## AmautaDialog

Envuelve `Dialog` de shadcn. Re-exporta todos los subcomponentes. Solo `AmautaDialogContent` tiene estilos personalizados.

### Props

```typescript
interface AmautaDialogContentProps extends React.ComponentProps<typeof DialogContent> {}
```

### Subcomponentes

| Export | Origen |
|--------|--------|
| `AmautaDialog` | shadcn Dialog |
| `AmautaDialogTrigger` | shadcn DialogTrigger |
| `AmautaDialogContent` | Wrapper con `rounded-2xl` y borde azul claro |
| `AmautaDialogHeader` | shadcn DialogHeader |
| `AmautaDialogFooter` | shadcn DialogFooter |
| `AmautaDialogTitle` | shadcn DialogTitle |
| `AmautaDialogDescription` | shadcn DialogDescription |
| `AmautaDialogClose` | shadcn DialogClose |

### Ejemplos

```tsx
<AmautaDialog>
  <AmautaDialogTrigger asChild>
    <AmautaButton>Abrir</AmautaButton>
  </AmautaDialogTrigger>
  <AmautaDialogContent>
    <AmautaDialogHeader>
      <AmautaDialogTitle>Confirmar</AmautaDialogTitle>
      <AmautaDialogDescription>Descripcion del dialogo</AmautaDialogDescription>
    </AmautaDialogHeader>
    <AmautaDialogFooter>
      <AmautaButton onClick={handleConfirm}>Aceptar</AmautaButton>
    </AmautaDialogFooter>
  </AmautaDialogContent>
</AmautaDialog>
```
