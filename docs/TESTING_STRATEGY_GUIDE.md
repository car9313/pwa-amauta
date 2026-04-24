# Guía de Estrategia de Testing - PWA Amauta

> Esta guía define la estrategia de testing para la aplicación.
> **Estado actual:** Vitest instalado pero NO configurado.

---

## Tabla de Contenidos

1. [Estado Actual](#estado-actual)
2. [Stack de Testing](#stack-de-testing)
3. [Configuración Necesaria](#configuración-necesaria)
4. [Estructura de Tests](#estructura-de-tests)
5. [Tipos de Tests](#tipos-de-tests)
6. [Estrategia por Capa](#estrategia-por-capa)
7. [Mocks](#mocks)
8. [Run Commands](#run-commands)
9. [ Próximos Pasos](#-próximos-pasos)

---

## Estado Actual

```bash
# vitest está instalado pero SIN configuración
pnpm build        # ✅ Funciona
pnpm lint         # ✅ Funciona
pnpm test        # ❌ NO configurado
```

El package.json tiene vitest como dependencia, pero falta:
- ❌ vitest.config.ts
- ❌ Scripts de test en package.json
- ❌ Archivos de test

---

## Stack de Testing

### Dependencias Instaladas

| Paquete | Versión | Propósito |
|---------|---------|----------|
| vitest | ^4.x | Test runner |
| @testing-library/react | ^16.x | Testing componentes React |
| @testing-library/jest-dom | ^6.x | Jest DOM matchers |
| jsdom | latest | Simulación del DOM |

### Paquetes Pendientes de Instalar

```bash
# Para instalar cuando se configure testing:
pnpm add -D @testing-library/jest-dom jsdom
```

---

## Configuración Necesaria

### 1. Crear vitest.config.ts

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['node_modules', 'dist'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.{js,ts,mjs,cjs}',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### 2. Crear setup.ts

```typescript
// src/test/setup.ts
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  vi.clearAllMocks();
});
```

### 3. Agregar scripts en package.json

```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui"
  }
}
```

---

## Estructura de Tests

### Organización por Feature

```
src/
├── features/
│   ├── auth/
│   │   ├── domain/
│   │   │   └── auth.types.ts
│   │   ├── infrastructure/
│   │   │   └── services/
│   │   │       └── auth.service.ts
│   │   └── presentation/
│   │       ├── components/
│   │       │   ├── LoginForm.tsx
│   │       │   └── LoginForm.test.tsx    ← Test рядом с componente
│   │       ├── hooks/
│   │       │   ├── useAuth.ts
│   │       │   └── useAuth.test.ts    ← Test рядом con hook
│   │       └── pages/
│   │           └── login-page.tsx
│   ├── exercises/
│   │   └── ...
│   └── ...
├── lib/
│   ├── api/
│   │   ├── storage/
│   │   │   ├── db.ts
│   │   │   └── db.test.ts          ← Test de funciones DB
│   │   └── http/
│   │       └── client.ts
│   │           └── client.test.ts
│   ├── sync/
│   │   ├── useOfflineMutation.ts
│   │   └── useOfflineMutation.test.ts
│   └── utils/
│       ├── utils.ts
│       └── utils.test.ts
└── test/
    ├── setup.ts
    ├── mocks/
    │   ├── handlers.ts         ← MSW handlers
    │   ├── browser.ts        ← Mock de IndexedDB
    │   └── store.ts         ← Mock de Zustand
    └── factories/
        └── user.factory.ts
```

### Convenciones de Nombres

| Tipo | Archivo | Ejemplo |
|------|---------|---------|
| Test de componente | `{nombre}.test.tsx` | `LoginForm.test.tsx` |
| Test de hook | `{nombre}.test.ts` | `useAuth.test.ts` |
| Test de utilities | `{nombre}.test.ts` | `utils.test.ts` |
| Test de API | `{nombre}.test.ts` | `client.test.ts` |
| Factories | `{nombre}.factory.ts` | `user.factory.ts` |

---

## Tipos de Tests

### 1. Tests Unitarios

> Prueban funciones/funcionalidades de forma aislada.

```typescript
// src/lib/utils/utils.test.ts
import { describe, it, expect } from 'vitest';
import { difficultyToStars } from './utils';

describe('difficultyToStars', () => {
  it('returns 2 stars for LOW difficulty', () => {
    expect(difficultyToStars('LOW')).toBe(2);
  });

  it('returns 3 stars for MEDIUM difficulty', () => {
    expect(difficultyToStars('MEDIUM')).toBe(3);
  });

  it('returns 5 stars for HIGH difficulty', () => {
    expect(difficultyToStars('HIGH')).toBe(5);
  });
});
```

### 2. Tests de Componentes

> Prueban componentes React.

```typescript
// src/features/auth/presentation/components/LoginForm.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from './LoginForm';

describe('LoginForm', () => {
  it('renders email and password fields', () => {
    render(<LoginForm />);
    
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('shows error for invalid email', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);
    
    await user.type(screen.getByLabelText(/email/i), 'invalid');
    await user.type(screen.getByLabelText(/password/i), '123456');
    await user.click(screen.getByRole('button', { name: /ingresar/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/correo inválido/i)).toBeInTheDocument();
    });
  });
});
```

### 3. Tests de Hooks

> Prueban hooks personalizados.

```typescript
// src/features/auth/hooks/useAuth.test.ts
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAuth } from './useAuth';

describe('useAuth', () => {
  it('returns initial state', () => {
    const { result } = renderHook(() => useAuth());
    
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('updates state after login', async () => {
    const { result } = renderHook(() => useAuth());
    
    await act(async () => {
      await result.current.login('test@email.com', 'password123');
    });
    
    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
    });
  });
});
```

### 4. Tests de Integración

> Prueban múltiples componentes/jooks trabajando juntos.

```typescript
// src/features/exercises/hooks/useExercises.integration.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useExercises } from './useExercises';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useExercises integration', () => {
  it('fetches and returns exercises', async () => {
    const { result } = renderHook(() => useExercises(), {
      wrapper: createWrapper(),
    });
    
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    
    expect(result.current.data).toBeDefined();
  });
});
```

---

## Estrategia por Capa

### Capa de Presentación (UI)

**Qué probar:**
- Componentes rendering correcto
- Interacciones de usuario (clicks, forms)
- Estados de carga/error
- Validación de forms

**Cuándo NO probar:**
- lógica de negocio (mover a hooks o domain)
- Details de implementación

**Ejemplo:**

```typescript
// ✅ BUENO: Test de comportamiento
describe('LoginForm', () => {
  it('calls login on submit', async () => {
    const mockLogin = vi.fn();
    render(<LoginForm onLogin={mockLogin} />);
    
    await userEvent.type(screen.getByLabelText(/email/i), 'test@test.com');
    await userEvent.click(screen.getByRole('button', { name: /ingresar/i }));
    
    expect(mockLogin).toHaveBeenCalledWith('test@test.com', 'password123');
  });
});

// ❌ MALO: Test de implementación
describe('LoginForm', () => {
  it('renders input with correct className', () => {
    render(<LoginForm />);
    expect(screen.getByLabelText(/email/i)).toHaveClass('w-full h-12');
  });
});
```

### Capa de Hooks (Negocios)

**Qué probar:**
- Estado inicial
- Actualizaciones de estado
- Integración con servicios
- Efectos secundarios

**Ejemplo:**

```typescript
describe('useAuth', () => {
  it('loads user from storage on mount', async () => {
    localStorage.setItem('user', JSON.stringify({ name: 'Test' }));
    
    const { result } = renderHook(() => useAuth());
    
    await waitFor(() => {
      expect(result.current.user).toEqual({ name: 'Test' });
    });
  });
});
```

### Capa de Infraestructura

**Qué probar:**
- Funciones de API (HTTP)
- IndexedDB/Dexie operations
- Persistencia

**Ejemplo:**

```typescript
import { httpClient } from './client';

describe('httpClient', () => {
  it('includes auth header', async () => {
    const mockFetch = vi.fn(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({}),
    }));
    
    global.fetch = mockFetch;
    
    await httpClient('/test', { skipAuth: false });
    
    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer token',
        }),
      })
    );
  });
});
```

---

## Mocks

### 1. Mock de IndexedDB/Dexie

```typescript
// src/test/mocks/indexeddb.ts
import Dexie from 'dexie';

export function createMockDB() {
  const db = new Dexie('amauta-db-test');
  
  db.version(1).stores({
    tokens: 'id',
    users: 'id',
    exercises: 'id, type',
    lessons: 'id',
    progress: 'studentId, lessonId',
    students: 'id',
  });
  
  return db;
}

export const mockDB = createMockDB();
```

### 2. Mock de HTTP con MSW

```typescript
// src/test/mocks/handlers.ts
import { http, HttpResponse } from 'msw';
import { setupWorker } from 'msw/browser';

export const handlers = [
  http.get('/api/v1/exercises', () => {
    return HttpResponse.json({
      exercises: [
        { id: 'ex_001', type: 'VISUAL_ADDITION', difficulty: 'LOW' },
      ],
    });
  }),
  
  http.post('/api/v1/auth/login', () => {
    return HttpResponse.json({
      user: { name: 'Test', email: 'test@test.com', role: 'parent' },
      token: 'test-token',
    });
  }),
];

export const worker = setupWorker(...handlers);
```

### 3. Mock de Zustand

```typescript
// src/test/mocks/store.ts
import { create } from 'zustand';
import { vi } from 'vitest';

export const createMockStore = (initialState = {}) => {
  return create(() => initialState);
};

export const mockAuthStore = createMockStore({
  user: null,
  isAuthenticated: false,
  hasHydrated: true,
});
```

---

## Run Commands

### Commands Disponibles (una vez configurado)

```bash
# Ejecutar todos los tests
pnpm test

# Ejecutar tests una vez (no watch)
pnpm test:run

# Ejecutar con coverage
pnpm test:coverage

# Ejecutar con UI interactiva
pnpm test:ui

# Ejecutar test específico
pnpm test src/features/auth/hooks/useAuth.test.ts

# Ejecutar tests en modo watch para archivo específico
pnpm test src/features/auth/hooks/useAuth.test.ts --watch
```

### En package.json

```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui"
  }
}
```

---

## Próximos Pasos

### Fase 1: Configuración Inicial

- [ ] Crear `vitest.config.ts`
- [ ] Crear `src/test/setup.ts`
- [ ] Agregar scripts en `package.json`

### Fase 2: Tests de Librería

- [ ] Instalar `@testing-library/jest-dom`
- [ ] Configurar mocks básicos
- [ ] Crear factories

### Fase 3: Tests Core

- [ ] Tests de utils (`lib/utils`)
- [ ] Tests de hooks de autenticación
- [ ] Tests de componentes críticos

### Fase 4: Cobertura

- [ ] Objetivo: 70% cobertura
- [ ] Tests de integración
- [ ] Tests E2E (opcional con Playwright)

---

## Recursos

### Documentación Oficial

- [Vitest](https://vitest.dev/)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [MSW](https://mswjs.io/docs/)

### Patrones

```typescript
// Patrón: Test de componente con form
describe('ComponentName', () => {
  describe('when condition', () => {
    it('should do something', async () => {
      // test implementation
    });
  });
});

// Patrón: AAA (Arrange, Act, Assert)
it('should do something', () => {
  // Arrange
  const props = { ... };
  
  // Act
  const result = functionUnderTest(props);
  
  // Assert
  expect(result).toBe(expected);
});
```

---

## Notas

- **NO** usar `test.each` para casos simples (úsalo para parametrización)
- **SIEMPRE** limpiar mocks entre tests
- **NUNCA** hacer testing de implementación (clases CSS, etc.)
- **SÍ** hacer testing de comportamiento (lo que ve el usuario)
- Mantener tests cerca del código que prueban (colocation)