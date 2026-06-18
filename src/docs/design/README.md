# Design System

El sistema de diseno de Amauta envuelve componentes shadcn/ui con variantes semanticas para educacion infantil.

## Stack

| Capa | Tecnologia |
|------|-----------|
| Base | shadcn/ui (Radix + Tailwind) |
| Estilos | Tailwind CSS v4 con variables CSS `--amauta-*` |
| Variantes | `class-variance-authority` (CVA) |
| Iconos | lucide-react |
| Animaciones | `src/styles/animations.css` (fade-in-up, scale-in, bounce, sparkle, pulse) |

## Convenciones

- Importar desde `@/components/amauta`
- Usar `cn()` de `@/lib/utils` para merger de clases
- Componentes con prop `as` (polymorphic): Container, Section
- Props que envuelven shadcn se pasan con `...props` (spread)

## Mapa de Componentes

| Capa | Componentes | Archivo |
|------|------------|---------|
| Base | AmautaButton, AmautaCard, AmautaBadge, AmautaProgress, AmautaInput, AmautaDialog | `01-base-layer.md` |
| Layout | AmautaContainer, AmautaSection, AmautaGrid, AmautaDivider | `02-layout-layer.md` |
| Brand | AmautaHero, CondorGuide, AmautaLearningPath, AmautaStatCard, AmautaAchievement | `03-brand-layer.md` |
| Patterns | HeroWithCondor, EducationalSection, CTAEducational, FeatureGrid, HowItWorks, StudentProgressPanel, ParentMetricsGrid | `04-patterns.md` |
| Story | AmautaTransition, AmautaLoadingState, AmautaEmptyState, AmautaErrorState, AmautaReveal | `05-story-layer.md` |

## Token System

| Variable | Proposito |
|----------|----------|
| `--amauta-blue` | Color primario (azul principal) |
| `--amauta-blue-dark` | Azul oscuro (hover, fondos oscuros) |
| `--amauta-blue-light` | Azul claro (fondos de icono, badges) |
| `--amauta-orange` | Color accent (naranja principal) |
| `--amauta-orange-dark` | Naranja oscuro (hover) |
| `--amauta-orange-light` | Naranja claro (fondos) |
| `--amauta-surface-alt` | Fondo alternativo para secciones |
| `--amauta-warm-white` | Blanco calido para fondos accent |
