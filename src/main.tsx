import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import './index.css'
import App from './App'
import { registerServiceWorker } from './serviceWorkerRegistration'
import { BrowserRouter } from 'react-router-dom'
import { AuthInitializer } from './features/auth/presentation/components/AuthInitializer'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

const persister = createSyncStoragePersister({
  storage: window.localStorage,
});

const root = createRoot(document.getElementById('root')!)

if ('serviceWorker' in navigator) {
  registerServiceWorker()
}

window.addEventListener('sw:need-refresh', () => {
  window.dispatchEvent(new CustomEvent('app:show-update-toast'))
})

window.addEventListener('sw:offline-ready', () => {
  console.log('PWA: offline ready (precached)')
})

navigator.serviceWorker?.addEventListener('message', (evt) => {
  const data = evt.data
  if (!data) return

  switch (data.type) {
    case 'CACHE_URLS_DONE':
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

navigator.serviceWorker?.addEventListener('controllerchange', () => {
  console.log('Service Worker controller changed (new SW in control)')
})

root.render(
  <StrictMode>
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
      }}
    >
      <BrowserRouter>
        <AuthInitializer>
          <App />
        </AuthInitializer>
      </BrowserRouter>
    </PersistQueryClientProvider>
  </StrictMode>,
)