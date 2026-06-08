# Fase 3b: Tests de `keys.ts` — Claves de Caché

## ¿Qué es esto?

`src/lib/query/keys.ts` define las **claves de caché** de TanStack Query. Cada `useQuery` en la app usa una clave para identificar los datos. Si la clave es incorrecta, la caché no funciona: los datos no se refrescan, se mezclan, o se pierden.

## ¿Por qué es importante testear esto?

```typescript
// Ejemplo de uso en la app:
useQuery({
  queryKey: exerciseKeys.next(studentId, tenantId),
  //         ↑ Si esta clave es incorrecta, la query nunca se invalida
})
```

Cada clave es un **array readonly** que identifica unívocamente un dato en caché. Testearlas garantiza que:

- La estructura del array es la esperada
- Los parámetros (IDs, tipos) se incluyen correctamente
- `null` como tenantId se maneja bien
- Cada llamada devuelve un array nuevo (no se comparte la referencia)

## Lo que testeamos

### authKeys — 8 tests

```typescript
authKeys.all                           // → ['auth']
authKeys.login()                       // → ['auth', 'login']
authKeys.register()                    // → ['auth', 'register']
authKeys.session()                     // → ['auth', 'session']
authKeys.refresh()                     // → ['auth', 'refresh']
authKeys.parentDashboard('par_001', 't1')  // → ['auth', 'parent', 'par_001', 't1']
authKeys.parentDashboard('par_001', null)  // → ['auth', 'parent', 'par_001', null]
authKeys.studentProgress('stu_001', 't1')  // → ['auth', 'progress', 'stu_001', 't1']
```

### exerciseKeys — 8 tests

```typescript
exerciseKeys.all                        // → ['exercises']
exerciseKeys.detail('ex_001')           // → ['exercises', 'detail', 'ex_001']
exerciseKeys.byType('VISUAL_ADDITION')  // → ['exercises', 'byType', 'VISUAL_ADDITION']
exerciseKeys.byDifficulty(2)            // → ['exercises', 'byDifficulty', 2]
exerciseKeys.count()                    // → ['exercises', 'count']
exerciseKeys.next('stu_001', 't1')      // → ['exercises', 'next', 'stu_001', 't1']
```

### studentKeys — 3 tests

```typescript
studentKeys.all                        // → ['student']
studentKeys.dashboard('stu_001')       // → ['student', 'dashboard', 'stu_001']
studentKeys.allData()                  // → ['student', 'all']
```

### lessonKeys — 4 tests

```typescript
lessonKeys.all                          // → ['lessons']
lessonKeys.detail('les_001')            // → ['lessons', 'detail', 'les_001']
lessonKeys.bySubject('math')            // → ['lessons', 'bySubject', 'math']
lessonKeys.allData()                    // → ['lessons']
```

### progressKeys — 4 tests

```typescript
progressKeys.all                        // → ['progress']
progressKeys.student('stu_001')         // → ['progress', 'student', 'stu_001']
progressKeys.byLesson('stu_001', 'l1')  // → ['progress', 'byLesson', 'stu_001', 'l1']
progressKeys.count()                    // → ['progress', 'count']
```

## Concepto nuevo: `toEqual` para arrays

```typescript
expect(authKeys.session()).toEqual(['auth', 'session'])
```

`toEqual` compara el **contenido** del array, no la referencia. Esto es clave porque cada llamada a `authKeys.session()` crea un array **nuevo**:

```typescript
authKeys.session() === authKeys.session()  // false (son arrays distintos)
authKeys.session()  // → ['auth', 'session'] en contenido
```

## Concepto nuevo: referencias frescas

```typescript
it('subsequent calls return fresh arrays', () => {
  const first = authKeys.session()
  const second = authKeys.session()
  expect(first).toEqual(second)  // mismo contenido
  expect(first).not.toBe(second) // pero distinta referencia
})
```

Si dos llamadas devolvieran la **misma** referencia de array, mutar uno afectaría al otro. Cada llamada debe crear un array nuevo.

## Por qué NO testeamos la inmutabilidad en runtime

TypeScript marca los arrays como `readonly` con `as const`:

```typescript
export const authKeys = {
  session: () => ['auth', 'session'] as const,
  //                                    ↑ readonly ["auth", "session"]
}
```

Pero `as const` es solo de TypeScript. En JavaScript runtime, el array sigue siendo mutable:

```typescript
const key = authKeys.session()
key.push('extra')  // ❌ TypeScript no lo permite, pero en runtime funciona
```

La inmutabilidad se garantiza en **compilación** (TypeScript), no en runtime. Por eso no tiene sentido testearlo con `toThrow()`.

## Resumen

| Archivo | Tests | Conceptos nuevos |
|---------|-------|-----------------|
| `src/lib/query/keys.test.ts` | **27 tests** | `toEqual` con arrays, referencias frescas, `as const` es compile-time |

**Acumulado: 102 tests | 4 archivos | 100% passing**
