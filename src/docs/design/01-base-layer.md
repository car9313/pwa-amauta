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

Envuelve `ProgressBar` de shadcn. Agrega label semantico y valor numerico.

### Props

```typescript
type AmautaProgressVariant = "lesson" | "xp" | "level" | "default"

interface AmautaProgressProps extends Omit<ProgressBarProps, "color"> {
  amautaVariant?: AmautaProgressVariant
  label?: string
  showValue?: boolean
  hideLabel?: boolean
}
```

### Variantes

| amautaVariant | Color | Label default |
|---------------|-------|---------------|
| `lesson` | primary (azul) | "Progreso de leccion" |
| `xp` | accent (naranja/amber) | "Puntos de experiencia" |
| `level` | success (verde) | "Nivel" |
| `default` | primary (azul) | "Progreso" |

### Comportamiento

- `hideLabel` cuando es `true`: renderiza solo la barra sin label ni valor. Util para tablas o listas donde el label ya esta en el layout padre.

### Ejemplos

```tsx
<AmautaProgress value={75} amautaVariant="lesson" />
<AmautaProgress value={60} amautaVariant="xp" label="Experiencia" size="lg" />
<AmautaProgress value={100} amautaVariant="level" showValue={false} />
<AmautaProgress value={85} amautaVariant="lesson" hideLabel />
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
