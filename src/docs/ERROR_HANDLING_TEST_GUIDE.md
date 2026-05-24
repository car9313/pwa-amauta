# FASE 7 - Guía de Pruebas y Verificación

## Prerequisites

```bash
pnpm dev  # ejecutar en http://localhost:5173
```

## Tests de Error Boundaries

### Test 1: Global Boundary - Crash de App

**Pasos:**
1. Abrir DevTools (F12) → Console
2. Ejecutar en consola:
```js
throw new Error("Test global error");
```
3. Verificar que muestra StudentFallback o ParentFallback (no pantalla blanca)

**Esperado:**
- ✅ Fallback amigablevisible
- ✅ Botón "Intentar de nuevo"
- ✅ Botón "Ir al inicio"

---

### Test 2: Layout Error Boundary - Crash en Header

**Pasos:**
1. En el componente AppHeader, forzar error:
```tsx
// Temporalmente en app-header.tsx
throw new Error("Test layout error");
```

**Esperado:**
- ✅ Solo el header muestra fallback
- ✅ El resto de la app funciona normalmente

---

## Tests de Edge Cases

### Test 3: Refresh Fail + Hay Sesión Offline

**Pasos:**
1. Login exitoso (tener sesión guardada en Dexie)
2. Desactivar WiFi / network offline
3.hacer cualquier acción que requiera refresh de token
4. Verificar que la app permite acceso read-only

**Esperado:**
- ✅ Banneramarillo: "Sin conexión - modo offline"
- ✅ Puede ver datos guardados localmente
- ✅ No pierde la sesión

---

### Test 4: Refresh Fail + No Hay Sesión

**Pasos:**
1. Sin sesión previa
2. Sin conexión a internet
3. Intentar login

**Esperado:**
- ✅ Error claro mostrado
- ✅ Redirige a /login cuando hay conexión

---

### Test 5: Token Revocado

**Pasos:**
1. Tener sesión activa
2. Servidor retorna 403 (token revocado)
3. Verificar logout forzado

**Esperado:**
- ✅ Mensaje: "Sesión cerrada por seguridad"
- ✅ Limpia todos los datos
- ✅ Redirige a /login

---

### Test 6: Outbox Overflow

**Pasos:**
1. Encolar muchas mutations (>50)
2. Observar que se eliminan las más antiguas

**Esperado:**
- ✅ Nunca hay más de 50 items en cola
- ✅ Los más antiguos se eliminan automáticamente

---

## Tests de Logging

### Test 7: Error Logging

**Pasos:**
1. Forzar un error en la app
2. Abrir DevTools → Application → Local Storage
3. Buscar key `amauta_error_logs`

**Esperado:**
- ✅ Error guardado con timestamp
- ✅ Stack trace presente
- ✅ URL y userAgent registrados

---

## Tests de UI

### Test 8: ConnectionStatus Banner

**Pasos:**
1. Desactivar red (offline mode)
2. Verificar que aparecen el banner

**Esperado:**
- ✅Banneramarillo en la parte superior
- ✅ Icono de WiFi-off
- ✅ Mensaje de error apropiado

---

### Test 9: Fallback según Rol

**Pasos:**
1. Login como niño → forzar error → verificar StudentFallback
2. Login como padre → forzar error → verificar ParentFallback

**Esperado:**
- Niño: tono amigable, colores orange
- Padre: tono profesional, colores neutros

---

## Comandos de Debug

### Ver Errores en LocalStorage

```js
// Console
JSON.parse(localStorage.getItem('amauta_error_logs') || '[]')
```

### Ver Estado de Auth

```js
// Console - acceder Zustand store
// Necesitas agregar en window para debug
window.__authStore = // tu store reference
```

### Forzar Offline

```js
// Console
navigator.onLine = false; // Simulation
```

---

## Checklist de Verificación

| Test | Status |
|------|--------|
| Global Error Boundary funciona | ⬜ |
| Fallback según rol | ⬜ |
| Offline mode sin pérdida de sesión | ⬜ |
| Outbox limit de 50 | ⬜ |
| Error logging activo | ⬜ |
| ConnectionStatus visible | ⬜ |

---

## Referencias

- Documentación de errores: `docs/ERROR_HANDLING.md`
- Auth flow: `docs/AUTH_FLOW.md`
- AGENTS.md (sección Fase 7)