# Amauta Frontend - Refactorización de Auth y Tipos

## Resumen Ejecutivo

Este documento describe la refactorización aplicada al sistema de autenticación, tipos Zod, y gestión de contexto activo del frontend de Amauta. El objetivo fue unificar la identidad, eliminar duplicación de estado, y centralizar las reglas de negocio.

---

## 1. Problemas Identificados

### 1.1 Identificador Duplicado (id + studentId/parentId/teacherId)

| Problema | Impacto |
|----------|---------|
| `id` genérico + identificador de rol | Confusión sobre cuál usar |
| `id` no aporta valor | Duplicación innecesaria |

**Decisión**: Eliminar `id`. Usar solo el identificador específico del rol.

### 1.2 childId vs studentId

| Problema | Impacto |
|----------|---------|
| `childId` usado en el dominio del parent | Inconsistencia con la API que usa `studentId` |

**Decisión**: Unificar a `studentId` como identidad canónica universal.

### 1.3 Estado Duplicado en el Store

| Campo | Derivable de |
|-------|-------------|
| `role` | `user.role` |
| `selectedRole` | Legacy, sin uso real |
| `tenantId` | `user.tenantId` |

**Decisión**: Eliminar campos derivables. El store solo guarda estado no derivable.

### 1.4 Helper ActiveContext Redundante

| Problema | Impacto |
|----------|---------|
| `ActiveContext` duplicaba información del store | Complejidad sin valor |
| `useActiveContext()` no se usaba en ningún componente | Código muerto |

**Decisión**: Eliminar `ActiveContext`. Usar selectors directos del store.

### 1.5 Registro Permitía student

```typescript
// ANTES: Permitía registro directo de estudiante
role: z.enum(["student", "parent", "teacher", "admin"])
```

**Decisión**: Restringir a solo `parent` (el estudiante no se registra solo).

---

## 2. Modelo de Datos Final

### 2.1 Un identificador por rol

| Rol | Identificador | Ejemplo |
|-----|--------------|---------|
| Student | `studentId` | `"stu_001"` |
| Parent | `parentId` | `"par_001"` |
| Teacher | `teacherId` | `"tea_001"` |

### 2.2 Modelo de Dominio

```
┌─────────────────────────────────────────────────────────────┐
│  Parent                                                       │
│  ├── parentId: string          ← único identificador        │
│  ├── name: string                                           │
│  ├── email: string                                           │
│  ├── tenantId: string                                        │
│  ├── children: [                                             │
│  │     { studentId: "stu_001", name: "Mario", ... },       │
│  │     { studentId: "stu_002", name: "Lucía", ... },       │
│  │   ]                                                       │
│  └── role: "parent"                                          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Student                                                      │
│  ├── studentId: string         ← único identificador        │
│  ├── name: string                                            │
│  ├── email: string                                            │
│  ├── tenantId: string                                        │
│  └── role: "student"                                         │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Teacher                                                      │
│  ├── teacherId: string         ← único identificador        │
│  ├── name: string                                            │
│  ├── email: string                                            │
│  ├── tenantId: string                                        │
│  ├── classIds: string[]                                       │
│  └── role: "teacher"                                         │
└─────────────────────────────────────────────────────────────┘
```

### 2.3 Reglas de Negocio Implementadas

| Regla | Implementación |
|-------|---------------|
| Student no se registra solo | `registerFormSchema` solo acepta `role: "parent"` |
| Parent tiene hijos referenciados por `studentId` | `children: [{ studentId: string }]` |
| Un identificador por rol | Sin `id` genérico |
| `selectedStudentId` es estado de UI | Persistido en localStorage |
| Identificador activo resuelto por selector | `selectStudentId()` en el store |

---

## 3. Arquitectura Resultante

### 3.1 Estructura de Archivos

```
src/
├── lib/
│   ├── auth/
│   │   └── http-client.ts        # Cliente HTTP con contexto
│   └── query/
│       └── keys.ts               # Query keys centralizadas
│
└── features/
    └── auth/
        ├── domain/
        │   ├── types.ts           # Schemas Zod (sin id redundante)
        │   ├── login-form.types.ts
        │   └── register-form.types.ts
        ├── infrastructure/
        │   ├── mappers/adapter.ts  # Mocks actualizados
        │   └── services/auth.service.ts
        ├── presentation/
        │   ├── store/
        │   │   └── auth-store.ts  # Store minimalista
        │   └── routing/
        │       └── auth-navigation.ts
        └── hooks/
            ├── useAuth.ts
            └── useAuthRedirectAfterHydration.ts
```

### 3.2 Store Minimalista con Selectors

```typescript
// Store - solo estado
interface AuthState {
  isAuthenticated: boolean;
  user: AuthUser | null;
  selectedStudentId: string | null;
  hasHydrated: boolean;

  setAuthenticated, setUser, clearSession, setHydrated,
  selectStudent, clearSelectedStudent
}

// Selectors - derivaciones puros
export const selectStudentId = (state: AuthState): string | null => {
  if (state.user?.role === "student") {
    return state.user.studentId;
  }
  if (state.user?.role === "parent" && state.selectedStudentId) {
    const childIds = state.user.children.map((c) => c.studentId);
    if (childIds.includes(state.selectedStudentId)) {
      return state.selectedStudentId;
    }
  }
  return null;
};

export const selectIsParent = (state) => state.user?.role === "parent";
export const selectIsStudent = (state) => state.user?.role === "student";
export const selectTenantId = (state) => state.user?.tenantId ?? null;
```

### 3.3 Query Keys Centralizadas

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

---

## 4. Cambios Aplicados

### 4.1 Archivos Eliminados (3)

| Archivo | Razón |
|---------|-------|
| `src/lib/auth/active-context.ts` | Redundante, duplicaba lógica del store |
| `src/features/auth/presentation/routing/get-dashboard-path.ts` | Funcionalidad fusionada |
| `src/types/exercise.types.ts` | Duplicado |

### 4.2 Archivos Modificados

| Archivo | Cambios |
|---------|---------|
| `types.ts` | Eliminado `id`, unificado `childId` → `studentId` |
| `register-form.types.ts` | Solo permite `role: "parent"` |
| `exercise.types.ts` | `childId` → `studentId` |
| `auth-store.ts` | Store minimalista con `selectStudentId` selector |
| `useAuth.ts` | Query keys centralizadas |
| `auth-navigation.ts` | Consolidado |
| `http-client.ts` | `studentId` desde store |
| `adapter.ts` | Eliminado `id` de mocks |
| `auth.service.ts` | `childId` → `studentId` en mocks |
| `useExercise.ts` | TenantId desde store |
| `useStudent.ts` | Query keys centralizadas |
| `parent-dashboard-page.tsx` | Tipos actualizados |
| `role-selection-page.tsx` | Sin `setRole` legacy |
| `require-role.tsx` | Actualizado |
| `home-redirect.tsx` | Actualizado |
| `app-menu-sheet.tsx` | Actualizado |
| `navigation.config.ts` | Import corregido |
| `filter-navigation.ts` | Import corregido |
| `useAuthRedirectAfterHydration.ts` | Simplificado |

### 4.3 Documentación Actualizada

| Archivo | Cambio |
|---------|--------|
| `AUTHENTICATION.md` | Refleja modelo sin `id`, selectors del store |
| `REFACTORING-AUTH.md` | Este documento |

---

## 5. Uso del Store

### 5.1 En Componentes

```typescript
import { useAuthStore } from "@/features/auth/presentation/store/auth-store";

// Selector simple
const user = useAuthStore((state) => state.user);

// Selector derivado
const studentId = useAuthStore((state) => {
  if (state.user?.role === "student") return state.user.studentId;
  if (state.user?.role === "parent" && state.selectedStudentId) {
    const childIds = state.user.children.map((c) => c.studentId);
    if (childIds.includes(state.selectedStudentId)) {
      return state.selectedStudentId;
    }
  }
  return null;
});

// O usar el selector exportado
import { selectStudentId, selectIsParent } from "@/features/auth/presentation/store/auth-store";
const studentId = useAuthStore(selectStudentId);
const isParent = useAuthStore(selectIsParent);
```

### 5.2 Selección de Hijo (Parent)

```typescript
// En parent-dashboard
const selectStudent = useAuthStore((state) => state.selectStudent);

const handleSelectChild = (studentId: string) => {
  selectStudent(studentId);
};
```

---

## 6. Flujo de Navegación

```
Login
  ↓
setAuthenticated(true) + setUser(user)
  ↓
user.role === "parent" → /dashboard/parent
user.role === "student" → /dashboard/student
  ↓
/dashboard/parent
  ├── Lista de hijos (childrenOverview)
  ├── Click en hijo → selectStudent(studentId)
  └── Vista detallada (progreso del hijo seleccionado)
```

---

## 7. Beneficios Obtenidos

| Beneficio | Descripción |
|-----------|-------------|
| **Claridad** | Un identificador por rol, sin ambigüedad |
| **Simplicidad** | Eliminado código redundante (ActiveContext) |
| **Consistencia** | `studentId` en todas partes |
| **Tipado** | Tipos inferidos de Zod |
| **Mantenibilidad** | Selectors del store como fuente de verdad |

---

## 8. Próximos Pasos (Pendientes)

| Prioridad | Tarea | Descripción |
|-----------|-------|-------------|
| 🔴 Alta | Teacher logic | Definir cómo un teacher accede a estudiantes |
| 🟡 Media | Test coverage | Agregar tests para selectors del store |
| 🟢 Baja | Cleanup | Verificar que no quede código muerto |

---

## 9. Glosario

| Término | Definición |
|---------|------------|
| **studentId** | Identificador único canónico de un estudiante |
| **parentId** | Identificador único de un padre |
| **teacherId** | Identificador único de un teacher |
| **selectedStudentId** | Estado de UI que indica qué hijo del parent está seleccionado |
| **Discriminated Union** | Patrón Zod donde `role` es el discriminator |

---

## 10. Referencias

| Archivo | Descripción |
|---------|-------------|
| `src/features/auth/domain/types.ts` | Schemas Zod |
| `src/features/auth/presentation/store/auth-store.ts` | Store con selectors |
| `src/lib/query/keys.ts` | Query keys |
| `src/lib/auth/http-client.ts` | HTTP client |
| `src/features/auth/doc/AUTHENTICATION.md` | Documentación completa |

---

*Documento generado: Abril 2026*
*Versión del proyecto: 0.0.0*
