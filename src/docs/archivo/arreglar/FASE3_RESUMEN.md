# Resumen Fase 3 — LocaleInitializer + Integración en App

> **Plan**: `I18N_PLAN_v2.md` · **Fase anterior**: `FASE2_RESUMEN.md`
> **Fecha**: 2026-06-27 · **Estado**: ✅ Completado

---

## Archivos Creados / Modificados (3)

| # | Archivo | Cambio |
|---|---------|--------|
| 3.1-3.2 | `src/features/locale/components/LocaleInitializer.tsx` | **CREADO** — componente orquestador NO blocking |
| 3.4 | `src/main.tsx` | **MODIFICADO** — +LocaleInitializer wrapper, +import i18n.ts |
| 3.5 | `src/sw.ts` | **MODIFICADO** — +ruta CacheFirst para `/locales/*` |

---

## Detalle por Tarea

### 3.1 — `LocaleInitializer.tsx` (componente)

Creado en `src/features/locale/components/LocaleInitializer.tsx`.

**Comportamiento**:
- Renderiza `{children}` inmediatamente (NO bloquea la UI)
- **Fase 1** (mount): llama `hydrateFromStorage()` para leer preferencia de locale desde Dexie
- **Fase 2** (auth ready): observa el AuthStore via `useAuthStore` selectors. Cuando `hasHydrated + isAuthenticated + user`, llama `resolveAndCacheLocale(userId)`  
  - Extrae el userId según el rol: `studentId`, `parentId`, o `teacherId`
  - NO contiene lógica de negocio propia — todo delega al store

### 3.2 — Versiones (integrado en store)

La validación de versiones ya estaba implementada en `resolveAndCacheLocale` (Fase 2) mediante `isLocaleStale()` que compara contra `LOCALE_VERSIONS[localeId]`.

### 3.4 — `main.tsx` (integración)

**Dos cambios**:

1. **Import de `i18n.ts`** (crítico):
   ```typescript
   import './features/locale/infrastructure/i18n'
   ```
   Sin esta línea, `i18next.init()` nunca se ejecutaba. Los 11 JSON de traducción de es-LA quedaban fuera del bundle y `useTranslation()` fallaba silenciosamente. Con el import, i18next se inicializa con `initReactI18next`, carga es-LA con todos sus namespaces, y expone `t()` a toda la app.

2. **Wrapper `LocaleInitializer`**:
   ```tsx
   <LocaleInitializer>
     <AuthInitializer>
       <App />
     </AuthInitializer>
   </LocaleInitializer>
   ```
   Se coloca **antes** de `AuthInitializer` (por fuera). Como es NO blocking no retrasa el render.

### 3.5 — Service Worker (`sw.ts`)

Nueva ruta de cacheo para archivos de locales:

```typescript
registerRoute(
  ({ url }) => url.pathname.startsWith('/locales/'),
  new CacheFirst({
    cacheName: 'static-resources-v1',
    plugins: [new CacheableResponsePlugin({ statuses: [0, 200] })]
  })
)
```

- Estrategia: **CacheFirst** (los archivos de locale son versionados, nunca cambian sin cambiar URL)
- Misma caché que scripts/fonts (`static-resources-v1`)
- Listo para variantes regionales descargables (Fase 12)

---

## Impacto en la Aplicación

### Lo que cambia AHORA

| Aspecto | Antes | Después |
|---------|-------|---------|
| **i18next** | Nunca se inicializaba (0 imports de `i18n.ts`) | Inicializado con es-LA embebido al arrancar la app |
| **Bundle** | ~371 KB (sin i18next) | ~432 KB (con i18next + react-i18next + 11 JSONs de traducción) |
| **Resolución de locale** | No existía | Al autenticarse, se resuelve locale por usuario (Dexie → Geo → Navigator → es-LA) |
| **SW caching de locales** | No existía | `/locales/*` con CacheFirst en `static-resources-v1` |
| **Preferencia de idioma** | No persistía | Se guarda en Dexie y sobrevive a cierres de app |

### Flujo de inicio completo (tras Fase 2 + 3)

```
1. main.tsx mount
   ├── import i18n.ts → i18next.init(es-LA embebido) ← NUEVO
   │
   ├── <LocaleInitializer>
   │   ├── Render hijos (NO blocking)
   │   ├── useEffect: hydrateFromStorage() → lee preferencia de Dexie
   │   │
   │   ├── <AuthInitializer>
   │   │   ├── useEffect: hydrateFromStorage() → hidrata sesión
   │   │   └── isVerifying ? <AmautaLoadingState /> : children
   │   │
   │   └── Cuando AuthStore: hasHydrated + isAuthenticated + user
   │       → resolveAndCacheLocale(userId)
   │       → Dexie → Geo → fallback → changeLanguage()
   │
   └── App renderiza en locale correcto
```

### Lo que queda pendiente

- Fase 4: Archivos JSON completos (post-inventario de textos hardcodeados)
- Fases 5-9: Migración de componentes a `t()` — recién ahí se verá i18n en la UI
- Fase 12: Variantes regionales descargables (es-MX, es-AR, etc.)

---

## Verificación

```bash
pnpm build    # ✅ tsc -b && vite build — sin errores
pnpm lint     # ✅ Sin advertencias nuevas
```

Peso del bundle principal: 432 KB (antes 371 KB) — incremento de ~60 KB por i18next + react-i18next + recursos embebidos.
