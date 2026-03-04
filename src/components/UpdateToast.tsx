import  { useEffect, useState } from 'react'
import { triggerUpdate } from '../serviceWorkerRegistration' // asegúrate de exportarla

export function UpdateToast() {
  const [visible, setVisible] = useState(false)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    function show() {
      setVisible(true)
    }
    window.addEventListener('app:show-update-toast', show)
    // registerSW tambien emite 'sw:need-refresh' que en main.tsx transformamos a app:show-update-toast
    return () => window.removeEventListener('app:show-update-toast', show)
  }, [])

  useEffect(() => {
    // reload cuando el controller cambie (nueva SW controla)
    const handler = () => {
      // puedes mostrar un mensaje antes de reload si quieres
      window.location.reload()
    }
    navigator.serviceWorker?.addEventListener('controllerchange', handler)
    return () => navigator.serviceWorker?.removeEventListener('controllerchange', handler)
  }, [])

  if (!visible) return null

  return (
    <div className="fixed bottom-4 right-4 bg-white border p-3 rounded shadow-lg w-72">
      <p className="font-semibold mb-2">Nueva versión disponible</p>
      <p className="text-sm mb-3">Hay una actualización. ¿Quieres actualizar ahora?</p>
      <div className="flex gap-2">
        <button
          className="btn btn-primary flex-1"
          onClick={async () => {
            setUpdating(true)
            try {
              await triggerUpdate()
              // triggerUpdate realiza skipWaiting; controllerchange forzará reload
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
            setVisible(false) // posponer
          }}
        >
          Posponer
        </button>
      </div>
    </div>
  )
}