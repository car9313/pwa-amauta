import { useEffect, useState } from 'react'
import { triggerUpdate } from '../serviceWorkerRegistration'
import { AnimatedPresence } from '@/components/ui/animated-presence'

export function UpdateToast() {
  const [visible, setVisible] = useState(false)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    function show() {
      setVisible(true)
    }
    window.addEventListener('app:show-update-toast', show)
    return () => window.removeEventListener('app:show-update-toast', show)
  }, [])

  useEffect(() => {
    const handler = () => {
      if (navigator.onLine) {
        window.location.reload()
      }
    }
    navigator.serviceWorker?.addEventListener('controllerchange', handler)
    return () => navigator.serviceWorker?.removeEventListener('controllerchange', handler)
  }, [])

  useEffect(() => {
    const goOnline = () => {
      if ('serviceWorker' in navigator) {
        window.location.reload()
      }
    }
    window.addEventListener('online', goOnline)
    return () => window.removeEventListener('online', goOnline)
  }, [])

  return (
    <AnimatedPresence show={visible}>
      <div className="fixed bottom-4 right-4 z-50 w-72 rounded-lg border bg-white p-3 shadow-lg">
        <p className="mb-2 font-semibold">Nueva versión disponible</p>
        <p className="mb-3 text-sm">Hay una actualización. ¿Quieres actualizar ahora?</p>
        <div className="flex gap-2">
          <button
            className="btn btn-primary flex-1"
            onClick={async () => {
              setUpdating(true)
              try {
                await triggerUpdate()
              } catch (err) {
                console.error('update failed', err)
                setUpdating(false)
              }
            }}
            disabled={updating}
          >
            {updating ? 'Actualizando…' : 'Actualizar ahora'}
          </button>
          <button
            className="btn btn-ghost"
            onClick={() => {
              setVisible(false)
            }}
          >
            Posponer
          </button>
        </div>
      </div>
    </AnimatedPresence>
  )
}