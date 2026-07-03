# Layout Layer

Componentes estructurales para construir paginas y secciones.

## AmautaContainer

Envuelve `Container` de shadcn. Controla el ancho maximo del contenido.

### Props

```typescript
type AmautaContainerSize = "sm" | "md" | "lg" | "full"
type AmautaContainerElement = "div" | "section" | "article" | "main" | "header" | "footer"

interface AmautaContainerProps {
  children: React.ReactNode
  className?: string
  size?: AmautaContainerSize
  as?: AmautaContainerElement
}
```

### Variantes

| size | max-width |
|------|-----------|
| `sm` | `max-w-4xl` |
| `md` | `max-w-5xl` |
| `lg` | `max-w-7xl` |
| `full` | `max-w-none` |

### Ejemplos

```tsx
<AmautaContainer size="sm">
  <p>Contenido angosto</p>
</AmautaContainer>

<AmautaContainer as="main" className="py-4">
  <Outlet />
</AmautaContainer>
```

---

## AmautaSection

Seccion con variantes de fondo predefinidas. Polimorphic con prop `as`.

### Props

```typescript
type AmautaSectionVariant = "default" | "alt" | "primary" | "accent" | "hero"

interface AmautaSectionProps {
  children: React.ReactNode
  className?: string
  variant?: AmautaSectionVariant
  as?: "section" | "div" | "article"
  id?: string
}
```

### Variantes

| variant | Background | Texto |
|---------|-----------|-------|
| `default` | `bg-background` | `text-foreground` |
| `alt` | `bg-[var(--amauta-surface-alt)]` | `text-foreground` |
| `primary` | Gradiente azul | `text-white` |
| `accent` | Gradiente naranja claro | `text-foreground` |
| `hero` | Gradiente azul a naranja | `text-white`, overflow hidden |

Todas tienen `py-16 sm:py-20`.

### Ejemplos

```tsx
<AmautaSection variant="primary" id="features">
  <AmautaContainer>
    <h2>Caracteristicas</h2>
  </AmautaContainer>
</AmautaSection>

<AmautaSection variant="alt" as="div">
  <p>Seccion con fondo alternativo</p>
</AmautaSection>
```

---

## AmautaGrid

Grid responsive con columnas configurables.

### Props

```typescript
type AmautaGridCols = 1 | 2 | 3 | 4
type AmautaGridGap = "sm" | "md" | "lg"

interface AmautaGridProps {
  children: React.ReactNode
  className?: string
  cols?: AmautaGridCols
  gap?: AmautaGridGap
}
```

### Variantes

| cols | Breakpoints |
|------|------------|
| `1` | `grid-cols-1` |
| `2` | `grid-cols-1 sm:grid-cols-2` |
| `3` | `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` |
| `4` | `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` |

| gap | Clase |
|-----|-------|
| `sm` | `gap-4` |
| `md` | `gap-6` |
| `lg` | `gap-8` |

### Ejemplos

```tsx
<AmautaGrid cols={3} gap="lg">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</AmautaGrid>

<AmautaGrid cols={2} gap="sm">
  {items.map(item => <Card key={item.id}>{item.content}</Card>)}
</AmautaGrid>
```

---

## AmautaDivider

Divisor horizontal con soporte opcional para label e icono.

### Props

```typescript
interface AmautaDividerProps {
  className?: string
  label?: string
  icon?: React.ReactNode
}
```

### Comportamiento

- Sin label ni icono: renderiza un `<hr>` simple.
- Con label o icono: renderiza un contenedor flex con lineas a ambos lados del contenido.

### Ejemplos

```tsx
<AmautaDivider />

<AmautaDivider label="Seccion" />

<AmautaDivider
  label="Logros"
  icon={<Trophy className="h-4 w-4" />}
/>
```
