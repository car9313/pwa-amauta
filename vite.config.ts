import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
   
    /**
     * PWA plugin (injectManifest)
     *
     * - injectManifest: te permite escribir src/sw.ts con lógica custom (cola offline, background sync, etc).
     * - registerType: 'prompt' te deja decidir en la UI cuándo forzar la actualización.
     * - includeAssets: assets estáticos que quieres pre-cachear/servir desde public.
     *
     * Notas:
     * - Crea `src/sw.ts` (módulo) con Workbox imports o lógica nativa.
     * - En desarrollo puedes activar `devOptions.enabled` para probar SW localmente (con limitaciones).
     */
      VitePWA({
      // Para producción puedes usar 'prompt' (control en UI) o 'autoUpdate' (más sencillo)
      registerType: 'prompt',

      // Usamos injectManifest para poder escribir un service worker con lógica personalizada
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts', // Vite buscará src/sw.ts y lo inyectará en la build

      // Archivos estáticos en /public que queremos asegurar que estén disponibles
      includeAssets: ['favicon.ico', 'robots.txt', 'icons/*.png', 'icons/*.webp'],

      // Manifest: metadatos que el navegador usará para la instalación
      manifest: {
        name: 'Amauta',
        short_name: 'Amauta',
        description: 'Plataforma educativa interactiva para niños y familias.',
        lang: 'es-419',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#ffffff',
        theme_color: '#0b6bf6',
       "icons": [
  {
    "src": "/icons/manifest-icon-192.maskable.png",
    "sizes": "192x192",
    "type": "image/png",
    "purpose": "any"
  },
  {
    "src": "/icons/manifest-icon-192.maskable.png",
    "sizes": "192x192",
    "type": "image/png",
    "purpose": "maskable"
  },
  {
    "src": "/icons/manifest-icon-512.maskable.png",
    "sizes": "512x512",
    "type": "image/png",
    "purpose": "any"
  },
  {
    "src": "/icons/manifest-icon-512.maskable.png",
    "sizes": "512x512",
    "type": "image/png",
    "purpose": "maskable"
  }
],
        shortcuts: [
          {
            name: 'Continuar última lección',
            short_name: 'Continuar',
            description: 'Abrir la lección más reciente',
            url: '/lessons/continue',
            icons: [{ src: '/icons/shortcut-96.png', sizes: '96x96', type: 'image/png' }]
          }
        ]
      },

      // Opciones útiles para pruebas en desarrollo (activar con cuidado)
      devOptions: {
        // enabled: true permite probar SW en `npm run dev` en localhost
        // Ten en cuenta que el SW en dev puede esconder cambios rápidos; activar sólo cuando lo necesites.
        enabled: false,
        type: 'module'
      },

      // Nota: con injectManifest, tu archivo src/sw.ts controlará las strategies de caching y la cola offline.
      // Si en algún caso quieres que workbox genere automáticamente la SW, usa strategies: 'generateSW' y
      // añade un bloque `workbox` con runtimeCaching (ver snippet alternativo al final).
    })
  ],
    // Opciones del servidor (útiles para testing PWA en LAN/dev)
  server: {
    // permitir servir recursos desde la raíz del proyecto (si necesitas `public` con iconos)
    fs: {
      allow: ['.']
    }
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})