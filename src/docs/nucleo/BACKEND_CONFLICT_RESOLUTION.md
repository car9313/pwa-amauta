# Conflict Resolution — Contrato con el Backend

> **Propósito**: Documentar lo que el backend debe implementar para que el frontend
> pueda resolver conflictos de datos cuando mutations offline se sincronizan.

---

## 1. Explicación en Lenguaje Natural

### El Problema

Amauta funciona offline. Cuando un estudiante responde ejercicios sin conexión,
los datos se guardan localmente en IndexedDB. Al recuperar la red, el frontend
reproduce esas operaciones en orden contra el backend.

**¿Qué pasa si hay conflictos?**

Imagina este escenario:
1. El estudiante Mario responde un ejercicio **offline** (se guarda localmente)
2. Al mismo tiempo, en otro dispositivo, la mamá de Mario actualiza su perfil
3. Cuando Mario se conecta, su respuesta se envía al backend
4. Pero los datos del backend ya cambiaron (por la mamá)
5. Hay un conflicto: ¿qué datos se quedan? ¿los locales o los del servidor?

### La Solución

Usamos una estrategia **"last-write-wins"** (el último que escribe gana).
Para eso, el backend debe:
1. **Devolver un timestamp** en cada respuesta de mutación
2. **Detectar conflictos** cuando los datos cambiaron desde la última consulta
3. **Responder con HTTP 409** cuando hay conflicto, enviando el estado actual

---

## 2. Requisitos Técnicos

### Requisito 1: Timestamp en Respuestas Exitosas

Toda respuesta exitosa de un endpoint de escritura (POST, PUT, PATCH, DELETE)
debe incluir `__serverTimestamp` con la hora del servidor en formato ISO 8601.

#### Respuesta actual (sin timestamp):
```json
{
  "success": true,
  "data": {
    "id": "stu_001",
    "score": 100,
    "level": 3
  }
}
```

#### Respuesta requerida (CON timestamp):
```json
{
  "success": true,
  "data": {
    "id": "stu_001",
    "score": 100,
    "level": 3
  },
  "__serverTimestamp": "2026-06-03T14:30:00.000Z"
}
```

### Requisito 2: Detección de Conflictos

El backend debe detectar que los datos han cambiado desde que el cliente
los obtuvo por última vez.

**Mecanismo**: El frontend NO envía timestamps en los requests (por ahora).
El backend debe usar su propia lógica para determinar si hubo cambios
(por ejemplo, comparando `updatedAt` del recurso con la hora de la última
lectura conocida).

Para implementaciones futuras, se puede agregar un header opcional:

```
X-Last-Known-Timestamp: 2026-06-03T14:25:00.000Z
```

### Requisito 3: HTTP 409 Conflict

Cuando el backend detecta un conflicto, debe responder con:

```
Status: 409 Conflict
Content-Type: application/json
```

```json
{
  "error": "Conflict",
  "message": "Los datos fueron modificados desde la última consulta",
  "code": "DATA_CONFLICT",
  "serverData": {
    "id": "stu_001",
    "score": 80,
    "level": 3
  },
  "__serverTimestamp": "2026-06-03T14:25:00.000Z"
}
```

**Campos obligatorios:**
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `error` | string | Título del error (`"Conflict"`) |
| `message` | string | Mensaje legible para el frontend |
| `code` | string | Código interno (`"DATA_CONFLICT"`) |
| `serverData` | object | Estado actual del recurso en el servidor |
| `__serverTimestamp` | string | ISO 8601 del momento en que el servidor detectó el conflicto |

### Requisito 4: Idempotencia en Endpoints Críticos

Para evitar duplicados cuando el frontend reenvía una mutación,
los endpoints `submitAnswer` y `addChild` deberían ser idempotentes.
El frontend incluirá un `idempotencyKey` en estos casos:

```json
{
  "answer": "15/8",
  "exerciseId": "ex_001",
  "idempotencyKey": "mutation_abc123"
}
```

Si el servidor ya procesó esa key, debe responder con los datos
existentes sin crear duplicados.

---

## 3. Endpoints Afectados

### Tabla de Mutaciones

| Mutation Type | Endpoint | Método | Estrategia | Idempotente |
|--------------|----------|--------|-----------|-------------|
| `submitAnswer` | `/v1/students/{studentId}/exercises/{exerciseId}/submit` | POST | last-write-wins | Sí |
| `updateProgress` | `/v1/students/{studentId}/progress` | PUT | last-write-wins | No |
| `updateProfile` | `/v1/profile` | PUT | last-write-wins | No |
| `updatePreferences` | `/v1/preferences` | PUT | last-write-wins | No |
| `addChild` | `/v1/parents/{parentId}/children` | POST | server-wins | Sí |

### Estrategias por Tipo

| Estrategia | Cuándo se usa | Comportamiento |
|-----------|--------------|----------------|
| **last-write-wins** | submitAnswer, updateProgress, updateProfile, updatePreferences | Gana el dato con timestamp más reciente |
| **server-wins** | addChild | Siempre gana el servidor (evita crear hijos duplicados) |

---

## 4. Flujo Completo de Sincronización con Conflictos

```
Frontend (offline)              Backend (API)
      │                              │
      │  [Usuario responde offline]  │
      │  ─── guarda en Dexie ───→    │
      │                              │
      │  [Se recupera la red]        │
      │                              │
      │  processQueue()              │
      │      │                       │
      │      ▼                       │
      │  HTTP POST /students/        │
      │    .../submit                │
      │  ──────────request─────────→ │
      │                              │
      │  ┌─── ¿Hubo cambios? ───┐   │
      │  │                      │    │
      │  ▼ NO                   ▼ SI │
      │  200 OK                 409  │
      │  + __serverTimestamp    +    │
      │  ───response──────────→ │    │
      │  │                   server  │
      │  │                   Data    │
      │  │                   +       │
      │  │                   server  │
      │  │                   Timestamp│
      │  │                      │    │
      │  │              ┌───────┘    │
      │  │              ▼            │
      │  │        hasConflict?       │
      │  │         │         │       │
      │  │        NO        SI       │
      │  │         │         │       │
      │  │    eliminar    resolve    │
      │  │    de cola    Conflict()  │
      │  │                 │         │
      │  │          ┌──────┴──┐     │
      │  │          │         │      │
      │  │     local      server     │
      │  │     wins       wins       │
      │  │       │          │        │
      │  │   re-POST    descartar    │
      │  │   con flag   local        │
      │  │   overwrite  mantener     │
      │  │             server        │
      │  │              │            │
      │  ▼              ▼            │
      │  eliminar de cola            │
      │                              │
```

---

## 5. Ejemplos de Implementación

### Código de ejemplo (backend, Node.js/Express)

```typescript
// Middleware de detección de conflictos
function detectConflict(req, res, next) {
  const resource = await getResource(req.params.id);
  const lastModified = resource.updatedAt;

  // Si el recurso fue modificado en los últimos N segundos
  // (desde que el cliente probablemente lo leyó)
  const lastKnownTimestamp = req.headers['x-last-known-timestamp'];
  
  if (lastKnownTimestamp && new Date(lastModified) > new Date(lastKnownTimestamp)) {
    return res.status(409).json({
      error: 'Conflict',
      message: 'Los datos fueron modificados desde la última consulta',
      code: 'DATA_CONFLICT',
      serverData: resource,
      __serverTimestamp: new Date().toISOString(),
    });
  }

  next();
}

// En cada respuesta exitosa, incluir timestamp
app.post('/v1/students/:id/exercises/:eid/submit', async (req, res) => {
  const result = await submitAnswer(req.params.id, req.body);
  res.json({
    success: true,
    data: result,
    __serverTimestamp: new Date().toISOString(),
  });
});
```

---

## 6. URLs de Documentación Relacionada

- Código frontend de resolución: `src/lib/sync/conflict.ts`
- Tests de resolución: `src/lib/sync/conflict.test.ts` (34 tests)
- Queue manager (donde se conectará): `src/lib/sync/queue-manager.ts`
- Cola offline: `src/lib/api/storage/offline-queue.ts`
- Esquema Dexie: `src/lib/api/storage/db.ts`
- Documento del sistema offline: `docs/OFFLINE_QUEUE_SYSTEM.md`
