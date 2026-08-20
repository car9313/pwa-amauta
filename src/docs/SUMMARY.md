# Resumen de Amauta

## 1. Resumen de la Aplicación

**Amauta** es una **aplicación web progresiva (PWA)** de **educación infantil** con enfoque **offline-first**. Está diseñada para que los niños aprendan con una experiencia gamificada (niveles, puntos, rachas, logros) que funciona **siempre**, incluso sin conexión a internet.

Al ser una PWA, se instala como una app nativa (Android, iOS, escritorio), se abre en pantalla completa y mantiene sus datos y funcionalidad principal sin red.

### Principios de Diseño

| Principio | Descripción |
|-----------|-------------|
| **Offline-first** | Prioriza la disponibilidad sobre la frescura de los datos. |
| **Rápido y siempre disponible** | Contenido servido desde caché instantáneamente. |
| **Sincronización automática** | Los datos se sincronizan en segundo plano al recuperar conexión. |
| **Experiencia infantil** | UI gamificada y amigable para niños. |

### Objetivo

Proveer una experiencia de **aprendizaje adaptativo** para niños, acompañada por padres y profesores, que funcione de forma fluida y continua tanto online como offline:

- El **niño** aprende con lecciones interactivas y retroalimentación inmediata.
- El **padre** supervisa el progreso de uno o más hijos.
- El **profesor** gestiona clases y sigue el avance de sus estudiantes.

---

## 2. Objetivo

| Aspecto | Detalle |
|---------|---------|
| **Qué resuelve** | Acceso a educación infantil de calidad con disponibilidad total, incluso sin internet. |
| **Para quién** | Niños (estudiantes), padres/madres y profesores. |
| **Cómo lo logra** | PWA instalable + Service Worker (caché) + IndexedDB (Dexie) + cola de sincronización offline. |
| **Valor central** | "Rápido y siempre disponible" — los niños no deben ver errores de conexión ni pantallas de carga. |

---

## 3. Roles de Usuario

### Estudiante (niño/niña)
- Dashboard personal con nivel, puntos, racha y ejercicios pendientes.
- Toma lecciones interactivas y responde ejercicios con retroalimentación inmediata (incluso offline).
- Ve su progreso estilo juego (niveles, estrellas, barras de avance).
- Solo ve su propia información (su `studentId` se inyecta automáticamente).

### Padre/Madre
- Se registra en la plataforma (el registro solo crea cuentas `parent`).
- Gestiona uno o más hijos vinculados a su cuenta.
- Dashboard parental con resumen de todos sus hijos (nombre, avatar, nivel, puntos, precisión, racha).
- Selecciona un hijo activo para ver su detalle, progreso y lecciones (la selección persiste incluso offline).

### Profesor/Teacher
- Tiene clases/grupos de estudiantes asignados (`classIds`).
- Ve lecciones y progreso de sus estudiantes.
- Es creado externamente (no hay registro público).
- **Nota**: el dashboard específico de profesor (`/dashboard/teacher`) está pendiente de implementar.

---

## 4. Secciones / Rutas de la Aplicación

### Rutas Públicas (sin autenticación)

| Ruta | Sección | Descripción |
|------|---------|-------------|
| `/login` | Login | Inicio de sesión con email + contraseña. |
| `/register` | Registro | Registro de cuenta de tipo padre/madre. |

### Rutas Protegidas (requieren autenticación)

| Ruta | Sección | Rol | Descripción |
|------|---------|-----|-------------|
| `/` o `/dashboard` | Redirección | Todos | Redirige al dashboard según el rol (`HomeRedirect`). |
| `/roles` | Selección de rol | Todos | Selección de rol/perfil del usuario. |
| `/dashboard/student` | Dashboard Estudiante | Estudiante | Panel con nivel, puntos, racha y ejercicios pendientes. |
| `/dashboard/parent` | Dashboard Padre | Padre | Resumen de los hijos y selección de hijo activo. |
| `/dashboard/teacher` | Dashboard Profesor | Teacher | Panel del profesor (pendiente de implementar). |
| `/lessons` | Lecciones | Todos | Lecciones interactivas adaptadas al nivel. |
| `/lessons/feedback` | Feedback de lección | Todos | Retroalimentación tras completar una lección. |
| `/progress` | Progreso / Niveles | Todos | Pantalla de progreso estilo juego (`LevelScreen`). |
| `/practice` | Práctica | Todos | Ejercicios de práctica. |
| `/games` | Juegos | Todos | Juegos educativos. |

### Menú de Navegación Principal

| Ítem | Ruta | Icono |
|------|------|-------|
| Dashboard | `/dashboard` | Home |
| Lecciones | `/lessons` | BookOpen |
| Práctica | `/practice` | BarChart3 |
| Juegos | `/games` | Gamepad2 |
| Progreso | `/progress` | BarChart3 |
| Panel Parental | `/parent` | Users |

---

## 5. Design System

El sistema de diseño envuelve **shadcn/ui** (Radix + Tailwind) con variantes semánticas orientadas a educación infantil.

### Stack del Design System

| Capa | Tecnología |
|------|-----------|
| Base | shadcn/ui (Radix + Tailwind) |
| Estilos | Tailwind CSS v4 con variables `--amauta-*` |
| Variantes | `class-variance-authority` (CVA) |
| Iconos | lucide-react |
| Animaciones | `src/styles/animations.css` (fade-in-up, scale-in, bounce, sparkle, pulse) |

### Convenciones

- Importar componentes desde `@/components/amauta`.
- Usar `cn()` de `@/lib/utils` para merge de clases.
- Componentes polimórficos con prop `as`: `AmautaContainer`, `AmautaSection`.
- Props que envuelven shadcn se pasan con spread (`...props`).

### Mapa de Componentes

| Capa | Componentes | Documentación |
|------|------------|---------------|
| **Base** | AmautaButton, AmautaCard, AmautaBadge, AmautaProgress, AmautaInput, AmautaDialog, Character | `01-base-layer.md` |
| **Layout** | AmautaContainer, AmautaSection, AmautaGrid, AmautaDivider | `02-layout-layer.md` |
| **Brand** | AmautaHero, CondorGuide, Character, AmautaLearningPath, AmautaStatCard, AmautaAchievement | `03-brand-layer.md` |
| **Patterns** | HeroWithCondor, EducationalSection, CTAEducational, FeatureGrid, HowItWorks, NavigationMenu, StudentProgressPanel, ParentMetricsGrid | `04-patterns.md` |
| **Story** | AmautaTransition, AmautaLoadingState, AmautaEmptyState, AmautaErrorState, AmautaReveal | `05-story-layer.md` |

### Token System (Variables CSS)

| Variable | Propósito |
|----------|-----------|
| `--amauta-blue` / `--amauta-blue-dark` / `--amauta-blue-light` | Color primario (azul) con tonos. |
| `--amauta-orange` / `--amauta-orange-dark` / `--amauta-orange-light` | Color accent (naranja). |
| `--amauta-surface-alt` | Fondo alternativo para secciones. |
| `--amauta-purple-500` / `--amauta-purple-600` | Púrpura de Figma (#8b5cf6 / #7c3aed). |
| `--amauta-yellow-100` / `--amauta-yellow-600` | Amarillos de Figma (#fef9c3 / #ca8a04). |
| `--amauta-warm-white` | Blanco cálido para fondos accent. |

### Utilidades Globales (`src/index.css`)

- `.noise-overlay` — textura de ruido.
- `.gradient-mesh` — gradientes radiales de fondo.
- `.glass-card` — efecto vidrio con blur.
- `.hover-lift`, `.hover-glow` — micro-interacciones de hover.
- `.text-gradient` — texto con gradiente azul→naranja.
- Accesibilidad: `min-h-[44px] min-w-[44px]` en elementos interactivos.
- Clases de color semántico: `.bg-success-50`, `.text-warning`, `.border-success`, etc.

### Variantes destacadas

| Componente | Variantes |
|------------|-----------|
| **AmautaButton** | `default`, `accent` (CTAs), `accent-ghost` (secundarias), `success`; tamaños incluido `child-lg`. |
| **AmautaCard** | `default`, `glass`, `elevated`, `bordered`, `interactive`. |
| **AmautaBadge** | `default`, `success`, `warning`, `xp`, `streak`, `achievement`; tamaños sm/md/lg. |
| **AmautaProgress** | `lesson`, `xp`, `level`, `default`, `topic`; `colorByValue` cambia color según valor. |
| **AmautaStatCard** | Colores `primary`, `accent`, `success`, `warning`, `info` + tendencia up/down/neutral. |
| **AmautaAchievement** | Estados locked/unlocked, tamaños sm/md/lg, animación sparkle. |
| **AmautaLearningPath** | Pasos `completed`/`current`/`locked`, orientación vertical u horizontal. |
| **CondorGuide** | Mascota con burbuja de diálogo opcional; posiciones left/center/right. |

---

## 6. Stack Tecnológico

| Capa | Tecnología | Propósito |
|------|-----------|-----------|
| **UI** | React 19 + TypeScript + Tailwind CSS 4 | Interfaz de usuario |
| **Estado runtime** | Zustand | Sesión, preferencias, modo offline |
| **Server state** | TanStack Query | Caché de datos del servidor |
| **Persistencia local** | Dexie (IndexedDB) | Tokens, usuarios, cola de mutaciones |
| **Caché PWA** | Workbox (Service Worker) | App shell, imágenes, API GET, navegación |
| **Sincronización offline** | App-level outbox (Dexie + queue-manager) | Cola de mutaciones con prioridad |
| **Ruteo** | React Router 7 | Navegación SPA con guards por rol |
| **Formularios** | React Hook Form + Zod | Validación de formularios |
| **i18n** | i18next + react-i18next | Internacionalización (plan en curso) |
| **Build tool** | Vite 7 | Build y dev server |
| **Testing** | Vitest 4 (instalado, sin configurar) | Test runner |

## 7. Arquitectura Resumida

```
UI (React) → Zustand (estado) → TanStack Query (cache) → Dexie/IndexedDB (persistencia)
                                  │
                    Service Worker (Workbox) — caché PWA
                    background-sync — sincronización offline
```

- **Feature-based DDD**: `src/features/[domain]/` con subcarpetas `application/`, `components/`, `domain/`, `hooks/`, `infrastructure/`, `pages/`, `store/`, `utils/`.
- **Sistema de cola offline**: `useSafeMutation` encola mutaciones en Dexie cuando no hay red y las sincroniza por prioridad al reconectar (estrategia last-write-wins, máx. 50 mutaciones, retry con backoff exponencial 1s/2s/4s).
- **Service Worker**: caching de app shell, navegación SPA, imágenes, API GET y recursos estáticos. No maneja la cola offline.

---

## Referencias

| Tema | Documento |
|------|-----------|
| **Visión general** | `src/docs/vision/VISION_GENERAL.md` |
| **Índice de docs** | `src/docs/README.md` |
| **Design System** | `src/docs/diseno/README.md` |
| **Arquitectura** | `src/docs/fundamentos/ARCHITECTURE_LAYERS.md` |
| **Cola offline** | `src/docs/sin-conexion/OFFLINE_QUEUE_SYSTEM.md` |
| **Service Worker** | `src/docs/sin-conexion/SERVICE_WORKER.md` |
| **Auth** | `src/docs/nucleo/AUTH_FLOW.md` |
| **Errores** | `src/docs/errores/ERROR_HANDLING.md` |
