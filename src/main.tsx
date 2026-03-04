// src/main.tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { registerServiceWorker } from './serviceWorkerRegistration'

const root = createRoot(document.getElementById('root')!)

// Registrar el service worker (no bloqueante)
if ('serviceWorker' in navigator) {
  registerServiceWorker()
}

// Escuchar eventos high-level disparados por registerServiceWorker()
window.addEventListener('sw:need-refresh', () => {
  // Por ejemplo: muestra un UpdateToast/Modal para que el usuario confirme la actualización
  window.dispatchEvent(new CustomEvent('app:show-update-toast'))
})

window.addEventListener('sw:offline-ready', () => {
  // Notificar que la app ya puede funcionar offline (precached)
  console.log('PWA: offline ready (precached)')
  // podrías mostrar una notificación pequeña en UI
})

// Escuchar mensajes directos enviados desde el service worker (notifyClients)
navigator.serviceWorker?.addEventListener('message', (evt) => {
  const data = evt.data
  if (!data) return

  switch (data.type) {
    case 'CACHE_URLS_DONE':
      // `data.results` contiene array con {url, ok, reason?}
      window.dispatchEvent(new CustomEvent('app:cache-done', { detail: data.results }))
      break
    case 'CACHE_URLS_FAILED':
      window.dispatchEvent(new CustomEvent('app:cache-failed', { detail: data }))
      break
    case 'SW_ACTIVATED':
      window.dispatchEvent(new CustomEvent('app:sw-activated'))
      break
    case 'SYNC_EVENT':
      console.log('SW Sync event', data.tag)
      break
    default:
      break
  }
})

// Opcional: control cuando cambia el controller (nueva SW tomó control)
navigator.serviceWorker?.addEventListener('controllerchange', () => {
  console.log('Service Worker controller changed (new SW in control)')
  // aquí puedes forzar re-render o recarga controlada si tu UX lo permite
  // window.location.reload()
})

root.render(
  <StrictMode>
    <App />
  </StrictMode>,
)