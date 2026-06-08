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

## Screenshots (futuro)

Chrome muestra el warning:
- `Richer PWA Install UI won't be available on desktop. Please add at least one screenshot with form_factor set to wide`
- `Richer PWA Install UI won't be available on mobile. Please add at least one screenshot`

Esto es **cosmetico** (no afecta el funcionamiento). Para resolverlo, habria que agregar:

```json
"screenshots": [
  {
    "src": "/screenshots/desktop.png",
    "sizes": "1280x720",
    "form_factor": "wide",
    "label": "Vista principal de Amauta"
  },
  {
    "src": "/screenshots/mobile.png",
    "sizes": "720x1280",
    "label": "Amauta en dispositivo movil"
  }
]
```

> Prioridad: baja (post-MVP). La app funciona sin screenshots.

## Referencias

- [vite-plugin-pwa manifest docs](https://vite-pwa.dev/guide/pwa-minimal-requirements.html)
- [MDN Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [Maskable icons](https://web.dev/articles/maskable-icon)
