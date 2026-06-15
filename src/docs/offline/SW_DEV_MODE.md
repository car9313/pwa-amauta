# Service Worker en Desarrollo

## El SW solo funciona en producción

Por defecto, el Service Worker está **deshabilitado en desarrollo** (`pnpm dev`).

```typescript
// vite.config.ts:95-100
devOptions: {
  enabled: false,  // SW desactivado en dev
  type: 'module'
}
```

## Razones

| Razón | Detalle |
|-------|---------|
| **`virtual:pwa-register`** | El SW se registra a través del plugin `vite-plugin-pwa`, que inyecta el precache manifest (`self.__WB_MANIFEST`) solo durante `pnpm build`. En dev no existe ese manifest. |
| **Cache oculta cambios** | Si el SW estuviera activo en dev, empezaría a cachear assets (JS, CSS, HTML). Al hacer cambios en código, el SW serviría la versión cacheada en lugar de la nueva — pé sima UX de desarrollo. |
| **`self.__WB_MANIFEST`** | El precache list solo se genera en build. Sin él, el SW no tiene lista de archivos para cachear al instalarse. |
| **HTTPS / localhost** | Los SW requieren HTTPS o localhost. `vite dev` sirve en localhost, por lo que técnicamente podría funcionar, pero el plugin no genera el manifest en dev. |

## Cómo activar el SW en dev (si es necesario)

```typescript
// vite.config.ts
devOptions: {
  enabled: true,    // ← cambiar a true
  type: 'module'
}
```

**Advertencia**: Al activarlo, el SW cacheará los assets y puede interferir con el hot-reload de Vite. Se recomienda:

- Usar una ventana de incógnito para probar
- Desactivar el SW en DevTools cuando no se necesite
- Hacer hard-reload (Ctrl+F5) después de cada cambio

## Flujo recomendado para pruebas offline

| Qué probar | Cómo |
|-----------|------|
| **Lógica offline de la app** (banners, errores, outbox, UI) | `DevOnlineToggle` en desarrollo (ver `src/docs/dev/DEV_ONLINE_TOGGLE.md`) |
| **Caching del SW, precache, navegación offline real** | `pnpm build && pnpm preview` con DevTools → Offline |

---

## Resumen para principiantes

### ¿Qué es el Service Worker (SW)?

Imagina que el Service Worker es como un **empleado de tienda** que trabaja en la trastienda:

- Cuando tienes internet, el empleado va al almacén central (el servidor) y trae los productos (archivos de la app) para tenerlos listos.
- Cuando **no tienes internet**, el empleado te da los productos que ya tenía guardados en la trastienda. Así la app sigue funcionando aunque estés offline.

### ¿Por qué el SW no trabaja en desarrollo?

Cuando estás programando (`pnpm dev`), estás en el **taller de costura** creando los productos. El empleado de la tienda (el SW) no debería estar guardando versiones a medio hacer porque:

1. **Guardaría versiones incompletas** — si el SW cachea mientras codificas, guardaría una foto de cómo estaba la app en ese momento. Al recargar la página, el SW mostraría esa foto vieja en lugar de tus cambios nuevos. Tendrías que estar limpiando el cache constantemente.

2. **No hay lista de productos** — el SW funciona con una lista de archivos que debe cachear (el "inventario"). Esa lista solo se genera cuando haces `pnpm build` (el "empaquetado final"). En desarrollo esa lista no existe.

3. **Ralentiza el trabajo** — cada vez que cambias una línea de código, Vite actualiza la página automáticamente. Si el SW estuviera activo, interceptaría esa actualización y la app se volvería lenta y confusa.

### ¿Entonces cómo pruebo el modo offline?

Para probar **la lógica de la app sin internet** (que se muestren los mensajes de error, que los botones se deshabiliten, etc.) usamos el **DevOnlineToggle**: un botoncito que aparece en la esquina inferior izquierda cuando estás en desarrollo. Al hacer clic puedes **simular que no hay internet** sin necesidad del SW.

Para probar **el SW real** (que los archivos se cacheen, que la navegación funcione sin conexión real), primero construyes la app con `pnpm build`, la previsualizas con `pnpm preview`, y luego activas el modo offline en las herramientas de desarrollador del navegador (DevTools → Network → Offline).

### En resumen

| Situación | SW activo? | Cómo simular offline |
|-----------|:----------:|---------------------|
| **Desarrollo** (`pnpm dev`) | ❌ No | Usar DevOnlineToggle (botón en pantalla) |
| **Producción real** | ✅ Sí | Desconectar internet o DevTools → Offline |
| **Vista previa** (`pnpm preview`) | ✅ Sí | DevTools → Offline |
