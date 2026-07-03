# Mapa de la Documentación

Estructura completa de `src/docs/` — 12 carpetas + 2 subcarpetas en `archivo/`, 74 archivos `.md`.

---

## `vision/` — Visión General

| Archivo | Descripción |
|---------|-------------|
| `VISION_GENERAL.md` | Visión general de Amauta: roles, funcionamiento online/offline, flujo de usuario, principios de diseño |

---

## `marca/` — Identidad de Marca

| Archivo | Descripción |
|---------|-------------|
| `BRAND_ESSENCE.md` | Esencia de marca: propuesta de valor, storytelling (cóndor mentor), tono de voz, personalidad |
| `BRAND_VISUAL_GUIDE.md` | Guía visual: tipografía (Nunito), paleta de colores, espaciado, sombras, iconografía |

---

## `diseno/` — Design System (5 capas)

| Archivo | Descripción |
|---------|-------------|
| `README.md` | Índice del Design System: stack, convenciones, reglas de importación |
| `01-base-layer.md` | Componentes base: AmautaButton, AmautaCard, AmautaBadge, AmautaProgress, AmautaInput, AmautaDialog |
| `02-layout-layer.md` | Componentes de layout: AmautaContainer, AmautaSection, AmautaGrid, AmautaDivider |
| `03-brand-layer.md` | Componentes de marca: AmautaHero, AmautaCondorGuide, AmautaLearningPath, AmautaStatCard, AmautaAchievement |
| `04-patterns.md` | Patrones compuestos: HeroWithCondor, EducationalSection, CTAEducational, FeatureGrid, HowItWorks, StudentProgressPanel, ParentMetricsGrid |
| `05-story-layer.md` | Componentes de estado: AmautaTransition, AmautaLoadingState, AmautaEmptyState, AmautaErrorState, AmautaReveal |

---

## `fundamentos/` — Fundamentos Técnicos

| Archivo | Descripción |
|---------|-------------|
| `ARCHITECTURE_LAYERS.md` | Arquitectura de capas: UI → Zustand → TanStack Query → Dexie, flujo de login, hydratación, mutations offline |
| `DEXIE_INDEXEDDB_GUIDE.md` | Guía completa de Dexie/IndexedDB: schema `amauta-db`, tablas, CRUD, migración, debugging |
| `PERSISTENCE_DEXIE.md` | Persistencia general: qué va en Zustand vs TanStack Query vs Dexie, auth tokens, usuarios, preferencias |

---

## `nucleo/` — Funcionalidades Núcleo

| Archivo | Descripción |
|---------|-------------|
| `API_CONTRACT.md` | Contrato de API con el backend: endpoints, request/response, Zod validations, headers, errores |
| `AUTH_FLOW.md` | Arquitectura de autenticación: login, logout, token refresh, offline mode, persistencia de sesión |
| `AUTH_CHANGES.md` | Historial de cambios y decisiones técnicas de auth (migración de localStorage a Dexie) |
| `BACKEND_CONFLICT_RESOLUTION.md` | Contrato de resolución de conflictos para el backend: timestamps, HTTP 409, estrategias por endpoint |

---

## `sin-conexion/` — Modo Offline y Sincronización

| Archivo | Descripción |
|---------|-------------|
| `OFFLINE_QUEUE_SYSTEM.md` | **Sistema de cola offline actual**: app-level outbox con Dexie + queue-manager + background-sync + useSafeMutation |
| `OUTBOX_PATTERN.md` | Patrón outbox actualizado: concepto general + referencias al sistema actual |
| `SERVICE_WORKER.md` | Service Worker: precaching, runtime caching, navegación SPA, patrones de matching API |
| `MANIFEST.md` | Web App Manifest: campos clave, iconos (any vs maskable), shortcuts, troubleshooting |
| `CACHES_EXPLAINED.md` | Explicación detallada de cada cache del SW: estrategias, condiciones de creación, contenido |
| `SW_DEV_MODE.md` | Por qué el SW solo funciona en producción, cómo activarlo en desarrollo si es necesario |

---

## `errores/` — Manejo de Errores

| Archivo | Descripción |
|---------|-------------|
| `ERROR_HANDLING.md` | Arquitectura de errores: ErrorBoundary, códigos de error, fallbacks (student/parent/generic), edge cases |
| `LOGIN_ERROR_UX.md` | UX de errores en login: banner vs field-level, mapeo de errores a mensajes amigables |
| `ERROR_HANDLING_TEST_GUIDE.md` | Guía de testing para manejo de errores: ErrorBoundary, ConnectionStatus, fallbacks |

---

## `desarrollo/` — Herramientas de Desarrollo

| Archivo | Descripción |
|---------|-------------|
| `DEV_ONLINE_TOGGLE.md` | Componente DevOnlineToggle: forzar online/offline en desarrollo, modo de uso y limpieza |
| `MOCK_SYSTEM.md` | Sistema de mocks: VITE_USE_MOCK, usuarios mock, adaptador mock vs real, archivos .env |

---

## `internacionalizacion/` — Internacionalización (i18n)

| Archivo | Descripción |
|---------|-------------|
| `00_INDICE.md` | Índice del sistema i18n: orden de lectura, glosario, mapa conceptual |
| `01_VISION_GENERAL.md` | Visión general: problema (variantes regionales LatAm), solución, 4 mecanismos |
| `02_MODELO_DE_DOMINIO.md` | Modelo de dominio: tipos LocaleId, constantes, configuración, LOCALE_MAP |
| `03_INFRAESTRUCTURA.md` | Infraestructura: i18next con es-LA embebido, geo-detección, persistencia Dexie |
| `04_STORE_Y_HOOKS.md` | Store y hooks: locale-store (Zustand), useLanguage, useLocale, locale-utils |
| `05_LOCALE_INITIALIZER.md` | LocaleInitializer: resolución pre-auth y post-auth, integración con AuthInitializer |
| `06_FLUJO_PREAUTH.md` | Flujo pre-auth: detectPreAuthLocale, timeout, memoización post-auth |
| `07_PERSISTENCIA_DEXIE.md` | Persistencia Dexie para traducciones: schema, versioning, invalidación, claves por userId |
| `08_VARIANTES_REGIONALES.md` | Variantes regionales: archivos en public/locales/*, estrategia de traducción, SW caching |
| `09_DIAGRAMAS.md` | Diagramas ASCII: flujo de inicio, geo-detección, árbol de decisión de locale, estructura de archivos |
| `10_PROBLEMAS_CONOCIDOS.md` | Problemas conocidos y casos pendientes: ordenamiento en getUserCachedLocale, edge cases |
| `PLAN_DOCUMENTACION.md` | Plan original de creación de la documentación i18n |

---

## `archivo/` — Planes Históricos y Documentación Archivada

Documentación de planificación y correcciones anteriores. Contenido histórico mantenido como referencia.

### `archivo/planificacion/` — Planificación y Roadmap

| Archivo | Descripción |
|---------|-------------|
| `ROADMAP.md` | Roadmap maestro: prioridades P0-P4, estado funcional actual, items completados |
| `PLAN.md` | Plan de trabajo por fases: Fase 0 (fixes críticos) en adelante, estado y esfuerzo |
| `TODOS.md` | Implementaciones pendientes: P5.1 (backend real), P5.2 (screenshots manifest), P5.3 (conflict resolution), P5.4 (stopBackgroundSync) |
| `ALINEACION_FIGMA.md` | Alineación con Figma: mapeo del design system Figma a la arquitectura de 5 capas |
| `UX_CHILD_MIGRATION.md` | Migración UX infantil: fases para migrar la UI a diseño amigable para niños |
| `MASCOT_IMPLEMENTATION.md` | Implementación de mascota animada: transformar llama/cóndor JPG en personaje animado con estados de ánimo |
| `REWARD_ANIMATIONS.md` | Sistema de animaciones de recompensa: partículas, confeti, "chispas de conocimiento" |
| `SOUND_SYSTEM.md` | Sistema de sonido: feedback de audio para respuestas correctas/incorrectas, accesibilidad |
| `I18N_PLAN.md` | Plan original de i18n: offline-first para variantes de español latinoamericano |
| `P5_PLAN.md` | Detalles de Fase 8 (P5): configuración .env para backend real, VITE_APP_VERSION |

### `archivo/arreglar/` — Correcciones de i18n (histórico)

| Archivo | Descripción |
|---------|-------------|
| `I18N_PLAN_v2.md` | Plan v2 de i18n: decisiones arquitecturales, desglose Fase 0-13 |
| `I18N_PLAN_v3.md` | Plan v3 de i18n: añade geo-detección pre-auth para login/register |
| `I18N_FIXES_F0_F1.md` | Fixes críticos Fase 0 y 1: 5 problemas (LOCALE_VERSION global, userId faltante, race conditions i18next) |
| `I18N_FIXES_F0_F1_RESUMEN.md` | Resumen de los fixes aplicados: cambios en locale.constants, types, i18n.ts, locale-persistence |
| `FASE2_RESUMEN.md` | Resumen Fase 2: locale-store, useLanguage, useLocale, locale-utils |
| `FASE3_RESUMEN.md` | Resumen Fase 3: LocaleInitializer, modificaciones a main.tsx y sw.ts |
| `FASE12_REGIONAL_VARIANTS.md` | Resumen Fase 12: reemplazo de traducciones placeholder con contenido real, soporte en-US |
| `FIX_US_CU_MX_TRANSLATIONS.md` | Fix de mapeo: US y CU → es-MX, creación de archivo es-MX |
| `I18N_OPCION_A_REFACTOR.md` | Refactor Opción A: reemplazar getLastActiveUserId por checkIfSessionExists |
| `I18N_RESUMEN_APLICADO.md` | Resumen de cambios i18n v3 aplicados: geo-detección pre-auth |
| `PROMPT_GEO_PREAUTH.md` | Prompt/plan usado para implementar geo-detección pre-auth: contexto, cambios, snippets |

---

## `pruebas-automatizadas/` — Testing Automatizado

| Archivo | Descripción |
|---------|-------------|
| `TESTING_STRATEGY_GUIDE.md` | Estrategia general de testing: stack, configuración, estructura, tipos de tests, mocks |
| `PERSISTENCE_TEST_GUIDE.md` | Testing de persistencia: inspeccionar IndexedDB/Dexie, verificar auth, debugging de hydratación |
| `FASE1-INFRAESTRUCTURA.md` | Fase 1: setup de Vitest, vitest.config.ts, test setup, jsdom |
| `FASE2-TESTS-RETRY.md` | Fase 2: tests para retry.ts (exponential backoff) |
| `FASE3-TESTS-CONFLICT.md` | Fase 3: tests para conflict.ts (4 estrategias, 9 funciones) |
| `FASE3B-TESTS-KEYS.md` | Fase 3b: tests para keys.ts (cache keys de TanStack Query) |
| `FASE3C-TESTS-CLIENT.md` | Fase 3c: tests para client.ts (HttpClient, HttpError, isHttpError) |
| `FASE4-TESTS-AUTH-ERROR.md` | Fase 4: tests para auth-error.ts (mapHttpErrorToAuthError, árbol de códigos) |
| `CONFLICTOS.md` | Estrategias de resolución de conflictos explicadas en lenguaje natural: 4 estrategias, árbol de decisión, diagramas |

---

## `pruebas-manuales/` — Pruebas Manuales / QA

| Archivo | Descripción |
|---------|-------------|
| `TESTING_MANUAL.md` | Guía de pruebas manuales para Fase 3 y 4: escenarios paso a paso para topic selector, dificultades, flujo de ejercicios |
| `TESTING_VITEST.md` | Plan de testing Vitest por fases: infraestructura actual (12 archivos, ~286 tests), setup, comandos |
| `TESTING_OFFLINE.md` | Pruebas manuales del sistema offline: encolar mutations, sincronización, retry, prioridad, comandos de diagnóstico |
