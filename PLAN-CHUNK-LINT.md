# Plan: Resolver Warnings de Build y Lint

## Resumen

| Problema | Prioridad | Tiempo estimado |
|----------|-----------|-----------------|
| Chunk size > 500KB | Alta | 30 min |
| `any` types | Media | 45 min |
| `setState` en effect | Baja | 20 min |
| Unused vars | Baja | 10 min |

---

## 1. Code Splitting para Reducir Bundle Size

### Problema
Bundle principal: `694.60 kB` (gzip: 194.79 kB)

### Solución
Implementar `manualChunks` en Vite config.

### Archivo a modificar
`vite.config.ts`

### Pasos

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Librerías de React
          'vendor-react': ['react', 'react-dom', 'react-dom/client'],
          
          // Routing
          'vendor-router': ['react-router-dom'],
          
          // Estado y fetching
          'vendor-query': ['@tanstack/react-query'],
          'vendor-zustand': ['zustand'],
          
          // UI components
          'vendor-ui': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-select'],
          
          // Formularios
          'vendor-forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
          
          // Utils
          'vendor-utils': ['clsx', 'tailwind-merge', 'lucide-react'],
        },
      },
    },
    // Reducir warning limit temporalmente si es necesario
    chunkSizeWarningLimit: 500,
  },
})
```

### Resultado esperado
- Múltiples chunks más pequeños
- Mejor caching del navegador
- Carga paralela de chunks

---

## 2. Eliminar `any` Types

### Archivos a revisar

| Archivo | Línea | Fix |
|---------|-------|-----|
| `src/components/DownloadLesson.tsx` | 17 | Crear tipo específico |
| `src/hooks/useExercise.ts` | 20 | Crear tipo específico |
| `src/hooks/useStudent.ts` | 20 | Crear tipo específico |
| `src/shared/services/syncService.ts` | 19, 55 | Usar `unknown` + type guard |
| `src/sw.ts` | 17, 42, 178 | Usar `unknown` + type guard |

### Ejemplo de Fix

```typescript
// Antes
const handleDownload = async (item: any) => { ... }

// Después
interface LessonItem {
  id: string;
  title: string;
  type: 'video' | 'pdf' | 'exercise';
}

const handleDownload = async (item: LessonItem) => { ... }
```

---

## 3. Corregir `setState` en Effect

### Archivos a revisar

| Archivo | Problema |
|---------|----------|
| `ConnectionStatus.tsx` | `setIsOnline(navigator.onLine)` |
| `register-page.tsx` | `setIsVisible(true)` |
| `student-dashboard-page.tsx` | `setIsVisible(true)` |
| `lesson-page.tsx` | `setIsVisible(true)` |
| `level-screen.tsx` | `setIsVisible(true)` |
| `parent-dashboard-page.tsx` | `setIsVisible(true)` |

### Solución: Usar `useState` con función inicial

```typescript
// Antes (warning)
const [isVisible, setIsVisible] = useState(false)

useEffect(() => {
  setIsVisible(true)  // Warning!
}, [])
```

```typescript
// Después (sin warning)
const [isVisible] = useState(() => true)
// O si necesita lógica de inicialización:
const [isVisible, setIsVisible] = useState(() => {
  // Solo se ejecuta en el primer render
  return checkCondition()
})
```

### Alternativa: CSS para animaciones de entrada

Si el objetivo es animaciones de fade-in,可以考虑 usar CSS:

```css
/* index.css */
.fade-in-on-mount {
  animation: fadeIn 0.5s ease-out forwards;
}
```

---

## 4. Eliminar Variables No Utilizadas

### Archivos a revisar

| Archivo | Variable |
|---------|---------|
| `auth.mock.ts` | `_password`, `_parentId`, `_studentId` |
| `exercise.mock.ts` | `_exerciseId`, `_answer`, `_studentId` |
| `serviceWorkerRegistration.ts` | `err` |
| `sw.ts` | `fetchErr` |

### Solución

```typescript
// Opción 1: Prefijo con _ (silencia el warning)
export function loginMock(email: string, _password: string) { }

// Opción 2: Usar la variable
export function loginMock(email: string, _password: string) {
  // Log para debug
  console.log('Password (ignored in mock):', _password)
  // ...
}
```

---

## 5. Otros Warnings Menores

### `button.tsx` - Export no componente

```typescript
// warning: Fast refresh only works when a file only exports components

// Mover constants a archivo separado
// constants/button-variants.ts
export const buttonVariants = { ... }

// button.tsx
export function Button() { ... }
```

### `ConnectionStatus.tsx` - Sincronizar estado con sistema externo

```typescript
// El efecto actual:
useEffect(() => {
  setIsOnline(navigator.onLine)  // Warning
  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)
}, [])

// Solución: No inicializar, solo subscribe
useEffect(() => {
  const handleOnline = () => setIsOnline(true)
  const handleOffline = () => setIsOnline(false)
  
  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)
  
  return () => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  }
}, [])
```

---

## Orden de Ejecución Sugerido

1. **Code Splitting** (mayor impacto en performance)
2. **Variables no usadas** (quick fix)
3. **Types `any`** (mejora type safety)
4. **`setState` en effect** (mejora React 19 compliance)
5. **Otros** (si hay tiempo)

---

## Verificación

Después de cada paso:

```bash
pnpm build    # Verificar chunk sizes
pnpm lint     # Verificar errores restantes
pnpm dev      # Probar funcionalidad
```

---

## Notas

- Los cambios son **no breaking** - no afectan funcionalidad
- Priorizar code splitting primero por impacto en UX
- Los warnings de lint pueden ignorarse暂时的mente si hay prisa
