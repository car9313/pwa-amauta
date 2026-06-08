# Fase 1: Infraestructura de Testing

## Objetivo

Configurar Vitest para poder escribir y ejecutar tests en la aplicación. Sin esta base, no se puede testear nada.

---

## ¿Qué creamos?

### 1. `vitest.config.ts` (raíz del proyecto)

```
D:\Proyectos\React\pwa-amauta
└── vitest.config.ts   ← NUEVO
```

Archivo de configuración de Vitest. Le dice al runner:

| Configuración | Valor | ¿Qué significa? |
|--------------|-------|-----------------|
| `environment` | `'jsdom'` | Usa jsdom como "navegador falso" para que React pueda renderizar sin Chrome |
| `globals` | `true` | No necesitás importar `describe`, `it`, `expect` en cada archivo de test |
| `setupFiles` | `['./src/test/setup.ts']` | Ejecuta ese archivo **antes** de cada test (importar matchers, limpiar DOM) |
| `include` | `['src/**/*.{test,spec}.{ts,tsx}']` | Busca tests en toda la carpeta `src/` que terminen en `.test.ts` o `.spec.tsx` |
| `resolve.alias['@']` | `'./src'` | Para que los tests entiendan `import { x } from "@/lib/..."` igual que la app |

### 2. `src/test/setup.ts`

```
D:\Proyectos\React\pwa-amauta\src
└── test/
    └── setup.ts   ← NUEVO
```

Código que se ejecuta antes de cada test:

```typescript
import '@testing-library/jest-dom/vitest'  // Agrega .toBeInTheDocument(), .toHaveClass(), etc.
import { cleanup } from '@testing-library/react'  // Desmonta componentes después de cada test
import { afterEach } from 'vitest'

afterEach(() => {
  cleanup()  // Limpia el DOM para que el próximo test empiece fresco
})
```

**¿Por qué cleanup?** Cuando renderizás un componente con `render(<LoginForm />)`, los elementos HTML quedan en el DOM. Si no los limpiás, el siguiente test arranca con basura del test anterior y puede dar falsos positivos.

### 3. `package.json` — Scripts nuevos

Se agregaron 3 comandos nuevos:

```json
"test": "vitest",              // Modo watch — corre tests cada vez que guardás
"test:run": "vitest run",      // Una sola ejecución (para CI o verificar)
"test:coverage": "vitest run --coverage"  // Ejecuta + reporte de cobertura
```

---

## Dependencias instaladas

```bash
pnpm add -D @testing-library/jest-dom jsdom
```

| Paquete | Versión | ¿Para qué sirve? |
|---------|---------|------------------|
| `@testing-library/jest-dom` | ^6.x | Proporciona matchers como `toBeInTheDocument()`, `toHaveClass()`, `toBeDisabled()`, `toHaveValue()` |
| `jsdom` | ^29.x | Simula un navegador completo (window, document, fetch) en Node.js |

**¿Por qué van en devDependencies?** Porque solo se usan mientras desarrollás. El navegador del usuario NO ejecuta tests ni jsdom.

### ¿Qué había antes?

Ya estaban instalados:

| Paquete | Versión | Propósito |
|---------|---------|-----------|
| `vitest` | ^4.0.18 | El runner de tests (el "motor") |
| `@testing-library/react` | ^16.3.2 | Para renderizar componentes React en tests (`render`, `screen`, `waitFor`) |

---

## Cómo verificar que funciona

```
pnpm test:run
```

Salida esperada:

```
✓ no test files found, exiting with code 1
```

El código 1 es normal porque todavía no hay tests. Lo importante es que Vitest se inicia sin errores. Si hubiera un error de configuración, verías algo como:

```
❌ Cannot find module '@testing-library/jest-dom/vitest'
```

---

## Cómo correr tests (de ahora en adelante)

| Comando | Cuándo usarlo |
|---------|--------------|
| `pnpm test` | Mientras desarrollás — se queda "escuchando" y corre tests cada vez que guardás |
| `pnpm test:run` | Cuando querés verificar que todo pasa de una sola vez |
| `pnpm test -- src/ruta/al/archivo.test.ts` | Solo un archivo específico |
| `pnpm test -- -t "nombre del test"` | Solo tests que coincidan con ese nombre |

---

## Conceptos clave para principiantes

### 1. ¿Qué es jsdom?

React necesita un DOM (Document Object Model) para funcionar: `document.createElement`, `window.addEventListener`, etc. En el navegador eso existe naturalmente. En Node.js (donde corren los tests) no hay navegador. **jsdom** crea un DOM falso en Node.js para que React pueda renderizar sin un navegador real.

### 2. ¿Qué es un matcher?

`expect(algo).toBeInTheDocument()` — `toBeInTheDocument` es un "matcher". Es una función que verifica una condición y tira un error si no se cumple. Sin jest-dom, solo tenés los matchers básicos (`toBe`, `toEqual`). Con jest-dom ganás matchers específicos para DOM:

- `toBeInTheDocument()` — el elemento existe en el DOM
- `toBeVisible()` — el elemento es visible (no tiene `display: none`)
- `toBeDisabled()` — el botón/input está deshabilitado
- `toHaveTextContent('texto')` — contiene ese texto
- `toHaveClass('clase')` — tiene esa clase CSS

### 3. ¿Qué es el setup y por qué se ejecuta antes de cada test?

El `setupFiles` en vitest.config.ts le dice a Vitest: "antes de correr cualquier test, ejecutá este archivo". Ahí importamos los matchers de jest-dom y configuramos `cleanup()` automático después de cada test.

### 4. ¿Cómo encuentra Vitest los archivos de test?

Vitest busca archivos que matchen el patrón `src/**/*.{test,spec}.{ts,tsx}`. Eso significa:

- `src/features/auth/store/auth-store.test.ts` ✅
- `src/lib/sync/retry.test.ts` ✅
- `src/components/LoginForm.test.tsx` ✅
- `src/utils/helpers.spec.ts` ✅

---

## Resumen

```
Se crearon 3 archivos + 1 modificación:
├── vitest.config.ts          ← Configuración de Vitest
├── src/test/setup.ts         ← Setup global (jest-dom + cleanup)
├── src/docs/testing/
│   └── FASE1-INFRAESTRUCTURA.md  ← Esta documentación
└── package.json              ← Se agregaron scripts test
```

La infraestructura está lista para escribir tests.
