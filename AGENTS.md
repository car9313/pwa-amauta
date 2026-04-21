# AGENTS.md - Amauta

## Stack
- React 19 + TypeScript ~5.9 + Vite 7
- Tailwind CSS 4.2 + shadcn/ui
- Zustand (estado), TanStack Query (data fetching)
- React Router 7, React Hook Form + Zod
- Dexie (IndexedDB), Workbox (PWA)
- Vitest 4 (installed but NOT configured)

## Commands
```bash
pnpm dev        # dev server
pnpm build      # tsc -b && vite build
pnpm lint       # eslint .
pnpm preview    # production preview
```

## ⚠️ Testing
- **NOT configured**: no vitest.config.ts, no test scripts in package.json
- vitest is installed but requires setup to run tests

## Required Conventions
- **Always use `import type`** for type-only imports
- **Named exports only** - no default exports for components
- **Function declarations** for components, arrow functions for utilities
- **_NO emojis** in code, **NO unnecessary comments**
- Use `@/` alias for imports from `src/`

### Import Order
1. External libraries
2. UI components (`@/components/ui`)
3. Utilities (`@/lib`)
4. Domain modules
5. Type imports (`import type`)

### Zustand Stores
```typescript
// ✅ Individual selectors
const user = useAuthStore((state) => state.user);

// ❌ Object destructuring
const { user } = useAuthStore((state) => state);
```

## Architecture
- **Feature-based DDD**: `src/features/[domain]/`
- Each feature: `application/`, `components/`, `domain/`, `hooks/`, `infrastructure/`, `pages/`, `store/`, `utils/`
- Routes use React Router `RouteObject` with guards (`RequireAuth`, `RequireRole`)

## Entry Points
- App: `src/App.tsx`
- Main: `src/main.tsx`
- Styles: `src/index.css` (Tailwind + global)
- PWA Service Worker: `src/sw.ts`