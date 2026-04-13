# Manual de Pruebas - Amauta PWA

> **Estado actual:** La aplicación funciona con **mocks** (datos simulados). No hay backend real conectado.

---

## 1. Configuración Actual

### Variables de Entorno

El proyecto está configurado para usar mocks en desarrollo:

```env
# .env.development
VITE_USE_MOCK=true           # ← Mocks activados
VITE_API_BASE_URL=           # ← Vacío (sin backend)
VITE_API_VERSION=v1
VITE_AUTH_TOKEN_KEY=amauta_token
VITE_QUERY_STALE_TIME=60
```

### Arquitectura de Datos

| Componente | Tecnología | Propósito |
|------------|------------|-----------|
| **Auth** | Zustand + localStorage | Estado global de autenticación |
| **Datos** | TanStack Query + Mocks | Fetching y caching de datos |
| **Forms** | React Hook Form + Zod | Validación de formularios |

---

## 2. Preparación para Pruebas

### 2.1 Iniciar la Aplicación

```bash
cd pwa-amauta
pnpm install
pnpm dev
```

Acceder a: `http://localhost:5173`

### 2.2 Limpiar Sesión Previa

**Importante:** Antes de probar, limpia el localStorage para partir de cero:

1. Abre DevTools (F12)
2. Ve a **Application** → **Local Storage** → `http://localhost:5173`
3. Elimina las claves:
   - `amauta-auth` (estado de autenticación)
   - `amauta_token` (token si existe)

O ejecuta en la consola del navegador:
```javascript
localStorage.removeItem('amauta-auth');
localStorage.removeItem('amauta_token');
```

---

## 3. Flujos de Prueba

### 3.1 Flujo de Registro

**Objetivo:** Registrar un nuevo usuario y seleccionar rol.

**Pasos:**

1. Ir a `http://localhost:5173/register`
2. Seleccionar tipo de cuenta:
   - **Estudiante** (predeterminado)
   - **Padre o Madre**
3. Completar formulario:
   ```
   Nombre completo:  Juan Pérez
   Email:           juan@test.com
   Contraseña:      123456
   Confirmar:       123456
   ```
4. Click en **"Registrarme"**

**Resultado esperado:**
- Animación de carga (spinner)
- Redirección a `/roles` (selección de rol)
- Sesión guardada en localStorage

**Verificación:**
- Abrir DevTools → Application → Local Storage
- Verificar que `amauta-auth` contiene `isAuthenticated: true`

---

### 3.2 Flujo de Login

#### Login como Estudiante

**Pasos:**

1. Ir a `http://localhost:5173/login`
2. Ingresar credenciales:
   ```
   Email:      mario@ejemplo.com
   Contraseña: cualquier texto
   ```
3. Click en **"Entrar"**

**Lógica del mock:**
```javascript
// auth.mock.ts
if (email.includes('parent')) {
  return mockLoginParentSuccess  // Usuario padre
}
return mockLoginSuccess         // Usuario estudiante
```

**Resultado esperado:**
- Animación de carga
- Redirección directa a `/dashboard/student`

---

#### Login como Padre/Madre

**Pasos:**

1. Ir a `http://localhost:5173/login`
2. Ingresar credenciales:
   ```
   Email:      parent@test.com    ← Debe contener "parent"
   Contraseña: cualquier texto
   ```
3. Click en **"Entrar"**

**Resultado esperado:**
- Animación de carga
- Redirección directa a `/dashboard/parent`

---

### 3.3 Flujo de Selección de Rol

**Objetivo:** Seleccionar rol después de registro.

**Pasos:**

1. Completar registro (flujo 3.1)
2. En `/roles`, ver dos opciones:
   - **Soy Estudiante** → Dashboard de estudiante
   - **Soy Padre o Madre** → Dashboard de padre
3. Click en la opción deseada
4. Click en **"Continuar"**

**Resultado esperado:**
- Redirección al dashboard correspondiente
- Rol guardado en Zustand store

---

### 3.4 Navegación en Dashboard

**Dashboard Estudiante** (`/dashboard/student`):

Contiene:
- Progreso general (72%)
- Materias con nivel de dominio
- Logros obtenidos
- Áreas por mejorar
- Estadísticas de racha

**Dashboard Padre** (`/dashboard/parent`):

Contiene:
- Perfil del padre
- Lista de hijos (Mario, Lucía)
- Estadísticas de cada hijo
- Actividad reciente

---

### 3.5 Otras Rutas

| Ruta | Descripción |
|------|-------------|
| `/lessons` | Lista de lecciones |
| `/progress` | Pantalla de niveles |
| `/roles` | Selección de rol |

---

## 4. Validación de Formularios

### Login

| Caso | Resultado esperado |
|------|-------------------|
| Email vacío | "Ingresa un correo válido" |
| Email sin @ | "Ingresa un correo válido" |
| Contraseña < 6 chars | "Mínimo 6 caracteres" |

### Registro

| Caso | Resultado esperado |
|------|-------------------|
| Nombre vacío | "El nombre es requerido" |
| Email inválido | "Ingresa un correo válido" |
| Contraseña < 6 chars | "Mínimo 6 caracteres" |
| Contraseñas diferentes | "Las contraseñas deben ser iguales" |

---

## 5. Estados de la Aplicación

### 5.1 Estados de Carga

- **AuthLoadingScreen:** Pantalla completa durante validación inicial
- **Spinner en botones:** Durante login/registro
- **Skeleton loaders:** En dashboards (si implementado)

### 5.2 Estados de Error

- Errores de validación se muestran debajo de cada campo
- Errores de autenticación se muestran en el campo de contraseña

### 5.3 Estados Offline (PWA)

- Indicador de conexión en header
- Funcionalidad offline lista para implementar

---

## 6. usuarios Mock Disponibles

### 6.1 Datos de Login

| Email | Rol | Dashboard |
|-------|-----|-----------|
| `mario@ejemplo.com` | Estudiante | `/dashboard/student` |
| `parent@test.com` | Padre | `/dashboard/parent` |
| `cualquier@texto.com` | Estudiante | `/dashboard/student` |

> **Nota:** La contraseña es ignorada en el mock (cualquier texto funciona).

### 6.2 Datos de Dashboard Estudiante

```json
{
  "studentName": "Mario",
  "overallProgress": 72,
  "subjects": [
    { "subjectName": "Matemáticas", "mastery": 0.75 },
    { "subjectName": "Español", "mastery": 0.85 },
    { "subjectName": "Ciencias", "mastery": 0.60 },
    { "subjectName": "Ciencias Sociales", "mastery": 0.90 }
  ],
  "achievements": [
    { "title": "Primera Racha" },
    { "title": "Nivel 2" },
    { "title": "100% Precisión" }
  ]
}
```

### 6.3 Datos de Dashboard Padre

```json
{
  "parent": {
    "name": "Ana María",
    "children": [
      { "name": "Mario", "level": 2, "points": 156, "precision": 85 },
      { "name": "Lucía", "level": 3, "points": 234, "precision": 92 }
    ]
  },
  "recentActivity": [
    { "childName": "Mario", "action": "Completó lección" },
    { "childName": "Lucía", "action": "Alcanzó nivel 3" }
  ]
}
```

---

## 7. Verificación en Consola

### Logs disponibles

El servicio de auth tiene logs de debug:

```javascript
// auth.service.ts
console.log(credentials)  // Ver email/password ingresados
console.log(USE_MOCK)      // Verificar si mocks están activos
```

### Estado de Zustand

Para inspeccionar el estado de autenticación:

```javascript
// En la consola del navegador
JSON.parse(localStorage.getItem('amauta-auth') || '{}')
```

---

## 8. Cambiar entre Mocks y API Real

### Usar Mocks (actual)

```env
VITE_USE_MOCK=true
VITE_API_BASE_URL=
```

### Usar API Real (futuro)

```env
VITE_USE_MOCK=false
VITE_API_BASE_URL=https://tu-api.com
```

> **Nota:** Requiere reiniciar el servidor de desarrollo.

---

## 9. Comandos de Verificación

```bash
# Build de producción
pnpm build

# Linting
pnpm lint

# Desarrollo
pnpm dev
```

---

## 10. Problemas Conocidos

1. **Chunk size warning:** El bundle es > 500KB. Code-splitting pendiente.
2. **Errores de lint preexistentes:** Algunos archivos tienen advertencias de React 19 que no afectan funcionalidad.

---

## 11. Próximos Pasos

1. Conectar API real (cambiar `VITE_USE_MOCK=false`)
2. Implementar logout funcional
3. Code-splitting para mejorar performance
4. Tests unitarios con Vitest
