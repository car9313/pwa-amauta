# Login Page — Error UX Pattern

## Propósito

La función `getFriendlyError()` en `src/features/auth/presentation/pages/login-page.tsx` clasifica los errores de autenticación en **dos categorías de experiencia de usuario**:

| Categoría | UX | Componente |
|-----------|----|-----------|
| **Banner** | Error transitorio / de conexión — el usuario puede reintentar sin cambiar credenciales | `<FormErrorBanner>` con botón "Reintentar" |
| **Field-level** | Error de autenticación — el usuario debe corregir sus credenciales | Mensaje en el campo `password` vía `setError()` |

---

## Mapeo de Códigos

```typescript
function getFriendlyError(error: AuthError | null): {
  banner: AuthError | null;
  field: string | null;
}
```

Las constantes de agrupación están definidas en `src/features/auth/domain/auth-error-constants.ts`:

```typescript
// Errores de red/transitorios → banner con retry
export const NETWORK_ERROR_CODES: readonly AuthErrorCode[] = [
  "NETWORK_ERROR",
  "TIMEOUT",
  "REFRESH_FAILED",
] as const;

// Errores de autenticación → field-level en password
export const AUTH_FAILURE_CODES: readonly AuthErrorCode[] = [
  "TOKEN_INVALID",
  "TOKEN_REVOKED",
  "TOKEN_EXPIRED",
  "SESSION_NOT_FOUND",
] as const;

// Subconjunto para mensaje "sesión cerrada"
export const SESSION_CLOSED_CODES: readonly AuthErrorCode[] = [
  "TOKEN_REVOKED",
  "TOKEN_EXPIRED",
] as const;
```

| `error.code` | `banner` | `field` | Intención UX |
|-------------|----------|---------|-------------|
| `null` (sin error) | `null` | `null` | UI limpia, sin errores |
| `NETWORK_ERROR` | `error` | `null` | Sin conexión — mostrar banner con retry |
| `TIMEOUT` | `error` | `null` | Timeout de red — mostrar banner con retry |
| `REFRESH_FAILED` | `error` | `null` | Fallo al renovar token — mostrar banner con retry |
| `TOKEN_INVALID` | `null` | `"password"` | Token inválido — pedir re-login |
| `TOKEN_REVOKED` | `null` | `"password"` | Token revocado — pedir re-login |
| `TOKEN_EXPIRED` | `null` | `"password"` | Token expirado — pedir re-login |
| `SESSION_NOT_FOUND` | `null` | `"password"` | Sesión inexistente — pedir re-login |
| `default` (otro) | `error` | `null` | Error desconocido — banner como fallback seguro |

---

## Integración con React Hook Form

El `useEffect` en la línea 90 escucha cambios en `error` y llama a `setError("password", ...)` cuando el error se clasifica como field-level:

```typescript
useEffect(() => {
  if (!error) {
    setError("password", { type: "manual", message: undefined });
    return;
  }
  const { field } = getFriendlyError(error);
  if (field === "password") {
    const friendly =
      error.code === "TOKEN_REVOKED" || error.code === "TOKEN_EXPIRED"
        ? "Tu sesión fue cerrada. Inicia sesión de nuevo."
        : "No encontramos tu cuenta. ¿Está bien escrito tu correo?";
    setError("password", { type: "manual", message: friendly });
  } else {
    setError("password", { type: "manual", message: undefined });
  }
}, [error, setError]);
```

### Mensajes por código

| Código | Mensaje |
|--------|---------|
| `TOKEN_REVOKED` | "Tu sesión fue cerrada. Inicia sesión de nuevo." |
| `TOKEN_EXPIRED` | "Tu sesión fue cerrada. Inicia sesión de nuevo." |
| `TOKEN_INVALID` | "No encontramos tu cuenta. ¿Está bien escrito tu correo?" |
| `SESSION_NOT_FOUND` | "No encontramos tu cuenta. ¿Está bien escrito tu correo?" |

### Auto-limpieza al reconectar

```typescript
useEffect(() => {
  if (isOnline && error) {
    reset(); // limpia el error del hook useLogin
  }
}, [isOnline, error, reset]);
```

Cuando el usuario recupera conexión `(isOnline = true)` y hay un error presente, se llama a `reset()` para limpiar el estado. Esto es especialmente relevante para `REFRESH_FAILED`, que ocurre cuando se está offline y se intenta renovar el token.

---

## Diagrama de Flujo

```
Error de auth
     │
     ▼
getFriendlyError(error)
     │
     ├── error = null ──────────► { banner: null, field: null } ──► UI limpia
     │
     ├── NETWORK_ERROR / TIMEOUT / REFRESH_FAILED
     │                           ──► { banner: error, field: null }
     │                               │
     │                               ▼
     │                          <FormErrorBanner onRetry={...} />
     │                          (usuario hace clic en "Reintentar")
     │
     ├── TOKEN_INVALID / TOKEN_REVOKED / TOKEN_EXPIRED / SESSION_NOT_FOUND
     │                           ──► { banner: null, field: "password" }
     │                               │
     │                               ▼
     │                          setError("password", mensaje)
     │                          (usuario ve el error en el campo)
     │
     └── default                 ──► { banner: error, field: null }
                                    (fallback seguro: banner genérico)
```

---

## Por Qué Esta Separación

| Situación | Si usáramos banner | Si usáramos field |
|-----------|-------------------|-------------------|
| **`NETWORK_ERROR`** | ✅ Muestra "Sin conexión" + botón Reintentar. El usuario sabe que es un problema de red. | ❌ El usuario vería "contraseña incorrecta" cuando en realidad no hay internet. Confuso. |
| **`TIMEOUT`** | ✅ Muestra "Tiempo de espera" + Reintentar. El problema es transitorio. | ❌ El usuario cambiaría su contraseña innecesariamente. |
| **`TOKEN_EXPIRED`** | ❌ El usuario hace clic en Reintentar, pero el token sigue expirado. Vuelve a fallar. Loop infinito. | ✅ "Tu sesión fue cerrada. Inicia sesión de nuevo." El usuario entiende que debe re-ingresar. |
| **`TOKEN_REVOKED`** | ❌ Mismo problema: reintentar no ayuda porque el token fue revocado. | ✅ Mensaje claro + el usuario ingresa credenciales frescas. |
| **`SESSION_NOT_FOUND`** | ❌ Reintentar no crea una sesión nueva. | ✅ El usuario sabe que debe loguearse. |

**Conclusión**: Los errores transitorios (red, timeout) permiten reintentar con las mismas credenciales → banner con retry. Los errores de autenticación (token inválido, revocado, expirado, sesión no encontrada) requieren nuevas credenciales → field-level error.

---

## Archivos Relacionados

| Archivo | Rol |
|---------|-----|
| `src/features/auth/presentation/pages/login-page.tsx` | Contiene `getFriendlyError()` y los effects de UI |
| `src/features/auth/domain/auth-error.ts` | Define `AuthErrorCode`, `AuthError`, `mapHttpErrorToAuthError()` |
| `src/features/auth/domain/auth-error-constants.ts` | Constantes de agrupación: `NETWORK_ERROR_CODES`, `AUTH_FAILURE_CODES`, `SESSION_CLOSED_CODES` |
| `src/features/auth/presentation/components/FormErrorBanner.tsx` | Componente banner que renderiza el error con botón de retry |
| `src/docs/errores/ERROR_HANDLING.md` | Documentación general del sistema de errores |
