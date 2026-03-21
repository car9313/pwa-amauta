
/// <reference lib="webworker" />
/**
 * Service Worker (mejorado) para Amauta (injectManifest)
 *
 * - precacheAndRoute(self.__WB_MANIFEST)
 * - runtime caching (images, api GET, assets)
 * - background sync plugin para POSTs con Workbox
 * - CACHE_URLS manejado con fetch + cache.put (mejor manejo que no-cors)
 * - listeners: SKIP_WAITING, CACHE_URLS
 * - notifica a los clients con mensajes (postMessage)
 *
 * NOTA: Workbox inyectará self.__WB_MANIFEST durante build.
 */

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST?: Array<any>
}

import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import {
  CacheFirst,
  NetworkFirst,
  StaleWhileRevalidate,
  NetworkOnly
} from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'
import { CacheableResponsePlugin } from 'workbox-cacheable-response'
import { BackgroundSyncPlugin } from 'workbox-background-sync'


/* -------------------------
   Precaching (app shell)
   ------------------------- */
precacheAndRoute(self.__WB_MANIFEST || [])
cleanupOutdatedCaches()

/* -------------------------
   Util: notificar a todos los clientes
   ------------------------- */
async function notifyClients(message: Record<string, any>) {
  try {
    const clients = await self.clients.matchAll({ includeUncontrolled: true })
    for (const client of clients) {
      client.postMessage(message)
    }
  } catch (err) {
    // no bloquear en caso de fallo
    console.warn('notifyClients error', err)
  }
}

/* -------------------------
   Background Sync plugin
   ------------------------- */
const bgSyncPlugin = new BackgroundSyncPlugin('amauta-outbox-queue', {
  maxRetentionTime: 24 * 60 // minutos (24h)
})

/* -------------------------
   Runtime caching routes
   ------------------------- */

// 1) Imágenes -> CacheFirst con expiración
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images-cache-v1',
    plugins: [
      new ExpirationPlugin({ maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 30 }),
      new CacheableResponsePlugin({ statuses: [0, 200] })
    ]
  })
)

// 2) API GET -> NetworkFirst con timeout y fallback a cache
registerRoute(
  ({ url, request }) => request.method === 'GET' && url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'api-get-cache-v1',
    networkTimeoutSeconds: 5,
    plugins: [new CacheableResponsePlugin({ statuses: [0, 200] })]
  })
)

// 3) Scripts / CSS / Fonts -> StaleWhileRevalidate
registerRoute(
  ({ request }) =>
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'font',
  new StaleWhileRevalidate({
    cacheName: 'static-resources-v1',
    plugins: [new CacheableResponsePlugin({ statuses: [0, 200] })]
  })
)

// 4) POSTs a /api/ -> NetworkOnly + BackgroundSync (se encolan si offline)
registerRoute(
  ({ url, request }) => request.method === 'POST' && url.pathname.startsWith('/api/'),
  new NetworkOnly({
    plugins: [bgSyncPlugin]
  }),
  'POST'
)

/* -------------------------
   Mensajes desde la app (SKIP_WAITING, CACHE_URLS)
   ------------------------- */

self.addEventListener('message', (event: ExtendableMessageEvent) => {
  const data = event.data
  if (!data || typeof data !== 'object') return

  // Forzar activación inmediata (la app debe recargar de forma controlada)
  if (data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }

  // Pedir al SW que cachee una lista de URLs (descarga de lección)
  // data.urls = string[]
  if (data.type === 'CACHE_URLS' && Array.isArray(data.urls)) {
    // Usamos event.waitUntil para indicar que la tarea async está en curso
    event.waitUntil((async () => {
      const results: { url: string; ok: boolean; reason?: string }[] = []
      const cache = await caches.open('downloaded-assets-v1')

      for (const url of data.urls) {
        try {
          // Intentamos fetch normal (cors): preferible para conservar response headers y status
          const resp = await fetch(url, { credentials: 'omit' })
          if (resp && resp.ok) {
            await cache.put(url, resp.clone())
            results.push({ url, ok: true })
            continue
          } else {
            // si no ok, intentamos fallback diferente
            // (no hacemos aún cache.add sin-cors automáticamente)
            results.push({ url, ok: false, reason: `fetch-not-ok status=${resp?.status}` })
          }
        } catch (fetchErr) {
          // Fetch falló (offline o CORS). Intentamos fallback con request no-cors.
          try {
            await cache.add(new Request(url, { mode: 'no-cors' }))
            results.push({ url, ok: true, reason: 'fallback-no-cors' })
            continue
          } catch (fallbackErr) {
            results.push({ url, ok: false, reason: String(fallbackErr) })
          }
        }
      }

      // Notificar al cliente que terminó la tarea con resultados por URL
      await notifyClients({ type: 'CACHE_URLS_DONE', results })
    })())
  }
})

/* -------------------------
   Install / Activate lifecycle
   ------------------------- */
self.addEventListener('install', () => {
  // No forzamos skipWaiting aquí; lo controlamos desde la UI (mejor UX)
  // event.waitUntil(self.skipWaiting())
})

self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil((async () => {
    await self.clients.claim()
    await notifyClients({ type: 'SW_ACTIVATED' })
  })())
})

/* -------------------------
   Sync event (optional fallback)
   ------------------------- */
self.addEventListener('sync', (event: any) => {
  // Event tags provienen de Background Sync (workbox) o de registration.sync.register(tag)
  // Se utiliza como fallback para ejecutar tareas cuando el navegador lo permita.
  // Podrías procesar una cola propia aquí si la mantienes en IndexedDB.
  // Por ahora notificamos al cliente para que active su reconciliador (fallback).
  event.waitUntil((async () => {
    await notifyClients({ type: 'SYNC_EVENT', tag: event.tag })
  })())
})
