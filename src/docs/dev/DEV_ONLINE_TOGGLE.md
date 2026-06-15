# DevOnlineToggle

## Propósito

Componente de desarrollo que permite **forzar el estado online/offline** de la aplicación sin depender del navegador ni del Service Worker.

Esto permite probar toda la lógica offline de la app (banners de error, botón deshabilitado, outbox queue, mensajes amigables) durante el desarrollo, incluso cuando el backend no está implementado o no hay conexión a internet.

## Cómo funciona

```
                    ┌──────────────────────┐
                    │  DevOnlineToggle      │
                    │  (esquina inf-izq)    │
                    └──────────┬───────────┘
                               │ click → cicla
                               ▼
                    ┌──────────────────────┐
                    │  localStorage.setItem │
                    │  ("__dev_online",     │
                    │   "true"|"false"|"")  │
                    └──────────┬───────────┘
                               │
                    ┌──────────▼───────────┐
                    │  window.dispatchEvent │
                    │  ("__dev-online-change")│
                    └──────────┬───────────┘
                               │
                    ┌──────────▼───────────┐
                    │  useOnlineStatus      │
                    │  escucha el evento    │
                    │  y pisa isOnline      │
                    └──────────────────────┘
```

### Ciclo de estados

```
Auto ──► Offline ──► Online ──► Auto
  │         │           │          │
  │         ▼           ▼          ▼
  │    isOnline=false  isOnline=true   isOnline=navigator.onLine
  ▼
  isOnline=navigator.onLine (comportamiento real)
```

## Componente visual

```tsx
<DevOnlineToggle />  // Solo se renderiza si import.meta.env.DEV
```

Es un badge flotante en la **esquina inferior izquierda** que muestra:

| Estado | Color | Texto |
|--------|-------|-------|
| Auto | `bg-gray-500` | `● Auto` |
| Offline | `bg-red-500` | `● Offline (dev)` |
| Online | `bg-green-500` | `● Online (dev)` |

Al hacer clic, cicla al siguiente estado.

## Archivos involucrados

| Archivo | Cambio |
|---------|--------|
| `src/components/dev/DevOnlineToggle.tsx` | **Nuevo** — componente del toggle |
| `src/features/auth/hooks/useOnlineStatus.ts` | **Modificado** — se agregan ~10 líneas al final para leer el override |
| `src/App.tsx` | **Modificado** — se agrega `<DevOnlineToggle />` al final del árbol |

## Cómo quitarlo después

Cuando ya no sea necesario (porque el backend está listo o porque se pasa a producción), seguir estos pasos:

### 1. Eliminar el componente

```bash
rm src/components/dev/DevOnlineToggle.tsx
```

### 2. Revertir `useOnlineStatus.ts`

Eliminar el bloque de código que comienza con:

```typescript
// ─── Dev override (solo en desarrollo) ───
```

Hasta:

```typescript
// ─── Fin dev override ───
```

### 3. Revertir `App.tsx`

Eliminar la línea:

```typescript
import { DevOnlineToggle } from "@/components/dev/DevOnlineToggle";
```

y el uso:

```typescript
{import.meta.env.DEV && <DevOnlineToggle />}
```

### 4. Limpiar localStorage (opcional)

Si algún desarrollador tiene valores guardados:

```typescript
localStorage.removeItem("__dev_online");
```

### Resumen de líneas a eliminar

| Archivo | Líneas a eliminar |
|---------|------------------|
| `src/components/dev/DevOnlineToggle.tsx` | Archivo completo (~50 líneas) |
| `src/features/auth/hooks/useOnlineStatus.ts` | ~15 líneas (bloque comentado) |
| `src/App.tsx` | 2 líneas (import + JSX) |
