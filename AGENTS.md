# AGENTS.md - Guía para Agentes de Código

## Descripción del Proyecto

**Amauta** es una Progressive Web App (PWA) educativa interactiva para niños y familias, construida con React 19 + TypeScript + Vite.

### Stack Tecnológico

| Tecnología | Propósito |
|------------|-----------|
| React 19 | Framework UI |
| Vite 7 | Bundler y dev server |
| TypeScript 5.9 | Tipado estático |
| Tailwind CSS 4.2 | Estilos utility-first |
| shadcn/ui | Componentes UI |
| Zustand | Gestión de estado |
| React Router 7 | Enrutamiento |
| React Hook Form + Zod | Formularios y validación |
| Dexie (IndexedDB) | Base de datos local |
| Workbox | Service Worker PWA |
| Vitest | Testing |

---

## Comandos de Build, Lint y Test

### Desarrollo

```bash
pnpm dev          # Iniciar servidor de desarrollo
pnpm preview      # Vista previa del build de producción
```

### Build y Lint

```bash
pnpm build        # Verificación TypeScript + build Vite
pnpm lint         # Ejecutar ESLint
```

### Testing

```bash
# Configuración pendiente - vitest está instalado pero sin configurar
# Para habilitar testing:
# 1. Crear vitest.config.ts
# 2. Agregar scripts a package.json:
#    "test": "vitest run"
#    "test:watch": "vitest"
#    "test:ui": "vitest --ui"
```

### Ejecutar un Test Individual

```bash
# Una vez configurado vitest:
pnpm test -- path/to/test.test.ts
pnpm test -- -t "nombre del test"
```

---

## Guía de Estilo de Código

### TypeScript

- **Modo estricto activado**: `strict: true` en tsconfig
- **`verbatimModuleSyntax`**: Obliga a usar `import type` para importaciones de solo tipos
- **Sin código muerto**: `noUnusedLocals` y `noUnusedParameters` están activados
- **Alias de rutas**: Usar `@/` para imports desde `src/`

### Importaciones

```typescript
// ✅ CORRECTO: Importaciones de solo tipos con `import type`
import type { AuthCredentials } from "../domain/auth.types";
import type { RouteObject } from "react-router-dom";

// ✅ CORRECTO: Importaciones regulares
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuthStore } from "../store/auth.store";

// ❌ INCORRECTO: Importar tipos sin `import type`
import { AuthCredentials } from "../domain/auth.types";
```

**Orden de importaciones**:
1. Librerías externas
2. Componentes UI (`@/components/ui`)
3. Utilidades (`@/lib`)
4. Módulos del proyecto
5. Tipos (`import type`)

### Componentes

```typescript
// ✅ CORRECTO: Export nombrado + declaración de función
export function LoginPage() {
  return <div>Login</div>;
}

// ✅ CORRECTO: Props definidas inline cerca del componente
interface StudentDashboardProps {
  userName?: string;
  userAvatar?: string;
}

export function StudentDashboardPage({
  userName = "Mario",
  userAvatar,
}: StudentDashboardProps) {
  return <div>{userName}</div>;
}

// ❌ INCORRECTO: Export default
export default function LoginPage() { ... }

// ❌ INCORRECTO: Arrow function para componentes
const LoginPage = () => { ... };
```

### Nomenclatura

| Elemento | Convención | Ejemplo |
|----------|------------|---------|
| Archivos de componentes | kebab-case | `student-dashboard.tsx` |
| Componentes React | PascalCase | `StudentDashboard` |
| Hooks personalizados | camelCase con prefijo `use` | `useAuth`, `useLogin` |
| Funciones/utilidades | camelCase | `formatDate`, `parseUser` |
| Tipos/Interfaces | PascalCase | `AuthState`, `UserData` |
| Constantes | UPPER_SNAKE_CASE | `MAX_RETRIES`, `API_URL` |
| Stores Zustand | camelCase con prefijo `use...Store` | `useAuthStore` |
| Archivos de test | `*.test.ts` o `*.test.tsx` | `login.test.tsx` |

### Gestión de Estado (Zustand)

```typescript
// ✅ CORRECTO: Store con persistencia y selectors individuales
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      setAuthenticated: (value) => set({ isAuthenticated: value }),
      setUser: (user) => set({ user }),
    }),
    {
      name: "amauta-auth",
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);

// ✅ CORRECTO: Uso con selectors individuales
const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
const user = useAuthStore((state) => state.user);

// ❌ INCORRECTO: Selector que retorna objeto completo
const { isAuthenticated, user } = useAuthStore((state) => state);
```

### Formularios (React Hook Form + Zod)

```typescript
// ✅ CORRECTO: Schema Zod + useForm con zodResolver
export const loginSchema = z.object({
  email: z.string().email("Ingresa un correo válido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register("email")} />
      {errors.email && <span>{errors.email.message}</span>}
    </form>
  );
}
```

### Estilos (Tailwind + shadcn/ui)

```typescript
// ✅ CORRECTO: Usar cn() para clases condicionales
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-card text-card-foreground shadow-sm",
        className
      )}
      {...props}
    />
  );
}

// ✅ CORRECTO: Responsive mobile-first
<div className="px-4 py-6 sm:px-6 lg:px-8">
```

### Manejo de Errores

```typescript
// ✅ CORRECTO: Try-catch en operaciones async
async function fetchUser(id: string): Promise<User | null> {
  try {
    const user = await userRepo.findById(id);
    return user;
  } catch (error) {
    console.error("Error fetching user:", error);
    return null;
  }
}

// ✅ CORRECTO: Validación con Zod antes de procesar
const result = loginSchema.safeParse(data);
if (!result.success) {
  return { errors: result.error.flatten().fieldErrors };
}
```

---

## Arquitectura del Proyecto

### Estructura de Directorios

```
src/
├── App.tsx                    # Componente raíz
├── main.tsx                   # Punto de entrada
├── index.css                  # Estilos globales + Tailwind
├── sw.ts                      # Service Worker (Workbox)
├── components/                # Componentes compartidos
│   ├── ui/                    # Primitivos shadcn/ui
│   ├── cards/                 # Cards específicas
│   └── pwa/                   # Componentes PWA
├── features/                  # Módulos por dominio (DDD-lite)
│   └── [feature]/
│       ├── application/       # Casos de uso
│       ├── components/        # Componentes del feature
│       ├── domain/            # Tipos, interfaces, repositorios
│       ├── hooks/             # Custom hooks
│       ├── infrastructure/    # Implementaciones (API, mocks)
│       ├── pages/             # Páginas
│       ├── store/             # Stores Zustand
│       └── utils/             # Helpers específicos
├── hooks/                     # Hooks globales
├── layout/                    # Layouts con Outlet
├── lib/                       # Utilidades (cn, etc.)
├── routes/                    # Configuración React Router
│   └── guards/                # Guards (RequireAuth, RequireRole)
├── shared/                    # Servicios compartidos
└── types/                     # Tipos globales
```

### Patrones Arquitectónicos

1. **Arquitectura por Features**: Organización por dominios de negocio
2. **Patrón Repositorio**: Interfaces abstractas con implementaciones concretas
3. **Patrón Caso de Uso**: Lógica de negocio encapsulada
4. **Guards de Ruta**: Autenticación y autorización a nivel de ruta
5. **Mock-First**: Desarrollo offline-first para PWA

### Rutas

```typescript
// ✅ Estructura de rutas con objetos RouteObject
const protectedRoutes: RouteObject[] = [
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AmautaLayout />,
        children: [
          { path: "/dashboard", element: <DashboardPage /> },
        ],
      },
    ],
  },
];
```

---

## Convenciones de Testing (Por Implementar)

```typescript
// ✅ Estructura esperada para tests
// src/features/auth/__tests__/login.test.tsx

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import { LoginForm } from "../components/login-form";

describe("LoginForm", () => {
  it("debe mostrar error con email inválido", async () => {
    render(<LoginForm />);
    // ... test implementation
  });
});
```

---

## Notas Importantes

- **No usar emojis** en código fuente a menos que se solicite explícitamente
- **No agregar comentarios** innecesarios; el código debe ser autoexplicativo
- **Usar `import type`** siempre para importaciones de solo tipos
- **Named exports** siempre; evitar default exports
- **Funciones declarativas** para componentes; arrow functions para utilidades
- **Mobile-first** en diseño responsive
- **Persistencia local** con Zustand + IndexedDB (Dexie) para funcionalidad offline
