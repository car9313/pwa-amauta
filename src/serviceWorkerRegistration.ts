// src/serviceWorkerRegistration.ts
import { registerSW } from 'virtual:pwa-register'

let updateFn: (() => Promise<void>) | undefined

export function registerServiceWorker() {
  // registerSW devuelve una función que dispara la activación de la nueva SW (skipWaiting)
  updateFn = registerSW({
    onNeedRefresh() {
      window.dispatchEvent(new CustomEvent('sw:need-refresh'))
    },
    onOfflineReady() {
      window.dispatchEvent(new CustomEvent('sw:offline-ready'))
    }
  })
}

/** Forzar la activación de la nueva SW (UX: llamar después de confirmar con el usuario) */
export async function triggerUpdate() {
  if (updateFn) {
    try {
      await updateFn()
    } catch (err) {
      // fallback: enviar mensaje al SW si la función virtual no está disponible
      navigator.serviceWorker.controller?.postMessage({ type: 'SKIP_WAITING' })
    }
  } else {
    navigator.serviceWorker.controller?.postMessage({ type: 'SKIP_WAITING' })
  }
}

/** Pedir al SW que cachee una lista de URLs (descarga de lección) */
export function cacheUrlsViaSW(urls: string[]) {
  if (!navigator.serviceWorker || !navigator.serviceWorker.controller) {
    console.warn('No hay service worker controlador activo')
    return
  }
  navigator.serviceWorker.controller.postMessage({ type: 'CACHE_URLS', urls })
}