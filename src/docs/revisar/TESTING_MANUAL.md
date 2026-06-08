# Pruebas Manuales — Fase 3 y Fase 4

## Requisitos

- `pnpm dev` — servidor de desarrollo
- `pnpm build && pnpm preview` — build de producción con Service Worker
- Navegador con DevTools (Chrome recomendado)
- Sesión iniciada (mocks activos por defecto en `.env`)

---

## Fase 3 — Práctica

### Selector y flujo

| # | Escenario | Pasos | Resultado esperado |
|---|-----------|-------|--------------------|
| 1 | Selector de tema | Navegar a `/practice`. Clic en cada tema | Botón activo se marca azul `#1f4fa3` con fondo `#e7eefb` |
| 2 | Selector de dificultad | Clic en cada nivel (1-3 estrellas) | Nivel se marca naranja `#f4701f`. Estrellas se llenan |
| 3 | Iniciar práctica | Seleccionar tema + dificultad. Clic "Comenzar a practicar" | Desaparece selector. Aparece contador + input |
| 4 | Respuesta excelente | Ingresar `15`, clic "Contestar" | FeedbackPage: score 100, "¡Excelente trabajo!" |
| 5 | Respuesta buena | Ingresar `7`, clic "Contestar" | FeedbackPage: score 75, "¡Buen trabajo!" |
| 6 | Respuesta fallida | Ingresar `3`, clic "Contestar" | FeedbackPage: score 40, "¡Sigue intentando!", muestra errores |
| 7 | Contador de sesión | Completar 3+ ejercicios | Aciertos/racha/intentos se actualizan en tiempo real |
| 8 | Volver al selector | Clic "Cambiar tema" | Vuelve al selector. Contadores se reinician |
| 9 | Loading | Conexión lenta | Spinner con `animate-ping` + `Sparkles` |
| 10 | Error | Desconectar backend | Mensaje + botón "Reintentar" |
| 11 | Offline | Preview + DevTools offline. Responder | FeedbackPage: "Respuesta guardada, se sincronizará" |

### Mock de respuestas

| Valor ingresado | Score | Passed |
|-----------------|-------|--------|
| `> 10` | 100 | true |
| `5` a `10` | 75 | true |
| `< 5` o no numérico | 40 | false |

---

## Fase 3 — Juegos

### Portal

| # | Escenario | Pasos | Resultado esperado |
|---|-----------|-------|--------------------|
| 12 | Portal de juegos | Navegar a `/games` | 3 tarjetas: Memoria, Contrarreloj, Quiz |
| 13 | Hover en tarjetas | Mouse sobre cada una | Escala 1.02 + sombra |

### Memoria Matemática

| # | Escenario | Pasos | Resultado esperado |
|---|-----------|-------|--------------------|
| 14 | Iniciar | Clic en "Memoria Matemática" | Tablero 4x4 con cartas `?` en azul |
| 15 | Voltear carta | Clic en carta | Se voltea mostrando operación o resultado |
| 16 | Match correcto | Voltear par del mismo par | Ambas se ocultan con animación. Pares +1 |
| 17 | Match incorrecto | Voltear 2 cartas distintas | ~0.8s después se voltean de nuevo |
| 18 | Victoria | Encontrar los 8 pares | Pantalla de resultado con puntaje |
| 19 | Reiniciar | Clic "Jugar de nuevo" | Nuevo tablero |
| 20 | Volver | Clic "Volver" (flecha) | Portal de juegos |

### Reto Contrarreloj

| # | Escenario | Pasos | Resultado esperado |
|---|-----------|-------|--------------------|
| 21 | Iniciar | Clic en "Reto Contrarreloj" | Timer 60s, score, streak, operación |
| 22 | Acierto | Responder correctamente, OK | Nueva operación, score +10+bonus |
| 23 | Error | Responder incorrectamente, OK | Nueva operación, streak = 0 |
| 24 | Barra de tiempo | Observar barra | Se reduce. Verde > naranja > rojo |
| 25 | Tiempo agotado | Esperar a 0s | Pantalla de resultado |
| 26 | Salir | Clic "Volver" durante juego | Portal de juegos |

### Quiz Opción Múltiple

| # | Escenario | Pasos | Resultado esperado |
|---|-----------|-------|--------------------|
| 27 | Iniciar | Clic en "Quiz" | Pregunta + 4 opciones + barra 1/10 |
| 28 | Correcta | Clic en opción correcta | Verde, feedback "¡Correcto!", botón "Siguiente" |
| 29 | Incorrecta | Clic en opción incorrecta | Rojo, verde en correcta, muestra respuesta |
| 30 | Navegar | Clic "Siguiente" | Avanza pregunta, barra progresa |
| 31 | Completar | Responder 10 preguntas | Pantalla de resultado final |
| 32 | Reiniciar | Clic "Jugar de nuevo" | Nuevas preguntas |
| 33 | Bloqueo post-respuesta | Responder e intentar otra opción | No debe permitir cambio |

### Navegación

| # | Escenario | Pasos | Resultado esperado |
|---|-----------|-------|--------------------|
| 34 | Breadcrumb Práctica | `/practice` | Inicio > Práctica |
| 35 | Breadcrumb Juegos | `/games` | Inicio > Juegos |
| 36 | Menú hamburguesa | Abrir menú | "Práctica" y "¡Juguemos!" visibles |

### Build de Producción

| # | Escenario | Pasos | Resultado esperado |
|---|-----------|-------|--------------------|
| 37 | Build | `pnpm build` | 0 errores. Chunks: `practice-page-*.js` (7.24 kB), `games-page-*.js` (18.77 kB) |
| 38 | Precarga SW | Preview. Cache Storage > precache-v2 | 37+ entradas |
| 39 | Offline total | Preview + Offline en DevTools | `/practice` y `/games` cargan desde precache |

---

## Fase 4 — Teacher Dashboard

### Estado actual: Placeholder

| # | Escenario | Pasos | Resultado esperado |
|---|-----------|-------|--------------------|
| 40 | Ruta existe | Navegar a `/dashboard/teacher` | Placeholder con icono "Próximamente" |
| 41 | No rompe navegación | Visitar y luego ir a otras rutas | Todo funciona normal |
| 42 | Menú por rol | Login como student/parent | "Panel de Docentes" no aparece |

### Pendiente de implementar

Cuando se desarrolle, probar:

| # | Escenario | Resultado esperado |
|---|-----------|--------------------|
| 43 | Vista de clases | Lista de grupos del docente |
| 44 | Tabla de estudiantes | Nombre, puntaje, precisión, racha, última actividad |
| 45 | Estadísticas grupales | Promedio por tema, gráficos |
| 46 | Exportar reportes | Opción de exportación funcional |
| 47 | Offline | Datos cacheados sin conexión |
| 48 | Roles | Solo teacher puede acceder |
| 49 | Responsive | Mobile, tablet, desktop |
