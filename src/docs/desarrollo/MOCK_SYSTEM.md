# Sistema de Mocks y Configuración de Entorno

## Propósito

Mientras el backend no está disponible, Amauta puede funcionar completamente con **datos mock**. Esto permite desarrollar y probar la UI, el flujo de login, y las funcionalidades offline sin depender de un servidor real.

## Cómo se activa el modo mock

La aplicación decide automáticamente si usar el adaptador mock o real según las variables de entorno:

```
┌──────────────────────────────────────────────────────────────┐
│ createAuthAdapter() (adapter.ts:324)                         │
│                                                              │
│   if (VITE_USE_MOCK === "true") ───────────► mockAdapter     │
│   if (!VITE_API_BASE_URL) ─────────────────► mockAdapter     │
│   else ────────────────────────────────────► realAdapter      │
└──────────────────────────────────────────────────────────────┘
```

| Condición | Adapter usado |
|-----------|--------------|
| `VITE_USE_MOCK=true` | Mock |
| `VITE_API_BASE_URL` vacío o ausente | Mock (fallback) |
| `VITE_USE_MOCK=false` + `VITE_API_BASE_URL` definido | Real |

### Misma lógica en refresh.ts:18

El archivo `src/lib/api/refresh.ts` usa exactamente la misma condición para decidir si refrescar el token contra el backend o contra un mock local.

### Misma lógica en auth.service.ts

Los endpoints de dashboard (`getParentDashboard`, `getTeacherDashboard`, `getStudentProgress`) también usan `USE_MOCKS` para devolver datos mock.

## Configuración del entorno

### 1. Crear archivo `.env`

Copia el archivo de ejemplo en la raíz del proyecto:

```bash
copy .env.example .env
```

O crea uno específico para desarrollo:

```bash
copy .env.example .env.development
```

### 2. Variables relevantes

| Variable | Valores | Efecto |
|----------|---------|--------|
| `VITE_USE_MOCK` | `true` o `false` | Activa/desactiva mocks |
| `VITE_API_BASE_URL` | URL del backend | Si está vacío, fuerza mocks |
| `VITE_API_VERSION` | `v1` | Versión del API (solo afecta al adapter real) |

### 3. Desarrollo sin backend (recomendado)

- `VITE_USE_MOCK=true`
- `VITE_API_BASE_URL` vacío (no hace falta definirlo)

### 4. Desarrollo contra backend real

- `VITE_USE_MOCK=false`
- `VITE_API_BASE_URL=https://api-dev.amauta.axentra.io`

## Usuarios mock disponibles

Definidos en `adapter.ts:86-141`.

| Email | Contraseña | Rol | ID |
|-------|-----------|-----|----|
| `student@amauta.com` | `123456` | student | `stu_001` |
| `parent@amauta.com` | `123456` | parent | `par_001` (con hijos Mario y Lucía) |
| `teacher@amauta.com` | `123456` | teacher | `tea_001` (con 2 clases) |

## Datos mock adicionales

- **Parent Dashboard**: 2 hijos (Mario, Lucía) con actividad reciente
- **Teacher Dashboard**: 2 clases, 5 estudiantes, progreso por materia
- **Student Progress**: Mario, materias (Matemáticas 75%, Español 85%, Ciencias 60%)
- **Register**: Crea un nuevo usuario de tipo `parent` con hijos vacíos
- **Add Child**: Crea un nuevo student y lo agrega al array local

## Mock de Refresh Token

En `src/lib/api/refresh.ts:18-23`:

```typescript
if (USE_MOCKS || !API_BASE_URL) {
  await delay(300);
  const newAccess = "mock_access_" + Date.now();
  await updateAccess(newAccess, 900);
  return { access: newAccess, expiresIn: 900 };
}
```

Simula un refresh exitoso devolviendo un nuevo token mock y actualizando Dexie.

## Archivos clave

| Archivo | Rol |
|---------|-----|
| `.env.example` | Plantilla de configuración |
| `src/features/auth/infrastructure/mappers/adapter.ts` | Adaptador mock/real con `MOCK_USERS` |
| `src/lib/api/refresh.ts` | Mock de refresh token |
| `src/features/auth/infrastructure/services/auth.service.ts` | Endpoints de dashboard con mock data |
| `src/features/auth/hooks/useAuth.ts` | Hook `useLogin` que orquesta la llamada |

## Cómo cambiar entre mock y real

1. Editar `.env`:
   ```
   VITE_USE_MOCK=false
   VITE_API_BASE_URL=https://api-dev.amauta.axentra.io
   ```
2. Reiniciar el servidor de desarrollo (`pnpm dev`).

## Notas

- Con `VITE_USE_MOCK=true`, todas las llamadas HTTP son simuladas; nunca se hace una petición real.
- **No necesitas internet** para usar los mocks, solo el navegador.
- El mock simula un delay de 800-1500ms en login y 300ms en refresh para emular la latencia real.
- Los datos mock persisten en IndexedDB (Dexie) igual que con el backend real.
