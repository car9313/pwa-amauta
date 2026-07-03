# LocaleInitializer — Fase 3 + Refactor

> **Proposito**: Describir el componente orquestador que coordina la resolucion de locale en las 3 fases (pre-auth, geo, post-auth), su integracion con AuthInitializer, y el refactor que reemplazo `getLastActiveUserId` por `checkIfSessionExists`.
> **Archivos**: `LocaleInitializer.tsx`, `main.tsx`, `auth-storage.ts`
> **Dependencias**: Store (Fase 2), Auth (sesion), AuthStore

---

## LocaleInitializer.tsx

**Ruta**: `src/features/locale/components/LocaleInitializer.tsx`
**Proposito**: Orquestar la resolucion de locale desde el momento en que la app se monta, coordinando las fases pre-auth y post-auth.

### Estructura

```typescript
export function LocaleInitializer({ children }: { children: React.ReactNode }) {
  const [localePhaseReady, setLocalePhaseReady] = useState(false);
  const hasInitialized = useRef(false);

  const hasAuthHydrated = useAuthStore((s) => s.hasHydrated);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);

  const hydrateFromStorage = useLocaleStore((s) => s.hydrateFromStorage);
  const detectPreAuthLocale = useLocaleStore((s) => s.detectPreAuthLocale);
  const resolveAndCacheLocale = useLocaleStore((s) => s.resolveAndCacheLocale);
```

2 `useEffect`, 1 `useRef`, 1 `useState`. Selectors individuales del store (por convencion del proyecto).

### Fase 1 — Pre-auth (mount)

```typescript
useEffect(() => {
  if (hasInitialized.current) return;
  hasInitialized.current = true;

  const init = async () => {
    const userId = await checkIfSessionExists();

    if (userId) {
      const found = await hydrateFromStorage(userId);
      if (found) {
        setLocalePhaseReady(true);
        return;
      }
    }

    await detectPreAuthLocale(800);
    setLocalePhaseReady(true);
  };
  init();
}, [detectPreAuthLocale, hydrateFromStorage]);
```

**Que hace**:
1. `checkIfSessionExists()` — busca tokens de sesion en Dexie
2. Si hay sesion activa → `hydrateFromStorage(userId)` — intenta cargar cache de Dexie
3. Si hay cache valido → `localePhaseReady = true` → render inmediato
4. Si no hay sesion o no hay cache → `detectPreAuthLocale(800)` — geo-deteccion
5. `localePhaseReady = true` → render (maximo 800ms de espera)

**Por que `useRef`**: Garantiza que este efecto solo se ejecute una vez, incluso en StrictMode de React.

### Fase 2 — Semi-blocking

```typescript
if (!localePhaseReady) {
  return <AmautaLoadingState variant="page" />;
}
return <>{children}</>;
```

Mientras el locale no esta resuelto, muestra una pantalla de carga. Esto evita el "flash" de ver `es-LA` y luego cambiar a `es-MX`.

**Semi-blocking** porque:
- No bloquea el thread principal (el efecto es asincrono)
- No bloquea la inicializacion de AuthInitializer (se ejecutan en paralelo)
- Solo bloquea el render de los hijos hasta tener el locale resuelto
- Maximo 800ms de espera para usuarios nuevos

### Fase 3 — Post-auth

```typescript
useEffect(() => {
  if (!hasAuthHydrated || !isAuthenticated || !user) return;
  const userId = getAuthUserId(user);
  resolveAndCacheLocale(userId);
}, [hasAuthHydrated, isAuthenticated, user, resolveAndCacheLocale]);
```

**Que hace**:
1. Espera a que AuthStore este hidratado, el usuario autenticado, y haya datos del usuario
2. Extrae el userId segun el rol del usuario
3. Llama a `resolveAndCacheLocale(userId)` que orquesta la persistencia en Dexie

**Por que no necesita verificar `geoAlreadyRan`**: `resolveAndCacheLocale` internamente ya maneja este flag.

### getAuthUserId

```typescript
function getAuthUserId(user: AuthUser): string {
  switch (user.role) {
    case "student": return user.studentId;
    case "parent": return user.parentId;
    case "teacher": return user.teacherId;
  }
}
```

Cada rol tiene su propio campo de ID. Esta funcion normaliza la extraccion.

---

## Integracion en main.tsx

**Ruta**: `src/main.tsx`
**Cambios realizados en Fase 3**:

```tsx
import "./features/locale/infrastructure/i18n";  // ← Inicializa i18next

// ...

<LocaleInitializer>           // ← Envuelve todo
  <AuthInitializer>           // ← Auth depende de locale estar listo
    <App />
  </AuthInitializer>
</LocaleInitializer>
```

**Orden de wrappers** (importante):

```
LocaleInitializer  (mas externo)
    └── AuthInitializer
        └── App
```

`LocaleInitializer` esta por fuera de `AuthInitializer` porque necesita resolver el locale **antes** de que la app sepa si hay sesion. AuthInitializer puede ejecutarse en paralelo porque el store de locale ya tiene los datos en memoria.

**Import de i18n.ts**: Sin este import, `i18next.init()` nunca se ejecutaba. Los 11 JSON de traduccion de es-LA quedaban fuera del bundle y `useTranslation()` fallaba silenciosamente.

---

## Refactor: Opcion A — checkIfSessionExists

### Problema original

Originalmente, `hydrateFromStorage()` usaba `getLastActiveUserId()` para saber quien era el ultimo usuario. Esto requeria que `setLastActiveUserId()` se llamara en cada login/logout para mantener el puntero actualizado. Era fragil:

```typescript
// ANTES: dependia de un puntero externo
const lastUserId = await getLastActiveUserId();  // puntero en Dexie
const cached = await getUserCachedLocale(lastUserId);
```

Problemas:
- Si el puntero se borraba (por un clear parcial de Dexie), la app perdia la referencia aunque la sesion del usuario siguiera viva
- Si dos usuarios compartian un dispositivo, el puntero podia quedar inconsitente
- Requeria mantenerse manualmente en cada auth action

### Solucion: checkIfSessionExists

```typescript
export async function checkIfSessionExists(): Promise<string | null> {
  const stored = await loadAuthFromStorage();
  if (!stored?.user) return null;
  const user = stored.user;
  switch (user.role) {
    case "student": return user.studentId;
    case "parent": return user.parentId;
    case "teacher": return user.teacherId;
  }
}
```

Lee directamente los tokens guardados en Dexie y retorna el `userId` si hay sesion activa, o `null` si no la hay.

**Ventajas**:
- Fuente de verdad unica: los tokens de sesion en Dexie
- No requiere mantenimiento manual del puntero
- Funciona incluso si hubo un clear parcial de Dexie (los tokens sobreviven)
- Es mas simple: menos codigo, menos superficie de bugs

### Comparacion Antes vs Despues

| Caso | Antes (getLastActiveUserId) | Despues (checkIfSessionExists) |
|------|----------------------------|-------------------------------|
| Maria tiene sesion activa | Puntero → "user-abc" → cache | Tokens → "user-abc" → cache ✅ |
| Juan abre sin sesion | Puntero → null → geo | Tokens → null → geo ✅ |
| Puntero corrupto pero hay sesion | Puntero → null → geo innecesaria | Tokens → userId → cache ✅ **mejor** |
| Clear parcial de Dexie | Puntero perdido, sesion tambien | Ambos se pierden igual ✅ |
| Sesion expirada | Puntero → userId → cache stale | Tokens → userId → cache stale ✅ |

### Cambios en archivos

| Archivo | Cambio |
|---------|--------|
| `auth-storage.ts` | Nueva funcion `checkIfSessionExists()` |
| `locale-store.ts` | `hydrateFromStorage(userId)` con parametro; eliminados imports a `getLastActiveUserId`/`setLastActiveUserId` |
| `locale-persistence.ts` | Eliminadas `setLastActiveUserId()`, `getLastActiveUserId()`, tipo `LastActiveUserEntry`, validador `isLastActiveUserEntry` |
| `LocaleInitializer.tsx` | Usa `checkIfSessionExists()` antes de decidir cache vs geo |

---

## checkIfSessionExists

**Ruta**: `src/features/auth/infrastructure/auth-storage.ts`
**Firma**:

```typescript
export async function checkIfSessionExists(): Promise<string | null>
```

**Implementacion**:

```typescript
export async function checkIfSessionExists(): Promise<string | null> {
  const stored = await loadAuthFromStorage();
  if (!stored?.user) return null;
  const user = stored.user;
  switch (user.role) {
    case "student": return user.studentId;
    case "parent": return user.parentId;
    case "teacher": return user.teacherId;
  }
}
```

**Por que funciona**: `loadAuthFromStorage()` lee de Dexie la entrada de tokens + usuario. Si existe (incluso con token expirado), devuelve el userId. Si no existe (nunca se logueo, o se hizo logout completo), devuelve null.

---

## Historial de Cambios

| Version | Fecha | Cambio |
|---------|-------|--------|
| 1.0.0 | 03 Jul 2026 | Creacion inicial |

## Archivos Relacionados

| Archivo | Ruta |
|---------|------|
| LocaleInitializer | `src/features/locale/components/LocaleInitializer.tsx` |
| Entry point | `src/main.tsx` |
| Auth storage | `src/features/auth/infrastructure/auth-storage.ts` |
| Auth store | `src/features/auth/presentation/store/auth-store.ts` |
