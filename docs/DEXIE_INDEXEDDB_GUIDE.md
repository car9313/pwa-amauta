# Guía de Dexie e IndexedDB - PWA Amauta

## Tabla de Contenidos

1. [Resumen](#resumen)
2. [Arquitectura de Base de Datos](#arquitectura-de-base-de-datos)
3. [Esquema de la Base de Datos](#esquema-de-la-base-de-datos)
4. [Uso de Funciones de Base de Datos](#uso-de-funciones-de-base-de-datos)
5. [Hooks de React Query](#hooks-de-react-query)
6. [Patrones Comunes](#patrones-comunes)
7. [Flujo de Datos: Dexie → React Query](#flujo-de-datos-dexie--react-query)
8. [Migración de Datos](#migración-de-datos)
9. [Debugging y Testing](#debugging-y-testing)

---

## Resumen

Amauta usa **Dexie** como wrapper sobre **IndexedDB** para persistencia offline. La aplicación tiene una **base de datos unificada** llamada `amauta-db` que contiene todas las tablas necesarias.

```
┌─────────────────────────────────────────────────────────────────┐
│                    IndexedDB (Browser)                         │
│                      amauta-db (v1)                           │
├─────────────────────────────────────────────────────────────────┤
│  Tables:                                                     │
│  ├── tokens       → Tokens de autenticación                 │
│  ├── users       → Usuario autenticado                      │
│  ├── preferences → Preferencias del usuario                 │
│  ├── mutations   → Cola de mutations (outbox)               │
│  ├── exercises   → Ejercicios disponibles                    │
│  ├── lessons    → Lecciones del currículo                   │
│  ├── progress   → Progreso del estudiante                   │
│  └── students   → Hijos registrados                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Arquitectura de Base de Datos

### Archivo Principal

`src/lib/api/storage/db.ts` define la base de datos unificada:

```typescript
import Dexie, { type EntityTable } from "dexie";
import type { AuthUser } from "@/features/auth/domain/types";

export interface TokenData {
  id: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  createdAt: number;
}

export interface StoredUser {
  id: string;
  user: AuthUser;
  storedAt: number;
}

export interface UserPreferences {
  id: string;
  selectedStudentId: string | null;
  updatedAt: number;
}

export interface QueuedMutation {
  id: string;
  type: string;
  payload: unknown;
  endpoint: string;
  method: string;
  priority: number;
  retryCount: number;
  status: string;
  createdAt: number;
  lastAttemptAt: number | null;
  errorMessage: string | null;
  result: unknown | null;
}

export interface Exercise {
  id: string;
  title: string;
  type: "math" | "spanish" | "science" | "logic";
  difficulty: number;
  points: number;
  content: unknown;
  subject: string;
}

export interface Lesson {
  id: string;
  title: string;
  subject: string;
  exerciseIds: string[];
  grade: number;
}

export interface StudentProgress {
  id: string;
  studentId: string;
  lessonId: string;
  completedExercises: string[];
  points: number;
  level: number;
  precision: number;
  streakDays: number;
  lastPlayedAt: number;
  createdAt: number;
  updatedAt: number;
}

export interface Student {
  id: string;
  name: string;
  avatar: string | null;
  parentId: string;
  grade: number;
  createdAt: number;
}

export interface AmautaDatabase extends Dexie {
  tokens: EntityTable<TokenData, "id">;
  users: EntityTable<StoredUser, "id">;
  preferences: EntityTable<UserPreferences, "id">;
  mutations: EntityTable<QueuedMutation, "id">;
  exercises: EntityTable<Exercise, "id">;
  lessons: EntityTable<Lesson, "id">;
  progress: EntityTable<StudentProgress, "id">;
  students: EntityTable<Student, "id">;
}

export const db = new Dexie("amauta-db") as AmautaDatabase;

db.version(1).stores({
  tokens: "id",
  users: "id",
  preferences: "id",
  mutations: "id, status, priority, createdAt, type",
  exercises: "id, type, difficulty, subject",
  lessons: "id, subject",
  progress: "studentId, lessonId",
  students: "id",
});
```

### Archivos de Funciones por Tabla

Cada tabla tiene su propio archivo de funciones en `src/lib/api/storage/`:

| Tabla | Archivo | Propósito |
|-------|---------|-----------|
| tokens, users, preferences | `auth-db.ts` | Autenticación |
| mutations | `offline-queue.ts` | Cola offline (outbox) |
| exercises | `exercises-db.ts` | CRUD de ejercicios |
| lessons | `lessons-db.ts` | CRUD de lecciones |
| progress | `progress-db.ts` | Progreso del estudiante |
| students | `students-db.ts` | Hijos registrados |

---

## Esquema de la Base de Datos

### Tabla: tokens

Almacena tokens de acceso JWT.

```typescript
interface TokenData {
  id: "amauta-tokens";           // Primary key (siempre este valor)
  accessToken: string;          // Token JWT de acceso
  refreshToken: string;         // Token para refresh
  expiresAt: number;           // Timestamp de expiración
  createdAt: number;           // Timestamp de creación
}
```

**Uso:** Inicio de sesión, refresh token, validación de sesión.

---

### Tabla: users

Almacena el usuario actualmente autenticado.

```typescript
interface StoredUser {
  id: "amauta-user";           // Primary key (siempre este valor)
  user: AuthUser;             // Usuario completo del dominio
  storedAt: number;           // Timestamp de guardado
}
```

**Uso:** Información del usuario logueado, avatar, rol.

---

### Tabla: preferences

Almacena preferencias del usuario.

```typescript
interface UserPreferences {
  id: "user-preferences";    // Primary key
  selectedStudentId: string | null;  // Hij@ actualmente seleccionado
  updatedAt: number;         // Timestamp de última actualización
}
```

**Uso:** Recordar qué hijo está seleccionado en el dashboard.

---

### Tabla: mutations

Cola de operaciones offline (outbox pattern). Ver `docs/OUTBOX_PATTERN.md`.

```typescript
interface QueuedMutation {
  id: string;                // "mut_{timestamp}_{hash}"
  type: string;             // "addChild", "updateProgress", etc.
  payload: unknown;        // Datos de la operación
  endpoint: string;         // "/api/parents/{id}/children"
  method: "POST" | "PUT" | "PATCH" | "DELETE";
  priority: 1 | 2 | 3;    // 1=alta, 2=media, 3=baja
  retryCount: number;       // Intentos de retry (0-3)
  status: "pending" | "syncing" | "done" | "failed";
  createdAt: number;
  lastAttemptAt: number | null;
  errorMessage: string | null;
  result: unknown | null;
}
```

**Uso:** Operaciones offline, sincronización cuando hay conexión.

---

### Tabla: exercises

Ejercicios disponibles para los estudiantes.

```typescript
interface Exercise {
  id: string;                // "ex_001", "ex_002", etc.
  title: string;            // "Addition Basics"
  type: "math" | "spanish" | "science" | "logic";
  difficulty: number;      // 1-5
  points: number;           // Puntos por completar
  content: unknown;        // Ejercicio completo (tipo Exercise del dominio)
  subject: string;         // "math", "addition", etc.
}
```

**Índices:** `id`, `type`, `difficulty`, `subject`

---

### Tabla: lessons

Lecciones del currículo.

```typescript
interface Lesson {
  id: string;
  title: string;
  subject: string;
  exerciseIds: string[];
  grade: number;
}
```

**Índices:** `id`, `subject`

---

### Tabla: progress

Progreso del estudiante por lección.

```typescript
interface StudentProgress {
  id: string;                    // "{studentId}_{lessonId}"
  studentId: string;
  lessonId: string;
  completedExercises: string[]; // IDs de ejercicios completados
  points: number;
  level: number;
  precision: number;             // Porcentaje 0-100
  streakDays: number;
  lastPlayedAt: number;
  createdAt: number;
  updatedAt: number;
}
```

**Índices:** `studentId, lessonId` (compuesto)

---

### Tabla: students

Hijos registrados bajo un padre.

```typescript
interface Student {
  id: string;
  name: string;
  avatar: string | null;
  parentId: string;
  grade: number;
  createdAt: number;
}
```

**Uso:** Lista de hijos en el dashboard del padre.

---

## Uso de Funciones de Base de Datos

### Ejemplo: Guardar y leer ejercicios

```typescript
import {
  saveExercise,
  getAllExercises,
  getExerciseById,
  getExercisesByType,
  getExercisesByDifficulty,
} from "@/lib/api/storage/exercises-db";

import type { Exercise } from "@/features/exercises/domain/exercise.types";

// Guardar un ejercicio
await saveExercise({
  id: "ex_001",
  title: "Addition Basics",
  type: "math",
  difficulty: 1,
  points: 10,
  content: {
    exerciseId: "ex_001",
    type: "VISUAL_ADDITION",
    topicId: "math_addition",
    prompt: "Resuelve: 5 + 3 = ?",
    answerType: "NUMERIC",
    difficulty: "LOW",
    hints: ["Cuenta con tus dedos"],
    feedbackStyle: "ENCOURAGING",
  } as Exercise,
  subject: "math",
});

// Leer todos los ejercicios
const allExercises = await getAllExercises();

// Leer por ID
const exercise = await getExerciseById("ex_001");

// Filtrar por tipo
const mathExercises = await getExercisesByType("math");

// Filtrar por dificultad
const easyExercises = await getExercisesByDifficulty(1);
```

### Ejemplo: Progreso del estudiante

```typescript
import {
  updateProgress,
  getProgressByStudent,
  getProgressByStudentAndLesson,
} from "@/lib/api/storage/progress-db";

// Actualizar progreso (crea si no existe)
await updateProgress("stu_001", "lesson_001", {
  completedExercises: ["ex_001", "ex_002"],
  points: 20,
  precision: 85,
});

// Obtener todo el progreso de un estudiante
const progressList = await getProgressByStudent("stu_001");

// Obtener progreso de una lección específica
const progress = await getProgressByStudentAndLesson("stu_001", "lesson_001");
```

---

## Hooks de React Query

Para usar con TanStack Query, existen hooks personalizados:

### useExercises

```typescript
import {
  useExercises,
  useExercise,
  useExercisesByType,
  useExercisesByDifficulty,
  useSaveExercise,
  useDeleteExercise,
  useClearExercises,
} from "@/features/exercises/hooks/useExercises";

// Query: obtener todos
const { data: exercises, isLoading } = useExercises();

// Query: obtener uno
const { data: exercise } = useExercise("ex_001");

// Mutation: guardar
const { mutate: save } = useSaveExercise();
save({
  id: "ex_001",
  title: "Addition",
  type: "math",
  difficulty: 1,
  points: 10,
  content: {},
  subject: "math",
});
```

### useProgress

```typescript
import {
  useProgressByStudent,
  useProgressByStudentAndLesson,
  useSaveProgress,
  useUpdateProgress,
  useDeleteProgress,
} from "@/features/exercises/hooks/useProgress";

// Query: progreso por estudiante
const { data: progressList } = useProgressByStudent("stu_001");

// Query: progreso por lección
const { data: progress } = useProgressByStudentAndLesson("stu_001", "lesson_001");

// Mutation: actualizar
const { mutate: update } = useUpdateProgress();
update({
  studentId: "stu_001",
  lessonId: "lesson_001",
  updates: { points: 25, precision: 90 },
});
```

---

## Patrones Comunes

### Inicialización de datos (semillas)

Crear datos iniciales solo si no existen:

```typescript
import { getAllExercises, saveExercise } from "@/lib/api/storage/exercises-db";

let initialized = false;

export async function ensureExercises() {
  if (initialized) return;
  
  const existing = await getAllExercises();
  if (existing.length === 0) {
    // Seed data
    await saveExercise({ /* ... */ });
  }
  
  initialized = true;
}
```

### Índices y consultas

Los índices se definen en `db.version(1).stores()`:

```typescript
db.version(1).stores({
  exercises: "id, type, difficulty, subject",  // Índices
  progress: "studentId, lessonId",               // Índice compuesto
});
```

Consultas usando índices:

```typescript
// Por índice exacto
await db.exercises.where("type").equals("math").toArray();

// Por rango
await db.exercises.where("difficulty").above(2).toArray();

// Compuesto (solo primer campo)
await db.progress.where("studentId").equals("stu_001").toArray();
```

---

## Flujo de Datos: Dexie → React Query

### Arquitectura de Flujo

```
┌─────────────────────────────────────────────────────────────────┐
│                 FLUJO DE DATOS: DEXIE → REACT QUERY              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐     ┌──────────────────┐                  │
│  │   IndexedDB      │     │   React Query    │                  │
│  │   (amauta-db)   │     │   (QueryClient) │                  │
│  ├──────────────────┤     ├──────────────────┤                  │
│  │  exercises []   │────▶│ setQueryData()   │                  │
│  │  lessons []    │     │  queries cache  │                  │
│  │  students []   │     │                  │                  │
│  │  progress []   │     │                  │                  │
│  └──────────────────┘     └──────────────────┘                  │
│         ▲                    ▲                                    │
│         │                    │                                    │
│  ┌──────┴──────────────────┴──────┐                             │
│  │     QueryInitializer (precarga)    │                             │
│  │  - Lee de Dexie al inicio         │                             │
│  │  - Pre-carga al QueryClient      │                             │
│  │  - Muestra loading si carga   │                             │
│  └─────────────────────────────────┘                             │
└─────────────────────────────────────────────────────────────────┘
```

### Componente QueryInitializer

El componente `QueryInitializer` es responsable de:

1. **Precargar datos** desde Dexie al iniciar la app
2. **Renderizar estado de carga** mientras Hydrata
3. **Proveer datos instantáneos** a los componentes

**Ubicación:** `src/features/queries/components/QueryInitializer.tsx`

**Uso:**

```typescript
import { QueryInitializer } from "@/features/queries/components/QueryInitializer";

function App() {
  return (
    <QueryInitializer>
      <YourAppContent />
    </QueryInitializer>
  );
}
```

### Hook useQueryInitializer

El hook interno que maneja la lógica de hidratación:

```typescript
import { useQueryInitializer } from "@/features/queries/hooks/useQueryInitializer";

function MyComponent() {
  const { isLoading, hasHydrated } = useQueryInitializer();

  if (isLoading && !hasHydrated) {
    return <Spinner />;
  }

  return <DataDisplay />;
}
```

### Diferencia con Persistencia Tradicional

| Enfoque | Persister (persistQueryClient) | Precarga (QueryInitializer) |
|--------|---------------------------|----------------------------|
| **Qué guarda** | Estado completo serializado de React Query | Datos crudos de Dexie |
| **Dónde guarda** | Tabla cache separada | Tablas originales (exercises, lessons, etc.) |
| **Duplicación** | Sí (dos copias) | No (una sola fuente) |
| **Complejidad** | Mayor (serialización) | Menor |
| **Performance** | Puede ser lento con muchos datos | Rápido (lectura directa) |
| **Recomendado para** | Cache grande, multi-tabla | App small/medium, una sola DB |

### Invalidación de Cache

Cuando se realizan mutaciones, el cache se actualiza automáticamente:

```typescript
// useExercises.ts
export function useSaveExercise() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: saveExercise,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: exerciseKeys.all });
    },
  });
}
```

**Importante:** Las mutaciones actualizan:
1. ✅ Dexie (tabla exercises)
2. ✅ React Query cache (vía invalidateQueries)

---

## Migración de Datos

Para actualizar el esquema de la base de datos:

```typescript
export const db = new Dexie("amauta-db") as AmautaDatabase;

// Versión 1: schema inicial
db.version(1).stores({
  tokens: "id",
  users: "id",
  // ...
});

// Versión 2: migrando a versión 2
db.version(2).stores({
  tokens: "id",
  users: "id",
  exercises: "id, type",  // Nuevo índice
}).upgrade(tx => {
  return tx.table("exercises").toCollection().modify(exercise => {
    // Migración de datos existente
    exercise.newField = "default";
  });
});
```

---

## Debugging y Testing

### Inspector de IndexedDB

En Chrome DevTools → Application → IndexedDB → amauta-db

### Console del navegador

```javascript
// Ver todas las tablas
await indexedDB.databases()

// Inspectionar Dexie directamente
const db = await import('/src/lib/api/storage/db.js').then(m => m.db)
await db.exercises.toArray()
await db.progress.toArray()
await db.mutations.toArray()
```

### Testing con Vitest

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/lib/api/storage/db";

describe("exercises-db", () => {
  beforeEach(async () => {
    await db.exercises.clear();
  });

  it("should save and retrieve exercise", async () => {
    const exercise = { id: "ex_test", title: "Test", type: "math" as const, difficulty: 1, points: 10, content: {}, subject: "math" };
    
    await db.exercises.put(exercise);
    const result = await db.exercises.get("ex_test");
    
    expect(result?.title).toBe("Test");
  });
});
```

---

## Ver Também

- [OUTBOX_PATTERN.md](./OUTBOX_PATTERN.md) - Patrón outbox para mutations offline
- [PERSISTENCE_TEST_GUIDE.md](./PERSISTENCE_TEST_GUIDE.md) - Guía de testing de persistencia
- [ARCHITECTURE_LAYERS.md](./ARCHITECTURE_LAYERS.md) - Capas de la aplicación