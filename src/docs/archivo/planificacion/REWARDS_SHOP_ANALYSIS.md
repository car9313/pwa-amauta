# Análisis: Kit de Premios y Tienda (Rewards Shop) — Amauta

> **Estado**: Pendiente de activación. Este documento analiza la feature completa del prototipo (`RewardsKitModal` + `StreakModal` + accesorios del Character), los gaps técnicos actuales y qué se necesitaría para implementarla.
>
> Origen: prototipo `D:\Estudio\prueba\prueba pwa\amauta (6)\src\pages\StudentDashboard.tsx` y sus componentes en `src/components/amauta/`.

---

## 1. Resumen Ejecutivo

El prototipo incluye un sistema de gamificación completo que NO existe en el proyecto actual:

| Feature | Prototipo | Proyecto actual |
|---------|-----------|-----------------|
| Tienda de accesorios (comprar/equipar) | ✅ 4 items | ❌ No existe |
| Ligas por puntos | ✅ 5 ligas | ❌ No existe |
| Medallas coleccionables | ✅ 5 medallas | ⚠️ Solo `recentAchievements` del dashboard |
| Congelar racha / Bono diario | ✅ | ⚠️ StreakModal informativo (botones "Próximamente") |
| Character con expresiones/accesorios | ✅ SVG vectorial | ❌ JPG estático |

**Bloqueadores principales**:
1. El Character actual es una imagen JPG estática — los accesorios requieren una mascota vectorial (ver [MASCOT_IMPLEMENTATION.md](./MASCOT_IMPLEMENTATION.md)).
2. El backend no tiene endpoints de rewards/compras/descuento de puntos — los puntos solo se leen del dashboard.
3. No hay persistencia local para inventario de accesorios.

**Recomendación**: Opción híbrida (sección 5) — UI + Dexie primero, sync con backend cuando exista. Prerrequisito duro: decidir el diseño de la mascota SVG.

---

## 2. Inventario del Prototipo

### 2.1 RewardsKitModal — Tab "Ligas & Niveles"

Ligas derivadas del nivel del jugador, con umbrales de puntos referenciales:

| Nivel | Liga | Título | Puntos mínimos |
|-------|------|--------|---------------|
| N1 | Liga Bronce | Principiante Andino | 0 |
| N2 | Liga Plata | Explorador de los Valles | 100 |
| N3 | Liga Oro | Maestro de las Cumbres | 300 |
| N4 | Liga Diamante | Cóndor Sabio | 600 |
| N5 | Liga Cóndor Supremo | Leyenda Amauta | 1000 |

Estados por liga: actual (resaltada "Tu Nivel"), desbloqueada (check verde), bloqueada (candado + "Reclama X pts").

### 2.2 RewardsKitModal — Tab "Tienda Amauta"

| id | Nombre | Costo | Descripción |
|----|--------|-------|-------------|
| `grad_hat` | Gorrito de Graduado | 100 pts | Luce sabio en todas tus lecciones |
| `golden_cape` | Capa Andina Dorada | 150 pts | Vuela más alto con la capa oficial |
| `wise_glasses` | Gafas de Sabio | 200 pts | Aumenta la concentración al resolver problemas |
| `crown` | Corona Cóndor Real | 300 pts | Reservado para los alumnos más dedicados |

Estados por item: **Comprar** (deshabilitado si no alcanza, muestra "Faltan X pts") → **Equipar** → **Equipado/Desequipar**. Al comprar: `playVictoryFanfare()` + confetti (60 partículas).

### 2.3 RewardsKitModal — Tab "Medallas"

| id | Medalla | Condición |
|----|---------|-----------|
| m1 | Racha de Fuego 🔥 | 4 días seguidos estudiando |
| m2 | Maestro de las Sumas ➕ | 10 lecciones con 100% |
| m3 | Explorador Veloz ⚡ | 3 juegos en Zona de Juegos |
| m4 | Cóndor Dorado 🦅 | Alcanza 500 puntos |
| m5 | Sabio de la Noche 🦉 | Usa el Chat con el Mentor |

Nota: en el prototipo las condiciones son hardcodeadas (solo m4 es dinámica). Una implementación real requeriría evaluarlas contra datos reales de progreso.

### 2.4 StreakModal (relacionado)

| Feature | Detalle |
|---------|---------|
| Protector de Racha (freeze) | Cuesta **50 pts**, evita perder la racha un día; estado binario equipado/activo |
| Premio Diario | **+20 XP**, reclamable 1 vez al día (⚠️ en el prototipo usa `useState`, se reinicia al recargar — sin enforcement real) |
| Calendario semanal | 7 días con fechas hardcodeadas ("10 Ago"...) — requiere datos reales de actividad |

Ambas acciones disparan fanfarria + confetti.

### 2.5 Character SVG (soporte visual)

El prototipo renderiza la mascota como **cóndor SVG vectorial** (~166 líneas):
- **Expresiones**: `idle`, `happy`, `superstar`, `encouraging`, `thinking` (ojos, alas, mejillas y fondo cambian)
- **Accesorios como overlays SVG**: gorro de graduado, gafas, corona, capa dorada
- **Animaciones**: `animate-mascot-cheer`, `animate-mascot-encourage` según expresión
- Tamaños: sm/md/lg/xl/2xl

---

## 3. Gaps del Proyecto Actual

| # | Gap | Detalle |
|---|-----|---------|
| G1 | **Character estático** | `src/components/amauta/character.tsx` renderiza `<img src="/img/amauta-mascot.jpg">` en un círculo. Sin props de expresión/accesorio. Además: la mascota actual es una **llama/alpaca**, el prototipo usa un **cóndor** — decisión de diseño pendiente. |
| G2 | **Sin backend de rewards** | `API_CONTRACT.md` define 13 endpoints; ninguno cubre compras, inventario ni descuento de puntos. Los puntos llegan solo lectura vía `GET /students/{id}/dashboard`. |
| G3 | **Sin persistencia de inventario** | Dexie (`amauta-db` v4) no tiene tabla para accesorios comprados/equipados. |
| G4 | **Sin mutación de puntos** | `MutationType` (offline queue) no contempla compras; `useSafeMutation` no tiene integración para descontar puntos. |
| G5 | **Sonido incompleto** | Existe `playCorrectSound()` (Web Audio); falta `playVictoryFanfare()`. |
| G6 | **Logros sin motor** | Las medallas del prototipo requieren evaluar condiciones contra progreso real; hoy solo hay `recentAchievements` calculado por el backend. |

---

## 4. Matriz de Dependencias

| Plan relacionado | Estado | Relación con Rewards Shop |
|------------------|--------|--------------------------|
| [MASCOT_IMPLEMENTATION.md](./MASCOT_IMPLEMENTATION.md) Fase 1 (SVG + CSS) | Pendiente | **Prerrequisito duro** — sin mascota vectorial no hay dónde dibujar accesorios. Su Fase 1 ya contempla componente `<Mascot>` con moods. |
| [SOUND_SYSTEM.md](./SOUND_SYSTEM.md) | Parcial | `playCorrectSound` ✅ implementado (Web Audio). Falta `playVictoryFanfare` (mismo patrón de osciladores, ~30 líneas). |
| [REWARD_ANIMATIONS.md](./REWARD_ANIMATIONS.md) | Parcial | `canvas-confetti` ✅ instalado y en uso (agenda). Faltan presets centralizados (`AMAUTA_REWARD_PRESETS`) si se quiere consistencia entre features. |
| Cola offline (`useSafeMutation`) | Lista | Infraestructura lista para sincronizar compras cuando exista backend (agregar nuevo `MutationType`). |

---

## 5. Opciones de Implementación

### Opción A — Todo local (Dexie only)

Puntos e inventario viven solo en el dispositivo.

| Pros | Contras |
|------|---------|
| Implementable de inmediato | Puntos desincronizados del servidor (compra descuenta local, el dashboard sigue mostrando los originales) |
| Offline-first total | Compras "falsas": se pierden o contradicen al recargar datos del servidor |
| 0 cambios de backend | Doble fuente de verdad para puntos |

### Opción B — Backend-first

Especificar e implementar endpoints primero; UI después.

| Pros | Contras |
|------|---------|
| Fuente única de verdad | Bloqueado hasta que el backend priorice la feature |
| Compras reales y consistentes multi-dispositivo | Time-to-market largo |

### Opción C — Híbrida (recomendada)

UI + Dexie ahora, diseñada para migrar a backend sin reescribir la UI.

| Pros | Contras |
|------|---------|
| Se puede activar por partes (ligas/medallas primero, tienda después) | Requiere disciplina: marcar datos locales como "pending sync" |
| La cola offline (`useSafeMutation`) facilita el sync futuro: agregar `purchaseReward` a `MutationType` y replay automático | Mientras no haya backend, las compras son efectivamente locales |
| El contrato de la spec (sección 6) queda definido desde día 1 | |

---

## 6. Spec de Endpoints Backend Propuestos

Contrato propuesto para extender `API_CONTRACT.md` (sección 2.x). Autenticación igual que el resto: `Authorization: Bearer <accessToken>`.

### 6.1 GET /students/{studentId}/rewards

Estado completo de rewards del estudiante.

```json
// 200 OK
{
  "points": 156,
  "level": 2,
  "ownedAccessories": ["grad_hat"],
  "equippedAccessory": "grad_hat",
  "hasStreakFreeze": false,
  "dailyBonusClaimedAt": null,
  "medals": [
    { "id": "m1", "unlockedAt": "2026-08-12T10:00:00Z" }
  ]
}
```

### 6.2 POST /students/{studentId}/rewards/purchases

Compra un item de la tienda. Idempotente por `itemId`: repetir una compra ya hecha devuelve 200 sin descontar.

```json
// Request
{ "itemId": "golden_cape" }

// 200 OK
{ "points": 6, "ownedAccessories": ["grad_hat", "golden_cape"] }

// 409 CONFLICT — fondos insuficientes
{ "error": "INSUFFICIENT_POINTS", "required": 150, "available": 6 }

// 404 NOT_FOUND — itemId inexistente
```

### 6.3 PUT /students/{studentId}/rewards/equipped

Equipar/desequipar. Solo permite accesorios owned (si no: 409).

```json
// Request
{ "accessoryId": "crown" }   // o null para desequipar

// 200 OK
{ "equippedAccessory": "crown" }
```

### 6.4 POST /students/{studentId}/rewards/bonus/claim

Bono diario (+20 XP). Enforced por servidor (1 por día UTC o por timezone del usuario).

```json
// 200 OK
{ "points": 176, "claimedAt": "2026-08-20T09:15:00Z", "nextClaimAvailableAt": "2026-08-21T00:00:00Z" }

// 409 CONFLICT — ya reclamado hoy
{ "error": "BONUS_ALREADY_CLAIMED", "nextClaimAvailableAt": "..." }
```

### 6.5 POST /students/{studentId}/streak/freeze

Compra el Protector de Racha (50 pts).

```json
// 200 OK
{ "points": 126, "hasStreakFreeze": true }

// 409 CONFLICT — ya tiene uno activo o fondos insuficientes
```

### 6.6 Consideraciones offline

- Las compras offline se encolan con el patrón outbox existente (`mutations` table) y se replanifican al reconectar.
- El servidor debe ser la fuente de verdad al reconciliar: si el saldo local no alcanza al procesar la compra encolada, responder 409 y descartar la mutación (la UI revierte el optimismo).
- Conflict resolution: last-write-wins no sirve para puntos (no es conmutativo). Usar operaciones absolutas por transacción (compra = delta negativo atómico server-side), no PATCH de saldo.
- Referencia general: [BACKEND_CONFLICT_RESOLUTION.md](../nucleo/BACKEND_CONFLICT_RESOLUTION.md).

---

## 7. Arquitectura Frontend Propuesta (Opción C)

```
src/features/rewards/
├── domain/
│   └── reward.types.ts          # RewardItem, League, Medal, PlayerRewards (Zod)
├── hooks/
│   └── usePlayerRewards.ts      # useLiveQuery(Dexie) + mutaciones compra/equipar
├── components/
│   ├── rewards-kit-modal.tsx    # shadcn Dialog + Tabs (ligas/tienda/medallas)
│   └── league-row.tsx           # fila de liga (actual/desbloqueada/bloqueada)
└── utils/
    └── reward-catalog.ts        # catálogo estático: SHOP_ITEMS, LEAGUES, MEDALS
```

| Pieza | Decisión propuesta |
|-------|--------------------|
| Dominio | Schemas Zod en `reward.types.ts`, mismo patrón que `exercise.types.ts` |
| Persistencia | Dexie **v5**: tabla `playerRewards` (`id = studentId`, `ownedAccessories: string[]`, `equippedAccessory: string \| null`, `hasStreakFreeze: boolean`, `dailyBonusClaimedAt: number \| null`) |
| Compras | `useSafeMutation` con nuevo `MutationType: "purchaseReward"` (prioridad 3, baja) — cuando exista backend hace replay automático |
| Catálogo | Constantes compartidas frontend/backend (ids y costos) para evitar drift |
| Modal | shadcn `Dialog` + `Tabs` (ya disponibles), tokens del design system (nada de slate hardcodeado como el prototipo) |
| i18n | Keys bajo `student.rewards.*` en `dashboard.json` (o namespace propio `rewards`) |
| Mascota | Componente `<Mascot>` de MASCOT_IMPLEMENTATION con prop `accessory` — los overlays SVG se agregan ahí, no en el modal |

---

## 8. Esfuerzo Estimado y Criterios de Activación

### Por fases

| Fase | Alcance | Esfuerzo | Prerrequisito |
|------|---------|----------|---------------|
| R0 | Decisión de diseño mascota (¿vectorizar llama o adoptar cóndor?) + catálogo de items aprobado | Decisión de producto | — |
| R1 | Mascota SVG con soporte de accesorios (extiende MASCOT Fase 1) | 1-2 días (sobre los 3-4 de MASCOT) | R0 |
| R2 | `playVictoryFanfare` + presets de confetti centralizados | 0.5 día | — |
| R3 | Dominio + Dexie v5 + hook `usePlayerRewards` | 1 día | — |
| R4 | RewardsKitModal (tienda + equipar) integrado al dashboard | 2 días | R1, R3 |
| R5 | Tab ligas + tab medallas (motor de condiciones contra progreso real) | 1-2 días | R3 |
| R6 | StreakModal funcional (freeze + bono diario con enforcement local) | 1 día | R3 |
| R7 | Sync backend (spec sección 6) | Depende del backend | Backend implementa spec |

Total frontend (R1-R6): ~7-8 días de desarrollo.

### Criterios de activación (checklist)

- [ ] Decisión de producto: ¿la mascota será llama vectorizada o cóndor? (bloquea R1→R4)
- [ ] Decisión: ¿puntos locales aceptados temporalmente (Opción C) o se espera backend (Opción B)?
- [ ] Catálogo de items/costos/ligas aprobado por diseño/producto
- [ ] Prioridad asignada en ROADMAP frente a otras features
- [ ] Si va con backend: spec de sección 6 revisada por el equipo backend

---

## 9. Referencias

- Prototipo: `amauta (6)/src/components/amauta/RewardsKitModal.tsx`, `StreakModal.tsx`, `Character.tsx`
- Página de origen: `amauta (6)/src/pages/StudentDashboard.tsx`
- [MASCOT_IMPLEMENTATION.md](./MASCOT_IMPLEMENTATION.md) — mascota SVG/moods
- [SOUND_SYSTEM.md](./SOUND_SYSTEM.md) — sistema de sonido
- [REWARD_ANIMATIONS.md](./REWARD_ANIMATIONS.md) — animaciones de recompensa
- [BACKEND_CONFLICT_RESOLUTION.md](../nucleo/BACKEND_CONFLICT_RESOLUTION.md) — conflict resolution
- [API_CONTRACT.md](../nucleo/API_CONTRACT.md) — contrato actual (13 endpoints)
- Implementación actual del dashboard migrado: `src/features/dashboard/pages/student-dashboard-page.tsx`, `src/features/dashboard/hooks/useAgendaTasks.ts`
