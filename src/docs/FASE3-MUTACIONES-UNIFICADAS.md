# Fase 3: Unificación de Mutaciones + Optimistic Updates + Manejo de Riesgos PWA

## Índice

1. [Diagnóstico del problema actual](#1-diagnóstico-del-problema-actual)
2. [Qué se va a implementar](#2-qué-se-va-a-implementar)
3. [Por qué se implementa](#3-por-qué-se-implementa)
4. [Ventajas y Desventajas](#4-ventajas-y-desventajas)
5. [Qué problemas resuelve realmente](#5-qué-problemas-resuelve-realmente)
6. [Diagrama de flujo del proceso](#6-diagrama-de-flujo-del-proceso)
7. [Impacto en la PWA](#7-impacto-en-la-pwa)
8. [Resumen de archivos modificados](#8-resumen-de-archivos-modificados)

---

## 1. Diagnóstico del problema actual

El proyecto tiene **3 caminos de mutación fragmentados** que operan de forma independiente, sin coordinación entre sí:

### Ruta A — `useOfflineMutation` (Outbox)

| Aspecto | Valor |
|---------|-------|
| Archivo | `src/lib/sync/useOfflineMutation.ts` |
| Consumidores en la app real | **0** (nadie lo importa) |
| Soporte offline | ✅ Sí (guarda en Dexie) |
| Soporte online | ❌ **No hace nada** (bug: retorna sin ejecutar HTTP) |
| Optimistic updates | ❌ No |
| Estado | Código muerto — existe solo en documentación |

**Comportamiento actual:**
```typescript
export async function queueMutation(type, payload, endpoint, method) {
  const online = isOnline();
  if (online) {
    return { online: true, queued: false };
    // ↑ NO ejecuta el HTTP call, la mutación se pierde
  }
  // offline: guarda en cola Dexie
  const mutationId = await enqueueMutation(type, payload, endpoint, method);
  return { online: false, queued: true, mutationId };
}
```

### Ruta B — `useSubmitAnswer` (HTTP Directo)

| Aspecto | Valor |
|---------|-------|
| Archivo | `src/features/exercises/hooks/useExercise.ts` |
| Consumidores | `lesson-page.tsx` (1 consumidor) |
| Soporte offline | ❌ No |
| Soporte online | ✅ Sí (HTTP call) |
| Optimistic updates | ❌ No |
| Estado | Activo pero sin feedback instantáneo |

**Comportamiento actual:**
```typescript
export function useSubmitAnswer(studentId: string) {
  return useMutation<ExerciseResult, Error, SubmitAnswerPayload>({
    mutationFn: (payload) => submitAnswer(studentId, payload),
    // ↑ fetch() directo a la API, sin soporte offline
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: exerciseKeys.next(studentId, tenantId),
        // ↑ invalida en vez de setQueryData
      });
    },
  });
}
```

### Ruta C — `useUpdateProgress` (Dexie Local)

| Aspecto | Valor |
|---------|-------|
| Archivo | `src/features/exercises/hooks/useProgress.ts` |
| Consumidores | **0** (nadie lo importa) |
| Soporte offline | ✅ Siempre funciona (Dexie local) |
| Soporte online | ❌ **Nunca sincroniza con servidor** |
| Optimistic updates | ❌ Invalida en vez de actualizar cache |
| Estado | Código muerto + progreso no portable entre dispositivos |

**Comportamiento actual:**
```typescript
export function useUpdateProgress() {
  return useMutation<void, Error, { studentId, lessonId, updates }>({
    mutationFn: ({ studentId, lessonId, updates }) =>
      updateProgressDb(studentId, lessonId, updates),
    // ↑ escribe directo a IndexedDB, nunca va al servidor
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: progressKeys.student(variables.studentId),
        // ↑ invalida innecesariamente (ya tenemos los datos actualizados)
      });
    },
  });
}
```

### Problemas adicionales

5. **`exercise.service.ts`** tiene su propio `fetchApi()` con `getToken()` de localStorage, duplicando la lógica del `httpClient` centralizado en `src/lib/auth/http-client.ts`.
6. **El Service Worker** usa `BackgroundSyncPlugin` para POSTs, que encola las mutaciones en paralelo con el app-level outbox. Si ambos están activos, la misma mutación se procesa **2 veces**.
7. **`queueMutation()`** retorna `{ online: true, queued: false }` sin ejecutar HTTP cuando hay conexión — la mutación simplemente se pierde.

---

## 2. Qué se va a implementar

### Subfase 3.1: Arreglar `queueMutation()` para que funcione online

Modificar `queueMutation()` para que ejecute el HTTP call cuando hay conexión.

**Comportamiento nuevo:**

| Escenario | Comportamiento |
|-----------|---------------|
| Online + HTTP ok | Ejecuta HTTP call, retorna `{ online: true, queued: false, data }` |
| Online + HTTP fail | Encola en Dexie para retry automático, retorna `{ online: true, queued: true, mutationId, error }` |
| Offline | Encola en Dexie para sync posterior, retorna `{ online: false, queued: true, mutationId }` |

### Subfase 3.2: Ajustar el Service Worker

Eliminar `BackgroundSyncPlugin` del SW para evitar doble encolado.

**Antes:**
```typescript
const bgSyncPlugin = new BackgroundSyncPlugin('amauta-outbox-queue', { maxRetentionTime: 24 * 60 });
registerRoute(
  ({ url, request }) => request.method === 'POST' && url.pathname.startsWith('/api/'),
  new NetworkOnly({ plugins: [bgSyncPlugin] }),
  'POST'
);
```

**Después:**
```typescript
registerRoute(
  ({ url, request }) => request.method === 'POST' && url.pathname.startsWith('/api/'),
  new NetworkOnly(),
  'POST'
);
```

### Subfase 3.3: Crear `useSafeMutation` (hook unificado)

Nuevo hook en `src/lib/sync/useSafeMutation.ts` que reemplaza los 3 caminos.

**Interfaz:**
```typescript
interface UseSafeMutationOptions<TData, TPayload> {
  mutationFn: (payload: TPayload) => Promise<TData>;
  queryKey: unknown[];
  optimisticUpdate?: (oldData: unknown, payload: TPayload) => unknown;
  offline?: {
    type: MutationType;
    endpoint: string;
    method: "POST" | "PUT" | "PATCH" | "DELETE";
  };
  tentativeOnly?: boolean;
}
```

### Subfase 3.4: Sistema de feedback en 2 fases

Cuando `tentativeOnly: true`, el optimistic update solo marca la respuesta como "enviada" sin mostrar score falso.

**Fase 1 (inmediata, optimista):**
```
¡Bien hecho! ✅
Verificando...
```
(Sin puntuación numérica)

**Fase 2 (cuando responde el servidor):**
```
¡Ganaste 7 estrellas! ⭐⭐⭐⭐⭐⭐⭐
```
(Animación de estrellas contando)

### Subfase 3.5: Migrar `useSubmitAnswer` a `useSafeMutation`

```typescript
export function useSubmitAnswer(studentId: string) {
  return useSafeMutation<ExerciseResult, SubmitAnswerPayload>({
    mutationFn: (payload) => submitAnswer(studentId, payload),
    queryKey: exerciseKeys.next(studentId, tenantId),
    tentativeOnly: true,
    optimisticUpdate: (oldExercise) => ({
      ...oldExercise,
      _optimisticSubmitted: true,
      _optimisticTimestamp: Date.now(),
    }),
    offline: {
      type: "submitAnswer",
      endpoint: `/students/${studentId}/exercises/${exerciseId}/submit`,
      method: "POST",
    },
  });
}
```

### Subfase 3.6: Migrar `useUpdateProgress` a `useSafeMutation`

Agregar sincronización con servidor manteniendo escritura local incondicional.

**Regla:** El error de red nunca se muestra al niño. La escritura local en Dexie es incondicional. El servidor es best-effort.

### Subfase 3.7: Centralizar `exercise.service.ts`

Reemplazar el `fetchApi()` interno por el `httpClient` centralizado.

### Subfase 3.8: Eliminar `useOfflineMutation` (código muerto)

Eliminar `src/lib/sync/useOfflineMutation.ts` y actualizar referencias en documentación.

---

## 3. Por qué se implementa

### Razón 1: Eliminar la fragmentación de mutaciones

Tres caminos distintos para hacer lo mismo (enviar datos al servidor) es una fuente de bugs. Cada camino tiene un comportamiento diferente frente a:

| Situación | Ruta A (outbox) | Ruta B (submitAnswer) | Ruta C (progress) |
|-----------|----------------|----------------------|-------------------|
| Sin conexión | Guarda en Dexie | ❌ Error HTTP | ✅ Escribe local |
| Conexión lenta | ❌ No hace nada | Muestra spinner | ✅ Instantáneo |
| Error del servidor | ❌ No captura | Muestra error | ✅ No aplica |
| Cambio de dispositivo | ❌ No aplica | ❌ No aplica | ❌ Datos perdidos |

Con `useSafeMutation`, todas las situaciones se manejan de forma consistente en un solo lugar.

### Razón 2: Feedback instantáneo para el niño

La interacción más crítica de la app es: **el niño responde un ejercicio y espera ver su resultado**. Actualmente tiene que esperar el HTTP roundtrip (200-2000ms). Con optimistic updates, el feedback es inmediato.

Para una app educativa infantil, la diferencia entre "instantáneo" y "cargando..." impacta directamente en el engagement del niño.

### Razón 3: Progreso portable entre dispositivos

Actualmente el progreso solo existe en IndexedDB local. Si el niño usa la app en otro dispositivo (tablet, celular de los padres), su progreso no aparece. Al sincronizar con el servidor, el progreso persiste entre dispositivos.

### Razón 4: Eliminar código muerto

`useOfflineMutation` y los hooks de progress (`useSaveProgress`, `useUpdateProgress`, `useDeleteProgress`, `useClearProgress`) tienen **0 consumidores**. Crean confusión sobre qué camino usar.

### Razón 5: Evitar doble encolado

El SW con `BackgroundSyncPlugin` y el app-level outbox (`queue-manager.ts`) encolan mutaciones por separado. Al recuperar conexión, ambos procesan la misma mutación, resultando en requests duplicados al servidor.

### Razón 6: Unificar el HTTP client

`exercise.service.ts` usa su propio `fetchApi()` en vez del `httpClient` centralizado. Esto significa que el manejo de 401/403, la inyección de headers de auth y tenant, y el refresh de tokens no aplican a las llamadas de ejercicios.

---

## 4. Ventajas y Desventajas

### Ventajas

| Ventaja | Explicación |
|---------|-------------|
| **Un solo camino de mutación** | Todo pasa por `useSafeMutation`. Comportamiento predecible. |
| **Feedback instantáneo al responder** | El niño ve check + mensaje alentador sin esperar HTTP. |
| **Soporte offline en ejercicios** | Las respuestas se guardan localmente y se sincronizan después. |
| **Progreso portable** | El progreso se sincroniza con el servidor, disponible en cualquier dispositivo. |
| **Sin código muerto** | Se eliminan `useOfflineMutation` y los hooks de progress sin usar. |
| **Sin doble encolado** | Solo el app-level outbox maneja retries. El SW deja de encolar. |
| **HTTP client unificado** | Manejo consistente de auth, errores 401/403, refresh tokens. |
| **Rollback automático** | Si el servidor rechaza la mutación, React Query restaura el estado anterior. |

### Desventajas

| Desventaja | Explicación | Mitigación |
|-----------|-------------|------------|
| **Complejidad añadida en el nuevo hook** | `useSafeMutation` debe manejar 3 escenarios (online/offline/retry) + optimistic updates + rollback | El hook es genérico y reutilizable. Una vez implementado, los componentes lo usan con 5 líneas. |
| **Riesgo de score inconsistente** | El servidor podría calcular un score diferente al que el niño espera | Feedback en 2 fases: solo mostramos "enviado" primero, la puntuación se revela cuando llega del servidor. |
| **Progreso ahora depende del servidor** | Antes era siempre local (nunca fallaba). Ahora el sync puede fallar. | Escritura local SIEMPRE primero. El servidor es best-effort. Los errores de red nunca llegan al niño. |
| **Cambio de contrato en `queueMutation`** | Modificar el tipo de retorno puede romper código existente | `useOfflineMutation` (único consumidor) se elimina. No hay código legacy. |
| **Mayor consumo de batería en offline** | El outbox debe verificar periodicamente si hay conexión para sincronizar | El intervalo de sync es configurable. El SW `BackgroundSync` nativo del navegador es más eficiente. |
| **Complejidad en rollback visual** | Si el server rechaza, hay que deshacer el estado optimista sin confundir al niño | `onError` restaura el cache de React Query automáticamente. La UI se actualiza reactivamente. |

---

## 5. Qué problemas resuelve realmente

### Problemas resueltos

| # | Problema | Lo resuelve | Cómo |
|---|----------|-------------|------|
| P1 | **Sin feedback instantáneo al responder** — el niño espera HTTP roundtrip para ver su resultado | Subfase 3.3 + 3.4 | Optimistic update marca "enviado" al instante. Puntuación se revela cuando llega del servidor. |
| P2 | **Sin soporte offline en ejercicios** — si no hay conexión, responder un ejercicio falla | Subfase 3.1 + 3.3 + 3.5 | `useSafeMutation` encola la respuesta en Dexie cuando está offline. Se sincroniza al recuperar conexión. |
| P3 | **Progreso no portable** — los datos solo existen en IndexedDB local | Subfase 3.6 | `useUpdateProgress` ahora sincroniza con el servidor. El progreso está disponible en cualquier dispositivo. |
| P4 | **Código muerto** — `useOfflineMutation` y hooks de progress sin usar | Subfase 3.8 | Se eliminan. Queda un solo camino (`useSafeMutation`). |
| P5 | **Doble encolado de mutaciones** — SW + app encolan por separado la misma mutación | Subfase 3.2 | Se elimina `BackgroundSyncPlugin` del SW. Solo el app-level outbox maneja retries. |
| P6 | **`queueMutation()` no ejecuta HTTP cuando está online** — la mutación se pierde | Subfase 3.1 | Ahora ejecuta HTTP call cuando hay conexión. Si falla, encola para retry. |
| P7 | **HTTP client duplicado** — `exercise.service.ts` tiene su propio `fetchApi()` | Subfase 3.7 | Se reemplaza por `httpClient` centralizado. Auth y errores consistentes. |
| P8 | **Tres caminos de mutación fragmentados** — comportamiento inconsistente | Todas las subfases | Todo pasa por `useSafeMutation`. Comportamiento predecible sin importar el estado de la red. |

### Problemas que NO resuelve

| # | Problema | Por qué no |
|---|----------|-----------|
| N1 | **Optimización del bundle inicial** | Lo resuelve la Fase 2 (Code Splitting) |
| N2 | **Configuración de tests** | Lo resuelve la Fase 1 (Testing) |
| N3 | **Limpieza de caches huérfanos en el SW** | Lo resuelve la Fase 7 (PWA Cache Cleanup) |
| N4 | **Rendimiento de renderizado de listas** | No aplica — las listas de la app no superan ~15 items |

---

## 6. Diagrama de flujo del proceso

A continuación se representa el flujo completo de una mutación después de la implementación de la Fase 3.

### Notación

```
(   )  Inicio / Fin
[   ]  Proceso / Acción
{   }  Entrada / Salida de datos
<   >  Evento / Trigger externo
 ◇    Decisión (Sí / No)
```


```
                  (Inicio: Usuario realiza acción)
                            │
                            ▼
                    ┌─────────────────┐
                    │ Llamar a         │
                    │ useSafeMutation  │
                    │ .mutate(payload) │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ Aplicar          │
                    │ optimisticUpdate │
                    │ al cache local   │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ Ejecutar         │
                    │ mutationFn()     │
                    └────────┬────────┘
                             │
                             ▼
                     ┌──────────────┐
                     │ ¿La mutación  │
                     │ escribe en    │
                     │ Dexie local?  │
                     └──────┬───────┘
                            │
              ┌─────────────┼─────────────┐
              │Sí           │             │No
              ▼             │             ▼
     ┌────────────────┐    │    ┌──────────────────┐
     │ Escribir en    │    │    │ Solo HTTP call   │
     │ Dexie local    │    │    │ (ej: submitAnswer)│
     │ (siempre ok)   │    │    └────────┬─────────┘
     └────────┬───────┘    │             │
              │            │             │
              └────────────┼─────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │ ¿Hay conexión│
                    │ de red?      │
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              │Sí          │            │No
              ▼            │            ▼
     ┌────────────────┐   │   ┌───────────────────┐
     │ Ejecutar HTTP  │   │   │ Encolar en Dexie  │
     │ call al server │   │   │ (cola outbox)     │
     └────────┬───────┘   │   └────────┬──────────┘
              │           │            │
              ▼           │            ▼
      ┌──────────────┐   │   ┌──────────────────────┐
      │ ¿HTTP call   │   │   │ Mostrar feedback     │
      │ fue exitoso? │   │   │ al usuario:          │
      └──────┬───────┘   │   │ "Guardado para       │
             │           │   │  cuando tengas       │
    ┌────────┼────────┐  │   │  conexión"           │
    │Sí      │        │No │   └──────────────────────┘
    ▼        │        ▼   │           │
 ┌──────┐    │  ┌─────────┴──┐        │
 │ Éxito│    │  │ Encolar en │        │
 └──┬───┘    │  │ Dexie para │        │
    │        │  │ reintento  │        │
    │        │  │ automático │        │
    │        │  └─────┬──────┘        │
    │        │        │               │
    ▼        ▼        ▼               ▼
 ┌────────────────────────────────────────┐
 │ ¿tentativeOnly está activado?          │
 └──────────────────┬─────────────────────┘
                    │
          ┌─────────┼──────────┐
          │Sí      │          │No
          ▼        │          ▼
 ┌──────────────┐  │  ┌──────────────────────┐
 │ AÚN NO       │  │  │ Actualizar cache     │
 │ mostrar      │  │  │ con datos reales     │
 │ resultado    │  │  │ del servidor         │
 │ (esperar     │  │  └──────────┬───────────┘
 │ respuesta)   │  │             │
 └──────┬───────┘  │             ▼
        │          │     ┌────────────────┐
        ▼          │     │ Mostrar        │
 ┌─────────────────┴┐    │ resultado      │
 │ Recibir respuesta │    │ (score,       │
 │ del servidor     │    │ feedback, etc) │
 │ (Fase 2)         │    └────────┬───────┘
 └────────┬─────────┘             │
          │                       │
          ▼                       ▼
                    ┌──────────────────────────┐
                    │ ¿onSettled: invalidar    │
                    │ queries relacionadas?    │
                    └──────────────────────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │ Llamar a             │
                    │ invalidateQueries    │
                    │ con queryKey         │
                    └──────────────────────┘
                               │
                               ▼
                          (Fin del proceso)


### Flujo paralelo: Sincronización de la cola outbox

<Se recupera conexión>
         │
         ▼
  ┌────────────────┐
  │ ¿Hay           │
  │ mutaciones     │
  │ pendientes     │
  │ en cola?       │
  └────────┬───────┘
           │
     ┌─────┼─────┐
     │Sí   │     │No
     ▼     │     ▼
  ┌────────┴┐  (Fin)
  │ ¿El sync│
  │ ya está │
  │ activo? │
  └────┬────┘
       │
  ┌────┼────┐
  │Sí  │    │No
  ▼    │    ▼
  (Esperar) ┌──────────────┐
            │ Ejecutar     │
            │ processQueue │
            │ (max 10 por  │
            │  batch)      │
            └──────┬───────┘
                   │
                   ▼
            ┌──────────────┐
            │ ¿Mutación    │
            │ fue exitosa? │
            └──────┬───────┘
                   │
         ┌─────────┼──────────┐
         │Sí      │          │No
         ▼        │          ▼
  ┌────────────┐  │  ┌──────────────┐
  │ Eliminar   │  │  │ Incrementar  │
  │ de la cola │  │  │ retryCount   │
  └──────┬─────┘  │  └──────┬───────┘
         │        │         │
         │        │         ▼
         │        │  ┌───────────────────┐
         │        │  │ ¿Excede máximo   │
         │        │  │ de reintentos    │
         │        │  │ (3)?             │
         │        │  └───────┬───────────┘
         │        │          │
         │        │   ┌──────┼──────┐
         │        │   │Sí   │      │No
         │        │   ▼    │      ▼
         │        │  ┌──────┴┐  ┌─────────────┐
         │        │  │ Marcar│  │ Esperar con │
         │        │  │ como  │  │ backoff y   │
         │        │  │ fallida│  │ reintentar  │
         │        │  └───────┘  └──────┬──────┘
         │        │                    │
         ▼        ▼                    ▼
         ┌─────────────────────────────────┐
         │ ¿Quedan más mutaciones          │
         │ pendientes en este batch?       │
         └──────────────┬──────────────────┘
                        │
                    ┌───┼───┐
                    │Sí │   │No
                    ▼   │   ▼
                (Siguiente) (Fin sync)
                mutación
```

---

## 7. Impacto en la PWA

### Cambios en el Service Worker

| Aspecto | Antes | Después |
|---------|-------|---------|
| BackgroundSyncPlugin | ✅ Activo para POSTs | ❌ Eliminado |
| Cola de retry | SW + app (doble) | Solo app-level outbox |
| Cache de navegación | Sin cambios | Sin cambios |
| Precaching | Sin cambios | Sin cambios |

### Comportamiento offline

| Escenario | Antes | Después |
|-----------|-------|---------|
| Responder ejercicio sin conexión | ❌ Error HTTP | ✅ Guardado en cola outbox |
| Ver progreso sin conexión | ✅ Desde Dexie local | ✅ Desde Dexie local |
| Sincronizar al recuperar conexión | ❌ No aplicaba | ✅ `processQueue()` procesa la cola |
| Feedback al niño sin conexión | ❌ Error en pantalla | ✅ Check optimista + "Guardado para cuando tengas conexión" |

### Comportamiento online

| Escenario | Antes | Después |
|-----------|-------|---------|
| Responder ejercicio | Espera HTTP (spinner) | Check inmediato + puntuación cuando llegue |
| HTTP falla (server error) | Error en pantalla | Encola para retry automático |
| Progreso guardado | Solo local | Local + sincronizado con servidor |

---

## 8. Resumen de archivos modificados

| Archivo | Acción | Subfase |
|---------|--------|---------|
| `src/lib/sync/queue-manager.ts` | Modificar `queueMutation()` para ejecutar HTTP cuando online + type guard | 3.1 |
| `src/sw.ts` | Eliminar `BackgroundSyncPlugin` de la ruta POST | 3.2 |
| `src/lib/sync/useSafeMutation.ts` | **Nuevo** — hook unificado con optimistic updates + offline | 3.3 |
| `src/features/exercises/hooks/useExercise.ts` | Migrar `useSubmitAnswer` a `useSafeMutation` | 3.5 |
| `src/features/exercises/hooks/useProgress.ts` | Migrar `useUpdateProgress` a `useSafeMutation` + sync con servidor | 3.6 |
| `src/services/exercise.service.ts` | Reemplazar `fetchApi()` por `httpClient` centralizado | 3.7 |
| `src/lib/sync/useOfflineMutation.ts` | **Eliminar** | 3.8 |
| `src/features/lessons/pages/lesson-page.tsx` | Agregar UI de feedback en 2 fases | 3.4 |

---

### Versión

```
Documento:  FASE3-MUTACIONES-UNIFICADAS.md
Proyecto:   Amauta PWA
Versión:    1.0
Estado:     Plan de implementación
```
