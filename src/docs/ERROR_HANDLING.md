# Manejo de Errores - Arquitectura Amauta

## Visión General

Este documento describe el sistema de manejo de errores implementado en la Fase 7, los patrones usados, y recomendaciones futuras.

---

## Arquitectura de Errores (Fase 7)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    App                              │
│  ┌───────────────────────────────────────────┐  │
│  │     GlobalErrorBoundary                    │  │
│  │  - Captura errores no esperados            │  │
│  │  - Evita pantalla blanca               │  │
│  └───────────────────────────────────────────┘  │
│         │                    │                    │
│    ┌────▼────┐        ┌────▼────┐              │
│    │ Layout │        │ Routes │               │
│    │Error  │        │Error  │               │
│    │Boundary│        │Boundary│              │
│    └────────┘        └────────┘              │
└─────────────────────────────────────────────┘
```

---

## Componentes del Sistema

### 1. Error Boundaries

| Componente | Archivo | Propósito |
|-----------|--------|----------|
| `ErrorBoundary` | `src/components/error/ErrorBoundary.tsx` | Clase que captura errores en su subtree |
| `StudentFallback` | `src/components/error/FallbackUI.tsx` | Fallback amigable para niños |
| `ParentFallback` | `src/components/error/FallbackUI.tsx` | Fallback profesional para padres |
| `GenericFallback` | `src/components/error/FallbackUI.tsx` | Fallback genérico |

### 2. Sistema de Errores HTTP

| Componente | Archivo | Propósito |
|-----------|--------|----------|
| `HttpError` | `src/lib/http/client.ts` | Clase de error con código y status |
| `mapHttpErrorToAuthError()` | `src/features/auth/domain/auth-error.ts` | Mapea errores HTTP a códigos de auth |
| `AuthErrorCode` | `src/features/auth/domain/auth-error.ts` | Tipos de errores de auth |

### 3. Estado offlineMode

| Componente | Archivo | Propósito |
|-----------|--------|----------|
| `useOfflineMode` hook | `src/features/auth/hooks/useOfflineMode.ts` | Detecta modo offline |
| `auth-store` | `src/features/auth/presentation/store/auth-store.ts` | Estado con offlineMode |

### 4. Logging

| Componente | Archivo | Propósito |
|-----------|--------|----------|
| `logError()` | `src/components/error/errorLogger.ts` | Guarda errores en localStorage |
| `ConnectionStatus` | `src/components/pwa/ConnectionStatus.tsx` | Banner de estado offline |

---

## Códigos de Error

```typescript
// src/features/auth/domain/auth-error.ts
export type AuthErrorCode =
  | "TOKEN_EXPIRED"      // Token expiró
  | "TOKEN_INVALID"      // Token no válido
  | "TOKEN_REVOKED"     // Token fue revocado por seguridad
  | "REFRESH_FAILED"    // No se pudo refresh
  | "NETWORK_ERROR"   // Sin conexión
  | "SESSION_NOT_FOUND"; // No hay sesión
```

---

## Flujos de Errores

### Flujo 1: Refresh Fail + Hay Sesión Local

```
1. Token expira → 401
2. Intenta refresh → falla (offline/revocado)
3. auth-store.handleAuthFailure("REFRESH_FAILED")
   └── Si hay sesión local: → offlineMode = true
4. Usuario puede seguir usando la app (read-only)
5. Banner muestra: "Sin conexión - modo offline"
```

### Flujo 2: Refresh Fail + No Hay Sesión

```
1. Token expira → 401
2. Intenta refresh → falla
3. auth-store.handleAuthFailure("REFRESH_FAILED")
   └── Si NO hay sesión local: → clearSession()
4. Redirigir a /login
```

### Flujo 3: Token Revocado

```
1. Servidor retorna 403 o 401 específico
2. HttpClient detecta "TOKEN_REVOKED"
3. onUnauthorized callback → handleAuthFailure
4. clearSession() completo (sin offlineMode)
5. Redirigir a /login
6. Mostrar: "Sesión cerrada por seguridad"
```

### Flujo 4: Sin Conexión

```
1. navigator.onLine = false
2. HttpClient.request() detecta error de red
3. Lanza HttpError con isOffline = true
4. Si hay datos locales: offlineMode = true
5. ConnectionStatus muestra banner
```

---

## Edge Cases

### Outbox Overflow

```
// src/lib/api/storage/offline-queue.ts
const MAX_OUTBOX_SIZE = 50;

function trimOldestWhenNeeded() {
  const count = await db.mutations.count();
  if (count >= MAX_OUTBOX_SIZE) {
    // Elimina los 10 más antiguos
    const oldest = await db.mutations
      .orderBy("createdAt")
      .limit(count - MAX_OUTBOX_SIZE + 10)
      .toArray();
    await db.mutations.bulkDelete(oldest.map(m => m.id));
  }
}
```

---

## Uso en Componentes

### ErrorBoundary con Fallback Específico

```tsx
import { ErrorBoundary } from "@/components/error";

function MyComponent() {
  return (
    <ErrorBoundary fallbackType="student">
      <MyContent />
    </ErrorBoundary>
  );
}
```

### Manejar Errors en mutations

```tsx
import { useMutation } from "@tanstack/react-query";
import { getHttpErrorCode, isHttpError } from "@/lib/http/client";

const mutation = useMutation({
  mutationFn: doSomething,
  onError: (error) => {
    if (isHttpError(error)) {
      const code = getHttpErrorCode(error);
      console.log("Error code:", code);
    }
  },
});
```

### Usar offlineMode en UI

```tsx
import { useOfflineMode } from "@/features/auth/hooks/useOfflineMode";

function MyScreen() {
  const { isOnline, isOfflineMode, errorMessage } = useOfflineMode();

  if (isOfflineMode) {
    return <div>⚠️ {errorMessage}</div>;
  }

  return <Content />;
}
```

---

## Errores que NO captura ErrorBoundary

**Importante**: Error Boundaries solo capturan errores síncronos durante renderizado:

| Tipo de Error | Capturado? | Cómo Handling |
|--------------|------------|-------------|
| Errores en render | ✅ Sí | ErrorBoundary |
| Errores en useEffect | ⚠️ Solo si thrown | try-catch manual |
| Errores async/await | ❌ No | try-catch obligatorio |
| Errores en event handlers | ❌ No | try-catch obligatorio |
| Errores en setState | ❌ No | Validación antes |

**Ejemplo de error async捕获**:

```tsx
function MyComponent() {
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await api.getData();
      } catch (e) {
        setError(e); // Convierte a estado para que ErrorBoundary pueda capturar
      }
    }
    fetchData();
  }, []);

  if (error) {
    throw error; // Re-throw para ErrorBoundary
  }

  return <Content />;
}
```

---

## Recomendaciones Futuras

### 1. Integrar Sentry

```bash
pnpm add @sentry/react
```

```tsx
// src/components/error/errorLogger.ts (futuro)
import * as Sentry from "@sentry/react";

export function logError(error: Error, context?: ...) {
  Sentry.captureException(error, { extra: context });
}
```

### 2. More Error Boundaries

- Por feature: cada feature con su propio ErrorBoundary
- Por widget: widgets independientes
- Por API: límites específicos por endpoint

### 3. Retry Automático

```tsx
// Configuración en TanStack Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});
```

### 4. Error Analytics

```tsx
// Recolectar métricas de errores
function getErrorAnalytics() {
  const logs = getErrorLogs(); // de errorLogger
  const grouped = getErrorLogsGrouped();
  
  return {
    totalErrors: logs.length,
    groupedByMessage: grouped,
    // Enviar a analytics
  };
}
```

### 5. Fallback por Tema

```tsx
// Para modo oscuro
<ErrorBoundary 
  fallback={({ error, resetError }) => (
    <DarkModeFallback error={error} resetError={resetError} />
  )}
/>
```

---

## Referencias

| Recurso | Link |
|---------|------|
| React Error Boundaries | https://react.dev/docs/error-boundaries |
| TanStack Query Error Handling | https://tanstack.com/query/latest/docs/frameworks/react/guide/queries#error-and-retry |
| Sentry React | https://docs.sentry.io/platforms/javascript/guides/react/ |