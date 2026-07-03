# Contrato de API — Amauta Frontend ↔ Backend

> **Propósito:** Este documento define el contrato exacto que el frontend (React) espera de la API REST. Cada campo incluye su tipo, validación Zod (si aplica), para qué se usa en la UI, y cómo fluye por las capas de la aplicación.
>
> El frontend usa **mocks** cuando `VITE_USE_MOCK=true` o `VITE_API_BASE_URL` está vacío. El backend real reemplaza estos mocks.

---

## Tabla de Contenidos

1. [Autenticación](#1-autenticación)
2. [Dashboard Estudiante](#2-dashboard-estudiante)
3. [Dashboard Padre](#3-dashboard-padre)
4. [Dashboard Maestro](#4-dashboard-maestro)
5. [Ejercicios](#5-ejercicios)
6. [Progreso del Estudiante](#6-progreso-del-estudiante)
7. [Reportes](#7-reportes)
8. [Formato de Errores](#8-formato-de-errores)
9. [Encabezados Requeridos](#9-encabezados-requeridos)
10. [Flujo de Token y Refresh](#10-flujo-de-token-y-refresh)
11. [Sistema Offline y Cola de Mutaciones](#11-sistema-offline-y-cola-de-mutaciones)
12. [Especificaciones Técnicas](#12-especificaciones-técnicas)

---

## 1. Autenticación

### 1.1 POST /auth/login

Inicia sesión con email y contraseña. El frontend usa `withTimeout(login(), 8000)` — si el backend no responde en **8 segundos**, se lanza `TIMEOUT` y se trata como error offline.

#### Request

```json
{
  "email": "padre@email.com",
  "password": "secret123"
}
```

| Campo | Tipo | Validación | Para qué lo usa el frontend |
|-------|------|-----------|----------------------------|
| `email` | `string` | `z.string().email()` | Identificador único del usuario |
| `password` | `string` | `z.string().min(6)` | Contraseña; mínimo 6 caracteres en frontend |

#### Response (201 Created)

```json
{
  "user": {
    "name": "María García",
    "email": "maria@email.com",
    "tenantId": "ten_abc123",
    "role": "parent",
    "parentId": "par_001",
    "children": [
      {
        "studentId": "stu_001",
        "name": "Mario",
        "avatar": "https://...",
        "level": 2,
        "points": 156,
        "precision": 85,
        "streakDays": 4
      }
    ]
  },
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": 900,
  "tenantId": "ten_abc123"
}
```

| Campo | Tipo | Obligatorio | ¿Por qué existe? |
|-------|------|------------|------------------|
| `user` | `AuthUser` (unión discriminada por `role`) | ✅ | Se persiste en Dexie y Zustand. Determina todo el flujo de la app (dashboard, rutas, permisos). |
| `user.name` | `string` | ✅ | Se muestra en header, dashboard, tarjetas de perfil. |
| `user.email` | `string` | ✅ | Se muestra en perfil, se usa como identificador en el sistema. |
| `user.tenantId` | `string` | ✅ | Se inyecta como header `X-Tenant-Id` en **todas las requests**. Identifica la escuela/tenant. |
| `user.role` | `"student" \| "parent" \| "teacher"` | ✅ | Unión discriminada en Zod. Determina a qué dashboard redirigir: `/dashboard/student`, `/dashboard/parent`, `/dashboard/teacher`. |
| `user.studentId` | `string` | Solo si `role: "student"` | Identifica al estudiante. Se usa en todos los endpoints que requieren `studentId`. |
| `user.parentId` | `string` | Solo si `role: "parent"` | Identifica al padre. Se usa en endpoints como `/parents/{parentId}/children`, `/parents/{parentId}/dashboard`. |
| `user.children` | `ChildProfile[]` | Solo si `role: "parent"` | Lista de hijos. Se muestra en el dashboard del padre y permite seleccionar un hijo para ver su progreso. |
| `user.teacherId` | `string` | Solo si `role: "teacher"` | Identifica al maestro. Se usa en endpoints como `/teachers/{teacherId}/dashboard`. |
| `user.classIds` | `string[]` | Solo si `role: "teacher"` | IDs de las clases que enseña. Se usa para filtrar reportes. |
| `token` | `string` (JWT) | ✅ | Access token. Se guarda en Dexie (tabla `tokens`). Se envía como `Authorization: Bearer <token>` en todas las requests. |
| `refresh` | `string` (JWT) | ❌ (opcional) | Refresh token. Se guarda en Dexie. Si no se envía, el frontend no podrá hacer refresh automático y el usuario será redirigido a login cuando el access token expire. |
| `expiresIn` | `number` (segundos) | ❌ (default: 900) | TTL del access token. Se persiste como `expiresAt = Date.now() + expiresIn * 1000` en Dexie. Si no se envía, el frontend asume un valor razonable. **Importante**: el frontend verifica `Date.now() < expiresAt` para decidir si puede operar offline. |
| `tenantId` | `string` | ❌ (redundante con `user.tenantId`) | Inyectado como `X-Tenant-Id`. El frontend prefiere leerlo de `user.tenantId`. |

#### Esquema Zod (validación runtime en frontend)

```typescript
const authResponseSchema = z.object({
  user: authUserSchema,        // unión discriminada por role
  token: z.string(),
  refresh: z.string().optional(),
  expiresIn: z.number().optional(),
  tenantId: z.string().optional(),
});
```

#### Flujo en el frontend

```
useLogin() → login(credentials) → authAdapter.login() → POST /auth/login
                                                              ↓
                                                         AuthResponse
                                                              ↓
  saveAuthResponse(response) → Dexie.tokens.put(token) + Dexie.users.put(user)
  setAuthenticated(true)
  setUser(response.user)
  queryClient.setQueryData(['auth', 'session'], response.user)  ← precarga React Query
  redirectToDashboard(navigate, response.user.role)             ← navegación
```

---

### 1.2 POST /auth/register

Registra un nuevo usuario (actualmente solo `role: "parent"` está implementado en frontend).

#### Request

```json
{
  "name": "María García",
  "email": "maria@email.com",
  "password": "secret123",
  "confirmPassword": "secret123",
  "role": "parent"
}
```

| Campo | Tipo | Validación | Para qué lo usa el frontend |
|-------|------|-----------|----------------------------|
| `name` | `string` | `z.string().min(1)` | Nombre completo del usuario |
| `email` | `string` | `z.string().email()` | Email único |
| `password` | `string` | `z.string().min(6)` | Contraseña |
| `confirmPassword` | `string` | `z.string().min(6)` | Solo para validación frontend (refine: password === confirmPassword). El backend puede ignorarlo. |
| `role` | `"parent"` | `z.enum(["parent"])` | Actualmente solo padres pueden registrarse desde el frontend. Estudiantes y maestros son creados por padres/administradores. |

#### Response (201 Created)

```json
{
  "user": { ...AuthUser },
  "token": "jwt_token_here"
}
```

Misma estructura que `AuthResponse` (login). El frontend trata el registro igual que login: persiste en Dexie, setea estado, redirige.

#### Flujo en el frontend

```
useRegister() → register(input) → authAdapter.register() → POST /auth/register
  → mismo flujo que login: saveAuthResponse + setUser + redirectToDashboard
```

---

### 1.3 POST /auth/logout

Cierra sesión. Invalida el token en backend.

#### Request

Sin body. Header `Authorization: Bearer <accessToken>`.

#### Response (200 OK)

```json
{}
```

#### Flujo en el frontend

```typescript
try {
  await httpClient.request("/auth/logout", { method: "POST" });
} finally {
  await clearAuth();            // limpia Dexie (tokens + users)
  setAuthenticated(false);
  setUser(null);
  queryClient.clear();          // limpia toda la cache React Query
  queryClient.setQueryData(['auth', 'session'], null);
  navigate("/login", { replace: true });
}
```

**Nota:** El `finally` asegura que la sesión se limpia incluso si el backend no responde (offline).

---

### 1.4 POST /auth/refresh

Intercambia el refresh token por un nuevo access token.

#### Request

```json
{
  "refresh": "eyJhbGciOiJIUzI1NiIs..."
}
```

| Campo | Tipo | Para qué lo usa el frontend |
|-------|------|----------------------------|
| `refresh` | `string` | Refresh token almacenado en Dexie. Se envía en el cuerpo, **no** en el header. |

#### Response (200 OK)

```json
{
  "access": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": 900
}
```

| Campo | Tipo | Obligatorio | Por qué |
|-------|------|------------|---------|
| `access` | `string` | ✅ | Nuevo access token. Se persiste en Dexie reemplazando el anterior. |
| `expiresIn` | `number` (segundos) | ✅ | TTL del nuevo token. El frontend calcula `expiresAt = Date.now() + expiresIn * 1000`. |

#### ¿Cuándo se llama?

- Automáticamente cuando el `httpClient` recibe un `401` en cualquier request.
- El cliente hace **1 intento de refresh**. Si falla con `401`, llama a `clearAuth()` y el usuario vuelve a login.
- Si `expiresAt < Date.now()` (token expirado) pero hay usuario local, el frontend entra en **modo offline** (read-only) en lugar de forzar logout. Esto permite seguir usando la app sin conexión.

#### Flujo

```
httpClient.request() → response 401
  → refreshAccessToken() → POST /auth/refresh { refresh: refreshToken }
    → success: updateAccess(newAccess, expiresIn) → retry original request
    → 401: clearAuth() → SESSION_NOT_FOUND
    → network error: offlineMode=true (conserva sesión local)
```

---

### 1.5 GET /auth/me

Obtiene los datos del usuario autenticado. Llamado durante la inicialización para verificar que el token sigue siendo válido.

#### Request

Header: `Authorization: Bearer <accessToken>`

#### Response (200 OK)

```json
{
  "name": "María García",
  "email": "maria@email.com",
  "tenantId": "ten_abc123",
  "role": "parent",
  "parentId": "par_001",
  "children": [...]
}
```

Tipo: `AuthUser` (unión discriminada por `role`).

| Código | Significado | Flujo resultante |
|--------|-------------|------------------|
| 200 | Token válido | Se actualiza el usuario en Zustand + Dexie |
| 401 | Token inválido/expirado | Se intenta refresh; si falla, `clearAuth()` |

---

## 2. Dashboard Estudiante

### 2.1 GET /students/{studentId}/dashboard

Pantalla principal del estudiante al iniciar sesión. Muestra perfil, agenda, progreso por tema y logros recientes. El frontend cachea esta respuesta en React Query con `staleTime: VITE_QUERY_STALE_TIME` (default 60s).

#### Response (200 OK)

```json
{
  "student": {
    "studentId": "stu_001",
    "name": "Mario",
    "avatar": "https://images.unsplash.com/...",
    "level": 2,
    "points": 156,
    "precision": 85,
    "streakDays": 4,
    "streakWeek": [true, true, true, true, false, false, false]
  },
  "agenda": [
    {
      "lessonId": "les_001",
      "title": "Suma Básica",
      "subject": "math",
      "scheduledAt": "2024-01-15T10:30:00Z",
      "durationMinutes": 15,
      "completed": false,
      "topicHint": "suma"
    }
  ],
  "progress": [
    {
      "topicId": "math_addition",
      "title": "Suma",
      "mastery": 85
    }
  ],
  "recentAchievements": [
    {
      "id": "ach_002",
      "title": "Racha de 3 días",
      "description": "Practicaste 3 días seguidos",
      "type": "streak"
    }
  ]
}
```

#### `Student`

| Campo | Tipo | Validación Zod | ¿Por qué? ¿Dónde se usa? |
|-------|------|---------------|--------------------------|
| `studentId` | `string` | `z.string()` | Se usa como identificador en endpoints y para seleccionar el contexto de estudiante (`X-Student-Context`). |
| `name` | `string` | `z.string()` | Se muestra en el dashboard, tarjetas, header. |
| `avatar` | `string` (URL) | `z.string().optional()` | Foto de perfil. Se muestra en `UserProfileCard`. Si no viene, se muestra iniciales. |
| `level` | `number` (int, >= 1) | `z.number().int().positive()` | Nivel gamificado. Se muestra en `StatCard` y `LevelScreen`. Sube al acumular puntos. |
| `points` | `number` (int, >= 0) | `z.number().int().nonnegative()` | Puntos totales. Se muestran en dashboard y animaciones de logro. |
| `precision` | `number` (0-100) | `z.number().min(0).max(100)` | Porcentaje de aciertos. Se muestra como barra de progreso. |
| `streakDays` | `number` (int, >= 0) | `z.number().int().nonnegative()` | Días consecutivos de práctica. Se usa para mostrar racha y desbloquear logros. |
| `streakWeek` | `boolean[]` (length 7) | `z.array(z.boolean())` | Representa [lun, mar, mié, jue, vie, sáb, dom]. Cada `true` = practicó ese día. Se pinta como cuadrícula semanal. |

#### `AgendaItem`

| Campo | Tipo | Validación | ¿Por qué? |
|-------|------|-----------|-----------|
| `lessonId` | `string` | `z.string()` | Identifica la lección programada. Se usa como enlace a `/lessons/{lessonId}`. |
| `title` | `string` | `z.string()` | Título visible en la tarjeta de agenda. |
| `subject` | `string` | `z.string()` | Materia ("math", "spanish", "science"). Se usa para filtrar por ícono/color. |
| `scheduledAt` | `string` (ISO 8601) | `z.string()` | Fecha programada. Se formatea para mostrar día y hora. |
| `durationMinutes` | `number` (int, > 0) | `z.number().int().positive()` | Duración estimada. Se muestra como "15 min". |
| `completed` | `boolean` | `z.boolean()` | Si ya completó la lección. Cambia el estilo visual (check/tachado). |
| `topicHint` | `string` | `z.string().optional()` | Pista textual del tema. Se muestra como subtítulo si existe. |

#### `ProgressItem`

| Campo | Tipo | Validación | ¿Por qué? |
|-------|------|-----------|-----------|
| `topicId` | `string` | `z.string()` | Identifica el tema. Se usa para enlazar a práctica específica. |
| `title` | `string` | `z.string()` | Nombre del tema visible. |
| `mastery` | `number` (0-100) | `z.number().min(0).max(100)` | Nivel de dominio. Se visualiza como barra de progreso circular o lineal. |

#### `Achievement`

| Campo | Tipo | Validación | ¿Por qué? |
|-------|------|-----------|-----------|
| `id` | `string` | `z.string()` | Identificador único. |
| `title` | `string` | `z.string()` | Título del logro. Ej: "Racha de 3 días". |
| `description` | `string` | `z.string()` | Descripción textual. |
| `type` | `"streak" \| "level" \| "accuracy"` | `z.enum([...])` | Determina el ícono a mostrar. `streak` = fuego, `level` = estrella, `accuracy` = diana. |

#### Flujo en frontend

```
<StudentDashboardPage>
  useStudentDashboard(studentId) → useQuery()
    → getStudentDashboard(studentId)
      → GET /students/{studentId}/dashboard
      → StudentDashboard
  Renderiza: UserProfileCard + AgendaItem[] + ProgressCard[] + AchievementCard[]
```

---

## 3. Dashboard Padre

### 3.1 GET /parents/{parentId}/dashboard

Pantalla principal del padre. Muestra su perfil y una vista general de todos sus hijos.

#### Response (200 OK)

```json
{
  "parent": {
    "parentId": "par_001",
    "name": "María García",
    "email": "maria@email.com",
    "children": [
      {
        "studentId": "stu_001",
        "name": "Mario",
        "avatar": null,
        "level": 2,
        "points": 156,
        "precision": 85,
        "streakDays": 4
      }
    ]
  },
  "childrenOverview": [
    {
      "studentId": "stu_001",
      "name": "Mario",
      "avatar": null,
      "level": 2,
      "points": 156,
      "precision": 85,
      "streakDays": 4
    }
  ],
  "recentActivity": [
    {
      "id": "act_001",
      "studentId": "stu_001",
      "childName": "Mario",
      "action": "Completó ejercicio de suma",
      "subject": "math",
      "timestamp": "2024-01-15T10:30:00Z"
    }
  ]
}
```

#### `ParentProfile`

| Campo | Tipo | ¿Por qué? |
|-------|------|-----------|
| `parentId` | `string` | ID del padre. Se muestra en perfil y se usa en URLs. |
| `name` | `string` | Nombre visible. |
| `email` | `string` | Email visible. |
| `children` | `ChildProfile[]` | Hijos registrados. Se usa en el store `selectStudent()` para validar que el hijo seleccionado pertenece al padre. |

#### `ChildProfile`

| Campo | Tipo | Validación Zod | ¿Por qué? |
|-------|------|---------------|-----------|
| `studentId` | `string` | `z.string()` | Se persiste como `selectedStudentId` en Dexie (preferencias). Se inyecta como `X-Student-Context` en requests. |
| `name` | `string` | `z.string()` | Nombre visible en tarjetas. |
| `avatar` | `string` (URL) | `z.string().optional()` | Foto de perfil. |
| `level` | `number` (int, >= 1) | `z.number().int().positive()` | Nivel actual. Se muestra en tarjetas. |
| `points` | `number` (int, >= 0) | `z.number().int().nonnegative()` | Puntos acumulados. |
| `precision` | `number` (0-100) | `z.number().min(0).max(100)` | Precisión general. |
| `streakDays` | `number` (int, >= 0) | `z.number().int().nonnegative()` | Días de racha. |

#### `ActivityItem`

| Campo | Tipo | Validación | ¿Por qué? |
|-------|------|-----------|-----------|
| `id` | `string` | `z.string()` | Identificador único (para keys de React). |
| `studentId` | `string` | `z.string()` | Filtra actividades por hijo. |
| `childName` | `string` | `z.string()` | Nombre visible del niño. |
| `action` | `string` | `z.string()` | Descripción de la acción. Ej: "Completó ejercicio de suma". |
| `subject` | `string` | `z.string()` | Materia. Se usa para ícono/color. |
| `timestamp` | `string` (ISO 8601) | `z.string()` | Cuándo ocurrió. Se formatea como "hace 2 horas". |

#### Flujo en frontend

```
<ParentDashboardPage>
  useParentDashboard() → queryFn: auth.service.getParentDashboard(parentId)
    → GET /parents/{parentId}/dashboard
  Muestra: ParentProfileCard + ChildProfile cards + RecentActivity list

  Al hacer click en un hijo:
    store.selectStudent(studentId)
    → persiste selectedStudentId en Dexie
    → navega a /dashboard/student?asParent=true
```

---

## 4. Dashboard Maestro

### 4.1 GET /teachers/{teacherId}/dashboard

Pantalla principal del maestro. Vista general de todas sus clases.

#### Response (200 OK)

```json
{
  "teacherId": "tea_001",
  "name": "Prof. Carlos",
  "totalStudents": 45,
  "totalClasses": 3,
  "averageMastery": 72,
  "classes": [
    {
      "classId": "cla_001",
      "className": "1° Básico A",
      "studentCount": 15,
      "averageMastery": 68,
      "students": [
        {
          "studentId": "stu_001",
          "name": "Mario",
          "avatar": null,
          "level": 2,
          "points": 156,
          "precision": 85,
          "streakDays": 4,
          "mastery": 72,
          "riskFlags": ["Bajo rendimiento en resta"],
          "lastActivity": "2024-01-15T10:30:00Z"
        }
      ]
    }
  ],
  "subjectProgress": [
    {
      "topicId": "math_addition",
      "title": "Suma",
      "mastery": 85
    }
  ],
  "recentActivity": [
    {
      "id": "act_001",
      "studentId": "stu_001",
      "childName": "Mario",
      "action": "Completó ejercicio de suma",
      "subject": "math",
      "timestamp": "2024-01-15T10:30:00Z"
    }
  ]
}
```

#### `TeacherClass`

| Campo | Tipo | ¿Por qué? |
|-------|------|-----------|
| `classId` | `string` | Identificador de la clase. |
| `className` | `string` | Nombre visible. Ej: "1° Básico A". |
| `studentCount` | `number` (int, > 0) | Cantidad de estudiantes en la clase. Se muestra en la tarjeta. |
| `averageMastery` | `number` (0-100) | Dominio promedio de la clase. Se muestra como métrica. |
| `students` | `TeacherStudentSummary[]` | Lista de estudiantes con sus métricas. |

#### `TeacherStudentSummary`

| Campo | Tipo | Validación | ¿Por qué? |
|-------|------|-----------|-----------|
| `studentId` | `string` | `z.string()` | Identificador único. |
| `name` | `string` | `z.string()` | Nombre visible. |
| `avatar` | `string` (URL) | `z.string().optional()` | Foto de perfil. |
| `level` | `number` (int, >= 1) | `z.number().int().positive()` | Nivel gamificado. |
| `points` | `number` (int, >= 0) | `z.number().int().nonnegative()` | Puntos acumulados. |
| `precision` | `number` (0-100) | `z.number().min(0).max(100)` | Precisión en respuestas. |
| `streakDays` | `number` (int, >= 0) | `z.number().int().nonnegative()` | Días de racha. |
| `mastery` | `number` (0-100) | `z.number().min(0).max(100)` | Dominio general. Se usa para ordenar estudiantes (riesgo). |
| `riskFlags` | `string[]` | `z.array(z.string())` | Alertas textuales. Se muestran como badges rojos/naranjas. Ej: ["Bajo rendimiento en resta", "4 días sin practicar"]. Si está vacío, no se muestra warning. |
| `lastActivity` | `string` (ISO 8601) | `z.string()` | Última actividad. Se muestra como "hace 2 días". Usado para detectar estudiantes inactivos. |

---

## 5. Ejercicios

### 5.1 GET /students/{studentId}/next-exercise

Obtiene el siguiente ejercicio que el estudiante debe resolver. El backend decide qué ejercicio servir basándose en el progreso anterior del estudiante.

#### Response (200 OK)

```json
{
  "exercise": {
    "exerciseId": "ex_001",
    "type": "VISUAL_ADDITION",
    "topicId": "math_addition",
    "prompt": "Resuelve: 5 + 3 = ?",
    "answerType": "NUMERIC",
    "difficulty": "LOW",
    "hints": ["Cuenta con tus dedos", "Sumar es agregar más"],
    "feedbackStyle": "ENCOURAGING",
    "stepCurrent": 1,
    "stepTotal": 3,
    "demoContent": "🍎🍎🍎🍎🍎 + 🍎🍎🍎 = 🍎🍎🍎🍎🍎🍎🍎🍎",
    "secondaryQuestion": "¿Cuántas manzanas hay en total?",
    "subInstruction": "Puedes usar los dedos para contar"
  },
  "sessionId": "ses_001"
}
```

#### `Exercise`

| Campo | Tipo | Validación | Obligatorio | ¿Por qué? ¿Dónde se usa? |
|-------|------|-----------|-------------|--------------------------|
| `exerciseId` | `string` | `z.string()` | ✅ | Se envía en `POST /submit` para identificar qué ejercicio se respondió. Se usa como key de React. |
| `type` | enum | `exerciseTypeSchema` | ✅ | Determina el componente visual que renderiza el ejercicio. `VISUAL_ADDITION` = emojis/svg de manzanas, `TEXT_PROBLEM` = solo texto, `INTERACTIVE` = componente interactivo. |
| `topicId` | `string` | `z.string()` | ✅ | Agrupa ejercicios por tema. Se usa para calcular progreso por tema y para `nextAction.topicId` en el resultado. |
| `prompt` | `string` | `z.string()` | ✅ | La pregunta principal que ve el estudiante. Es el texto más importante de la pantalla. |
| `answerType` | enum | `answerTypeSchema` | ✅ | Define el tipo de input: `NUMERIC` = teclado numérico, `TEXT` = campo texto, `SELECT` = dropdown, `MULTIPLE_CHOICE` = botones de opción. |
| `difficulty` | enum | `difficultyLevelSchema` | ✅ | `LOW` = 2 estrellas, `MEDIUM` = 3 estrellas, `HIGH` = 5 estrellas. Se muestra visualmente. |
| `hints` | `string[]` | `z.array(z.string())` | ✅ | Array de pistas. Se muestran una por una cuando el estudiante presiona "Ayuda". Si está vacío, se oculta el botón de ayuda. |
| `feedbackStyle` | enum | `feedbackStyleSchema` | ✅ | `ENCOURAGING` = mensajes positivos siempre, `NEUTRAL` = objetivo, `CORRECTIVE` = señala errores específicos. Determina el tono del feedback. |
| `stepCurrent` | `number` (int) | `z.number().int().optional()` | ❌ | Paso actual en ejercicios multi-paso. Se muestra como "Paso 1 de 3". Si no viene, se asume ejercicio de un solo paso. |
| `stepTotal` | `number` (int) | `z.number().int().optional()` | ❌ | Total de pasos. Se muestra con `stepCurrent`. |
| `demoContent` | `string` | `z.string().optional()` | ❌ | Contenido visual de demostración (SVG, emojis, texto formateado). Se renderiza en un bloque destacado arriba del prompt. |
| `secondaryQuestion` | `string` | `z.string().optional()` | ❌ | Pregunta secundaria. Se muestra debajo de la principal si existe. |
| `subInstruction` | `string` | `z.string().optional()` | ❌ | Instrucción adicional. Se muestra como texto pequeño debajo del input. |

#### `sessionId`

| Campo | Tipo | Obligatorio | ¿Por qué? |
|-------|------|-------------|-----------|
| `sessionId` | `string` | ✅ | Identifica la sesión de práctica actual. Actualmente el frontend no lo usa activamente, pero está previsto para tracking de sesiones completas. |

#### Flujo en frontend

```
<LessonPage>
  useNextExercise(studentId) → useQuery()
    → getNextExercise(studentId)
      → GET /students/{studentId}/next-exercise
      → Exercise
  Renderiza: prompt, input según answerType, hints, demoContent, etc.
  Estudiante responde → submitAnswer()
```

---

### 5.2 POST /students/{studentId}/exercises/{exerciseId}/submit

Envía la respuesta del estudiante a un ejercicio específico. El frontend usa `useSafeMutation` que:

1. Si está online → hace POST HTTP
2. Si el POST falla (error de red) → encola en Dexie para sync posterior
3. Si está offline → encola directamente, devuelve `Symbol(QUEUED_OFFLINE)`

#### Request

```json
{
  "answer": "8",
  "telemetry": {
    "responseTimeMs": 5000,
    "hintsUsed": 1,
    "abandoned": false
  }
}
```

| Campo | Tipo | Validación | Obligatorio | ¿Por qué? |
|-------|------|-----------|-------------|-----------|
| `answer` | `string` | `z.string()` | ✅ | Respuesta del estudiante en texto. Siempre string incluso para respuestas numéricas. |
| `telemetry` | `Telemetry` | `telemetrySchema` | ❌ (frontend lo envía siempre) | Datos de cómo respondió el estudiante. Usado para análisis pedagógico. |
| `telemetry.responseTimeMs` | `number` | `z.number()` | ✅ | Milisegundos que tardó en responder. Se mide desde que se muestra el ejercicio hasta que envía. |
| `telemetry.hintsUsed` | `number` (int) | `z.number().int()` | ✅ | Cuántas pistas usó (0 si no usó). |
| `telemetry.abandoned` | `boolean` | `z.boolean()` | ✅ | `true` si el estudiante cerró la página o navegó sin responder. |

#### Response (200 OK)

```json
{
  "result": {
    "attemptId": "att_001",
    "score": 100,
    "passed": true,
    "mistakes": [],
    "feedbackSummary": "¡Excelente trabajo!",
    "nextAction": {
      "action": "ADVANCE",
      "topicId": "math_addition",
      "pedagogy": "VISUAL"
    }
  }
}
```

**Nota:** El frontend espera `{ result: ExerciseResult }` como wrapper, no `ExerciseResult` directamente. Esto está definido en el tipo `SubmitResponse`.

#### `ExerciseResult`

| Campo | Tipo | Validación | Obligatorio | ¿Por qué? ¿Dónde se usa? |
|-------|------|-----------|-------------|--------------------------|
| `attemptId` | `string` | `z.string()` | ✅ | ID del intento. Se muestra en feedback como identificador. |
| `score` | `number` (0-100) | `z.number().min(0).max(100)` | ✅ | Determina el estado de la respuesta (ver tabla abajo). |
| `passed` | `boolean` | `z.boolean()` | ✅ | `true` si `score >= 70`. Determina si se muestra celebración o feedback correctivo. |
| `mistakes` | `Mistake[]` | `z.array(mistakeSchema)` | ✅ | Errores cometidos. Se muestran en el feedback correctivo. Array vacío si no hay errores. |
| `feedbackSummary` | `string` | `z.string()` | ✅ | Texto principal de feedback. Se muestra en grande en la pantalla de feedback. |
| `nextAction` | `NextActionDetail` | `nextActionDetailSchema` | ✅ | Determina qué recomendación mostrar y qué pasa al hacer click en "Siguiente". |

#### `Mistake`

| Campo | Tipo | Validación | ¿Por qué? |
|-------|------|-----------|-----------|
| `type` | enum | `mistakeTypeSchema` | `CARRY_MISSED` = error de acarreo, `COLUMN_MISALIGN` = desalineación, `SIGN_ERROR` = error de signo, `CALCULATION_ERROR` = error de cálculo. El frontend usa el tipo para mostrar un mensaje específico. |
| `severity` | `number` (0-1) | `z.number().min(0).max(1)` | Gravedad del error. Se usa para priorizar qué errores mostrar primero. |

#### `NextActionDetail`

| Campo | Tipo | Validación | ¿Por qué? |
|-------|------|-----------|-----------|
| `action` | enum | `nextActionSchema` | `REINFORCE` = repetir ejercicios similares (botón "Practicar más"), `ADVANCE` = avanzar al siguiente tema (botón "Siguiente lección"), `REMEDIATE` = ir a fundamentos (botón "Repasar conceptos"). El texto del botón cambia según el action. |
| `topicId` | `string` | `z.string()` | Tópico al que debe ir el estudiante según la acción recomendada. Se usa para link de navegación. |
| `pedagogy` | enum | `pedagogyTypeSchema` | `VISUAL`, `TEXT` o `INTERACTIVE`. Sugiere el tipo de ejercicio recomendado. |

#### Mapeo score → UI en FeedbackPage

| score | passed | UI que se muestra |
|-------|--------|-------------------|
| >= 80 | `true` | Animación de celebración + "¡Excelente!" + mensaje motivacional + botón Siguiente (acción `ADVANCE` o `REINFORCE`) |
| 70-79 | `true` | Mensaje de ánimo + "¡Buen trabajo!" + botón Siguiente |
| < 70 | `false` | Feedback con errores específicos + lista de `mistakes` con mensajes + botón "Intentar de nuevo" (acción `REMEDIATE`) |

#### Flujo offline

```
useSafeMutation({
  mutationFn: (payload) => submitAnswer(studentId, payload),
  queryKey: exerciseKeys.next(studentId),
  offline: {
    type: "submitAnswer",
    endpoint: `/students/${studentId}/exercises/${payload.exerciseId}/submit`,
    method: "POST",
  },
  tentativeOnly: true,   // solo marca _submitted, no hace optimistic update completo
  optimisticUpdate: (old, payload) => ({ ...old, _submitted: true }),
})
  → Online: POST HTTP → ExerciseResult → FeedbackPage
  → Offline: enqueueMutation("submitAnswer", payload, endpoint, "POST")
    → useMutation retorna QUEUED_OFFLINE
    → FeedbackPage muestra "Respuesta guardada, se enviará cuando tengas conexión"
```

---

## 6. Progreso del Estudiante

### 6.1 GET /students/{studentId}/progress

Obtiene el progreso detallado del estudiante. Usado para reportes y vista de progreso.

#### Response (200 OK)

```json
{
  "studentId": "stu_001",
  "studentName": "Mario",
  "overallProgress": 75,
  "subjects": [
    {
      "subjectId": "math",
      "subjectName": "Matemáticas",
      "mastery": 80,
      "lastPractice": "2024-01-15T10:30:00Z"
    }
  ],
  "achievements": [
    {
      "id": "ach_001",
      "title": "Primera Estrella",
      "description": "Completaste tu primer ejercicio",
      "earnedAt": "2024-01-10T08:00:00Z"
    }
  ],
  "weakAreas": [
    {
      "topicId": "math_subtraction",
      "topicName": "Resta",
      "recommendation": "Practica restas básicas"
    }
  ]
}
```

| Campo | Tipo | Validación | ¿Por qué? |
|-------|------|-----------|-----------|
| `studentId` | `string` | `z.string()` | Identificador. |
| `studentName` | `string` | `z.string()` | Nombre visible. |
| `overallProgress` | `number` (0-100) | `z.number().min(0).max(100)` | Progreso general. Se muestra como barra grande en reportes. |
| `subjects` | `SubjectProgress[]` | `z.array(subjectProgressSchema)` | Desglose por materia. Cada una con su barra de dominio. |
| `achievements` | `ProgressAchievement[]` | `z.array(progressAchievementSchema)` | Logros obtenidos con fecha. Se listan en orden cronológico. |
| `weakAreas` | `WeakArea[]` | `z.array(weakAreaSchema)` | Áreas de mejora. Se muestran como tarjetas con recomendación. |

#### `SubjectProgress`

| Campo | Tipo | ¿Por qué? |
|-------|------|-----------|
| `subjectId` | `string` | Identificador de la materia. |
| `subjectName` | `string` | Nombre visible. Ej: "Matemáticas". |
| `mastery` | `number` (0-100) | Dominio en esa materia. Visualizado como barra. |
| `lastPractice` | `string` (ISO 8601) | Última vez que practicó. Se muestra como "hace N días". |

#### `WeakArea`

| Campo | Tipo | ¿Por qué? |
|-------|------|-----------|
| `topicId` | `string` | Identificador del tema débil. |
| `topicName` | `string` | Nombre visible. Ej: "Resta". |
| `recommendation` | `string` | Texto con recomendación pedagógica. Se muestra al padre/maestro. |

---

## 7. Reportes

### 7.1 GET /parents/{parentId}/report

Reporte semanal para padres sobre el progreso de un hijo específico. Requiere `X-Student-Context`.

#### Response (200 OK)

```json
{
  "studentId": "stu_001",
  "weekRange": "Ene 8 - Ene 14",
  "summary": "Esta semana Mario avanzó significativamente en sumas...",
  "highlights": [
    "Completó 5 ejercicios de suma",
    "Mantuvo racha de 3 días",
    "Subió de nivel"
  ],
  "nextSteps": [
    "Practicar restas",
    "Revisar errores comunes en sustracción"
  ]
}
```

| Campo | Tipo | ¿Por qué? |
|-------|------|-----------|
| `studentId` | `string` | Hijo al que pertenece el reporte. |
| `weekRange` | `string` | Texto con rango de fechas. Ej: "Ene 8 - Ene 14". |
| `summary` | `string` | Resumen narrativo del progreso semanal. |
| `highlights` | `string[]` | Puntos destacados positivos. Se muestran como lista con íconos. |
| `nextSteps` | `string[]` | Recomendaciones para la próxima semana. |

### 7.2 GET /teachers/{teacherId}/report?classId={classId}

Reporte de una clase completa para el maestro.

#### Response (200 OK)

```json
{
  "classId": "cla_001",
  "studentSummaries": [
    {
      "studentId": "stu_001",
      "mastery": 85,
      "riskFlags": []
    },
    {
      "studentId": "stu_002",
      "mastery": 45,
      "riskFlags": ["Necesita apoyo en resta", "Asistencia irregular"]
    }
  ]
}
```

| Campo | Tipo | ¿Por qué? |
|-------|------|-----------|
| `classId` | `string` | Identificador de la clase. |
| `studentSummaries` | `StudentSummary[]` | Resumen por estudiante. Permite al maestro identificar rápidamente quién necesita ayuda. |

#### `StudentSummary`

| Campo | Tipo | ¿Por qué? |
|-------|------|-----------|
| `studentId` | `string` | Identificador del estudiante. |
| `mastery` | `number` (0-100) | Dominio general del estudiante. |
| `riskFlags` | `string[]` | Alertas. Si tiene flags, el estudiante se marca como "en riesgo" en la UI. |

---

## 8. Formato de Errores

### 8.1 Estructura General

```json
{
  "message": "Descripción legible del error",
  "code": "ERROR_CODE",
  "details": {
    "field": "email"
  }
}
```

| Campo | Tipo | Obligatorio | ¿Por qué? |
|-------|------|-------------|-----------|
| `message` | `string` | ✅ | Mensaje legible. El frontend lo muestra en `FormErrorBanner` o como notificación. Debe estar en español. |
| `code` | `string` | ❌ (recomendado) | Código interno para debugging. Se usa en el mapeo `mapHttpErrorToAuthError()`. |
| `details` | `object` | ❌ | Detalles adicionales. Ej: `{ field: "email" }` para errores de validación de formulario. |

### 8.2 Mapeo a AuthErrorCode (Frontend)

El frontend mapea errores HTTP a códigos internos:

| Condición en backend | HTTP Status | AuthErrorCode | Flujo resultante |
|---------------------|-------------|---------------|------------------|
| Sin conexión de red | — | `NETWORK_ERROR` | `isOfflineMode = true`, mantiene sesión local |
| Token inválido | 401 | `TOKEN_INVALID` | Intenta refresh; si falla, `clearSession()` |
| Token revocado/forbidden | 401 con mensaje "revoked" o 403 | `TOKEN_REVOKED` | `clearSession()` forzado, muestra "Sesión cerrada por seguridad" |
| Refresh falla con 401 | 401 en `/auth/refresh` | `SESSION_NOT_FOUND` | `clearSession()`, redirige a `/login` |
| Timeout | — | `TIMEOUT` | `isOfflineMode = true`, muestra "Conexión lenta" |
| Token expirado + hay sesión Dexie | — | `TOKEN_EXPIRED` | `isOfflineMode = true`, acceso read-only |
| Contraseña incorrecta | 401 en login | — | `FormErrorBanner` muestra "Email o contraseña incorrectos" |
| Email duplicado | 409 en register | — | `FormErrorBanner` muestra "El email ya está registrado" |

### 8.3 ErrorBoundary (Errores de Render)

Los errores no capturados en render son manejados por `ErrorBoundary` con 3 tipos de fallback:

| Tipo | Usuario | UI |
|------|---------|----|
| `"student"` | Niño | Mensaje amigable + botón "Volver a intentar" + imagen divertida |
| `"parent"` | Padre | Mensaje profesional + botón "Recargar" + datos de contacto |
| `"student"` (role) | Genérico | Mensaje neutral + botón "Recargar" |

---

## 9. Encabezados Requeridos

### 9.1 Authorization

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

Se envía en **todas las requests** excepto `/auth/login`, `/auth/register` y `/auth/refresh`.

### 9.2 X-Tenant-Id

```http
X-Tenant-Id: ten_abc123
```

Se envía en **todas las requests autenticadas** (excepto si el endpoint tiene `skipTenant: true`). Se obtiene de `user.tenantId` en el store de Zustand.

### 9.3 X-Student-Context

```http
X-Student-Context: stu_001
```

Se envía cuando:

- El usuario autenticado tiene `role: "student"` → usa `user.studentId`
- El usuario autenticado tiene `role: "parent"` y ha seleccionado un hijo → usa `selectedStudentId` del store
- Se omite para endpoints sin contexto de estudiante (`/auth/*`, `/parents/{parentId}/dashboard`, `/teachers/{teacherId}/dashboard`)

### 9.4 Content-Type

```http
Content-Type: application/json
```

Siempre incluir en requests con body.

---

## 10. Flujo de Token y Refresh

### 10.1 Persistencia en Dexie

```
Tabla "tokens" (amauta-db):
{
  id: "amauta-tokens",
  accessToken: "eyJ...",
  refreshToken: "eyJ...",
  expiresAt: 1734567890000,    // Date.now() + expiresIn * 1000
  createdAt: 1734567000000
}

Tabla "users":
{
  id: "amauta-user",
  user: { ...AuthUser },
  storedAt: 1734567000000
}
```

### 10.2 Ciclo de Vida del Token

```
Login:
  POST /auth/login → { token, refresh, expiresIn }
  → accessToken + refreshToken guardados en Dexie
  → expiresAt calculado

Refresh automático:
  httpClient.request() recibe 401
  → POST /auth/refresh { refresh: refreshToken }
  → { access: nuevoToken, expiresIn: 900 }
  → updateAccess(nuevoToken, expiresIn) en Dexie
  → retry original request

Token expirado + offline:
  hydrateFromStorage() detecta Date.now() >= expiresAt
  → isOfflineMode = true (NO hace logout)
  → Usuario puede navegar en modo lectura
  → "Estás en modo sin conexión" (ConnectionStatus banner)

Sin refresh token:
  hydrateFromStorage() no encuentra refreshToken
  → isVerifying = false, hasHydrated = true
  → Usuario ve login screen
```

### 10.3 Tiempos

| Concepto | Valor | Configurable |
|----------|-------|--------------|
| Timeout de login | 8 segundos | Hardcodeado en `useAuth.ts` |
| Timeout de register | 8 segundos | Hardcodeado en `useAuth.ts` |
| Stale time de queries | 60 segundos | `VITE_QUERY_STALE_TIME` en `.env` |
| Retry de queries | 2 intentos | Hardcodeado en hooks |

---

## 11. Sistema Offline y Cola de Mutaciones

### 11.1 Arquitectura

```
useSafeMutation()
    │
    ├─ ¿Online y HTTP exitoso? → Response normal
    │
    ├─ ¿Online pero HTTP falla? → enqueueMutation() a Dexie
    │     └─ background-sync procesa después
    │
    └─ ¿Offline? → enqueueMutation() a Dexie
          └─ background-sync procesa cuando vuelve la conexión
```

### 11.2 Cola de Mutaciones en Dexie

```typescript
interface QueuedMutation {
  id: string;              // "mut_1712345678900_abc123"
  type: string;            // "submitAnswer" | "addChild" | "updateProgress" | etc.
  payload: unknown;        // El body que se enviará al endpoint
  endpoint: string;        // "/students/stu_001/exercises/ex_001/submit"
  method: string;          // "POST" | "PUT" | "PATCH" | "DELETE"
  priority: number;        // 1 (alta) | 2 (media) | 3 (baja)
  retryCount: number;      // 0 a 3 (max)
  status: string;          // "pending" | "syncing" | "done" | "failed"
  createdAt: number;       // Date.now()
  lastAttemptAt: number | null;
  errorMessage: string | null;
  result: unknown | null;
}
```

### 11.3 Prioridad de Mutaciones

| Prioridad | Tipos | ¿Por qué? |
|-----------|-------|-----------|
| 1 (Alta) | `login`, `logout`, `register`, `submitAnswer` | Operaciones críticas del usuario. `submitAnswer` debe sincronizarse rápido para no perder respuestas. |
| 2 (Media) | `addChild`, `updateProgress` | Operaciones importantes pero no urgentes. |
| 3 (Baja) | `updateProfile`, `updatePreferences` | Operaciones que pueden esperar. |

### 11.4 Estrategias de Resolución de Conflictos

| Tipo de Mutación | Estrategia | Explicación |
|-----------------|------------|-------------|
| `login`, `register`, `logout` | server-wins | El servidor siempre tiene la razón para auth. |
| `addChild` | server-wins | Crea un recurso nuevo; el servidor decide el `studentId`. |
| `submitAnswer` | server-wins | El servidor calcula el score y feedback. El cliente acepta el resultado del servidor. |
| `updateProgress` | merge | Combina datos locales y del servidor. Se usa cuando el estudiante tiene progreso offline que debe fusionarse. |
| `updateProfile`, `updatePreferences` | last-write-wins | El último dato escrito prevalece. Suficiente para datos de un solo dispositivo. |

### 11.5 Retry (Exponential Backoff)

```
MAX_RETRY_ATTEMPTS = 3
INITIAL_RETRY_DELAY_MS = 1000

Attempt 1: espera 1s → falla
Attempt 2: espera 2s → falla
Attempt 3: espera 4s → falla → marca "failed" (no más retrys)
```

### 11.6 Background Sync

```typescript
initBackgroundSync() → ejecutado en App.tsx al montar

Comportamiento:
1. Al iniciar: verifica mutations pendientes y las procesa
2. Cada 30 segundos: verifica si hay mutations pendientes
3. Evento "online": procesa inmediatamente
4. Máximo 10 mutations por batch
5. Si falla, incrementa retryCount y espera al próximo ciclo
```

### 11.7 Máximo de Outbox

```
MAX_OUTBOX_SIZE = 50

Cuando se excede: se eliminan las mutations más antiguas (por createdAt) para hacer espacio.
Esto previene que la cola crezca indefinidamente.
```

---

## 12. Especificaciones Técnicas

### 12.1 IDs con Prefijos

| Entidad | Prefijo | Ejemplo | Generado por |
|---------|---------|---------|-------------|
| Ejercicio | `ex_` | `ex_001` | Backend |
| Lección | `les_` | `les_001` | Backend |
| Estudiante | `stu_` | `stu_001` | Backend |
| Padre | `par_` | `par_001` | Backend |
| Maestro | `tea_` | `tea_001` | Backend |
| Tenant/Escuela | `ten_` | `ten_001` | Backend |
| Attempt | `att_` | `att_001` | Backend |
| Sesión | `ses_` | `ses_001` | Backend |
| Clase | `cla_` | `cla_001` | Backend |

### 12.2 Timestamps

Siempre usar ISO 8601 en UTC:

```
"2024-01-15T10:30:00Z"
```

NO usar formatos locales ni Unix timestamps para fechas.

### 12.3 Paginación

Para endpoints que retornan listas:

```
GET /v1/students?page=1&limit=20
```

Response:
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

### 12.4 Variables de Entorno del Frontend

| Variable | Descripción | Default | 
|----------|-------------|---------|
| `VITE_API_BASE_URL` | URL base de la API | `""` (usa mocks) |
| `VITE_API_VERSION` | Versión de la API (no usado actualmente) | `"v1"` |
| `VITE_USE_MOCK` | Usar datos mock | `"true"` |
| `VITE_QUERY_STALE_TIME` | Tiempo stale de TanStack Query (segundos) | `"60"` |

Para conectar el backend real:

```env
VITE_USE_MOCK=false
VITE_API_BASE_URL=https://api-dev.amauta.axentra.io
VITE_API_VERSION=v1
```

---

## Apéndice A: Resumen de Endpoints

| Método | Endpoint | Autenticación | Request Body | Response Type | Frecuencia de uso |
|--------|----------|--------------|-------------|---------------|-------------------|
| POST | `/auth/login` | No | `{ email, password }` | `AuthResponse` | Login |
| POST | `/auth/register` | No | `{ name, email, password, confirmPassword, role }` | `AuthResponse` | Registro |
| POST | `/auth/logout` | Bearer token | — | `void` | Logout |
| POST | `/auth/refresh` | No | `{ refresh }` | `{ access, expiresIn }` | Automático (401) |
| GET | `/auth/me` | Bearer token | — | `AuthUser` | Inicialización |
| GET | `/students/{studentId}/next-exercise` | Bearer + Tenant | — | `{ exercise, sessionId }` | Cada ejercicio |
| POST | `/students/{studentId}/exercises/{exerciseId}/submit` | Bearer + Tenant | `{ answer, telemetry }` | `{ result: ExerciseResult }` | Cada respuesta |
| GET | `/students/{studentId}/dashboard` | Bearer + Tenant | — | `StudentDashboard` | Dashboard estudiante |
| GET | `/students/{studentId}/progress` | Bearer + Tenant | — | `StudentProgress` | Reportes |
| GET | `/parents/{parentId}/dashboard` | Bearer + Tenant | — | `ParentDashboard` | Dashboard padre |
| POST | `/parents/{parentId}/children` | Bearer + Tenant | `{ name, email, password }` | `ChildResponse` | Agregar hijo |
| GET | `/parents/{parentId}/report` | Bearer + Tenant + Student-Context | — | `ParentReport` | Reporte semanal |
| GET | `/teachers/{teacherId}/dashboard` | Bearer + Tenant | — | `TeacherDashboard` | Dashboard maestro |
| GET | `/teachers/{teacherId}/report` | Bearer + Tenant | `?classId=` | `TeacherReport` | Reporte de clase |

---

## Apéndice B: Archivos Clave del Frontend

| Propósito | Archivo |
|-----------|---------|
| Tipos de todos los endpoints | `src/features/exercises/domain/exercise.types.ts` |
| Tipos de autenticación | `src/features/auth/domain/types.ts` |
| Servicio HTTP (fetch wrapper) | `src/lib/http/client.ts` |
| Refresh de token | `src/lib/api/refresh.ts` |
| Cola offline | `src/lib/api/storage/offline-queue.ts` |
| Hook único de mutaciones | `src/lib/sync/useSafeMutation.ts` |
| Sync en background | `src/lib/sync/background-sync.ts` |
| Resolución de conflictos | `src/lib/sync/conflict.ts` |
| Mocks de ejercicios | `src/services/exercise.service.ts` |
| Keys de TanStack Query | `src/lib/query/keys.ts` |
| Esquema Dexie (tablas) | `src/lib/api/storage/db.ts` |
| Store de autenticación | `src/features/auth/presentation/store/auth-store.ts` |
| Adapter de auth (HTTP real) | `src/features/auth/infrastructure/mappers/adapter.ts` |
| Servicios de auth | `src/features/auth/infrastructure/services/auth.service.ts` |
| Storage de auth (Dexie) | `src/features/auth/infrastructure/auth-storage.ts` |
| Manejo de errores de auth | `src/features/auth/domain/auth-error.ts` |
