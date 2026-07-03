# Fase 8 — P5 TODOs

> Documento de planificación e implementación.
> ✅ = Completado | ❌ = Pendiente (con explicación)

---

## P5.1 — Configuración `.env` para backend real

**Estado**: ✅ Completado

**Archivos creados**:
- `.env.development` — `VITE_USE_MOCK=true`, `VITE_API_BASE_URL=https://api-dev.amauta.axentra.io`, `VITE_APP_VERSION=0.1.0`
- `.env.production` — `VITE_USE_MOCK=false`, `VITE_API_BASE_URL=https://api.amauta.axentra.io`, `VITE_APP_VERSION=0.1.0`

**Archivos editados**:
- `.env.example` — agregada sección `VITE_APP_VERSION`

Para conectar con backend real: copiar el `.env` correspondiente, cambiar `VITE_USE_MOCK=false` y ajustar `VITE_API_BASE_URL`.

---

## P5.2 — Screenshots al manifest

**Estado**: ⏳ Parcial

**Archivos creados**:
- `public/screenshots/` — carpeta lista

**Archivos editados**:
- `vite.config.ts` — agregado array `screenshots[]` al manifest del VitePWA plugin (3 entries: dashboard-student, lesson-view, practice-exercise)

**Pendiente**: ❌ Las imágenes PNG deben generarse con capturas reales de la app funcionando.
- **Por qué falta**: No hay backend operativo ni UI completa para tomar capturas realistas.
- **Necesario para implementar**: Ejecutar la app con datos reales, navegar a las rutas correspondientes y tomar capturas de pantalla. Colocar los archivos PNG en `public/screenshots/` con los nombres y tamaños especificados en el manifest.

---

## P5.3 — Manejo de HTTP 409 en `executeMutation()` + `resolveConflict()` con `serverData`

**Estado**: ✅ Completado

**Archivos editados**:

1. `src/features/auth/domain/auth-error.ts`
   - Agregado `CONFLICT` a `AuthErrorCode`
   - Agregado mensaje `CONFLICT` en `AUTH_ERROR_MESSAGES`

2. `src/lib/http/client.ts`
   - Agregado campo `serverData?: unknown` al constructor de `HttpError`
   - Agregado bloque específico para HTTP 409 en el manejador `!response.ok`: extrae el cuerpo de la respuesta como `serverData` y lo pasa al `HttpError`

3. `src/lib/sync/queue-manager.ts`
   - Importado `isHttpError` desde `@/lib/http/client`
   - En `executeMutation()`, el catch ahora detecta `HttpError` con `statusCode === 409` y `serverData`, llama a `resolveMutationConflict()` con los datos del servidor, y retorna `{ success: true, data: resolved.resolved }` — tratando el conflicto como éxito resuelto en vez de fallo

**Flujo resultante**:
```
HTTP 409 → HttpError(serverData) → executeMutation detecta 409 →
resolveMutationConflict(type, payload, serverData, timestamp) →
{ success: true, data: resolved } → processQueue lo marca como "done"
```

---

## P5.4 — `stopBackgroundSync()` cleanup en `App.tsx`

**Estado**: ✅ Completado

**Archivos editados**:
- `src/App.tsx`
  - Agregado `stopBackgroundSync` al import de `background-sync`
  - Agregado `return () => { stopBackgroundSync(); }` al useEffect de inicialización

Esto asegura que al desmontar el componente (StrictMode, hot-reload, etc.) se limpien el intervalo y los event listeners de online/offline.

---

## Resumen de archivos

| Archivo | Acción | Estado |
|---------|--------|--------|
| `.env.development` | Crear | ✅ |
| `.env.production` | Crear | ✅ |
| `.env.example` | Editar | ✅ |
| `public/screenshots/` | Crear carpeta | ✅ (pendiente imágenes) |
| `vite.config.ts` | Editar | ✅ |
| `src/features/auth/domain/auth-error.ts` | Editar | ✅ |
| `src/lib/http/client.ts` | Editar | ✅ |
| `src/lib/sync/queue-manager.ts` | Editar | ✅ |
| `src/App.tsx` | Editar | ✅ |

## Verificación

- `tsc --noEmit` — ✅ Sin errores de tipo
- `eslint .` — ✅ Sin errores nuevos (solo 6 pre-existentes no relacionados)
