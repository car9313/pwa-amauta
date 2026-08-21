# Web App Manifest - Amauta

## Que es el manifest

El `manifest.webmanifest` es un archivo JSON que le dice al navegador como debe comportarse la aplicacion cuando se instala en el dispositivo. Sin manifest, el navegador trata la app como un sitio web comun.

## Configuracion en vite.config.ts

El manifest se define dentro del plugin `VitePWA` en `vite.config.ts`. Durante el build, `vite-plugin-pwa` genera `manifest.webmanifest` en `dist/`.

```typescript
VitePWA({
  manifest: {
    id: '/',
    name: 'Amauta',
    short_name: 'Amauta',
    description: 'Plataforma educativa interactiva para ninos y familias.',
    lang: 'es-419',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#ffffff',
    theme_color: '#0b6bf6',
    icons: [ /* ... */ ],
    shortcuts: [ /* ... */ ]
  }
})
```

## Campos clave

| Campo | Valor | Que hace |
|-------|-------|----------|
| `id` | `"/"` | Identificador unico de la PWA. Si falta, Chrome usa `start_url` como fallback (warning en DevTools). Se agrego para eliminar ese warning. |
| `display` | `"standalone"` | La app se abre sin barra de direcciones del navegador, como una app nativa. |
| `scope` | `"/"` | Define que rutas controla la PWA. Todo lo que este fuera del scope se abre en el navegador. |
| `start_url` | `"/"` | Ruta que se abre cuando el usuario inicia la app desde el icono instalado. |
| `orientation` | `"portrait"` | Fija la orientacion vertical (importante para experiencia infantil). |
| `theme_color` | `"#0b6bf6"` | Color de la barra de herramientas del navegador en mobile. |

## Iconos

El manifest define 4 iconos con dos propositos distintos:

```json
{ "src": "/icons/manifest-icon-192.maskable.png", "sizes": "192x192", "purpose": "any" },
{ "src": "/icons/maskable-192.png",             "sizes": "192x192", "purpose": "maskable" },
{ "src": "/icons/manifest-icon-512.maskable.png", "sizes": "512x512", "purpose": "any" },
{ "src": "/icons/maskable-512.png",             "sizes": "512x512", "purpose": "maskable" }
```

### Diferencia entre `any` y `maskable`

| `purpose` | Comportamiento | Se usa cuando... |
|-----------|---------------|------------------|
| `any` | El navegador puede recortar el icono como quiera (redondo, cuadrado, etc.) | No hay requisito de forma especifica |
| `maskable` | El navegador respeta un area segura con padding del 20% | El icono necesita verse bien en todos los formatos (circulo, cuadrado, etc.) |

Los iconos `maskable` fueron generados con padding del 20% usando el script `scripts/generate-maskable-icons.mjs`.

### Como verificar que los iconos cargan correctamente

1. Abrir DevTools (F12)
2. Ir a **Application > Manifest**
3. En la seccion "Icons", cada icono aparece con su URL
4. **Hacer clic en cada URL** (son links clickeables)
5. Si se abre una pestana mostrando la imagen -> el icono existe y carga bien (HTTP 200)
6. Si da error 404 -> el archivo falta o la ruta es incorrecta

Los iconos existen en `dist/icons/` y se copian desde `public/icons/` durante el build.

## Shortcuts

Los shortcuts aparecen al hacer **long-press** (presion prolongada) en el icono de la app instalada.

```json
{
  "name": "Continuar ultima leccion",
  "short_name": "Continuar",
  "url": "/lessons/continue",
  "icons": [{ "src": "/icons/shortcut-96.png", "sizes": "96x96" }]
}
```

## Como verificar el manifest en DevTools

1. Abrir Chrome DevTools (F12)
2. Ir a **Application > Manifest**
3. Alli se muestran:
   - **Identity**: name, short_name, id, start_url
   - **Presentation**: display, orientation, theme/background color, scope
   - **Icons**: todos los iconos definidos (con preview visual y URL)
   - **Shortcuts**: accesos directos disponibles

### Errores y warnings comunes

| Warning | Significado | Solucion |
|---------|-------------|----------|
| `id is not specified` | Chrome usa `start_url` como fallback | Agregar `"id": "/"` al manifest (ya resuelto) |
| `Richer PWA Install UI` faltan screenshots | La UI de instalacion mejorada no esta disponible | Agregar screenshots al manifest (post-MVP) |
| Icono no carga (404) | La ruta del icono no existe | Verificar que el archivo existe en `public/icons/` y se copia al build |

## Screenshots (PENDIENTE)

Las entradas de screenshots **ya estan configuradas** en `vite.config.ts` (bloque `manifest.screenshots`), pero los archivos PNG **no existen todavia**. La carpeta `public/screenshots/` no existe.

### Archivos pendientes de crear

| Archivo pendiente | Tamaño declarado | `form_factor` | Estado |
|---|---|---|---|
| `public/screenshots/dashboard-student.png` | 1080x1920 | `wide` | Pendiente + inconsistencia (ver abajo) |
| `public/screenshots/lesson-view.png` | 1080x1920 | `narrow` | Pendiente |
| `public/screenshots/practice-exercise.png` | 1080x1920 | `narrow` | Pendiente |

### Inconsistencia detectada

`dashboard-student.png` declara `form_factor: "wide"` pero con tamaño 1080x1920 (vertical/retrato). Chrome exige que un screenshot `wide` sea horizontal (paisaje). Al crear el archivo, usar una captura horizontal (ej. 1280x720 o 1920x1080) y actualizar `sizes` en `vite.config.ts`, o cambiar el `form_factor` a `narrow`.

### Impacto

Mientras los archivos no existan:
- Chrome muestra warnings en DevTools:
  - `Richer PWA Install UI won't be available on desktop...`
  - `Richer PWA Install UI won't be available on mobile...`
- La UI de instalacion mejorada (con screenshots) no esta disponible
- Es **cosmetico**: NO afecta la instalacion basica de la PWA

### Como resolverlo

1. Tomar capturas reales de la app (dashboard del nino, vista de leccion, ejercicio)
2. Guardarlas en `public/screenshots/` con los nombres de la tabla
3. Verificar que las dimensiones coincidan con `sizes` en `vite.config.ts`
4. Corregir la inconsistencia `wide`/vertical de `dashboard-student.png`

> Prioridad: baja (post-MVP). La app instala y funciona sin screenshots.

## Manifest en desarrollo (pnpm dev)

En `pnpm dev` el manifest **se ve vacio en DevTools** (Application > Manifest: "No manifest detected") y no aparece la opcion de instalar. Esto es **comportamiento esperado**, no un bug.

| Aspecto | Detalle |
|---------|---------|
| Causa | `devOptions.enabled: false` en `vite.config.ts`. Con esto, `vite-plugin-pwa` NO genera ni sirve `manifest.webmanifest`, y NO inyecta `<link rel="manifest">` en el HTML servido |
| Donde existe el manifest | Solo se genera durante `pnpm build`, en `dist/manifest.webmanifest` |
| Service Worker | Igual: desactivado en dev (ver `SW_DEV_MODE.md`) |

### Como verificar la instalacion de la PWA

```bash
pnpm build && pnpm preview
```

1. Abrir `http://localhost:4173` en Chrome
2. DevTools > Application > Manifest: debe mostrar Identity, Presentation, Icons y Shortcuts
3. Aparecera el icono de instalar en la barra de direcciones (o Menu > Instalar Amauta)

> Nota: agregar manualmente `<link rel="manifest">` a `index.html` NO es necesario ni recomendado: el plugin lo inyecta solo durante el build, y en dev el archivo no existiria (404).

## Referencias

- [vite-plugin-pwa manifest docs](https://vite-pwa.dev/guide/pwa-minimal-requirements.html)
- [MDN Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [Maskable icons](https://web.dev/articles/maskable-icon)
