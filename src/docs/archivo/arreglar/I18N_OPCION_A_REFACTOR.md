## Resumen — Refactor a Opción A (sesión como fuente de verdad)

> **Fecha**: 30 Junio 2026
> **Objetivo**: Reemplazar `getLastActiveUserId` (puntero externo) por verificación directa del token de sesión en Dexie como fuente de verdad para saber quién es el usuario pre-auth.

---

## Problema original

`hydrateFromStorage()` usaba `getLastActiveUserId()` para saber quién era el último usuario. Esto requería que `setLastActiveUserId()` se llamara en cada login/logout para mantener el puntero actualizado. Era frágil:

- Si el puntero se borraba (por un clear de Dexie, por ejemplo), la app perdía la referencia aunque la sesión del usuario siguiera viva
- Si dos usuarios compartían un dispositivo, el puntero podía quedar en un estado inconsistente

---

## Cambios aplicados

### 1. `auth-storage.ts` — Nueva función `checkIfSessionExists()`

Lee directamente los tokens guardados en Dexie y retorna el `userId` si hay sesión activa, o `null` si no la hay.

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

**Cómo afecta**: Esta es la nueva fuente de verdad. `LocaleInitializer` la usa para decidir si puede leer cache de un usuario específico o si debe correr geo-detección.

---

### 2. `locale-store.ts` — `hydrateFromStorage` ahora recibe `userId`

| Antes | Después |
|-------|---------|
| `hydrateFromStorage()` sin parámetros | `hydrateFromStorage(userId: string)` |
| Buscaba internamente con `getLastActiveUserId()` | Recibe el userId directamente desde `LocaleInitializer` |
| Dependía del puntero `last-active-user` en Dexie | No depende de nada externo |

También se eliminaron todas las llamadas a `setLastActiveUserId()` (3 en `resolveAndCacheLocale`, 1 en `setUserPreference`).

**Cómo afecta**: El cache de locale ahora se consulta exclusivamente con el `userId` real. No hay un paso intermedio que pueda fallar.

---

### 3. `locale-persistence.ts` — Eliminación de funciones obsoletas

Se eliminaron `setLastActiveUserId()` y `getLastActiveUserId()` junto con sus tipos asociados (`LastActiveUserEntry`, `isLastActiveUserEntry`). Ya no se necesita el filtro `.filter(e => e.id !== "last-active-user")` en `getUserCachedLocale`.

**Cómo afecta**: Menos código, menos superficie de bugs. Dexie ya no guarda entradas "last-active-user" huérfanas.

---

### 4. `LocaleInitializer.tsx` — Nueva lógica de decisión

```typescript
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
```

**Cómo afecta**:

| Caso | Antes | Después |
|------|-------|---------|
| María tiene sesión activa | `getLastActiveUserId()` → "user-abc" → cache es-MX | `checkIfSessionExists()` → "user-abc" → cache es-MX ✅ (igual) |
| Juan abre sin sesión | `getLastActiveUserId()` → null → geo-detección | `checkIfSessionExists()` → null → geo-detección ✅ (igual) |
| Falla el puntero "last-active-user" pero hay sesión | `getLastActiveUserId()` → null → geo innecesaria | `checkIfSessionExists()` → userId → cache ✅ **(mejor)** |
| Clear de Dexie parcial | El puntero se pierde, sesión también se pierde | Ambos se pierden igual ✅ |
| Sesión expirada | `getLastActiveUserId()` → userId → cache stale | `checkIfSessionExists()` → userId (aunque token expirado) → cache ✅ **(igual)** |

---

## Flujo final

```
Pre-auth (mount):
  ├── checkIfSessionExists()
  │   ├── SÍ hay sesión → hydrateFromStorage(userId) → cache → render inmediato
  │   └── NO hay sesión → detectPreAuthLocale(800) → geo → render
  │
Post-auth (login exitoso):
  └── resolveAndCacheLocale(userId)
        → lee cache específico de ESE userId
        → si existe y es válido → aplica y confirma
        → si no existe → usa resultado de geo pre-auth → persiste
```

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `src/features/auth/infrastructure/auth-storage.ts` | + `checkIfSessionExists()` |
| `src/features/locale/store/locale-store.ts` | `hydrateFromStorage(userId)` con parámetro; eliminados imports y llamadas a `getLastActiveUserId`/`setLastActiveUserId` |
| `src/features/locale/infrastructure/locale-persistence.ts` | Eliminadas funciones `setLastActiveUserId`/`getLastActiveUserId` y tipos asociados |
| `src/features/locale/components/LocaleInitializer.tsx` | Usa `checkIfSessionExists()` antes de decidir cache vs geo |
