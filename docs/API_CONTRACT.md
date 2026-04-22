# Contrato de API - PWA Amauta

> Este documento define el contrato entre el frontend (React) y el backend (API REST).
> El backend debe implementar estos endpoints para que el frontend funcione sin cambios.

## Tabla de Contenidos

1. [Visión General](#visión-general)
2. [Entidades del Dominio](#entidades-del-dominio)
3. [Endpoints de Autenticación](#endpoints-de-autenticación)
4. [Endpoints de Ejercicios](#endpoints-de-ejercicios)
5. [Endpoints de Progreso](#endpoints-de-progreso)
6. [Endpoints de Estudiantes (Hijos)](#endpoints-de-estudiantes-hijos)
7. [Endpoints de Lecciones](#endpoints-de-lecciones)
8. [Endpoints de Reportes](#endpoints-de-reportes)
9. [Encabezados Requeridos](#encabezados-requeridos)
10. [Códigos de Respuesta](#códigos-de-respuesta)

---

## Visión General

### URL Base

```
{API_BASE_URL}/{API_VERSION}
https://api.amauta.com/v1
```

| Variable | Descripción | Ejemplo |
|----------|------------|---------|
| `API_BASE_URL` | Dominio donde está desplegada la API | `https://api.amauta.com` |
| `API_VERSION` | Versión de la API (v1, v2, etc.) | `v1` |

### Autenticación

| Tipo | Descripción |
|------|-------------|
| Bearer Token (JWT) | Token JWT en header Authorization |

### Formato de Datos

Todos los cuerpos de solicitud y respuesta usan **JSON**.

---

## Entidades del Dominio

### Exercise (Ejercicio)

> Representa un ejercicio matemático que el estudiante debe resolver.
> Es la entidad principal de la aplicación educativa.

```typescript
interface Exercise {
  // ID único del ejercicio (prefijado con ex_)
  exerciseId: string;        // "ex_001"
  
  // Tipo de ejercicio - define la operación matemática y presentación
  // VISUAL = muestra elementos visuales (manzanas, bloques)
  // TEXT = solo texto
  // INTERACTIVE = interacción toca/mueve
  type: "VISUAL_ADDITION" | "VISUAL_SUBTRACTION" | "VISUAL_MULTIPLICATION" | 
        "VISUAL_DIVISION" | "TEXT_PROBLEM" | "INTERACTIVE"
  
  // Tema al que pertenece el ejercicio (para agrupar por tema)
  // Se usa para determinar el "camino" de aprendizaje
  topicId: string;         // "math_addition", "math_subtraction"
  
  // La pregunta/problema que el estudiante debe resolver
  prompt: string;          // "Resuelve: 5 + 3 = ?"
  
  // Tipo de respuesta esperada del estudiante
  // NUMERIC = número (campo de texto que espera número)
  // TEXT = respuesta abierta en texto
  // SELECT = opción única entre varias
  // MULTIPLE_CHOICE = una o múltiples opciones
  answerType: "NUMERIC" | "TEXT" | "SELECT" | "MULTIPLE_CHOICE"
  
  // Nivel de dificultad del ejercicio
  // LOW = fácil (2 estrellas)
  // MEDIUM = medio (3 estrellas)
  // HIGH = difícil (5 estrellas)
  difficulty: "LOW" | "MEDIUM" | "HIGH"
  
  // Array de pistas/ayudas para el estudiante
  // Se muestran una por una si el estudiante pide ayuda
  hints: string[];         // ["Cuenta con tus dedos", "Sumar es agregar más"]
  
  // Estilo del feedback cuando responde
  // ENCOURAGING = positivo motivación
  // NEUTRAL = objetivo
  // CORRECTIVE = indica errores específicos
  feedbackStyle: "ENCOURAGING" | "NEUTRAL" | "CORRECTIVE"
  
  // Paso actual en ejercicios multi-paso (opcional)
  stepCurrent?: number;
  
  // Total de pasos en ejercicios multi-paso (opcional)
  stepTotal?: number;
  
  // Contenido de demostración visual (opcional)
  // Puede ser un SVG, imagen, o texto que muestra el concepto
  demoContent?: string;
  
  // Segunda pregunta relacionada (opcional)
  // Para ejercicios que tienen pregunta principal y secundaria
  secondaryQuestion?: string;
  
  // Instrucciones adicionales bajo la pregunta (opcional)
  subInstruction?: string;
}
```

**Para qué sirve:** Es el contenido educativo principal. El estudiante ve el `prompt`, intenta resolver, y envía su `answer`.

---

### ExerciseResult (Resultado de Ejercicio)

> Respuesta del servidor después de que el estudiante envía una respuesta.
> Indica si respondió correctamente y qué debe hacer después.

```typescript
interface ExerciseResult {
  // ID único del intento/resultado
  attemptId: string;         // "att_001"
  
  // Puntuación del 0 al 100
  // 100 = todo correcto
  // 0 = todo wrong
  score: number;            // 0-100
  
  // Si aprobó o no (score >= 70 se considera passed)
  passed: boolean;
  
  // Errores que cometió el estudiante
  // Análisis automático de errores comunes
  mistakes: Mistake[];
  
  // Feedback textual para el estudiante
  feedbackSummary: string;
  
  // Qué debe hacer después (siguiente paso en su aprendizaje)
  nextAction: NextActionDetail;
}

interface Mistake {
  // Tipo de error cometido
  // CARRY_MISSED =Se forgetó llevar el acarreo
  // COLUMN_MISALIGN = Desalineó las columnas
  // SIGN_ERROR = Error de signo (+/-)
  // CALCULATION_ERROR = Error de cuenta
  type: "CARRY_MISSED" | "COLUMN_MISALIGN" | "SIGN_ERROR" | "CALCULATION_ERROR"
  
  // Qué tan grave (0 a 1)
  severity: number;        // 0-1
}

interface NextActionDetail {
  // Acción recomendada para el siguiente ejercicio
  // REINFORCE = Repetir ejercicios similares
  // ADVANCE = Avanzar al siguiente tema
  // REMEDIATE = Ir atrás a fundamentals
  action: "REINFORCE" | "ADVANCE" | "REMEDIATE"
  
  // Topic al que debe ir
  topicId: string;
  
  // Pedagógica preferida (cómo更喜欢 aprender)
  pedagogy: "VISUAL" | "TEXT" | "INTERACTIVE"
}
```

**Para qué sirve:** Después de responder, el estudiante ve  y recibe recomendaciones para su siguiente paso.

---

### Student (Estudiante - Vista Niño)

> Perfil del estudiante cuando inicia sesión como niño.
> Muestra su progreso gamificado (nivel, puntos, racha).

```typescript
interface Student {
  // ID único del estudiante
  studentId: string;        // "stu_001"
  
  // Nombre del estudiante
  name: string;
  
  // URL de su avatar/IMAGEN de perfil (opcional)
  avatar?: string;
  
  // Nivel actual en el juego (1, 2, 3...)
  // Sube de nivel al ganar suficientes puntos
  level: number;         // 1+
  
  // Puntos acumulados
  // Gana puntos al completar ejercicios
  points: number;       // 0+
  
  // Porcentaje de respuestas correctas (0-100)
  // Mide su precisión general
  precision: number;      // 0-100
  
  // Días consecutivos que ha practicado
  // Si un día no practica, se reinicia a 0
  streakDays: number;   // 0+
  
  // Array de 7 booleanos representando la semana
  // [lunes, martes, miércoles, jueves, viernes, sábado, domingo]
  // true = practicó ese día
  streakWeek: boolean[];  // [true, true, true, false, false, false, false]
}
```

**Para qué sirve:** Se muestra en el dashboard del niño. Motivación para seguir practicando.

---

### ChildProfile (Perfil del Hijo - Vista Padre)

> Perfil del hijo cuando el padre lo ve.
> Versión simplificada sin campos de gamificación.

```typescript
interface ChildProfile {
  // ID del hijo
  studentId: string;
  
  // Nombre del hijo
  name: string;
  
  // Avatar (opcional)
  avatar?: string;
  
  // Nivel en el que está
  level: number;
  
  // Puntos totales acumulados
  points: number;
  
  // Precisión general (0-100)
  precision: number;
  
  // Días streak actuales
  streakDays: number;
}
```

**Para qué sirve:** El padre ve la información de su hijo en su dashboard.

---

### StudentDashboard (Dashboard del Estudiante)

> Dashboard principal que ve el estudiante al abrir la app.
> Incluye agenda, progreso y logros recientes.

```typescript
interface StudentDashboard {
  // Perfil del estudiante
  student: Student;
  
  // Lecciones programadas para hoy/semana
  // Muestra qué debe practicar
  agenda: AgendaItem[];
  
  // Progreso por tema/topic
  // Muestra dominio por cada área
  progress: ProgressItem[];
  
  // Logros recientes obtidos
  // Para motivar
  recentAchievements: Achievement[];
}

interface AgendaItem {
  // ID de la lección
  lessonId: string;
  
  // Título de la lección
  title: string;
  
  // Materia (math, español, ciencia)
  subject: string;
  
  // Cuándo está programada (ISO 8601)
  scheduledAt: string;    // "2024-01-15T10:30:00Z"
  
  // Duración expected en minutos
  durationMinutes: number;
  
  // Si ya completó la lección
  completed: boolean;
  
  // Pista del topic (opcional)
  topicHint?: string;
}

interface ProgressItem {
  // ID del topic
  topicId: string;
  
  // Nombre del topic
  title: string;
  
  // Dominio en este topic (0-100)
  mastery: number;         // 0-100
}

interface Achievement {
  // ID único del logro
  id: string;
  
  // Título del logro
  title: string;
  
  // Descripción
  description: string;
  
  // Tipo de logro (para mostrar icono)
  // streak = por racha
  // level = por subir nivel
  // accuracy = por precisión
  type: "streak" | "level" | "accuracy"
}
```

**Para qué sirve:** Es la pantalla principal del estudiante.

---

### StudentProgress (Progreso del Estudiante)

> Reporte detallado del progreso del estudiante.
>区分 usarlo para padres y maestros.

```typescript
interface StudentProgress {
  // ID del estudiante
  studentId: string;
  
  // Nombre del estudiante
  studentName: string;
  
  // Progreso general (0-100)
  overallProgress: number;  // 0-100
  
  // Progreso por materia
  subjects: SubjectProgress[];
  
  // Logros obtenidos
  achievements: ProgressAchievement[];
  
  // Áreas donde necesita practicar más
  weakAreas: WeakArea[];
}

interface SubjectProgress {
  // ID de la materia
  subjectId: string;
  
  // Nombre de la materia
  subjectName: string;    // "Matemáticas"
  
  // Dominio en esta materia (0-100)
  mastery: number;      // 0-100
  
  // Última vez que practicó esta materia
  lastPractice: string; // ISO 8601
}

interface ProgressAchievement {
  // ID del logro
  id: string;
  
  // Título
  title: string;
  
  // Descripción
  description: string;
  
  // Cuándo lo obtuvo
  earnedAt: string;   // ISO 8601
}

interface WeakArea {
  // Topic donde tiene dificultades
  topicId: string;
  
  // Nombre del topic
  topicName: string;
  
  // Recomendación específica para mejorar
  recommendation: string;
}
```

**Para qué sirve:** Para mostrar reportes a padres y maestros.

---

### AuthUser (Usuario Autenticado)

> Usuario que ha iniciado sesión.
> Hay 3 tipos: student, parent, teacher.

```typescript
// ESTUDIANTE - Cuando el usuario es un niño
interface StudentUser {
  // Nombre completos
  name: string;
  
  // Email (para login)
  email: string();
  
  // ID de la escuela/tenant
  tenantId: string;
  
  // Rol fixed como student
  role: "student";
  
  // ID del estudiante (para relacionar con progress)
  studentId: string;
}

// PADRE - Cuando el usuario es un padre/madre
interface ParentUser {
  name: string;
  email: string;
  tenantId: string;
  role: "parent";
  
  // ID del padre (para /parents/{parentId}/...)
  parentId: string;
  
  // Lista de hijos registrados bajo este padre
  children: ChildProfile[];
}

// MAESTRO - Cuando el usuario es un maestro
interface TeacherUser {
  name: string;
  email: string;
  tenantId: string;
  role: "teacher";
  
  // ID del maestro
  teacherId: string;
  
  // Lista de clases que enseña
  classIds: string[];
}
```

**Para qué sirve:**
- Determina qué puede hacer el usuario
- Determina qué ve el usuario (dashboard diferente)
- Se guarda en Dexie al hacer login

---

### ParentReport (Reporte para Padres)

> Reporte semanal que ve un padre sobre el progreso de su hijo.

```typescript
interface ParentReport {
  // ID del hijo al que refiere el reporte
  studentId: string;
  
  // Rango de fechas de la semana
  // Formato: "Ene 8 - Ene 14"
  weekRange: string;
  
  // Resumen textual del progreso
  summary: string;
  
  // Cosas positivas de la semana
  highlights: string[];
  
  // Recomendaciones para la próxima semana
  nextSteps: string[];
}
```

**Para qué sirve:** El padre recibe un resumen cada semana.

---

### TeacherReport (Reporte para Maestros)

> Reporte de una clase para el maestro.
> Muestra el progreso de todos los estudiantes.

```typescript
interface TeacherReport {
  // ID de la clase
  classId: string;
  
  // Resumen de cada estudiante
  studentSummaries: StudentSummary[];
}

interface StudentSummary {
  // ID del estudiante
  studentId: string;
  
  // Dominio general del estudiante (0-100)
  mastery: number;
  
  // Banderas de riesgo
  // ["Necesita apoyo en suma", "Bajo dominio"]
  riskFlags: string[];
}
```

**Para qué sirve:** El maestro puede ver quién necesita help adicional.

---

## Endpoints de Autenticación

### POST /auth/login

> Endpoint para iniciar sesión.
> Retorna el usuario y tokens JWT.

```http
POST /v1/auth/login
Content-Type: application/json

Cuerpo de la solicitud (Request Body):
{
  "email": "usuario@email.com",    // Email registrado
  "password": "password123"       // Password del usuario
}

 Respuesta (201 Created):
{
  // Datos del usuario (según su rol)
  "user": { 
    "name": "Juan Pérez",
    "email": "juan@email.com",
    "tenantId": "ten_001",
    "role": "parent",
    "parentId": "par_001",
    "children": [...]
  },
  
  // Token JWT de acceso (dura 1 hora típicamente)
  "token": "eyJhbGciOiJIUzI1NiIs...",
  
  // Token para refresh (dura más, ej. 7 días)
  "refresh": "eyJhbGciOiJIUzI1NiIs...",
  
  // Cuántos segundos dura el token
  "expiresIn": 3600,
  
  // ID de la escuela/tenant ( redundante con user.tenantId)
  "tenantId": "ten_001"
}
```

---

### POST /auth/register

> Registrar nuevo usuario (padre, estudiante, o maestro).

```http
POST /v1/auth/register
Content-Type: application/json

Cuerpo de la solicitud:
{
  "name": "Juan Pérez",           // Nombre completos
  "email": "juan@email.com",    // Email (debe ser único)
  "password": "password123",   // Mínimo 6 caracteres
  "role": "parent",            // "student" | "parent" | "teacher"
  "tenantId": "ten_001"        // ID de la escuela
}

 Respuesta (201 Created):
{
  "user": { ...AuthUser },
  "token": "jwt_token"         // Solo token de acceso
}
```

---

### POST /auth/refresh

> Usar el refresh token para obtener un nuevo access token.
> El access token expira rápido, el refresh dura más.

```http
POST /v1/auth/refresh
Authorization: Bearer {refresh_token}

 Respuesta (200 OK):
{
  "token": "new_jwt_token",
  "expiresIn": 3600
}
```

---

### POST /auth/logout

> Cerrar sesión (invalidar tokens).

```http
POST /v1/auth/logout
Authorization: Bearer {access_token}

 Respuesta (200 OK):
{ }
```

---

## Endpoints de Ejercicios

### GET /students/{studentId}/next-exercise

> Obtener el siguiente ejercicio que debe resolver el estudiante.
> El decide qué ejercicio viene basándose en progreso anterior.

```http
GET /v1/students/stu_001/next-exercise
X-Student-Context: stu_001
Authorization: Bearer {access_token}

 Respuesta (200 OK):
{
  // El ejercicio a resolver
  "exercise": {
    "exerciseId": "ex_001",
    "type": "VISUAL_ADDITION",
    "topicId": "math_addition",
    "prompt": "Resuelve: 5 + 3 = ?",
    "answerType": "NUMERIC",
    "difficulty": "LOW",
    "hints": ["Cuenta con tus dedos"],
    "feedbackStyle": "ENCOURAGING"
  },
  
  // ID de la sesión (para identificar el flujo)
  "sessionId": "ses_001"
}
```

---

### POST /students/{studentId}/exercises/{exerciseId}/submit

> Enviar la respuesta del estudiante a un ejercicio.

```http
POST /v1/students/stu_001/exercises/ex_001/submit
Content-Type: application/json
X-Student-Context: stu_001
Authorization: Bearer {access_token}

Cuerpo de la solicitud:
{
  "answer": "8",                    // Respuesta del estudiante
  
  // Telemetry = datos sobre cómo respondió
  "telemetry": {
    "responseTimeMs": 5000,         // Milisegundos que tardó
    "hintsUsed": 0,                // Cuántas pistas usó
    "abandoned": false             // Si abandonó sin responder
  }
}

 Respuesta (200 OK):
{
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
```

---

## Endpoints de Progreso

### GET /students/{studentId}/progress

> Obtener el progreso detallado del estudiante.
> Usado para reportes.

```http
GET /v1/students/stu_001/progress
X-Student-Context: stu_001
Authorization: Bearer {access_token}

 Respuesta (200 OK):
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

---

### GET /students/{studentId}/dashboard

> Obtener el dashboard del estudiante.
> Es la pantalla principal cuando inicia sesión.

```http
GET /v1/students/stu_001/dashboard
X-Student-Context: stu_001
Authorization: Bearer {access_token}

 Respuesta (200 OK):
{
  "student": {
    "studentId": "stu_001",
    "name": "Mario",
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

---

## Endpoints de Estudiantes (Hijos)

### GET /parents/{parentId}/children

> Listar todos los hijos de un padre.

```http
GET /v1/parents/par_001/children
Authorization: Bearer {access_token}

 Respuesta (200 OK):
{
  "children": [
    {
      "studentId": "stu_001",
      "name": "Mario",
      "level": 2,
      "points": 156,
      "precision": 85,
      "streakDays": 4
    },
    {
      "studentId": "stu_002",
      "name": "Ana",
      "level": 1,
      "points": 50,
      "precision": 70,
      "streakDays": 1
    }
  ]
}
```

---

### POST /parents/{parentId}/children

> Agregar un nuevo hijo (registrar otro estudiante).
> El padre puede registrar varios hijos.

```http
POST /v1/parents/par_001/children
Content-Type: application/json
Authorization: Bearer {access_token}

Cuerpo de la solicitud:
{
  "name": "Mario",              // Nombre del hijo
  "email": "mario@email.com",    // Email (para login del hijo)
  "password": "mario123"       // Password inicial
}

 Respuesta (201 Created):
{
  "studentId": "stu_002",
  "name": "Mario",
  "level": 1,
  "points": 0,
  "precision": 0,
  "streakDays": 0
}
```

---

### PUT /parents/{parentId}/children/{studentId}

> Actualizar datos de un hijo.

```http
PUT /v1/parents/par_001/children/stu_002
Content-Type: application/json
Authorization: Bearer {access_token}

Cuerpo de la solicitud:
{
  "name": "Mario Actualizado"
}

 Respuesta (200 OK):
{
  "studentId": "stu_002",
  "name": "Mario Actualizado",
  "level": 1,
  "points": 0,
  "precision": 0,
  "streakDays": 0
}
```

---

### DELETE /parents/{parentId}/children/{studentId}

> Eliminar (dar de baixa) un hijo.

```http
DELETE /v1/parents/par_001/children/stu_002
Authorization: Bearer {access_token}

 Respuesta (204 No Content):
{ }
```

---

## Endpoints de Lecciones

### GET /lessons

> Listar todas las lecciones disponibles.

```http
GET /v1/lessons
Authorization: Bearer {access_token}

Respuesta (200 OK):
{
  "lessons": [
    {
      "id": "les_001",
      "title": "Suma Básica",
      "subject": "math",
      "exerciseIds": ["ex_001", "ex_002"],
      "grade": 1
    }
  ]
}
```

---

### GET /lessons/{lessonId}

> Obtener una lección específica.

```http
GET /v1/lessons/les_001
Authorization: Bearer {access_token}

 Respuesta (200 OK):
{
  "id": "les_001",
  "title": "Suma Básica",
  "subject": "math",
  "exerciseIds": ["ex_001", "ex_002"],
  "grade": 1
}
```

---

## Endpoints de Reportes

### GET /parents/{parentId}/report

> Obtener reporte semanal de un hijo.

```http
GET /v1/parents/par_001/report
Authorization: Bearer {access_token}
X-Student-Context: stu_001  (opcional - si no se pone, traer todos los hijos)

 Respuesta (200 OK):
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

---

### GET /teachers/{teacherId}/report

> Obtener reporte de una clase.

```http
GET /v1/teachers/tea_001/report
Authorization: Bearer {access_token}
Query: ?classId=cla_001

 Respuesta (200 OK):
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

---

## Encabezados Requeridos

### authorization

```http
Authorization: Bearer {access_token}
```
> Token JWT de acceso. Se obtiene del login.
> Se envía en casi todas las solicitudes.

### X-Tenant-Id (Encabezado)

```http
X-Tenant-Id: {tenantId}
```
> ID de la escuela/tenant.
> Se necesita para identificar a qué escuela pertenece el usuario.
> Geralmente se obtiene del usuario logueado.

### X-Student-Context (Encabezado)

```http
X-Student-Context: {studentId}
```
> Cuando un padre está viendo datos de un hijo específico.
> Permite al servidor saber "en nombre de quién" se hace la solicitud.
> Útil cuando el padre tiene múltiples hijos.

### Content-Type

```http
Content-Type: application/json
```
> Siempre incluir en requests con body.

---

## Códigos de Respuesta HTTP

| Código | Significado | Cuándo ocurre |
|--------|-------------|---|
| 200 | OK | La solicitud fue exitosa |
| 201 | Created | Se creó un nuevo recurso (register, addChild) |
| 204 | No Content | La solicitud fue exitosa pero no hay body (delete) |
| 400 | Bad Request | El body de la solicitud es inválido |
| 401 | Unauthorized | No hay token o está expirado |
| 403 | Forbidden | El usuario no tiene permiso |
| 404 | Not Found | El recurso no existe |
| 409 | Conflict | Conflicto de datos (email duplicado) |
| 422 | Unprocessable Entity | Datos válidos pero no procesables |
| 500 | Internal Server Error | Error inesperado en el servidor |

---

## Formato de Errores

```http
{
  "message": "Descripción legible del error",
  "code": "ERROR_CODE",          // Código interno para debugging
  "details": { }                 // Detalles adicionales (opcional)
}
```

Ejemplo:

```json
{
  "message": "El email ya está registrado",
  "code": "EMAIL_ALREADY_EXISTS",
  "details": {
    "field": "email"
  }
}
```

---

## Notas para el Backend

### 1. IDs
Usar prefijos consistentes:

| Entidad | Prefijo | Ejemplo |
|---------|---------|--------|
| Ejercicio | `ex_` | `ex_001` |
| Lección | `les_` | `les_001` |
| Estudiante | `stu_` | `stu_001` |
| Padre | `par_` | `par_001` |
| Maestro | `tea_` | `tea_001` |
| Tenant/escuela | `ten_` | `ten_001` |
| Attempt | `att_` | `att_001` |
| Sesión | `ses_` | `ses_001` |
| Clase | `cla_` | `cla_001` |

### 2. Timestamps
Usar ISO 8601 en UTC:

```
"2024-01-15T10:30:00Z"
```

NO usar:
- `"2024-01-15 10:30:00"`
- `"15/01/2024"`
- Timestamps Unix (segundos)

### 3. Pagination
Para endpoints que retornan listas, implementar pagination:

```
GET /v1/exercises?page=1&limit=20
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

### 4. Rate Limiting
Considerar rate limiting para:
- Endpoints de escritura (POST, PUT, DELETE)
- Para evitar abuse
- Especialmente en `/auth/login`

### 5. Websockets (Opcional)
Para tiempo real:
- Notificaciones cuando el padre recibe mensaje
- Actualización de líderboards
- Chat entre padre/maestro (si se implementa)

---

## Variables de Entorno del Frontend

El frontend usa estas variables de entorno:

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `VITE_USE_MOCK` | Si usar mocks en lugar de API real | `"true"` |
| `VITE_API_BASE_URL` | URL base de la API | `"https://api.amauta.com"` |
| `VITE_API_VERSION` | Versión de la API | `"v1"` |
| `VITE_AUTH_TOKEN_KEY` | Key del token en localStorage | `"amauta_token"` |
| `VITE_QUERY_STALE_TIME` | Tiempo stale de queries (segundos) | `"60"` |

Para conectar el backend real:
1. Cambiar `VITE_USE_MOCK` a `"false"`
2. Configurar `VITE_API_BASE_URL` a la URL del backend