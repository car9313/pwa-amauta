# Sistema de Autenticación - Amauta

## Visión General

El sistema de autenticación de Amauta es una PWA educativa que permite a estudiantes, padres y profesores acceder a contenido educativo. Implementa un patrón Adapter con soporte para mocks durante desarrollo y API real en producción.

## Tecnologías Utilizadas

| Tecnología | Propósito |
|------------|-----------|
| **React 19** | Framework UI con hooks |
| **React Query (TanStack Query)** | Gestión de estado async y cache |
| **Zustand** | Estado global con persistencia |
| **Zod** | Validación de esquemas |
| **React Router 7** | Navegación |
| **localStorage** | Persistencia del token JWT |

## Arquitectura

```
src/features/auth/
├── domain/
│   └── types.ts                 # Tipos y esquemas Zod
├── infrastructure/
│   ├── mappers/
│   │   └── adapter.ts          # AuthAdapter (mock/real)
│   └── services/
│       └── auth.service.ts     # Funciones de autenticación
├── hooks/
│   └── useAuth.ts              # Hooks useLogin, useRegister, etc.
└── presentation/
    ├── store/
    │   └── auth-store.ts       # Estado global Zustand
    └── routing/
        └── auth-navigation.ts  # Redirecciones

src/lib/
├── auth/
│   └── http-client.ts          # Cliente HTTP con contexto de estudiante
└── query/
    └── keys.ts                 # Query keys centralizadas
```

## Patrón Adapter

El sistema implementa el patrón Adapter para abstraer la fuente de datos:

```
┌─────────────────────────────────────────────────────────┐
│                      useAuth.ts                         │
│                  (React Query hooks)                     │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│                   auth.service.ts                       │
│            (login, register, logout, etc.)               │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│                    adapter.ts                           │
│              AuthAdapter Interface                       │
└──────────────┬──────────────────────┬───────────────────┘
              │                      │
              ▼                      ▼
    ┌─────────────────┐    ┌─────────────────┐
    │   mockAdapter   │    │   realAdapter   │
    │   (desarrollo)  │    │   (producción)  │
    └─────────────────┘    └─────────────────┘
```

### Toggle Mock/Real

```typescript
const USE_MOCKS = import.meta.env.VITE_USE_MOCK === "true";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

export function createAuthAdapter(): AuthAdapter {
  if (USE_MOCKS || !API_BASE_URL) {
    console.debug("[AuthAdapter] Using mock adapter");
    return mockAdapter;
  }
  console.debug("[AuthAdapter] Using real adapter");
  return realAdapter;
}

export const authAdapter = createAuthAdapter();
```

### Variables de Entorno

| Variable | Descripción | Valor por defecto |
|----------|-------------|-------------------|
| `VITE_USE_MOCK` | Forzar uso de mocks | `"true"` |
| `VITE_API_BASE_URL` | URL del backend | `""` (vacío = mocks) |
| `VITE_API_VERSION` | Versión de API | `"v1"` |
| `VITE_AUTH_TOKEN_KEY` | Clave localStorage | `"amauta_token"` |
| `VITE_QUERY_STALE_TIME` | Tiempo cache queries (seg) | `60"` |

## Modelo de Identidad

### Principio: Un identificador por rol

Cada rol tiene su propio identificador canónico:

| Rol | Identificador | Ejemplo |
|-----|--------------|---------|
| Student | `studentId` | `"stu_001"` |
| Parent | `parentId` | `"par_001"` |
| Teacher | `teacherId` | `"tea_001"` |

**No existe `id` genérico**. El identificador es específico del rol.

## Tipos Principales

### LoginCredentials

```typescript
const loginCredentialsSchema = z.object({
  email: z.string().email("Ingresa un correo válido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

type LoginCredentials = z.infer<typeof loginCredentialsSchema>;
```

### RegisterInput

```typescript
const registerFormSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  email: z.string().email("Ingresa un correo válido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
  confirmPassword: z.string().min(6, "Confirma tu contraseña"),
  role: z.enum(["parent"]),  // Solo parent (student no se registra solo)
});

type RegisterFormValues = z.infer<typeof registerFormSchema>;
```

### AuthUser (Discriminated Union)

```typescript
// Student - único identificador: studentId
{
  name: string;
  email: string;
  role: "student";
  studentId: string;        // ← Identificador canónico
  tenantId: string;
}

// Parent - único identificador: parentId
{
  name: string;
  email: string;
  role: "parent";
  parentId: string;        // ← Identificador canónico
  tenantId: string;
  children: Child[];        // Hijos referenciados por studentId
}

// Teacher - único identificador: teacherId
{
  name: string;
  email: string;
  role: "teacher";
  teacherId: string;       // ← Identificador canónico
  classIds: string[];
  tenantId: string;
}

// Type inferido de discriminated union
type AuthUser = z.infer<typeof authUserSchema>;
```

### Child (dentro de Parent)

```typescript
{
  studentId: string;       // ← Identificador del estudiante
  name: string;
  avatar?: string;
  level: number;
  points: number;
  precision: number;
  streakDays: number;
}
```

### AuthResponse

```typescript
const authResponseSchema = z.object({
  user: authUserSchema,
  token: z.string(),
  tenantId: z.string().optional(),
});

type AuthResponse = z.infer<typeof authResponseSchema>;
```

## Flujo de Autenticación

### 1. Login

```
┌──────────────┐     ┌──────────────┐     ┌─────────────────────────────────────┐
│ LoginForm    │ ──▶│ useLogin()   │ ──▶ │          authAdapter.login()        │
│              │     │ (useMutation)│     │     (elige mock o real)             │
└──────────────┘     └──────────────┘     └──────────────────┬──────────────────┘
                                                              ▼
                     ┌──────────────────────────────────────────────────────────────────────────────────┐
                     ▼                                                                                  ▼
          ┌─────────────────────┐                                                        ┌─────────────────────┐
          │    mockAdapter      │                                                        │     realAdapter     │
          │                     │                                                        │                     │
          │ MOCK_USERS[email]   │                                                        │fetchApi("/auth/...")│
          │ + delay(800ms)      │                                                        │ + JWT en headers    │
          │ = datos hardcodeados│                                                        │ = petición HTTP real│
          └─────────────────────┘                                                        └─────────────────────┘
                     │                                                                                   │
                     └─────────────────────────────────────┬─────────────────────────────────────────────────┘
                                                           ▼
                               ┌───────────────────────────────────────────────────────────────────────────┐
                               │                         AuthResponse                                      │
                               │  { user: AuthUser, token: string, tenantId: string | undefined }          │
                               └───────────────────────────────────────────────────────────────────────────┘
                                                         │
                                                         ▼
                               ┌───────────────────────────────────────────────────────────────────────────┐
                               │                           useAuthStore                                    │
                               │  setAuthenticated(true)                                                   │
                               │  setUser(response.user)                                                   │
                               └───────────────────────────────────────────────────────────────────────────┘
                                                         │
                                                         ▼
                               ┌───────────────────────────────────────────────────────────────────────────┐
                               │                      redirectToDashboard(role)                            │
                               │  /dashboard/student  |  /dashboard/parent  |  /dashboard/teacher          │
                               └───────────────────────────────────────────────────────────────────────────┘
```

### mockAdapter vs realAdapter

| Característica | mockAdapter | realAdapter |
|----------------|-------------|-------------|
| **Fuente de datos** | `MOCK_USERS` (objeto en memoria) | API HTTP real |
| **Latencia** | `delay(800ms)` simulada | Red real |
| **Token** | Generado localmente con identifier del rol | Del servidor |
| **Uso** | Desarrollo, testing | Producción |

### 2. Registro

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ RegisterForm │────▶│ useRegister()│────▶│ authAdapter  │
│              │     │ (useMutation)│     │ .register()  │
└──────────────┘     └──────────────┘     └──────────────┘
```

**Nota**: Solo `parent` puede registrarse. El estudiante es registrado por su padre.

## Store de Autenticación

### Estado Persistido

```typescript
interface AuthState {
  // Persistido en localStorage
  isAuthenticated: boolean;
  user: AuthUser | null;
  selectedStudentId: string | null;  // Solo para parent
  hasHydrated: boolean;

  // Acciones
  setAuthenticated: (value: boolean) => void;
  setUser: (user: AuthUser | null) => void;
  clearSession: () => void;
  setHydrated: (value: boolean) => void;
  selectStudent: (studentId: string) => boolean;
  clearSelectedStudent: () => void;
}
```

### Selectors

```typescript
// Acceso directo al usuario
export const selectUser = (state: AuthState) => state.user;
export const selectIsAuthenticated = (state: AuthState) => state.isAuthenticated;

// Identificador activo (deriva studentId según el rol)
export const selectStudentId = (state: AuthState): string | null => {
  // Student → usa su propio studentId
  if (state.user?.role === "student") {
    return state.user.studentId;
  }
  // Parent → usa el estudiante seleccionado
  if (state.user?.role === "parent" && state.selectedStudentId) {
    const childIds = state.user.children.map((c) => c.studentId);
    if (childIds.includes(state.selectedStudentId)) {
      return state.selectedStudentId;
    }
  }
  return null;
};

// Flags de rol
export const selectIsParent = (state: AuthState) => state.user?.role === "parent";
export const selectIsStudent = (state: AuthState) => state.user?.role === "student";
export const selectIsTeacher = (state: AuthState) => state.user?.role === "teacher";
export const selectUserRole = (state: AuthState) => state.user?.role ?? null;
export const selectTenantId = (state: AuthState) => state.user?.tenantId ?? null;
export const selectChildren = (state: AuthState) =>
  state.user?.role === "parent" ? state.user.children : [];
```

### Lo que NO está en el store

| Campo | Razón |
|-------|-------|
| `role` | Derivado de `user.role` |
| `tenantId` | Derivado de `user.tenantId` |
| `selectedRole` | Eliminado (legacy, no se usaba) |

## Hooks

### useLogin()

```typescript
export function useLogin() {
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated);
  const setUser = useAuthStore((state) => state.setUser);

  const mutation = useMutation({
    mutationFn: (credentials: LoginFormValues) => login(credentials),
    onSuccess: (result) => {
      setAuthenticated(true);
      setUser(result.user);
      // Redirige según el rol del usuario
    },
  });

  return {
    login: mutation.mutate,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
}
```

### useParentDashboard()

```typescript
export function useParentDashboard() {
  const user = useAuthStore((state) => state.user);
  const parentId = user?.role === "parent" ? user.parentId : null;

  return useQuery<ParentDashboard, Error>({
    queryKey: authKeys.parentDashboard(parentId ?? "", user?.tenantId ?? null),
    queryFn: () => getParentDashboard(parentId ?? ""),
    enabled: !!parentId && !!user?.tenantId,
  });
}
```

### useStudentProgress(studentId?)

```typescript
export function useStudentProgress(studentId?: string) {
  const user = useAuthStore((state) => state.user);
  const selectedStudentId = useAuthStore((state) => state.selectedStudentId);

  // Si no se pasa studentId, usa el seleccionado del store
  const targetStudentId = studentId ?? selectedStudentId;

  return useQuery<StudentProgress, Error>({
    queryKey: authKeys.studentProgress(targetStudentId ?? "", user?.tenantId ?? null),
    queryFn: () => getStudentProgress(targetStudentId ?? ""),
    enabled: !!targetStudentId && !!user?.tenantId,
  });
}
```

## Mocks de Desarrollo

### Usuarios Mock

| Email | Password | Rol | Identificador |
|-------|----------|-----|---------------|
| `student@amauta.com` | `123456` | Student | `stu_001` |
| `parent@amauta.com` | `123456` | Parent | `par_001` (con 2 hijos) |
| `teacher@amauta.com` | `123456` | Teacher | `tea_001` |

### Datos Mock

**Parent Dashboard:**
- 2 hijos: Mario (nivel 2, 156 puntos) y Lucía (nivel 3, 234 puntos)
- Actividades recientes simuladas

**Student Progress:**
- Progreso general: 72%
- Materias: Matemáticas (75%), Español (85%), Ciencias (60%)

## Reglas de Negocio

### El estudiante no se registra solo

```typescript
// register-form.types.ts
export const registerFormSchema = z.object({
  // ...
  role: z.enum(["parent"]),  // Solo parent puede registrarse
});
```

### Identificador activo para operaciones

El `studentId` activo se resuelve así:

```
┌─────────────────────────────────────────────────────────────┐
│                    selectStudentId                           │
├─────────────────────────────────────────────────────────────┤
│  Si role === "student"                                     │
│    → return user.studentId                                 │
│                                                             │
│  Si role === "parent"                                      │
│    → Si selectedStudentId válido                            │
│        return selectedStudentId                             │
│    → Si no, return user.children[0].studentId (fallback)   │
│                                                             │
│  Si role === "teacher"                                     │
│    → return null (pendiente)                               │
└─────────────────────────────────────────────────────────────┘
```

### Parent selecciona hijo activo

```typescript
// El parent selecciona cuál hijo está "activo"
const handleSelectChild = (studentId: string) => {
  useAuthStore.getState().selectStudent(studentId);
};

// Luego usa el studentId activo para queries
const { data: progress } = useStudentProgress();
```

## Query Keys Centralizadas

```typescript
// src/lib/query/keys.ts
export const authKeys = {
  all: ["auth"] as const,
  parentDashboard: (parentId, tenantId) => [...],
  studentProgress: (studentId, tenantId) => [...],
};

export const exerciseKeys = {
  all: ["exercises"] as const,
  next: (studentId, tenantId) => [...],
};

export const studentKeys = {
  all: ["student"] as const,
  dashboard: (studentId) => [...],
};
```

## Redirección por Rol

```
/login ──────┬──────▶ /roles ──────▶ /dashboard/{role}
             │
             └──────▶ /dashboard/{role} (si ya tiene rol)
```

- `/dashboard/student` - Vista de estudiante
- `/dashboard/parent` - Vista de padre (con selector de hijos)
- `/dashboard/teacher` - Vista de profesor (pendiente)

## HTTP Client con Contexto de Estudiante

El `http-client.ts` inyecta automáticamente el `studentId` en las peticiones:

```typescript
// src/lib/auth/http-client.ts
const ENDPOINTS_REQUIRING_STUDENT_ID = [
  "/next-exercise",
  "/submit-answer",
  "/progress",
  "/students/",
];

// En cada petición
if (needsStudentId(endpoint)) {
  const studentId = useAuthStore.getState().user?.studentId 
    ?? useAuthStore.getState().selectedStudentId;
  headers["X-Student-Context"] = studentId;
}
```
